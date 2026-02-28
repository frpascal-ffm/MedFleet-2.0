/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { LogIn, Calendar, Shield, Zap } from 'lucide-react';

const Login = () => {
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
          <Calendar className="text-white" size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Fahrdienst SaaS</h1>
        <p className="text-slate-500 mb-8">
          Die intelligente Lösung für Krankentransport-Unternehmen. 
          Synchronisieren Sie Ihre Fahrten direkt mit Google Kalender.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-left p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Echtzeit-Synchronisierung</p>
              <p className="text-xs text-slate-500">Alle Aufträge landen sofort im Google Kalender.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Sicher & DSGVO-konform</p>
              <p className="text-xs text-slate-500">Ihre Daten sind durch Google OAuth geschützt.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Mit Google anmelden
        </button>
        
        <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Powered by Google Cloud
        </p>
      </motion.div>
      
      <p className="mt-8 text-slate-400 text-sm">
        &copy; 2026 Fahrdienst Richter SaaS. Alle Rechte vorbehalten.
      </p>
    </div>
  );
};

export default Login;
