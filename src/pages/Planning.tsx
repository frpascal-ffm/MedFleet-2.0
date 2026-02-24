/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { 
  AlertCircle, 
  Clock, 
  MapPin, 
  ChevronRight,
  GripVertical,
  Info
} from 'lucide-react';
import { TransportSheetStatus } from '../types';
import { motion, Reorder } from 'motion/react';

const Planning = () => {
  const { vehicles, orders, assignments, getConflicts, reassignOrder } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const getVehicleAssignments = (vehicleId: string) => {
    return assignments
      .filter(a => a.vehicleId === vehicleId)
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tagesplanung</h2>
          <p className="text-slate-500">Verwalte die Fahrzeug-Zuweisungen und optimiere die Routen.</p>
        </div>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
          Neu berechnen
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6">
        {vehicles.map((vehicle) => {
          const vehicleAssignments = getVehicleAssignments(vehicle.id);
          const conflicts = getConflicts(vehicle.id);

          return (
            <div key={vehicle.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{vehicle.name}</h3>
                  <p className="text-xs text-slate-500">{vehicleAssignments.length} Aufträge</p>
                </div>
                {conflicts.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg text-red-600">
                    <AlertCircle size={14} />
                    <span className="text-xs font-bold">{conflicts.length}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {vehicleAssignments.map((ass, index) => {
                  const order = orders.find(o => o.id === ass.orderId);
                  if (!order) return null;

                  const conflict = conflicts.find(c => c.orderId === order.id);

                  return (
                    <motion.div
                      key={ass.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        bg-white p-4 rounded-xl border-2 transition-all cursor-pointer
                        ${selectedOrderId === order.id ? 'border-emerald-500 shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-sm'}
                      `}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{order.scheduledStartTime}</span>
                          <ChevronRight size={14} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-500">{order.plannedArrivalTime}</span>
                        </div>
                        <GripVertical size={16} className="text-slate-300" />
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="text-sm font-bold text-slate-900 truncate">{order.patientLabel}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin size={12} />
                          <span className="truncate">{order.pickupAddress} → {order.dropoffAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{order.tripDurationMin} Min. Fahrt</span>
                        </div>
                        {conflict && (
                          <div className={`p-1 rounded ${conflict.severity === 'error' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}`}>
                            <AlertCircle size={14} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {vehicleAssignments.length === 0 && (
                  <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">Keine Aufträge zugewiesen</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrderId && (
        <div className={`
          fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 p-6 md:p-8 transform transition-transform duration-300
          ${selectedOrderId ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <button 
            onClick={() => setSelectedOrderId(null)}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"
          >
            <ChevronRight size={24} className="rotate-180 sm:rotate-0" />
          </button>
          
          <div className="space-y-6 md:space-y-8 mt-8 sm:mt-0">
            <div>
              <h3 className="text-xl font-bold mb-1">Auftragsdetails</h3>
              <p className="text-slate-500 font-medium text-sm">{selectedOrderId}</p>
            </div>

            <div className="space-y-4 md:space-y-6">
              <section className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient & Route</h4>
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Patient</p>
                    <p className="font-bold text-sm">{orders.find(o => o.id === selectedOrderId)?.patientLabel}</p>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Von</p>
                      <p className="text-xs font-medium">{orders.find(o => o.id === selectedOrderId)?.pickupAddress}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Nach</p>
                      <p className="text-xs font-medium">{orders.find(o => o.id === selectedOrderId)?.dropoffAddress}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zeitplanung</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Start</p>
                    <p className="font-bold text-sm">{orders.find(o => o.id === selectedOrderId)?.scheduledStartTime}</p>
                  </div>
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Ankunft</p>
                    <p className="font-bold text-sm">{orders.find(o => o.id === selectedOrderId)?.plannedArrivalTime}</p>
                  </div>
                </div>
              </section>

              {/* Conflict Analysis */}
              {(() => {
                const ass = assignments.find(a => a.orderId === selectedOrderId);
                if (!ass) return null;
                const conflicts = getConflicts(ass.vehicleId);
                const conflict = conflicts.find(c => c.orderId === selectedOrderId);
                
                if (!conflict) return null;

                return (
                  <section className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konflikt-Analyse</h4>
                    <div className={`p-4 rounded-xl flex gap-3 ${conflict.severity === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                      <Info size={20} className="flex-shrink-0" />
                      <p className="text-sm font-medium leading-relaxed">{conflict.message}</p>
                    </div>
                  </section>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;
