/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  Phone, 
  Shield, 
  Users, 
  Repeat, 
  CheckCircle2,
  FileText,
  ArrowLeft,
  Info,
  AlertCircle,
  Plus,
  Trash2,
  X,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { de } from 'date-fns/locale';
import { useApp } from '../state/AppContext';
import { OrderStatus, Requirement } from '../types';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, getDay } from 'date-fns';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

registerLocale('de', de);

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse: (str: string) => parseISO(str),
  startOfWeek: () => startOfWeek(new Date(), { locale: de }),
  getDay: (date: Date) => getDay(date),
  locales,
});

interface RecurringDate {
  id: string;
  date: Date;
  time: string;
}

const CreateOrder = () => {
  const { 
    addOrder, 
    isGoogleConnected, 
    checkGoogleStatus, 
    orders, 
    assignments, 
    vehicles, 
    googleEvents,
    pricing
  } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientLabel: '',
    phone: '',
    insurance: '',
    billingType: 'GKV' as 'GKV' | 'PKV' | 'PRIVAT',
    careLevel: 0,
    date: new Date(),
    scheduledStartTime: '08:00',
    pickupAddress: '',
    dropoffAddress: '',
    tripType: 'ONE_WAY' as 'ONE_WAY' | 'ROUND_TRIP',
    returnMode: 'FIXED' as 'FIXED' | 'OPEN' | 'AUTO_DURATION',
    returnTime: '',
    onsiteDurationMin: 60,
    requirements: [] as Requirement[],
    hasCompanion: false,
    isRecurring: false,
    transportSheetPresent: false,
    notes: ''
  });

  const [recurringDates, setRecurringDates] = useState<RecurringDate[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkGoogleStatus();
  }, [checkGoogleStatus]);

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }
      const { url } = await res.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
    }
  };

  const calendarEvents = useMemo(() => {
    const selectedDateStr = format(formData.date, 'yyyy-MM-dd');
    
    const internalEvents = assignments.map(assignment => {
      const order = orders.find(o => o.id === assignment.orderId);
      if (!order || order.date !== selectedDateStr) return null;

      const [startH, startM] = order.scheduledStartTime.split(':').map(Number);
      const startDate = new Date(formData.date);
      startDate.setHours(startH, startM, 0, 0);

      const endDate = new Date(startDate.getTime() + (order.tripDurationMin || 30) * 60000);

      return {
        id: order.id,
        title: order.patientLabel,
        start: startDate,
        end: endDate,
        resourceId: assignment.vehicleId,
        type: 'internal'
      };
    }).filter(Boolean);

    const externalEvents = googleEvents.map(ge => {
      const start = ge.start.dateTime ? new Date(ge.start.dateTime) : new Date(ge.start.date + 'T00:00:00');
      const end = ge.end.dateTime ? new Date(ge.end.dateTime) : new Date(ge.end.date + 'T23:59:59');
      
      if (format(start, 'yyyy-MM-dd') !== selectedDateStr) return null;

      return {
        id: ge.id,
        title: ge.summary,
        start,
        end,
        resourceId: 'google-calendar',
        type: 'google'
      };
    }).filter(Boolean);

    return [...internalEvents, ...externalEvents];
  }, [orders, assignments, googleEvents, formData.date]);

  const resources = useMemo(() => {
    const base = vehicles.filter(v => v.active).map(v => ({
      id: v.id,
      title: v.name,
    }));
    if (isGoogleConnected) {
      base.push({ id: 'google-calendar', title: 'Google' });
    }
    return base;
  }, [vehicles, isGoogleConnected]);

  const syncToCalendar = async (order: any) => {
    if (!isGoogleConnected) return;
    try {
      await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Add the main order
    const mainOrderData = {
      ...formData,
      date: format(formData.date, 'yyyy-MM-dd')
    };
    const mainOrder = addOrder(mainOrderData);
    
    // 2. Handle Return Ride if ROUND_TRIP
    let returnOrderData = null;
    if (formData.tripType === 'ROUND_TRIP') {
      let calculatedReturnTime = formData.returnTime;
      
      if (formData.returnMode === 'AUTO_DURATION' && mainOrder) {
        // Calculate return time based on arrival time + onsite duration
        const [arrH, arrM] = mainOrder.plannedArrivalTime.split(':').map(Number);
        const arrivalDate = new Date();
        arrivalDate.setHours(arrH, arrM, 0, 0);
        const returnDate = new Date(arrivalDate.getTime() + formData.onsiteDurationMin * 60000);
        calculatedReturnTime = format(returnDate, 'HH:mm');
      } else if (formData.returnMode === 'OPEN') {
        calculatedReturnTime = 'Offen';
      }

      returnOrderData = {
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd'),
        scheduledStartTime: calculatedReturnTime,
        pickupAddress: formData.dropoffAddress,
        dropoffAddress: formData.pickupAddress,
        tripType: 'ONE_WAY' as const,
        notes: `Rückfahrt zu Fahrt ${mainOrder?.id}. ${formData.notes}`
      };
      
      addOrder(returnOrderData);
    }

    // 3. Sync to Google Calendar
    if (isGoogleConnected) {
      setIsSyncing(true);
      try {
        // Sync main order
        await syncToCalendar(mainOrderData);
        
        // Sync return order if exists
        if (returnOrderData) {
          await syncToCalendar(returnOrderData);
        }
        
        // Sync recurring dates if applicable
        if (formData.isRecurring && recurringDates.length > 0) {
          for (const rd of recurringDates) {
            const recurringOrderData = {
              ...formData,
              date: format(rd.date, 'yyyy-MM-dd'),
              scheduledStartTime: rd.time
            };
            await syncToCalendar(recurringOrderData);
            
            // Note: In a real app, we'd also call addOrder for each recurring date
            // and handle their return rides as well.
          }
        }
      } catch (error) {
        console.error('Error during full sync:', error);
      } finally {
        setIsSyncing(false);
      }
    }
    
    navigate('/auftraege');
  };

  const toggleRequirement = (req: Requirement) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(req)
        ? prev.requirements.filter(r => r !== req)
        : [...prev.requirements, req]
    }));
  };

  const addRecurringDate = () => {
    setRecurringDates(prev => [
      ...prev, 
      { id: Math.random().toString(36).substr(2, 9), date: new Date(), time: '08:00' }
    ]);
  };

  const removeRecurringDate = (id: string) => {
    setRecurringDates(prev => prev.filter(d => d.id !== id));
  };

  const updateRecurringDate = (id: string, updates: Partial<RecurringDate>) => {
    setRecurringDates(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  // Sync isRecurring with drawer
  useEffect(() => {
    if (formData.isRecurring) {
      if (recurringDates.length === 0) {
        addRecurringDate();
      }
      setIsDrawerOpen(true);
    }
  }, [formData.isRecurring]);

  const getTransportCategory = (reqs: Requirement[]) => {
    if (reqs.includes(Requirement.TRAGESTUHL)) return 'tragestuhl';
    if (reqs.includes(Requirement.ROLLSTUHL) || reqs.includes(Requirement.ROLLATOR)) return 'rollstuhl';
    return 'sitzend';
  };

  const calculatePrice = (priceStructure: { baseFee: number, includedKm: number, pricePerKm: number }, distanceKm: number) => {
    if (!priceStructure) return 0;
    const { baseFee, includedKm, pricePerKm } = priceStructure;
    const extraKm = Math.max(0, distanceKm - includedKm);
    return baseFee + (extraKm * pricePerKm);
  };

  const currentCategory = getTransportCategory(formData.requirements);
  // Assuming an average distance of 15km for preview purposes if no distance is available yet
  const estimatedDistance = 15; 
  
  const pkvPrice = calculatePrice(pricing.pkv[currentCategory], estimatedDistance);
  const privatPrice = calculatePrice(pricing.privat[currentCategory], estimatedDistance);
  
  const matchingGkv = pricing.gkv.find(g => g.insuranceName.toLowerCase() === formData.insurance.toLowerCase());
  const gkvPriceText = matchingGkv 
    ? `${calculatePrice(matchingGkv.prices[currentCategory], estimatedDistance).toFixed(2)}€ (${matchingGkv.insuranceName})` 
    : pricing.gkv.length > 0 
      ? `${Math.min(...pricing.gkv.map(g => calculatePrice(g.prices[currentCategory], estimatedDistance))).toFixed(2)}€ - ${Math.max(...pricing.gkv.map(g => calculatePrice(g.prices[currentCategory], estimatedDistance))).toFixed(2)}€ (GKV Durchschnitt)`
      : 'Keine GKV Verträge hinterlegt';

  return (
    <div className="max-w-[1600px] mx-auto relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors border border-slate-200"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Neue Fahrt erfassen</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 0: Abrechnungsart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <h3 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Abrechnungsart</h3>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row gap-3">
                {(['GKV', 'PKV', 'PRIVAT'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, billingType: type})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      formData.billingType === type
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'PRIVAT' ? 'Privat (Selbstzahler)' : type}
                  </button>
                ))}
              </div>
              
              <AnimatePresence>
                {formData.billingType === 'PRIVAT' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 mt-4">
                      <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 w-full">
                        <p className="text-sm font-bold text-blue-900">Preisinformation für Selbstzahler</p>
                        <p className="text-xs text-blue-700">
                          Basierend auf dem Transportbedarf (<span className="font-bold capitalize">{currentCategory === 'rollstuhl' ? 'Rollstuhl/Rollator' : currentCategory}</span>):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-200/50">
                          <div className="bg-white/60 rounded px-2 py-1.5">
                            <span className="block text-[10px] uppercase text-blue-600 font-bold">Privat Standard</span>
                            <span className="font-mono text-sm font-bold text-slate-800">ab {pricing.privat[currentCategory].baseFee}€</span>
                          </div>
                          <div className="bg-white/60 rounded px-2 py-1.5">
                            <span className="block text-[10px] uppercase text-blue-600 font-bold">PKV Vergleich</span>
                            <span className="font-mono text-sm font-bold text-slate-800">ab {pricing.pkv[currentCategory].baseFee}€</span>
                          </div>
                          <div className="bg-white/60 rounded px-2 py-1.5">
                            <span className="block text-[10px] uppercase text-blue-600 font-bold">GKV Vergleich</span>
                            <span className="font-mono text-sm font-bold text-slate-800 text-xs">{gkvPriceText}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Section 1: Patient & Versicherung */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <h3 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Patient & Versicherung</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Patientenname</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="Name des Patienten"
                  value={formData.patientLabel}
                  onChange={e => setFormData({...formData, patientLabel: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Telefonnummer</label>
                <input 
                  type="tel" 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="0123 456789"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Krankenkasse</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                  placeholder="z.B. AOK Nordost"
                  value={formData.insurance}
                  onChange={e => setFormData({...formData, insurance: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pflegegrad</label>
                <select 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                  value={formData.careLevel}
                  onChange={e => setFormData({...formData, careLevel: parseInt(e.target.value)})}
                >
                  {[0, 1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level}>Pflegegrad {level}</option>
                  ))}
                </select>
                {formData.careLevel <= 2 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-amber-700 font-medium leading-tight">
                      Hinweis: Bei Pflegegrad 0-2 wird zwingend eine Genehmigung der Krankenkasse benötigt.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Fahrt Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              <h3 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Fahrt Details</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Datum</label>
                  <div className="relative custom-datepicker">
                    <DatePicker
                      selected={formData.date}
                      onChange={(date) => setFormData({...formData, date: date || new Date()})}
                      locale="de"
                      dateFormat="dd.MM.yyyy"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                    />
                    <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Abholuhrzeit</label>
                  <input 
                    type="time" 
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                    value={formData.scheduledStartTime}
                    onChange={e => setFormData({...formData, scheduledStartTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Abholort (Von)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                    placeholder="Straße, Hausnummer, PLZ Ort"
                    value={formData.pickupAddress}
                    onChange={e => setFormData({...formData, pickupAddress: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Zielort (Nach)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                    placeholder="Straße, Hausnummer, PLZ Ort"
                    value={formData.dropoffAddress}
                    onChange={e => setFormData({...formData, dropoffAddress: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fahrt-Typ</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, tripType: 'ONE_WAY'})}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        formData.tripType === 'ONE_WAY' 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Einfache Fahrt
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, tripType: 'ROUND_TRIP'})}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        formData.tripType === 'ROUND_TRIP' 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Hin- & Rückfahrt
                    </button>
                  </div>
                </div>
                {formData.tripType === 'ROUND_TRIP' && (
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Rückfahrtmodus</label>
                    <select 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                      value={formData.returnMode}
                      onChange={e => setFormData({...formData, returnMode: e.target.value as any})}
                    >
                      <option value="FIXED">Feste Uhrzeit</option>
                      <option value="OPEN">Offen (Zeit unklar)</option>
                      <option value="AUTO_DURATION">Automatisch nach Dauer</option>
                    </select>
                    
                    {formData.returnMode === 'FIXED' && (
                      <input 
                        type="time" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium mt-2"
                        value={formData.returnTime}
                        onChange={e => setFormData({...formData, returnTime: e.target.value})}
                      />
                    )}

                    {formData.returnMode === 'AUTO_DURATION' && (
                      <div className="mt-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Dauer vor Ort (Minuten)</label>
                        <input 
                          type="number" 
                          min="0"
                          step="15"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                          value={formData.onsiteDurationMin}
                          onChange={e => setFormData({...formData, onsiteDurationMin: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Anforderungen & Sonstiges */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <AlertCircle size={16} className="text-slate-400" />
              <h3 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Anforderungen & Sonstiges</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Transportmittelbedarf</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(Requirement).map(req => (
                    <button
                      key={req}
                      type="button"
                      onClick={() => toggleRequirement(req)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                        formData.requirements.includes(req)
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {req}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={formData.hasCompanion}
                    onChange={() => setFormData({...formData, hasCompanion: !formData.hasCompanion})}
                  />
                  <span className="text-xs font-medium text-slate-700">Begleitperson</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={formData.isRecurring}
                    onChange={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
                  />
                  <span className="text-xs font-medium text-slate-700">Serienfahrt</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={formData.transportSheetPresent}
                    onChange={() => setFormData({...formData, transportSheetPresent: !formData.transportSheetPresent})}
                  />
                  <span className="text-xs font-medium text-slate-700">Transportschein liegt vor</span>
                </label>
              </div>

              {formData.isRecurring && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">{recurringDates.length} Termine geplant</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline"
                  >
                    Termine bearbeiten
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Notizen / Besonderheiten</label>
                <textarea 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium min-h-[80px]"
                  placeholder="Zusätzliche Informationen..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Kalender-Vorschau */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-slate-400" />
                <h3 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Verfügbarkeit prüfen</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {format(formData.date, 'EEEE, dd. MMMM yyyy', { locale: de })}
              </span>
            </div>
            <div className="p-0 h-[400px] relative">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={Views.DAY}
                date={formData.date}
                onNavigate={() => {}} // Controlled by form date
                toolbar={false}
                resources={resources}
                resourceIdAccessor="id"
                resourceTitleAccessor="title"
                min={new Date(0, 0, 0, 6, 0, 0)} // Start at 6 AM
                max={new Date(0, 0, 0, 22, 0, 0)} // End at 10 PM
                eventPropGetter={(event: any) => ({
                  style: {
                    backgroundColor: event.type === 'google' ? '#4285F4' : '#10b981',
                    borderRadius: '4px',
                    fontSize: '9px',
                    border: 'none',
                    color: 'white'
                  }
                })}
              />
              <div className="absolute bottom-4 right-4 flex gap-3">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Intern</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#4285F4]"></div>
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Google</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-4">
          <div className="sticky top-0 space-y-3">
            <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden text-white">
              <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                <h3 className="font-bold text-[9px] uppercase tracking-widest text-slate-400">Zusammenfassung</h3>
                <div className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-bold uppercase">Entwurf</div>
              </div>
              <div className="p-4 space-y-3">
                {/* Patient Info */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">{formData.patientLabel || 'Patient?'}</p>
                    <p className="text-[9px] text-slate-500 truncate">{formData.insurance || 'Kasse?'}</p>
                  </div>
                </div>

                {/* DateTime */}
                <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-800">
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Datum</p>
                    <p className="text-[10px] font-medium">{format(formData.date, 'dd.MM.yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Uhrzeit</p>
                    <p className="text-[10px] font-medium">{formData.scheduledStartTime}</p>
                  </div>
                </div>

                {/* Route */}
                <div className="relative pl-3.5 space-y-2">
                  <div className="absolute left-1 top-1 bottom-1 w-0.5 bg-slate-800"></div>
                  <div className="absolute left-0 top-1 w-2 h-2 rounded-full border border-emerald-500 bg-slate-900"></div>
                  <div className="absolute left-0 bottom-1 w-2 h-2 rounded-full border border-blue-500 bg-slate-900"></div>
                  
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Von</p>
                    <p className="text-[10px] font-medium truncate leading-tight">{formData.pickupAddress || 'Start...'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Nach</p>
                    <p className="text-[10px] font-medium truncate leading-tight">{formData.dropoffAddress || 'Ziel...'}</p>
                  </div>
                </div>

                {/* Recurring Info */}
                {formData.isRecurring && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[9px] text-emerald-400 font-bold">{recurringDates.length} Termine geplant</p>
                  </div>
                )}

                {/* Requirements */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap gap-1">
                    {formData.requirements.map(req => (
                      <span key={req} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[8px] font-bold">{req}</span>
                    ))}
                    {formData.hasCompanion && <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[8px] font-bold">Begleitung</span>}
                  </div>
                </div>

                {/* Action */}
                <div className="pt-2 space-y-2">
                  {!isGoogleConnected ? (
                    <button 
                      type="button"
                      onClick={handleConnectGoogle}
                      className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={12} />
                      Google Kalender verbinden
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Kalender synchron</span>
                    </div>
                  )}
                  
                  <button 
                    type="submit"
                    disabled={isSyncing}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {isSyncing ? 'Wird synchronisiert...' : 'Fahrt speichern'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex gap-2">
              <Info size={14} className="text-amber-500 flex-shrink-0" />
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Die Fahrt wird nach dem Speichern in der Auftragsliste angezeigt.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Recurring Dates Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[80] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900">Serientermine</h3>
                  <p className="text-xs text-slate-500">Planen Sie mehrere Fahrten gleichzeitig.</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase px-2">
                    <div className="col-span-7">Datum</div>
                    <div className="col-span-4">Uhrzeit</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {recurringDates.map((rd) => (
                    <div key={rd.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="col-span-7">
                        <DatePicker
                          selected={rd.date}
                          onChange={(date) => updateRecurringDate(rd.id, { date: date || new Date() })}
                          locale="de"
                          dateFormat="dd.MM.yyyy"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium"
                        />
                      </div>
                      <div className="col-span-4">
                        <input 
                          type="time" 
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium"
                          value={rd.time}
                          onChange={(e) => updateRecurringDate(rd.id, { time: e.target.value })}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button 
                          onClick={() => removeRecurringDate(rd.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button 
                    type="button"
                    onClick={addRecurringDate}
                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                  >
                    <Plus size={14} />
                    Termin hinzufügen
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                >
                  Planung übernehmen
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateOrder;
