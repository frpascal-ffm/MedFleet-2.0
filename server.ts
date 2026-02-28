/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

console.log(`[Server] Starting with APP_URL: ${process.env.APP_URL}`);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/google/callback`
);

app.use(express.json());
app.use(cookieParser());

// Debug logging
app.use((req, res, next) => {
  if (req.url.includes('google')) {
    console.log(`[Google Auth] ${req.method} ${req.url}`);
  }
  next();
});

// Callback route
app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
  console.log("[Google Auth] Callback received", req.query);
  const { code } = req.query;
  try {
    if (!code) throw new Error("No code provided");
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Store tokens in a cookie
    res.cookie("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentifizierung erfolgreich. Dieses Fenster schließt sich automatisch.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("[Google Auth] Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed: " + (error instanceof Error ? error.message : String(error)));
  }
});

// Helper to handle API errors
const handleApiError = (res: express.Response, error: any, message = "Internal Server Error") => {
  console.error(`${message}:`, error);
  res.status(500).json({ 
    error: message, 
    details: error instanceof Error ? error.message : String(error) 
  });
};

// API Routes
app.get(["/api/auth/google/url", "/api/auth/google/url/"], (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: "Google OAuth credentials are not configured in environment variables." });
    }
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      prompt: "consent",
    });
    res.json({ url });
  } catch (error) {
    handleApiError(res, error, "Failed to generate auth URL");
  }
});

app.get(["/api/auth/google/status", "/api/auth/google/status/"], (req, res) => {
  try {
    const tokens = req.cookies.google_tokens;
    res.json({ connected: !!tokens });
  } catch (error) {
    handleApiError(res, error, "Failed to check status");
  }
});

app.post(["/api/auth/google/logout", "/api/auth/google/logout/"], (req, res) => {
  try {
    res.clearCookie("google_tokens", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error, "Failed to logout");
  }
});

app.post(["/api/calendar/sync", "/api/calendar/sync/"], async (req, res) => {
  const tokens = req.cookies.google_tokens;
  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Calendar" });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: "Order data missing" });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials(JSON.parse(tokens));

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: `Fahrt: ${order.patientLabel}`,
      location: `${order.pickupAddress} -> ${order.dropoffAddress}`,
      description: `Patient: ${order.patientLabel}\nKrankenkasse: ${order.insurance}\nNotizen: ${order.notes}\nAnforderungen: ${order.requirements?.join(", ")}`,
      start: {
        dateTime: `${order.date}T${order.scheduledStartTime}:00`,
        timeZone: "Europe/Berlin",
      },
      end: {
        dateTime: `${order.date}T${(parseInt(order.scheduledStartTime.split(':')[0]) + 1).toString().padStart(2, '0')}:${order.scheduledStartTime.split(':')[1]}:00`,
        timeZone: "Europe/Berlin",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    res.json({ success: true, eventId: response.data.id });
  } catch (error) {
    handleApiError(res, error, "Failed to sync with Google Calendar");
  }
});

app.get(["/api/calendar/events", "/api/calendar/events/"], async (req, res) => {
  const tokens = req.cookies.google_tokens;
  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Calendar" });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials(JSON.parse(tokens));

    const calendar = google.calendar({ version: "v3", auth });
    
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json({ events: response.data.items });
  } catch (error) {
    handleApiError(res, error, "Failed to fetch Google Calendar events");
  }
});

app.patch(["/api/calendar/events/:eventId", "/api/calendar/events/:eventId/"], async (req, res) => {
  const tokens = req.cookies.google_tokens;
  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Calendar" });
  }

  const { eventId } = req.params;
  const { start, end, summary, location, description } = req.body;

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials(JSON.parse(tokens));

    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: {
        summary,
        location,
        description,
        start: start ? { dateTime: start, timeZone: "Europe/Berlin" } : undefined,
        end: end ? { dateTime: end, timeZone: "Europe/Berlin" } : undefined,
      },
    });

    res.json({ success: true, event: response.data });
  } catch (error) {
    handleApiError(res, error, "Failed to update Google Calendar event");
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, time: new Date().toISOString() });
});

// Catch-all for API routes to prevent falling through to Vite
app.all("/api/*", (req, res) => {
  console.log(`[API] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "API route not found" });
});

// Catch-all for any other routes to see if they reach the server
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('.')) {
    console.log(`[Server] Unmatched request: ${req.method} ${req.url}`);
  }
  next();
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Running in production mode");
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." }, (err) => {
        if (err) {
          console.error("[Server] Error sending dist/index.html:", err);
          res.status(500).send("Application not built. Please run 'npm run build'.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
