/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  AppState, 
  Order, 
  Vehicle, 
  Assignment, 
  TransportSheet, 
  TransportSheetStatus,
  Conflict,
  OrderStatus,
  PricingConfig,
  GkvPricing,
  TransportPrices
} from '../types';
import { 
  MOCK_VEHICLES, 
  MOCK_ORDERS, 
  MOCK_ASSIGNMENTS, 
  MOCK_TRANSPORT_SHEETS 
} from '../data/mockData';
import { timeToMinutes, getRouteEstimate } from '../utils/geoUtils';
import { format } from 'date-fns';

interface AppContextType extends AppState {
  addOrder: (order: Partial<Order>) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  addVehicle: (vehicle: Partial<Vehicle>) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (vehicleId: string) => void;
  updateAssignment: (assignmentId: string, updates: Partial<Assignment>) => void;
  reassignOrder: (orderId: string, newVehicleId: string, newIndex: number) => void;
  updateTransportSheet: (orderId: string, updates: Partial<TransportSheet>) => void;
  getConflicts: (vehicleId: string) => Conflict[];
  fetchGoogleEvents: () => Promise<void>;
  updateGoogleEvent: (eventId: string, updates: any) => Promise<void>;
  checkGoogleStatus: () => Promise<void>;
  updatePricing: (type: 'pkv' | 'privat', prices: TransportPrices) => void;
  addGkvContract: (contract: Omit<GkvPricing, 'id'>) => void;
  updateGkvContract: (id: string, updates: Partial<GkvPricing>) => void;
  deleteGkvContract: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [transportSheets, setTransportSheets] = useState<TransportSheet[]>(MOCK_TRANSPORT_SHEETS);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [pricing, setPricing] = useState<PricingConfig>({
    gkv: [
      { id: '1', insuranceName: 'AOK Nordost', prices: { 
        sitzend: { baseFee: 35, includedKm: 10, pricePerKm: 2.00 }, 
        rollstuhl: { baseFee: 55, includedKm: 10, pricePerKm: 2.20 }, 
        tragestuhl: { baseFee: 75, includedKm: 10, pricePerKm: 2.40 } 
      } },
      { id: '2', insuranceName: 'Techniker Krankenkasse', prices: { 
        sitzend: { baseFee: 38, includedKm: 10, pricePerKm: 2.10 }, 
        rollstuhl: { baseFee: 58, includedKm: 10, pricePerKm: 2.30 }, 
        tragestuhl: { baseFee: 78, includedKm: 10, pricePerKm: 2.50 } 
      } }
    ],
    pkv: { 
      sitzend: { baseFee: 50, includedKm: 10, pricePerKm: 2.50 }, 
      rollstuhl: { baseFee: 80, includedKm: 10, pricePerKm: 2.80 }, 
      tragestuhl: { baseFee: 100, includedKm: 10, pricePerKm: 3.00 } 
    },
    privat: { 
      sitzend: { baseFee: 60, includedKm: 10, pricePerKm: 2.50 }, 
      rollstuhl: { baseFee: 90, includedKm: 10, pricePerKm: 2.80 }, 
      tragestuhl: { baseFee: 110, includedKm: 10, pricePerKm: 3.00 } 
    }
  });

