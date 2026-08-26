import React, { useState } from 'react';
import { 
  Anchor, 
  Compass, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { BoatType, UserProfile } from '../types';
import { COASTAL_STATES, COASTAL_VILLAGES, DEMO_CAPTAINS } from '../data/coastalVillages';

interface LoginPageProps {
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onContinueGuest: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLogin,
  onContinueGuest,
  isOffline,
  onToggleOffline
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'demo'>('form');
  
  // Form state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [boatName, setBoatName] = useState(currentUser?.boatName || '');
  const [boatRegNumber, setBoatRegNumber] = useState(currentUser?.boatRegNumber || '');
  const [boatType, setBoatType] = useState<BoatType>(currentUser?.boatType || 'Motorized Trawler');
  const [selectedState, setSelectedState] = useState(currentUser?.state || 'Tamil Nadu');
  const [villageQuery, setVillageQuery] = useState(currentUser?.villageOrPort || 'Kasimedu (Royapuram)');
  const [language, setLanguage] = useState(currentUser?.language || 'ta');
  const [crewCount, setCrewCount] = useState<number>(currentUser?.crewMembersCount || 5);
  const [rememberMe, setRememberMe] = useState(true);

  // Available villages for current state
  const stateVillages = COASTAL_VILLAGES.filter(v => v.state === selectedState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const profile: UserProfile = {
      id: currentUser?.id || `user-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '+91 98000 00000',
      boatName: boatName.trim() || 'Ocean Scout',
      boatRegNumber: boatRegNumber.trim() || `IND-${selectedState.substring(0, 2).toUpperCase()}-01-F-${Math.floor(1000 + Math.random() * 9000)}`,
      boatType,
      state: selectedState,
      villageOrPort: villageQuery.trim() || stateVillages[0]?.name || 'Coastal Sector',
      language,
      isLoggedIn: true,
      crewMembersCount: crewCount,
      createdAt: currentUser?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    if (rememberMe) {
      try {
        localStorage.setItem('floatchat_user_profile', JSON.stringify(profile));
      } catch (err) {
        console.warn('Local storage error:', err);
      }
    }

    onLogin(profile);
  };

  const handleSelectDemoCaptain = (cap: UserProfile) => {
    try {
      localStorage.setItem('floatchat_user_profile', JSON.stringify(cap));
    } catch (err) {
      console.warn('Local storage error:', err);
    }
    onLogin(cap);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl z-10">
        
        {/* Top Header & Brand Identity */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-3 shadow-xl shadow-blue-900/30">
            <Anchor className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>FloatChat</span>
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40">
              Maritime Portal
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            AI-powered ARGO ocean risk intelligence & early safety advisory for coastal fishermen. Works both <strong className="text-blue-300">Online</strong> and <strong className="text-emerald-300">100% Offline at Sea</strong>.
          </p>
        </div>

        {/* Offline Sea Mode & Connectivity Pill */}
        <div className="mb-5 flex items-center justify-between p-3 rounded-2xl bg-[#0b0f19] border border-slate-800 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${isOffline ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`}>
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">
                {isOffline ? 'Offline Sea Mode Enabled' : 'Live Satellite Cloud Connected'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isOffline ? 'Local ARGO physics rules & cache active' : 'Real-time Gemini AI & satellite sync ready'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleOffline}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isOffline
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isOffline ? 'Connect Live' : 'Test Offline'}
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 p-2 gap-2 bg-[#020617]/50">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Fisherman / Vessel Login</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'demo'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>1-Click Demo Captains</span>
            </button>
          </div>

          {/* Tab 1: Login / Profile Form */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 text-left">
              
              {/* Row 1: Captain Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Captain / Fisherman Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Captain Anbu / Ramesh"
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mobile / VHF Contact</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98401 23456"
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: State & Village / Coastal Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Coastal State</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      const matching = COASTAL_VILLAGES.filter(v => v.state === e.target.value);
                      if (matching.length > 0) {
                        setVillageQuery(matching[0].name);
                      }
                    }}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {COASTAL_STATES.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.nativeName}) - {s.basin}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      <span>Village / Coastal Port</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Any custom name</span>
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={villageQuery}
                      onChange={(e) => setVillageQuery(e.target.value)}
                      placeholder="e.g. Kasimedu, Dhanushkodi, Vizhinjam..."
                      list="state-villages-list"
                      className="w-full bg-[#020617] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <datalist id="state-villages-list">
                      {stateVillages.map(v => (
                        <option key={v.id} value={v.name}>
                          {v.nativeName} ({v.district})
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Quick Village Pills */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 font-medium block mb-1.5">
                  Popular Coastal Villages in {selectedState}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {stateVillages.slice(0, 5).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVillageQuery(v.name)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        villageQuery === v.name
                          ? 'bg-blue-600 text-white border-blue-400 font-bold'
                          : 'bg-[#020617] text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {v.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Boat Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Boat / Vessel Name
                  </label>
                  <input
                    type="text"
                    value={boatName}
                    onChange={(e) => setBoatName(e.target.value)}
                    placeholder="e.g. Kadalarasan-IV"
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={boatType}
                    onChange={(e) => setBoatType(e.target.value as BoatType)}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Motorized Trawler">Motorized Trawler</option>
                    <option value="Artisanal Catamaran / FRP">Artisanal Catamaran / FRP</option>
                    <option value="Deep-Sea Longliner & Gillnetter">Deep-Sea Gillnetter</option>
                    <option value="Traditional Canoe / Dinghy">Traditional Canoe</option>
                    <option value="Coastal Patrol / Guard Craft">Patrol / Guard Craft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Language / மொழி
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="ml">Malayalam (മലയാളം)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="gu">Gujarati (ગુજરાતી)</option>
                    <option value="mr">Marathi (मराठी)</option>
                    <option value="or">Odia (ଓଡ଼ିଆ)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Checkbox: Remember profile offline */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-[#020617] text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Remember Profile for Offline Sea Access
                  </span>
                </label>

                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>On-Device Storage</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all active:scale-[0.98]"
                >
                  <span>Launch Dashboard & Ocean Safety</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onContinueGuest}
                  className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs sm:text-sm transition-all"
                >
                  Quick Guest Access
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: 1-Click Demo Captains */}
          {activeTab === 'demo' && (
            <div className="p-5 sm:p-7 space-y-3 text-left">
              <p className="text-xs text-slate-400 mb-2">
                Select any registered captain below to test state/village identification, ARGO live telemetry, and local advisory scripts:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_CAPTAINS.map(cap => (
                  <div
                    key={cap.id}
                    onClick={() => handleSelectDemoCaptain(cap)}
                    className="p-4 rounded-2xl bg-[#020617] border border-slate-800 hover:border-blue-500 hover:bg-slate-900/60 cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {cap.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                          {cap.state}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-[11px] text-slate-400 font-mono">
                        <p className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{cap.villageOrPort}</span>
                        </p>
                        <p className="flex items-center gap-1 text-slate-400">
                          <Anchor className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>{cap.boatName} ({cap.boatType.split(' ')[0]})</span>
                        </p>
                        <p className="text-[10px] text-slate-500">{cap.boatRegNumber}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                      <span className="text-xs text-blue-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Launch <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">All demo captains work offline with pre-cached ARGO bouys</span>
                <button
                  type="button"
                  onClick={onContinueGuest}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Continue as Anonymous Guest
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
            Coastal Fishermen Safety Network
          </span>
          <span>•</span>
          <span>ARGO Ocean Buoy Telemetry</span>
          <span>•</span>
          <span>Dual Mode (Online + Offline)</span>
        </div>

      </div>
    </div>
  );
};
