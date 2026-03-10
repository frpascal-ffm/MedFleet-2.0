/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from '../types';
import { format, parseISO } from 'date-fns';

export function generateWhatsappCopyText(order: Order): string {
  const dateStr = format(parseISO(order.date), 'dd.MM.yyyy');
  const requirementsStr = order.requirements.length > 0 
    ? order.requirements.join(', ') 
    : 'Sitzend';

  return `Datum: ${dateStr}
Patient: ${order.patientLabel}
Abholuhrzeit: ${order.scheduledStartTime}
Von: ${order.pickupAddress}
Nach: ${order.dropoffAddress}
Telefon: ${order.phone || '-'}
Beförderungsart: ${requirementsStr}
Hinweis: ${order.notes || '-'}`;
}
