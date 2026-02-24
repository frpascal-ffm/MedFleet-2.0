/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { 
  Search, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Upload,
  MoreVertical,
  MessageSquare
} from 'lucide-react';
import { TransportSheetStatus, MissingReason } from '../types';

const TransportSheets = () => {
  const { transportSheets, orders, updateTransportSheet } = useApp();
  const [activeTab, setActiveTab] = useState<'KRITISCH' | 'ANGEFORDERT' | 'ALLE'>('KRITISCH');
  const [search, setSearch] = useState('');

  const filteredSheets = transportSheets.filter(s => {
    const order = orders.find(o => o.id === s.orderId);
    const matchesSearch = s.orderId.toLowerCase().includes(search.toLowerCase()) || 
                         order?.patientLabel.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'KRITISCH') {
      return s.status === TransportSheetStatus.FEHLT || s.status === TransportSheetStatus.MUSS_KORRIGIERT_WERDEN;
    }
    if (activeTab === 'ANGEFORDERT') {
      return s.status === TransportSheetStatus.ANGEFORDERT;
    }
    return true;
  });

  const handleStatusChange = (orderId: string, status: TransportSheetStatus) => {
    updateTransportSheet(orderId, { status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transportschein-Kontrolle</h2>
          <p className="text-slate-500">Überwache und verwalte den Status der Transportdokumente.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['KRITISCH', 'ANGEFORDERT', 'ALLE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap
                ${activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}
              `}
            >
              {tab === 'KRITISCH' ? 'Kritisch' : tab === 'ANGEFORDERT' ? 'Angefordert' : 'Alle'}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Suchen..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredSheets.map((sheet) => {
          const order = orders.find(o => o.id === sheet.orderId);
          return (
            <div key={sheet.orderId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
              <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className={`p-2 md:p-3 rounded-xl flex-shrink-0 ${
                    sheet.status === TransportSheetStatus.VORHANDEN ? 'bg-emerald-50 text-emerald-600' :
                    sheet.status === TransportSheetStatus.FEHLT ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <FileText size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm md:text-base">{sheet.orderId}</span>
                      <span className="hidden xs:inline text-slate-300">•</span>
                      <span className="text-xs md:text-sm font-medium text-slate-600 truncate">{order?.patientLabel}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-[10px] md:text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {order?.scheduledStartTime}
                      </div>
                      <span className="truncate">{order?.pickupAddress} → {order?.dropoffAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="space-y-1 text-left md:text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                    <div className="flex items-center gap-2 md:justify-end">
                      {sheet.status === TransportSheetStatus.VORHANDEN ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={14} className={`${sheet.status === TransportSheetStatus.FEHLT ? 'text-red-500' : 'text-amber-500'}`} />
                      )}
                      <span className={`text-xs md:text-sm font-bold ${
                        sheet.status === TransportSheetStatus.VORHANDEN ? 'text-emerald-600' :
                        sheet.status === TransportSheetStatus.FEHLT ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {sheet.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 md:gap-2">
                    <select 
                      className="text-xs md:text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={sheet.status}
                      onChange={(e) => handleStatusChange(sheet.orderId, e.target.value as TransportSheetStatus)}
                    >
                      {Object.values(TransportSheetStatus).map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors hidden xs:block">
                      <Upload size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              {sheet.status === TransportSheetStatus.FEHLT && (
                <div className="px-6 py-3 bg-red-50/50 border-t border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-red-700 font-medium">
                    <AlertCircle size={14} />
                    <span>Abrechnung blockiert: Transportschein fehlt.</span>
                  </div>
                  <button 
                    onClick={() => handleStatusChange(sheet.orderId, TransportSheetStatus.ANGEFORDERT)}
                    className="text-xs font-bold text-red-700 hover:underline"
                  >
                    Jetzt anfordern
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredSheets.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Alles erledigt!</h3>
            <p className="text-slate-500">Keine kritischen Transportscheine im aktuellen Filter gefunden.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportSheets;
