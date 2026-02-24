/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Vehicle, 
  Order, 
  Assignment, 
  TransportSheet, 
  TransportSheetStatus,
  MissingReason,
  OrderStatus,
  Requirement
} from '../types';
import { getRouteEstimate, calculateArrivalTime } from '../utils/geoUtils';
import { format } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', name: 'KT-1 (RTW)', type: 'RTW', active: true },
  { id: 'v2', name: 'KT-2 (KTW)', type: 'KTW', active: true },
  { id: 'v3', name: 'KT-3 (KTW)', type: 'KTW', active: true },
  { id: 'v4', name: 'KT-4 (BTW)', type: 'BTW', active: true },
  { id: 'v5', name: 'KT-5 (KTW)', type: 'KTW', active: false },
];

const createOrder = (
  id: string, 
  time: string, 
  from: string, 
  to: string, 
  patient: string,
  status: OrderStatus = OrderStatus.GEPLANT
): Order => {
  const { durationMin, distanceKm } = getRouteEstimate(from, to);
  return {
    id,
    date: today,
    pickupAddress: from,
    dropoffAddress: to,
    scheduledStartTime: time,
    patientLabel: patient,
    notes: '',
    tripDurationMin: durationMin,
    tripDistanceKm: distanceKm,
    plannedArrivalTime: calculateArrivalTime(time, durationMin),
    lastCalculatedAt: Date.now(),
    status,
    requirements: [Requirement.ROLLSTUHL],
    insurance: 'AOK Nordost',
    careLevel: 2,
    phone: '0123 456789',
    hasCompanion: false,
    isRecurring: false,
    tripType: 'ONE_WAY',
  };
};

export const MOCK_ORDERS: Order[] = [
  createOrder('1736001', '08:00', 'Klinik Nord', 'Seniorenheim West', 'M. Schmidt', OrderStatus.GEPLANT),
  createOrder('1736002', '09:30', 'Privatweg 4', 'Dialysezentrum Ost', 'H. Müller', OrderStatus.AUF_HINFAHRT),
  createOrder('1736003', '08:15', 'Klinik Süd', 'Reha-Zentrum', 'P. Weber', OrderStatus.DURCHGEFUEHRT),
  createOrder('1736004', '11:00', 'Dialysezentrum Ost', 'Privatweg 4', 'H. Müller', OrderStatus.GEPLANT),
  createOrder('1736005', '10:00', 'Klinik Nord', 'Klinik Süd', 'S. Klein', OrderStatus.GEPLANT),
  createOrder('1736006', '13:00', 'Seniorenheim West', 'Klinik Nord', 'M. Schmidt', OrderStatus.GEPLANT),
  createOrder('1736007', '14:30', 'Reha-Zentrum', 'Privatwohnung', 'L. Wagner', OrderStatus.GEPLANT),
  createOrder('1736008', '08:45', 'Klinik Mitte', 'Uniklinik', 'J. Fischer', OrderStatus.GEPLANT),
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', vehicleId: 'v1', orderId: '1736001', sequenceIndex: 0, bufferMin: 10, transitionDurationMin: 0, transitionDistanceKm: 0 },
  { id: 'a2', vehicleId: 'v1', orderId: '1736006', sequenceIndex: 1, bufferMin: 10, transitionDurationMin: 15, transitionDistanceKm: 5 },
  { id: 'a3', vehicleId: 'v2', orderId: '1736002', sequenceIndex: 0, bufferMin: 10, transitionDurationMin: 0, transitionDistanceKm: 0 },
  { id: 'a4', vehicleId: 'v2', orderId: '1736004', sequenceIndex: 1, bufferMin: 10, transitionDurationMin: 20, transitionDistanceKm: 8 },
  { id: 'a5', vehicleId: 'v3', orderId: '1736003', sequenceIndex: 0, bufferMin: 10, transitionDurationMin: 0, transitionDistanceKm: 0 },
  { id: 'a6', vehicleId: 'v3', orderId: '1736005', sequenceIndex: 1, bufferMin: 10, transitionDurationMin: 12, transitionDistanceKm: 4 },
  { id: 'a7', vehicleId: 'v4', orderId: '1736008', sequenceIndex: 0, bufferMin: 10, transitionDurationMin: 0, transitionDistanceKm: 0 },
];

export const MOCK_TRANSPORT_SHEETS: TransportSheet[] = MOCK_ORDERS.map((o, i) => ({
  orderId: o.id,
  status: i % 3 === 0 ? TransportSheetStatus.FEHLT : i % 4 === 0 ? TransportSheetStatus.MUSS_KORRIGIERT_WERDEN : TransportSheetStatus.VORHANDEN,
  missingReason: i % 3 === 0 ? MissingReason.NICHT_ERHALTEN : undefined,
  note: '',
  attachments: [],
}));
