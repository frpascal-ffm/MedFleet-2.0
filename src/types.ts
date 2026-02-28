/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TransportSheetStatus {
  FEHLT = 'FEHLT',
  VORHANDEN = 'VORHANDEN',
  MUSS_KORRIGIERT_WERDEN = 'MUSS_KORRIGIERT_WERDEN',
  ANGEFORDERT = 'ANGEFORDERT',
  UNKLAR = 'UNKLAR',
}

export enum OrderStatus {
  GEPLANT = 'Fahrt geplant',
  DURCHGEFUEHRT = 'Fahrt durchgeführt',
  AUF_HINFAHRT = 'Auf Hinfahrt',
  AUF_RUECKFAHRT = 'Auf Rückfahrt',
  STORNIERT = 'Storniert',
}

export enum Requirement {
  ROLLSTUHL = 'Rollstuhl',
  ROLLATOR = 'Rollator',
  EINSTIEGSHILFE = 'Einstiegshilfe',
  TRAGESTUHL = 'Tragestuhl',
  LIEGEND = 'Liegend',
}

export enum MissingReason {
  NICHT_ERHALTEN = 'Nicht erhalten',
  VERGESSEN = 'Vergessen',
  KLINIK_GIBT_NICHT_RAUS = 'Klinik gibt nicht raus',
  UNKLAR = 'Unklar',
  SONSTIGES = 'Sonstiges',
}

export interface Vehicle {
  id: string;
  name: string;
  type?: string;
  active: boolean;
}

export interface Order {
  id: string;
  date: string; // YYYY-MM-DD
  pickupAddress: string;
  dropoffAddress: string;
  scheduledStartTime: string; // HH:MM
  patientLabel: string;
  notes?: string;
  tripDurationMin: number;
  tripDistanceKm: number;
  plannedArrivalTime: string; // HH:MM
  lastCalculatedAt: number;
  status: OrderStatus;
  requirements: Requirement[];
  insurance?: string;
  careLevel?: number;
  phone?: string;
  hasCompanion: boolean;
  isRecurring: boolean;
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  returnTime?: string;
}

export interface Assignment {
  id: string;
  vehicleId: string;
  orderId: string;
  sequenceIndex: number;
  bufferMin: number;
  transitionDurationMin: number;
  transitionDistanceKm: number;
}

export interface TransportSheet {
  orderId: string;
  status: TransportSheetStatus;
  missingReason?: MissingReason;
  note: string;
  attachments: string[];
}

export interface Conflict {
  type: 'OVERLAP' | 'BUFFER_LOW';
  orderId: string;
  nextOrderId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export interface AppState {
  vehicles: Vehicle[];
  orders: Order[];
  assignments: Assignment[];
  transportSheets: TransportSheet[];
  googleEvents: GoogleEvent[];
  isGoogleConnected: boolean;
}
