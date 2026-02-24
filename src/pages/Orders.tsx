/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { 
  Filter, 
  MoreHorizontal, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Calendar
} from 'lucide-react';
import { TransportSheetStatus, OrderStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const Orders = () => {
  const { orders, assignments, vehicles, transportSheets } = useApp();
  const [filter, setFilter] = useState('');

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(filter.toLowerCase()) || 
    o.patientLabel.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Auftragsliste</h2>
          <p className="text-slate-500">Alle Fahrten im Überblick.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filtern..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fahrt ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Zeit / Datum</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Route</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fahrzeug</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Dokument</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const assignment = assignments.find(a => a.orderId === order.id);
                const vehicle = vehicles.find(v => v.id === assignment?.vehicleId);
                const sheet = transportSheets.find(s => s.orderId === order.id);
                const orderDate = parseISO(order.date);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-900">{order.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{order.scheduledStartTime}</span>
                        <div 
                          className="text-[10px] text-slate-500 flex items-center gap-1 cursor-help"
                          title={format(orderDate, 'EEEE', { locale: de })}
                        >
                          <Calendar size={10} />
                          {format(orderDate, 'dd.MM.yyyy')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 w-8">Von:</span>
                          <span className="text-[11px] font-medium text-slate-700 truncate max-w-[180px]">{order.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 w-8">Nach:</span>
                          <span className="text-[11px] font-medium text-slate-700 truncate max-w-[180px]">{order.dropoffAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {vehicle ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <Truck size={12} className="text-slate-400" />
                          {vehicle.name}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === OrderStatus.DURCHGEFUEHRT ? 'bg-emerald-100 text-emerald-700' :
                        order.status === OrderStatus.STORNIERT ? 'bg-slate-100 text-slate-600' :
                        order.status === OrderStatus.AUF_HINFAHRT || order.status === OrderStatus.AUF_RUECKFAHRT ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <FileText 
                          size={18} 
                          className={`${
                            sheet?.status === TransportSheetStatus.VORHANDEN ? 'text-emerald-500' :
                            sheet?.status === TransportSheetStatus.FEHLT ? 'text-red-500' : 'text-amber-500'
                          }`} 
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
