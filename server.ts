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

app.use(express.json());
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/google/callback`
);

// API Routes
app.get("/api/auth/google/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
  });
  res.json({ url });
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Store tokens in a cookie
    // SameSite: 'none' and Secure: true are required for iframes
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
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/auth/google/status", (req, res) => {
  const tokens = req.cookies.google_tokens;
  res.json({ connected: !!tokens });
});

app.post("/api/calendar/sync", async (req, res) => {
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
        // Assume 1 hour duration if not specified
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
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to sync with Google Calendar" });
  }
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
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