  const checkGoogleStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setIsGoogleConnected(data.connected);
      if (data.connected) {
        // Auto-fetch events if connected
        fetchGoogleEvents();
      }
    } catch (err) {
      console.error('Error checking google status:', err);
      setIsGoogleConnected(false);
    }
  }, []);

  const fetchGoogleEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data.events || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to fetch google events:', errorData.error || res.statusText);
      }
    } catch (err) {
      console.error('Error fetching google events:', err);
    }
  }, []);

  const updateGoogleEvent = useCallback(async (eventId: string, updates: any) => {
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchGoogleEvents(); // Refresh
      }
    } catch (err) {
      console.error('Error updating google event:', err);
    }
  }, [fetchGoogleEvents]);

  const addOrder = useCallback((newOrderData: Partial<Order>) => {
    const lastId = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.id))) : 1736000;
    const newId = (lastId + 1).toString();

    const { durationMin, distanceKm } = getRouteEstimate(
      newOrderData.pickupAddress || '', 
      newOrderData.dropoffAddress || ''
    );
    
    const startTime = newOrderData.scheduledStartTime || '08:00';
    const [h, m] = startTime.split(':').map(Number);
    const arrivalMinutes = h * 60 + m + durationMin;
    const arrivalTime = `${Math.floor(arrivalMinutes / 60).toString().padStart(2, '0')}:${(arrivalMinutes % 60).toString().padStart(2, '0')}`;

    const order: Order = {
      id: newId,
      date: newOrderData.date || format(new Date(), 'yyyy-MM-dd'),
      pickupAddress: newOrderData.pickupAddress || '',
      dropoffAddress: newOrderData.dropoffAddress || '',
      scheduledStartTime: startTime,
      patientLabel: newOrderData.patientLabel || 'Unbekannt',
      notes: newOrderData.notes || '',
      tripDurationMin: durationMin,
      tripDistanceKm: distanceKm,
      plannedArrivalTime: arrivalTime,
      lastCalculatedAt: Date.now(),
      status: newOrderData.status || OrderStatus.GEPLANT,
      requirements: newOrderData.requirements || [],
      insurance: newOrderData.insurance || '',
      billingType: newOrderData.billingType || 'GKV',
      careLevel: newOrderData.careLevel || 0,
      phone: newOrderData.phone || '',
      hasCompanion: newOrderData.hasCompanion || false,
      isRecurring: newOrderData.isRecurring || false,
      tripType: newOrderData.tripType || 'ONE_WAY',
      returnTime: newOrderData.returnTime,
    };

    setOrders(prev => [...prev, order]);
    setTransportSheets(prev => [...prev, {
      orderId: order.id,
      status: TransportSheetStatus.FEHLT,
      note: '',
      attachments: [],
    }]);

    return order;
  }, [orders]);

  const updateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
  }, []);

  const addVehicle = useCallback((newVehicleData: Partial<Vehicle>) => {
    const newId = `v-${Date.now()}`;
    const vehicle: Vehicle = {
      id: newId,
      name: newVehicleData.name || 'Unbenannt',
      brand: newVehicleData.brand || '',
      model: newVehicleData.model || '',
      licensePlate: newVehicleData.licensePlate || '',
      equipment: newVehicleData.equipment || [],
      active: newVehicleData.active !== undefined ? newVehicleData.active : true,
    };
    setVehicles(prev => [...prev, vehicle]);
  }, []);

  const updateVehicle = useCallback((vehicleId: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, ...updates } : v));
  }, []);

  const deleteVehicle = useCallback((vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    // Also remove assignments for this vehicle
    setAssignments(prev => prev.filter(a => a.vehicleId !== vehicleId));
  }, []);

  const updatePricing = useCallback((type: 'pkv' | 'privat', prices: TransportPrices) => {
    setPricing(prev => ({ ...prev, [type]: prices }));
  }, []);

  const addGkvContract = useCallback((contract: Omit<GkvPricing, 'id'>) => {
    setPricing(prev => ({
      ...prev,
      gkv: [...prev.gkv, { ...contract, id: `gkv-${Date.now()}` }]
    }));
  }, []);

  const updateGkvContract = useCallback((id: string, updates: Partial<GkvPricing>) => {
    setPricing(prev => ({
      ...prev,
      gkv: prev.gkv.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
  }, []);

  const deleteGkvContract = useCallback((id: string) => {
    setPricing(prev => ({
      ...prev,
      gkv: prev.gkv.filter(g => g.id !== id)
    }));
  }, []);

  const updateAssignment = useCallback((assignmentId: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, ...updates } : a));
  }, []);

  const reassignOrder = useCallback((orderId: string, newVehicleId: string, newIndex: number) => {
    setAssignments(prev => {
      const filtered = prev.filter(a => a.orderId !== orderId);
      const newAssignment: Assignment = {
        id: `a-${Date.now()}`,
        orderId,
        vehicleId: newVehicleId,
        sequenceIndex: newIndex,
        bufferMin: 10,
        transitionDurationMin: 0,
        transitionDistanceKm: 0,
      };
      
      // Re-index others in the same vehicle
      const sameVehicle = filtered.filter(a => a.vehicleId === newVehicleId);
      sameVehicle.splice(newIndex, 0, newAssignment);
      
      const updatedSameVehicle = sameVehicle.map((a, idx) => ({ ...a, sequenceIndex: idx }));
      const others = filtered.filter(a => a.vehicleId !== newVehicleId);
      
      return [...others, ...updatedSameVehicle];
    });
  }, []);

  const updateTransportSheet = useCallback((orderId: string, updates: Partial<TransportSheet>) => {
    setTransportSheets(prev => prev.map(s => s.orderId === orderId ? { ...s, ...updates } : s));
  }, []);

  const getConflicts = useCallback((vehicleId: string): Conflict[] => {
    const vehicleAssignments = assignments
      .filter(a => a.vehicleId === vehicleId)
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex);

    const conflicts: Conflict[] = [];

    for (let i = 0; i < vehicleAssignments.length - 1; i++) {
      const currentAss = vehicleAssignments[i];
      const nextAss = vehicleAssignments[i + 1];
      
      const currentOrder = orders.find(o => o.id === currentAss.orderId);
      const nextOrder = orders.find(o => o.id === nextAss.orderId);

      if (!currentOrder || !nextOrder) continue;

      const currentArrivalMin = timeToMinutes(currentOrder.plannedArrivalTime);
      const nextStartMin = timeToMinutes(nextOrder.scheduledStartTime);
      
      const transitionMin = currentAss.transitionDurationMin || 10; // Default transition
      const bufferMin = currentAss.bufferMin || 10;
      
      const totalNeededMin = currentArrivalMin + transitionMin + bufferMin;

      if (currentArrivalMin > nextStartMin) {
        conflicts.push({
          type: 'OVERLAP',
          orderId: currentOrder.id,
          nextOrderId: nextOrder.id,
          message: `Überschneidung: ${currentOrder.id} endet nach Start von ${nextOrder.id}.`,
          severity: 'error'
        });
      } else if (totalNeededMin > nextStartMin) {
        conflicts.push({
          type: 'BUFFER_LOW',
          orderId: currentOrder.id,
          nextOrderId: nextOrder.id,
          message: `Puffer unterschritten: Nur ${nextStartMin - currentArrivalMin - transitionMin} Min. verfügbar (Soll: ${bufferMin} Min).`,
          severity: 'warning'
        });
      }
    }

    return conflicts;
  }, [assignments, orders]);

  const value = useMemo(() => ({
    vehicles,
    orders,
    assignments,
    transportSheets,
    googleEvents,
    isGoogleConnected,
    pricing,
    addOrder,
    updateOrder,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateAssignment,
    reassignOrder,
    updateTransportSheet,
    getConflicts,
    fetchGoogleEvents,
    updateGoogleEvent,
    checkGoogleStatus,
    updatePricing,
    addGkvContract,
    updateGkvContract,
    deleteGkvContract,
  }), [
    vehicles, 
    orders, 
    assignments, 
    transportSheets, 
    googleEvents, 
    isGoogleConnected, 
    pricing,
    addOrder, 
    updateOrder, 
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateAssignment, 
    reassignOrder, 
    updateTransportSheet, 
    getConflicts, 
    fetchGoogleEvents, 
    updateGoogleEvent, 
    checkGoogleStatus,
    updatePricing,
    addGkvContract,
    updateGkvContract,
    deleteGkvContract
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
