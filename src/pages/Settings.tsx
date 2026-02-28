/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Bell,
  User,
  Database,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../state/AppContext';

const Settings = () => {
  const { isGoogleConnected, checkGoogleStatus, fetchGoogleEvents } = useApp();

  useEffect(() => {
    checkGoogleStatus();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkGoogleStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkGoogleStatus]);

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }
      const { url } = await res.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
    }
  };

  const handleSyncNow = async () => {
    await fetchGoogleEvents();
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/auth/google/logout', { method: 'POST' });
      if (res.ok) {
        checkGoogleStatus();
      }
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-100 rounded-2xl">
          <SettingsIcon className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Einstellungen</h1>
          <p className="text-slate-500">Verwalten Sie Ihre App-Konfiguration und Integrationen.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Tabs (Simulated) */}
        <div className="space-y-1">
          {[
            { id: 'general', label: 'Allgemein', icon: SettingsIcon, active: true },
            { id: 'integrations', label: 'Integrationen', icon: RefreshCw, active: false },
            { id: 'account', label: 'Benutzerkonto', icon: User, active: false },
            { id: 'notifications', label: 'Benachrichtigungen', icon: Bell, active: false },
            { id: 'security', label: 'Sicherheit', icon: Shield, active: false },
            { id: 'data', label: 'Datenbank', icon: Database, active: false },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Google Calendar Integration */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Google Kalender</h3>
                  <p className="text-xs text-slate-500">Synchronisieren Sie Ihre Fahrten mit Google.</p>
                </div>
              </div>
              {isGoogleConnected && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 size={12} />
                  Verbunden
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-6">
              {!isGoogleConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
                    <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Keine Verbindung</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Verbinden Sie Ihren Google Kalender, um Fahrten automatisch zu synchronisieren und externe Termine in der Planung zu sehen.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleConnectGoogle}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ExternalLink size={18} />
                    Google Konto verbinden
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        G
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Google Kalender Aktiv</p>
                        <p className="text-xs text-slate-500">Letzte Synchronisierung: Gerade eben</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSyncNow}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                      title="Jetzt synchronisieren"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Optionen</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Neue Fahrten automatisch syncen', active: true },
                        { label: 'Google Termine in Planung anzeigen', active: true },
                        { label: 'Benachrichtigungen bei Konflikten', active: false },
                      ].map((opt, i) => (
                        <label key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${opt.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${opt.active ? 'right-1' : 'left-1'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleDisconnect}
                    className="w-full py-3 text-red-600 font-bold text-sm hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                  >
                    Verbindung trennen
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Other Settings (Placeholders) */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 opacity-50 pointer-events-none">
            <h3 className="font-bold text-slate-900 mb-4">Allgemeine Präferenzen</h3>
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse"></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
