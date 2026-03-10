/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardList, 
  FileText, 
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useSupabase } from '../state/SupabaseContext';
import { supabase } from '../lib/supabase';
import { TransportSheetStatus } from '../types';

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ onClose, isCollapsed, onToggle }: SidebarProps) => {
  const { transportSheets, assignments, getConflicts, vehicles } = useApp();
  const { session } = useSupabase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const criticalSheetsCount = transportSheets.filter(
    s => s.status === TransportSheetStatus.FEHLT || s.status === TransportSheetStatus.MUSS_KORRIGIERT_WERDEN
  ).length;

  const totalConflicts = vehicles.reduce((acc, v) => acc + getConflicts(v.id).length, 0);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Übersicht' },
    { to: '/planung', icon: CalendarDays, label: 'Planung', badge: totalConflicts > 0 ? totalConflicts : undefined, badgeColor: 'bg-red-500' },
    { to: '/auftraege', icon: ClipboardList, label: 'Aufträge' },
    { to: '/transportscheine', icon: FileText, label: 'Transportscheine', badge: criticalSheetsCount > 0 ? criticalSheetsCount : undefined, badgeColor: 'bg-amber-500' },
    { to: '/einstellungen', icon: Settings, label: 'Einstellungen' },
  ];

  return (
    <aside className={`bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Toggle Button on Edge */}
      <button
        onClick={onToggle}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white z-50 shadow-lg"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-6 flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-3 min-w-max">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">KT</div>
          {!isCollapsed && <h1 className="text-xl font-bold text-white tracking-tight whitespace-nowrap">MediLog Ops</h1>}
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            title={isCollapsed ? item.label : ''}
            className={({ isActive }) => `
              flex items-center px-3 py-2 rounded-lg transition-colors
              ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}
              ${isCollapsed ? 'justify-center' : 'justify-between'}
            `}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <item.icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </div>
            {!isCollapsed && item.badge !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor}`}>
                {item.badge}
              </span>
            )}
            {isCollapsed && item.badge !== undefined && (
              <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${item.badgeColor}`} />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 overflow-hidden space-y-2">
        <div className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium flex-shrink-0">
            {session?.user?.user_metadata?.first_name?.[0] || 'U'}
            {session?.user?.user_metadata?.last_name?.[0] || ''}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.user_metadata?.first_name || 'User'} {session?.user?.user_metadata?.last_name || ''}
              </p>
              <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Abmelden' : ''}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Abmelden</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
