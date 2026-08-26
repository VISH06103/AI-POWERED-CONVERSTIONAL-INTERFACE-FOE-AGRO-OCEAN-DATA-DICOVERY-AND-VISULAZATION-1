import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ArgoFloat, CoastalPort, OceanRiskLevel } from '../types';
import { 
  Flame, 
  Waves, 
  Anchor, 
  Radio, 
  Eye, 
  Layers, 
  ShieldAlert, 
  Compass, 
  Info,
  Maximize2
} from 'lucide-react';

interface OceanMapProps {
  floats: ArgoFloat[];
  ports: CoastalPort[];
  selectedFloat: ArgoFloat;
  selectedPort: CoastalPort;
  onSelectFloat: (float: ArgoFloat) => void;
  onSelectPort: (port: CoastalPort) => void;
  onOpenDepthProfile: (float: ArgoFloat) => void;
}

export const OceanMap: React.FC<OceanMapProps> = ({
  floats,
  ports,
  selectedFloat,
  selectedPort,
  onSelectFloat,
  onSelectPort,
  onOpenDepthProfile,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatCirclesLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'ocean'>('dark');
  const [showThermalZones, setShowThermalZones] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedPort.lat, selectedPort.lng],
        zoom: 6,
        minZoom: 3,
        maxZoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      heatCirclesLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Tile layer configurations
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap, &copy; CARTO, ARGO Floats';

    if (mapLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, Maxar, Earthstar Geographics';
    } else if (mapLayer === 'ocean') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, GEBCO, NOAA, National Geographic';
    }

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    return () => {
      // Map instance is kept alive across component re-renders unless unmounted
    };
  }, [mapLayer]);

  // Update Markers & Danger Heat Circles when floats or selectedPort changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const heatGroup = heatCirclesLayerRef.current;
    if (!map || !markersGroup || !heatGroup) return;

    markersGroup.clearLayers();
    heatGroup.clearLayers();

    // 1. Render Thermal Heat Danger Circles for High TCHP Floats
    if (showThermalZones) {
      floats.forEach(float => {
        if (float.tchp >= 50) {
          const radiusMeters = (float.tchp / 100) * 160000; // ~80km - 140km radius thermal pool
          const color = float.tchp > 75 ? '#ef4444' : '#f59e0b';

          const circle = L.circle([float.lat, float.lng], {
            radius: radiusMeters,
            color: color,
            weight: 1.5,
            opacity: 0.7,
            fillColor: color,
            fillOpacity: 0.18,
            dashArray: '4, 8',
          });

          circle.bindTooltip(`🔥 Cyclonic Thermal Reservoir (TCHP: ${float.tchp} kJ/cm²)`, {
            permanent: false,
            direction: 'top',
            className: 'bg-slate-900 text-red-300 font-mono text-xs border border-red-800 rounded px-2 py-1',
          });

          heatGroup.addLayer(circle);
        }
      });
    }

    // 2. Render Coastal Fishing Ports
    ports.forEach(port => {
      const isSelected = port.id === selectedPort.id;
      const portColor = port.currentWarningStatus === 'HIGH_RISK' ? '#ef4444' : port.currentWarningStatus === 'MODERATE_RISK' ? '#f59e0b' : '#10b981';

      const portHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isSelected ? 'ring-4 ring-cyan-400 bg-slate-950' : 'bg-slate-900 border-2'}" style="border-color: ${portColor}">
            <svg class="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v20m0-20a8 8 0 018 8v4a8 8 0 01-16 0V10a8 8 0 018-8z"></path>
            </svg>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[10px] font-bold text-slate-200">
            ${port.name.split(' ')[0]}
          </div>
        </div>
      `;

      const portIcon = L.divIcon({
        html: portHtml,
        className: 'custom-port-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([port.lat, port.lng], { icon: portIcon });
      marker.on('click', () => onSelectPort(port));
      marker.bindPopup(`
        <div class="p-1 text-slate-100">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-extrabold uppercase text-cyan-400">⚓ Fishing Harbor</span>
          </div>
          <h4 class="font-bold text-sm text-white">${port.name}</h4>
          <p class="text-xs text-slate-300">${port.nativeName || ''}</p>
          <div class="mt-2 pt-2 border-t border-slate-700 text-xs flex justify-between">
            <span class="text-slate-400">Coast Guard VHF:</span>
            <span class="font-mono text-cyan-300 font-bold">${port.vhfChannel}</span>
          </div>
          <div class="mt-1 text-xs flex justify-between">
            <span class="text-slate-400">Status:</span>
            <span class="font-bold ${port.currentWarningStatus === 'HIGH_RISK' ? 'text-red-400' : 'text-emerald-400'}">${port.currentWarningStatus.replace('_', ' ')}</span>
          </div>
        </div>
      `);

      markersGroup.addLayer(marker);
    });

    // 3. Render ARGO Floats
    floats.forEach(float => {
      const isSelected = float.id === selectedFloat.id;
      const isDanger = float.riskLevel === 'HIGH_RISK';
      const isModerate = float.riskLevel === 'MODERATE_RISK';
      const bgClass = isDanger ? 'bg-red-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500';
      const pulseClass = isDanger ? 'bg-red-400 animate-ping-slow' : isModerate ? 'bg-amber-400' : 'bg-emerald-400';

      const floatHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <span class="absolute w-7 h-7 rounded-full ${pulseClass} opacity-60"></span>
          <div class="relative z-10 w-6 h-6 rounded-full ${bgClass} border-2 ${isSelected ? 'border-white ring-4 ring-cyan-400 scale-125' : 'border-slate-900'} flex items-center justify-center shadow-lg transition-transform group-hover:scale-125">
            <span class="w-2 h-2 rounded-full bg-white"></span>
          </div>
          <div class="absolute -top-6 whitespace-nowrap bg-slate-950/90 border border-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            #${float.wmoId} (${float.tchp} kJ)
          </div>
        </div>
      `;

      const floatIcon = L.divIcon({
        html: floatHtml,
        className: 'custom-float-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([float.lat, float.lng], { icon: floatIcon });

      marker.on('click', () => {
        onSelectFloat(float);
      });

      marker.bindPopup(`
        <div class="p-1 min-w-[220px]">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              ARGO #${float.wmoId}
            </span>
            <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isDanger ? 'bg-red-900 text-red-200' : isModerate ? 'bg-amber-900 text-amber-200' : 'bg-emerald-900 text-emerald-200'}">
              ${float.riskLevel.replace('_', ' ')}
            </span>
          </div>
          <h4 class="font-bold text-sm text-white">${float.name}</h4>
          <p class="text-xs text-slate-400 mt-0.5">${float.basin} Basin</p>

          <div class="mt-2.5 grid grid-cols-2 gap-1.5 bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-xs font-mono">
            <div>
              <span class="text-slate-500 text-[10px]">TCHP:</span>
              <div class="font-bold ${float.tchp > 50 ? 'text-red-400' : 'text-slate-200'}">${float.tchp} kJ/cm²</div>
            </div>
            <div>
              <span class="text-slate-500 text-[10px]">D26 Depth:</span>
              <div class="font-bold text-cyan-300">${float.d26Depth}m</div>
            </div>
            <div>
              <span class="text-slate-500 text-[10px]">SST:</span>
              <div class="font-bold text-amber-300">${float.surfaceTemp}°C</div>
            </div>
            <div>
              <span class="text-slate-500 text-[10px]">Waves:</span>
              <div class="font-bold text-blue-300">${float.waveHeight}m</div>
            </div>
          </div>

          <p class="text-xs text-slate-300 mt-2 line-clamp-2">
            ${float.alertSummary}
          </p>

          <div class="mt-3 pt-2 border-t border-slate-800 flex gap-2">
            <button id="popup-profile-btn-${float.id}" class="flex-1 py-1 px-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition-colors">
              View Depth Profile
            </button>
          </div>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-profile-btn-${float.id}`);
        if (btn) {
          btn.onclick = () => onOpenDepthProfile(float);
        }
      });

      markersGroup.addLayer(marker);
    });

  }, [floats, ports, selectedFloat, selectedPort, showThermalZones]);

  // Center map when selectedPort changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([selectedPort.lat, selectedPort.lng], 7, {
      duration: 1.2,
    });
  }, [selectedPort]);

  const handleCenterSelectedFloat = () => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFloat) return;
    map.flyTo([selectedFloat.lat, selectedFloat.lng], 8, { duration: 1 });
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#020617]">
      
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
        
        {/* Basemap Switcher */}
        <div className="flex bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl">
          <button
            onClick={() => setMapLayer('dark')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              mapLayer === 'dark' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dark Grid
          </button>
          <button
            onClick={() => setMapLayer('satellite')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              mapLayer === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapLayer('ocean')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              mapLayer === 'ocean' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bathymetry
          </button>
        </div>

        {/* Thermal Zone Toggle */}
        <button
          onClick={() => setShowThermalZones(!showThermalZones)}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-xl transition-colors ${
            showThermalZones
              ? 'bg-red-950/80 border-red-700/80 text-red-300'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-400" />
          <span>Thermal Reservoirs {showThermalZones ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Top Right Quick Float Center Button & ARGO Cluster Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <button
          onClick={handleCenterSelectedFloat}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-blue-400 text-xs font-bold flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-colors"
          title="Focus on selected ARGO buoy"
        >
          <Compass className="w-4 h-4" />
          <span>Focus #{selectedFloat.wmoId}</span>
        </button>

        {/* Floating Cluster Telemetry Card (Desktop) */}
        <div className="hidden md:block p-3.5 bg-slate-900/90 border border-slate-700 rounded-2xl backdrop-blur-xl shadow-2xl text-left min-w-[200px]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
            <span>ARGO Telemetry</span>
            <span className="font-mono text-blue-400">#{selectedFloat.wmoId}</span>
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400 font-medium">Surface Temp</span>
              <span className="font-mono text-blue-400 font-bold">{selectedFloat.surfaceTemp}°C</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400 font-medium">Salinity</span>
              <span className="font-mono text-emerald-400 font-bold">{selectedFloat.surfaceSalinity} PSU</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400 font-medium">TCHP Energy</span>
              <span className={`font-mono font-bold ${selectedFloat.tchp > 50 ? 'text-red-400' : 'text-white'}`}>{selectedFloat.tchp} kJ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right Anomaly Detection Card if Risk Elevated */}
      {selectedFloat.riskLevel !== 'LOW_RISK' && (
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 max-w-xs">
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-md shadow-2xl">
            <p className="text-[10px] text-red-400 font-black uppercase tracking-tighter flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Marine Anomaly Active
            </p>
            <p className="text-xs text-white leading-tight mt-0.5">
              {selectedFloat.alertSummary}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3 shadow-2xl text-xs max-w-xs hidden sm:block">
        <div className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] uppercase tracking-wider text-slate-300">ARGO Map Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse"></span>
            <span>Cyclone Fuel &gt;50kJ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>
            <span>Rough Swell</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
            <span>Safe Waters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>⚓ Harbor Sector</span>
          </div>
        </div>
      </div>

    </div>
  );
};
