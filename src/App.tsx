/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppProvider } from './state/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import Orders from './pages/Orders';
import TransportSheets from './pages/TransportSheets';
import CreateOrder from './pages/CreateOrder';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <DndProvider backend={HTML5Backend}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="planung" element={<Planning />} />
              <Route path="auftraege" element={<Orders />} />
              <Route path="transportscheine" element={<TransportSheets />} />
              <Route path="neue-fahrt" element={<CreateOrder />} />
              <Route path="einstellungen" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DndProvider>
    </AppProvider>
  );
}
