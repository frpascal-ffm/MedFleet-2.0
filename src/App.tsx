/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppProvider } from './state/AppContext';
import { SupabaseProvider, useSupabase } from './state/SupabaseContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import Orders from './pages/Orders';
import TransportSheets from './pages/TransportSheets';
import CreateOrder from './pages/CreateOrder';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import SeriesRides from './pages/SeriesRides';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Auth is temporarily disabled as requested
  return <>{children}</>;
};

export default function App() {
  return (
    <SupabaseProvider>
      <AppProvider>
        <ToastProvider>
          <DndProvider backend={HTML5Backend}>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="planung" element={<Planning />} />
                  <Route path="auftraege" element={<Orders />} />
                  <Route path="transportscheine" element={<TransportSheets />} />
                  <Route path="serienfahrten" element={<SeriesRides />} />
                  <Route path="neue-fahrt" element={<CreateOrder />} />
                  <Route path="einstellungen" element={<Settings />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DndProvider>
        </ToastProvider>
      </AppProvider>
    </SupabaseProvider>
  );
}
