/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Bell,
  User,
  Database,
  RefreshCw,
  Truck,
  Plus,
  Trash2,
  Edit2,
  X,
  Euro,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../state/AppContext';
import { Vehicle, GkvPricing } from '../types';

const Settings = () => {
  const { 
    isGoogleConnected, 
    checkGoogleStatus, 
    fetchGoogleEvents, 
    vehicles, 
    addVehicle, 
    updateVehicle, 
    deleteVehicle,
    pricing,
    updatePricing,
    addGkvContract,
    updateGkvContract,
    deleteGkvContract
  } = useApp();
  const [activeTab, setActiveTab] = React.useState('general');
  const [activePriceTab, setActivePriceTab] = React.useState<'gkv' | 'pkv' | 'privat'>('gkv');
  const [isAddingVehicle, setIsAddingVehicle] = React.useState(false);
  const [newVehicle, setNewVehicle] = React.useState<Partial<Vehicle>>({
    name: '',
    brand: '',
    model: '',
    licensePlate: '',
    equipment: [],
    active: true
  });

  const [isAddingGkv, setIsAddingGkv] = React.useState(false);
  const [newGkv, setNewGkv] = React.useState<Omit<GkvPricing, 'id'>>({
    insuranceName: '',
    prices: { 
      sitzend: { baseFee: 0, includedKm: 0, pricePerKm: 0 }, 
      rollstuhl: { baseFee: 0, includedKm: 0, pricePerKm: 0 }, 
      tragestuhl: { baseFee: 0, includedKm: 0, pricePerKm: 0 } 
    }
  });

  useEffect(() => {
    checkGoogleStatus();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        checkGoogleStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

  const handleSyncNow = async () => {
    await fetchGoogleEvents();
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/auth/google/logout', { method: 'POST' });
      if (res.ok) {
        checkGoogleStatus();
      }
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-100 rounded-2xl">
          <SettingsIcon className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Einstellungen</h1>
          <p className="text-slate-500">Verwalten Sie Ihre App-Konfiguration und Integrationen.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Tabs */}
        <div className="space-y-1">
          {[
            { id: 'general', label: 'Allgemein', icon: SettingsIcon },
            { id: 'vehicles', label: 'Fahrzeuge', icon: Truck },
            { id: 'prices', label: 'Preise & Verträge', icon: Euro },
            { id: 'integrations', label: 'Integrationen', icon: RefreshCw },
            { id: 'account', label: 'Benutzerkonto', icon: User },
            { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
            { id: 'security', label: 'Sicherheit', icon: Shield },
            { id: 'data', label: 'Datenbank', icon: Database },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'integrations' && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Google Kalender</h3>
                  <p className="text-xs text-slate-500">Synchronisieren Sie Ihre Fahrten mit Google.</p>
                </div>
              </div>
              {isGoogleConnected && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 size={12} />
                  Verbunden
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-6">
              {!isGoogleConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
                    <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Keine Verbindung</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Verbinden Sie Ihren Google Kalender, um Fahrten automatisch zu synchronisieren und externe Termine in der Planung zu sehen.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleConnectGoogle}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ExternalLink size={18} />
                    Google Konto verbinden
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        G
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Google Kalender Aktiv</p>
                        <p className="text-xs text-slate-500">Letzte Synchronisierung: Gerade eben</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSyncNow}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                      title="Jetzt synchronisieren"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Optionen</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Neue Fahrten automatisch syncen', active: true },
                        { label: 'Google Termine in Planung anzeigen', active: true },
                        { label: 'Benachrichtigungen bei Konflikten', active: false },
                      ].map((opt, i) => (
                        <label key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${opt.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${opt.active ? 'right-1' : 'left-1'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleDisconnect}
                    className="w-full py-3 text-red-600 font-bold text-sm hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                  >
                    Verbindung trennen
                  </button>
                </div>
              )}
            </div>
          </section>
          )}

          {activeTab === 'vehicles' && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Fahrzeuge</h3>
                    <p className="text-xs text-slate-500">Verwalten Sie Ihren Fuhrpark.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  {isAddingVehicle ? <X size={16} /> : <Plus size={16} />}
                  {isAddingVehicle ? 'Abbrechen' : 'Neues Fahrzeug'}
                </button>
              </div>

              {isAddingVehicle && (
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <h4 className="font-bold text-sm mb-4 text-slate-700">Fahrzeug hinzufügen</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Fahrzeugname / Rufname</label>
                      <input 
                        type="text" 
                        value={newVehicle.name}
                        onChange={e => setNewVehicle({...newVehicle, name: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="z.B. KTW 1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Kennzeichen</label>
                      <input 
                        type="text" 
                        value={newVehicle.licensePlate}
                        onChange={e => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="z.B. B-KT 123"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Marke</label>
                      <input 
                        type="text" 
                        value={newVehicle.brand}
                        onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="z.B. Mercedes-Benz"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Modell</label>
                      <input 
                        type="text" 
                        value={newVehicle.model}
                        onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="z.B. Sprinter"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ausstattung</label>
                    <div className="flex flex-wrap gap-2">
                      {['Rampe', 'Tragestuhl', 'Rollstuhlgerecht', 'Sauerstoff'].map(eq => (
                        <button
                          key={eq}
                          onClick={() => {
                            const current = newVehicle.equipment || [];
                            setNewVehicle({
                              ...newVehicle,
                              equipment: current.includes(eq) ? current.filter(e => e !== eq) : [...current, eq]
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            (newVehicle.equipment || []).includes(eq)
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {eq}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsAddingVehicle(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button 
                      onClick={() => {
                        if (newVehicle.name) {
                          addVehicle(newVehicle);
                          setIsAddingVehicle(false);
                          setNewVehicle({ name: '', brand: '', model: '', licensePlate: '', equipment: [], active: true });
                        }
                      }}
                      disabled={!newVehicle.name}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {vehicles.map(vehicle => (
                  <div key={vehicle.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vehicle.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          {vehicle.name}
                          {!vehicle.active && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">Inaktiv</span>}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {vehicle.licensePlate && <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{vehicle.licensePlate}</span>}
                          {vehicle.brand && vehicle.model && <span>{vehicle.brand} {vehicle.model}</span>}
                        </div>
                        {vehicle.equipment && vehicle.equipment.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {vehicle.equipment.map(eq => (
                              <span key={eq} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{eq}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateVehicle(vehicle.id, { active: !vehicle.active })}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${vehicle.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        {vehicle.active ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button 
                        onClick={() => deleteVehicle(vehicle.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {vehicles.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Keine Fahrzeuge vorhanden.
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'prices' && (
            <div className="space-y-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActivePriceTab('gkv')} 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activePriceTab === 'gkv' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  GKV Verträge
                </button>
                <button 
                  onClick={() => setActivePriceTab('pkv')} 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activePriceTab === 'pkv' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  PKV Preise
                </button>
                <button 
                  onClick={() => setActivePriceTab('privat')} 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activePriceTab === 'privat' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Privat (Selbstzahler)
                </button>
              </div>

              {activePriceTab === 'pkv' && (
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">PKV Preise</h3>
                    <p className="text-xs text-slate-500">Fixe Preise für Privatversicherte</p>
                  </div>
                  <div className="p-4">
                    {(['sitzend', 'rollstuhl', 'tragestuhl'] as const).map(type => (
                      <div key={type} className="space-y-2 py-3 border-b border-slate-100 last:border-0">
                        <label className="text-sm font-bold text-slate-700 capitalize">{type === 'rollstuhl' ? 'Rollstuhl/Rollator' : type}</label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Grundpauschale</label>
                            <div className="relative mt-1">
                              <input 
                                type="number" 
                                value={pricing.pkv[type].baseFee}
                                onChange={e => updatePricing('pkv', { ...pricing.pkv, [type]: { ...pricing.pkv[type], baseFee: parseFloat(e.target.value) || 0 } })}
                                className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Inklusiv KM</label>
                            <div className="relative mt-1">
                              <input 
                                type="number" 
                                value={pricing.pkv[type].includedKm}
                                onChange={e => updatePricing('pkv', { ...pricing.pkv, [type]: { ...pricing.pkv[type], includedKm: parseFloat(e.target.value) || 0 } })}
                                className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">km</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Preis / KM</label>
                            <div className="relative mt-1">
                              <input 
                                type="number" 
                                value={pricing.pkv[type].pricePerKm}
                                onChange={e => updatePricing('pkv', { ...pricing.pkv, [type]: { ...pricing.pkv[type], pricePerKm: parseFloat(e.target.value) || 0 } })}
                                className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activePriceTab === 'privat' && (
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Privat (Selbstzahler)</h3>
                    <p className="text-xs text-slate-500">Standardpreise für Selbstzahler</p>
                  </div>
                  <div className="p-4">
                    {(['sitzend', 'rollstuhl', 'tragestuhl'] as const).map(type => (
                      <div key={type} className="space-y-2 py-3 border-b border-slate-100 last:border-0">
                        <label className="text-sm font-bold text-slate-700 capitalize">{type === 'rollstuhl' ? 'Rollstuhl/Rollator' : type}</label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Grundpauschale</label>
                            <div className="relative mt-1">
                              <input 
                                type="number" 
                                value={pricing.privat[type].baseFee}
                                onChange={e => updatePricing('privat', { ...pricing.privat, [type]: { ...pricing.privat[type], baseFee: parseFloat(e.target.value) || 0 } })}
                                className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Inklusiv KM</label>
                            <div className="relative mt-1">
                              <input 
                                type="number" 
                                value={pricing.privat[type].includedKm}
                                onChange={e => updatePricing('privat', { ...pricing.privat, [type]: { ...pricing.privat[type], includedKm: parseFloat(e.target.value) || 0 } })}
                                className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">km</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Preis / KM</label>
                            <div className="relative mt-1">
                              <input 
                                type="number" 
                                value={pricing.privat[type].pricePerKm}
                                onChange={e => updatePricing('privat', { ...pricing.privat, [type]: { ...pricing.privat[type], pricePerKm: parseFloat(e.target.value) || 0 } })}
                                className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activePriceTab === 'gkv' && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">GKV Verträge</h3>
                    <p className="text-xs text-slate-500">Preise nach Krankenkasse</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingGkv(!isAddingGkv)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    {isAddingGkv ? <X size={16} /> : <Plus size={16} />}
                    {isAddingGkv ? 'Abbrechen' : 'Neuer Vertrag'}
                  </button>
                </div>

                {isAddingGkv && (
                  <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Krankenkasse</label>
                        <input 
                          type="text" 
                          value={newGkv.insuranceName}
                          onChange={e => setNewGkv({...newGkv, insuranceName: e.target.value})}
                          className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          placeholder="z.B. AOK Nordost"
                        />
                      </div>
                      <div className="space-y-6">
                        {(['sitzend', 'rollstuhl', 'tragestuhl'] as const).map(type => (
                          <div key={type}>
                            <label className="text-sm font-bold text-slate-700 capitalize">{type === 'rollstuhl' ? 'Rollstuhl/Rollator' : type}</label>
                            <div className="grid grid-cols-3 gap-4 mt-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Grundpauschale</label>
                                <div className="relative mt-1">
                                  <input 
                                    type="number" 
                                    value={newGkv.prices[type].baseFee}
                                    onChange={e => setNewGkv({
                                      ...newGkv, 
                                      prices: { ...newGkv.prices, [type]: { ...newGkv.prices[type], baseFee: parseFloat(e.target.value) || 0 } }
                                    })}
                                    className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Inklusiv KM</label>
                                <div className="relative mt-1">
                                  <input 
                                    type="number" 
                                    value={newGkv.prices[type].includedKm}
                                    onChange={e => setNewGkv({
                                      ...newGkv, 
                                      prices: { ...newGkv.prices, [type]: { ...newGkv.prices[type], includedKm: parseFloat(e.target.value) || 0 } }
                                    })}
                                    className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">km</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Preis / KM</label>
                                <div className="relative mt-1">
                                  <input 
                                    type="number" 
                                    value={newGkv.prices[type].pricePerKm}
                                    onChange={e => setNewGkv({
                                      ...newGkv, 
                                      prices: { ...newGkv.prices, [type]: { ...newGkv.prices[type], pricePerKm: parseFloat(e.target.value) || 0 } }
                                    })}
                                    className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          onClick={() => {
                            if (newGkv.insuranceName) {
                              addGkvContract(newGkv);
                              setIsAddingGkv(false);
                              setNewGkv({ insuranceName: '', prices: { 
                                sitzend: { baseFee: 0, includedKm: 0, pricePerKm: 0 }, 
                                rollstuhl: { baseFee: 0, includedKm: 0, pricePerKm: 0 }, 
                                tragestuhl: { baseFee: 0, includedKm: 0, pricePerKm: 0 } 
                              } });
                            }
                          }}
                          disabled={!newGkv.insuranceName}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          Speichern
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {pricing.gkv.map(contract => (
                    <div key={contract.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-900">{contract.insuranceName}</h4>
                        <button 
                          onClick={() => deleteGkvContract(contract.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {(['sitzend', 'rollstuhl', 'tragestuhl'] as const).map(type => (
                          <div key={type} className="bg-white p-4 rounded-xl border border-slate-200">
                            <h5 className="text-sm font-bold text-slate-700 capitalize mb-3">{type === 'rollstuhl' ? 'Rollstuhl/Rollator' : type}</h5>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Grundpauschale</label>
                                <div className="relative mt-1">
                                  <input 
                                    type="number" 
                                    value={contract.prices[type].baseFee}
                                    onChange={e => updateGkvContract(contract.id, { 
                                      prices: { ...contract.prices, [type]: { ...contract.prices[type], baseFee: parseFloat(e.target.value) || 0 } }
                                    })}
                                    className="w-full px-3 py-1.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Inklusiv KM</label>
                                <div className="relative mt-1">
                                  <input 
                                    type="number" 
                                    value={contract.prices[type].includedKm}
                                    onChange={e => updateGkvContract(contract.id, { 
                                      prices: { ...contract.prices, [type]: { ...contract.prices[type], includedKm: parseFloat(e.target.value) || 0 } }
                                    })}
                                    className="w-full px-3 py-1.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">km</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Preis / KM</label>
                                <div className="relative mt-1">
                                  <input 
                                    type="number" 
                                    value={contract.prices[type].pricePerKm}
                                    onChange={e => updateGkvContract(contract.id, { 
                                      prices: { ...contract.prices, [type]: { ...contract.prices[type], pricePerKm: parseFloat(e.target.value) || 0 } }
                                    })}
                                    className="w-full px-3 py-1.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {pricing.gkv.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      Keine GKV Verträge vorhanden.
                    </div>
                  )}
                </div>
              </section>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Database className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Datenbank (Supabase)</h3>
                    <p className="text-xs text-slate-500">Verwalten Sie Ihre Datenbankverbindung.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
                  <Info className="text-blue-500 flex-shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">Supabase Integration</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Um Supabase zu nutzen, müssen Sie die Umgebungsvariablen <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_URL</code> und <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in den App-Einstellungen hinterlegen.
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2">
                      Das Datenbankschema finden Sie in der Datei <code className="bg-slate-200 px-1 rounded">supabase.sql</code> im Hauptverzeichnis. Führen Sie dieses Script im Supabase SQL Editor aus, um die Tabellen zu erstellen.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Other Settings (Placeholders) */}
          {activeTab !== 'integrations' && activeTab !== 'vehicles' && activeTab !== 'prices' && activeTab !== 'data' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 opacity-50 pointer-events-none">
            <h3 className="font-bold text-slate-900 mb-4">Allgemeine Präferenzen</h3>
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse"></div>
            </div>
          </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
