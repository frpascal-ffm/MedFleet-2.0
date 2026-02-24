/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Truck, 
  AlertTriangle, 
  FileWarning,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { TransportSheetStatus } from '../types';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { orders, vehicles, transportSheets, getConflicts } = useApp();

  const activeVehicles = vehicles.filter(v => v.active).length;
  const criticalSheets = transportSheets.filter(
    s => s.status === TransportSheetStatus.FEHLT || s.status === TransportSheetStatus.MUSS_KORRIGIERT_WERDEN
  );
  const totalConflicts = vehicles.reduce((acc, v) => acc + getConflicts(v.id).length, 0);

  const stats = [
    { label: 'Aufträge heute', value: orders.length, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Fahrzeuge aktiv', value: activeVehicles, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Planungskonflikte', value: totalConflicts, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Kritische Scheine', value: criticalSheets.length, icon: FileWarning, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Guten Morgen, Jan</h2>
        <p className="text-slate-500">Hier ist die Übersicht für den heutigen Betriebstag.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Live</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
              <p className="text-xs md:text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Fahrzeug-Auslastung</h3>
            <Link to="/planung" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Planung <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fahrzeug</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aufträge</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Konflikte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => {
                    const conflicts = getConflicts(v.id);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">{v.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                            {v.active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm font-medium">3</td>
                        <td className="px-6 py-4">
                          {conflicts.length > 0 ? (
                            <span className="flex items-center gap-1 text-red-600 font-bold text-sm">
                              <AlertTriangle size={14} /> {conflicts.length}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Kritische Scheine</h3>
            <Link to="/transportscheine" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Alle ansehen
            </Link>
          </div>

          <div className="space-y-3">
            {criticalSheets.slice(0, 5).map((sheet) => {
              const order = orders.find(o => o.id === sheet.orderId);
              return (
                <div key={sheet.orderId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{sheet.orderId}</p>
                    <p className="text-xs text-slate-500">{order?.patientLabel} • {order?.scheduledStartTime}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sheet.status === TransportSheetStatus.FEHLT ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sheet.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <button className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors">
                    Öffnen
                  </button>
                </div>
              );
            })}
            {criticalSheets.length === 0 && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm text-slate-400">Keine kritischen Scheine</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
