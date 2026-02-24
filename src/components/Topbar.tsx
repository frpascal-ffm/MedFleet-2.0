/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Bell, Calendar, Menu } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TopbarProps {
  onMenuClick?: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const [search, setSearch] = useState('');

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 md:gap-8 flex-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="relative hidden md:block w-64 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Suche..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar size={18} className="text-slate-400" />
          <span className="text-xs md:text-sm font-medium">
            {format(new Date(), 'dd.MM.yyyy')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <Link 
          to="/neue-fahrt"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 py-2 rounded-xl font-medium transition-colors shadow-sm shadow-emerald-200"
        >
          <Plus size={18} />
          <span className="hidden xs:inline">Neu</span>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
