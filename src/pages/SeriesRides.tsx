import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { 
  Calendar, 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const SeriesRides = () => {
  const { orders } = useApp();
  const [filter, setFilter] = useState('');

  // Mock series data for MVP
  const [series] = useState([
    {
      id: 'SR-001',
      patientLabel: 'Müller, Hans',
      pickupAddress: 'Hauptstraße 1, Berlin',
      dropoffAddress: 'Klinikum Mitte, Berlin',
      active: true,
      startDate: '2023-10-01',
      endDate: '2023-12-31',
      rules: [
        { weekday: 1, pickupTime: '08:00', returnMode: 'AUTO_BY_DURATION', onsiteDurationMin: 120 },
        { weekday: 3, pickupTime: '08:00', returnMode: 'AUTO_BY_DURATION', onsiteDurationMin: 120 },
        { weekday: 5, pickupTime: '08:00', returnMode: 'AUTO_BY_DURATION', onsiteDurationMin: 120 },
      ]
    },
    {
      id: 'SR-002',
      patientLabel: 'Schmidt, Anna',
      pickupAddress: 'Waldweg 5, Potsdam',
      dropoffAddress: 'Dialysezentrum, Potsdam',
      active: true,
      startDate: '2023-11-15',
      endDate: null,
      rules: [
        { weekday: 2, pickupTime: '10:30', returnMode: 'OPEN' },
        { weekday: 4, pickupTime: '10:30', returnMode: 'OPEN' },
      ]
    }
  ]);

  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Serienfahrten</h2>
          <p className="text-slate-500">Wiederkehrende Fahrten verwalten.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={16} />
          Neue Serie
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {series.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{s.patientLabel}</h3>
                    {s.active ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> Aktiv
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle size={10} /> Inaktiv
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="font-medium text-slate-700">{s.id}</span>
                    <span className="mx-1">•</span>
                    Gültig ab: {format(parseISO(s.startDate), 'dd.MM.yyyy')}
                    {s.endDate && ` bis ${format(parseISO(s.endDate), 'dd.MM.yyyy')}`}
                  </p>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p><span className="text-xs font-bold text-slate-400 w-8 inline-block">Von:</span> {s.pickupAddress}</p>
                    <p><span className="text-xs font-bold text-slate-400 w-8 inline-block">Nach:</span> {s.dropoffAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 md:w-96 bg-slate-50/50 flex flex-col justify-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Regeln</h4>
              <div className="space-y-2">
                {s.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {weekdays[rule.weekday]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {rule.pickupTime} Uhr
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {rule.returnMode === 'AUTO_BY_DURATION' 
                            ? `Rückfahrt nach ${rule.onsiteDurationMin} Min.` 
                            : rule.returnMode === 'OPEN' 
                              ? 'Rückfahrt offen' 
                              : 'Keine Rückfahrt'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeriesRides;
