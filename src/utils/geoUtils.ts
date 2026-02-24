/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addMinutes, format, parse } from 'date-fns';

/**
 * Mock function to simulate route calculation.
 * In a real app, this would call Google Maps API.
 */
export const getRouteEstimate = (from: string, to: string) => {
  // Simple deterministic hash-based mock
  const combined = from + to;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  
  const absHash = Math.abs(hash);
  const durationMin = (absHash % 45) + 10; // 10-55 mins
  const distanceKm = Number(((absHash % 30) + 2).toFixed(1)); // 2-32 km
  
  return { durationMin, distanceKm };
};

export const calculateArrivalTime = (startTime: string, durationMin: number): string => {
  const date = parse(startTime, 'HH:mm', new Date());
  const arrivalDate = addMinutes(date, durationMin);
  return format(arrivalDate, 'HH:mm');
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
