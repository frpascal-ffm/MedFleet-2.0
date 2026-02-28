import React, { useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addMinutes, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useApp } from '../state/AppContext';
import { Order, Vehicle, Assignment, OrderStatus } from '../types';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Truck, 
  Clock, 
  MapPin, 
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  ClipboardList,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  order: Order;
  assignment?: Assignment;
}

const Planning: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { 
    orders, 
    vehicles, 
    assignments, 
    reassignOrder, 
    updateOrder, 
    googleEvents, 
    isGoogleConnected, 
    checkGoogleStatus,
    updateGoogleEvent 
  } = useApp();
  const [view, setView] = useState<View>(Views.DAY);
  const [date, setDate] = useState(new Date());

  React.useEffect(() => {
    checkGoogleStatus();
  }, [checkGoogleStatus]);

  const unassignedOrders = useMemo(() => {
    return orders.filter(order => !assignments.some(a => a.orderId === order.id));
  }, [orders, assignments]);

  const events = useMemo(() => {
    const internalEvents = assignments.map(assignment => {
      const order = orders.find(o => o.id === assignment.orderId);
      if (!order) return null;

      const [startH, startM] = order.scheduledStartTime.split(':').map(Number);
      const startDate = parseISO(order.date);
      startDate.setHours(startH, startM, 0, 0);

      const endDate = addMinutes(startDate, order.tripDurationMin || 30);

      return {
        id: order.id,
        title: `${order.patientLabel}`,
        start: startDate,
        end: endDate,
        resourceId: assignment.vehicleId,
        order,
        assignment,
        type: 'internal'
      } as any;
    }).filter(Boolean);

    const externalEvents = googleEvents.map(ge => {
      const start = ge.start.dateTime ? new Date(ge.start.dateTime) : new Date(ge.start.date + 'T00:00:00');
      const end = ge.end.dateTime ? new Date(ge.end.dateTime) : new Date(ge.end.date + 'T23:59:59');
      
      return {
        id: ge.id,
        title: ge.summary,
        start,
        end,
        resourceId: 'google-calendar',
        googleEvent: ge,
        type: 'google'
      };
    });

    return [...internalEvents, ...externalEvents];
  }, [orders, assignments, googleEvents]);

  const resources = useMemo(() => {
    const baseResources = vehicles.filter(v => v.active).map(v => ({
      id: v.id,
      title: v.name,
    }));

    if (isGoogleConnected) {
      baseResources.push({
        id: 'google-calendar',
        title: 'Google Kalender',
      });
    }

    return baseResources;
  }, [vehicles, isGoogleConnected]);

  const onEventDrop: withDragAndDropProps['onEventDrop'] = useCallback(
    ({ event, start, end, resourceId, isAllDay }) => {
      const calEvent = event as any;
      
      if (calEvent.type === 'google') {
        updateGoogleEvent(calEvent.id, {
          start: (start as Date).toISOString(),
          end: (end as Date).toISOString(),
        });
        return;
      }

      const newStartTime = format(start as Date, 'HH:mm');
      const newDate = format(start as Date, 'yyyy-MM-dd');
      
      // Update order time and date
      updateOrder(calEvent.id, {
        scheduledStartTime: newStartTime,
        date: newDate
      });

      // Update assignment vehicle
      if (resourceId && resourceId !== calEvent.resourceId) {
        reassignOrder(calEvent.id, resourceId as string, 0);
      }
    },
    [updateOrder, reassignOrder, updateGoogleEvent]
  );

  const eventPropGetter = useCallback((event: any) => {
    if (event.type === 'google') {
      return {
        style: {
          backgroundColor: '#4285F4', // Google Blue
          borderRadius: '6px',
          border: 'none',
          color: 'white',
          fontSize: '0.7rem',
          padding: '2px 6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontWeight: '500'
        }
      };
    }

    const calEvent = event as any;
    let backgroundColor = '#3b82f6'; // blue-500
    
    switch (calEvent.order.status) {
      case OrderStatus.DURCHGEFUEHRT:
        backgroundColor = '#10b981'; // emerald-500
        break;
      case OrderStatus.AUF_HINFAHRT:
      case OrderStatus.AUF_RUECKFAHRT:
        backgroundColor = '#f59e0b'; // amber-500
        break;
      case OrderStatus.STORNIERT:
        backgroundColor = '#ef4444'; // red-500
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '0.7rem',
        padding: '2px 6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontWeight: '500'
      }
    };
  }, []);

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left Sidebar: Unassigned Orders */}
      <div className="w-80 flex flex-col border-r border-slate-200 bg-slate-50/50">
        <div className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Nicht zugewiesen
            </h2>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
              {unassignedOrders.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {unassignedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <ClipboardList className="w-12 h-12 opacity-20" />
                <p className="text-sm">Alle Fahrten zugewiesen</p>
              </div>
            ) : (
              unassignedOrders.map(order => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-grab active:cursor-grabbing group shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      #{order.id}
                    </span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.scheduledStartTime}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{order.patientLabel}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{order.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{order.dropoffAddress}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => reassignOrder(order.id, vehicles[0].id, 0)}
                      className="flex-1 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Zuweisen
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="p-4 border-t border-slate-200 bg-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-indigo-100">Auslastung</p>
              <p className="text-lg font-bold">78%</p>
            </div>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-white h-full w-[78%]" />
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Einsatzplanung</h1>
              <p className="text-sm text-slate-500">{format(date, 'MMMM yyyy', { locale: de })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            >
              Heute
            </button>
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setDate(prev => addMinutes(prev, -1440))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="px-3 text-sm font-semibold text-slate-700 min-w-[140px] text-center">
                {format(date, 'EEEE, d. MMM', { locale: de })}
              </span>
              <button 
                onClick={() => setDate(prev => addMinutes(prev, 1440))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: Views.DAY, label: 'Tag' },
                { id: Views.WEEK, label: 'Woche' },
                { id: Views.MONTH, label: 'Monat' }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id as View)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                    view === v.id 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-calendar">
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor={(e: any) => e.start}
              endAccessor={(e: any) => e.end}
              style={{ height: '100%' }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              resources={view === Views.DAY ? resources : undefined}
              resourceIdAccessor={(r: any) => r.id}
              resourceTitleAccessor={(r: any) => r.title}
              onEventDrop={onEventDrop}
              resizable
              selectable
              step={15}
              timeslots={4}
              eventPropGetter={eventPropGetter}
              messages={{
                today: 'Heute',
                previous: 'Zurück',
                next: 'Weiter',
                month: 'Monat',
                week: 'Woche',
                day: 'Tag',
                agenda: 'Agenda',
                date: 'Datum',
                time: 'Zeit',
                event: 'Ereignis',
                noEventsInRange: 'Keine Fahrten in diesem Zeitraum.',
                allDay: 'Ganztägig'
              }}
              culture="de"
              components={{
                event: ({ event }: any) => (
                  <div className="flex flex-col h-full overflow-hidden leading-tight">
                    <div className="font-bold truncate text-[11px]">{event.title}</div>
                    {event.type === 'internal' && (
                      <div className="text-[9px] opacity-80 truncate">
                        {event.order.pickupAddress.split(',')[0]}
                      </div>
                    )}
                    {event.type === 'google' && (
                      <div className="text-[9px] opacity-80 truncate">
                        Google Kalender
                      </div>
                    )}
                  </div>
                ),
                resourceHeader: ({ label, resource }: any) => (
                  <div className="flex flex-col items-center py-2">
                    <div className={cn(
                      "p-1.5 rounded-lg mb-1",
                      resource.id === 'google-calendar' ? "bg-blue-50" : "bg-indigo-50"
                    )}>
                      {resource.id === 'google-calendar' ? (
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Truck className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                  </div>
                )
              }}
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-calendar .rbc-header {
          padding: 8px;
          font-weight: 600;
          color: #64748b;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.75rem;
        }
        .custom-calendar .rbc-time-header-content {
          border-left: 1px solid #f1f5f9;
        }
        .custom-calendar .rbc-timeslot-group {
          border-bottom: 1px solid #f1f5f9;
          min-height: 40px;
        }
        .custom-calendar .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f8fafc;
        }
        .custom-calendar .rbc-event {
          transition: all 0.2s ease;
          border-left: 3px solid rgba(0,0,0,0.1) !important;
        }
        .custom-calendar .rbc-event:hover {
          filter: brightness(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 50;
        }
        .custom-calendar .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }
        .custom-calendar .rbc-time-view {
          border: none;
        }
        .custom-calendar .rbc-month-view {
          border: none;
        }
        .custom-calendar .rbc-off-range-bg {
          background-color: #f8fafc;
        }
        .custom-calendar .rbc-today {
          background-color: #f0f9ff;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
};

export default Planning;
