import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ArgoFloat, CoastalPort, OceanRiskLevel, UserProfile, VillageConditionResult, VoyageNavigationState } from '../types';
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
  Maximize2,
  Navigation,
  MapPin,
  Search,
  Crosshair,
  Route,
  Sparkles,
  Volume2,
  X
} from 'lucide-react';
import { identifyVillageOrStateCondition, identifyVillageOrStateConditionAsync, INDIAN_AND_GLOBAL_PLACES_DIRECTORY } from '../data/coastalVillages';

interface OceanMapProps {
  floats: ArgoFloat[];
  ports: CoastalPort[];
  selectedFloat: ArgoFloat;
  selectedPort: CoastalPort;
  onSelectFloat: (float: ArgoFloat) => void;
  onSelectPort: (port: CoastalPort) => void;
  onOpenDepthProfile: (float: ArgoFloat) => void;
  activeTrackedLocation?: VillageConditionResult | null;
  onLocationTracked?: (result: VillageConditionResult) => void;
  onAskChat?: (query: string) => void;
  voyageState?: VoyageNavigationState | null;
  currentUser?: UserProfile | null;
}

export const OceanMap: React.FC<OceanMapProps> = ({
  floats,
  ports,
  selectedFloat,
  selectedPort,
  onSelectFloat,
  onSelectPort,
  onOpenDepthProfile,
  activeTrackedLocation,
  onLocationTracked,
  onAskChat,
  voyageState,
  currentUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatCirclesLayerRef = useRef<L.LayerGroup | null>(null);
  const userTrackLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'osm' | 'ocean'>('dark');
  const [showThermalZones, setShowThermalZones] = useState(true);
  const [showNavigationRoutes, setShowNavigationRoutes] = useState(true);

  // Live Location & Place Search state
  const [searchPlaceQuery, setSearchPlaceQuery] = useState('');
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [localTrackedPlace, setLocalTrackedPlace] = useState<VillageConditionResult | null>(activeTrackedLocation || null);

  // Sync external activeTrackedLocation if updated elsewhere
  useEffect(() => {
    if (activeTrackedLocation) {
      setLocalTrackedPlace(activeTrackedLocation);
    }
  }, [activeTrackedLocation]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedPort.lat, selectedPort.lng],
        zoom: 6,
        minZoom: 3,
        maxZoom: 19,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      heatCirclesLayerRef.current = L.layerGroup().addTo(map);
      userTrackLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layers before applying chosen basemap
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Zero API-Key Required, 100% Free & Open Tile Providers with safe zoom scaling
    // Esri Dark Gray Base provides high-contrast maritime styling without API keys or watermarks
    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    let attribution = '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';
    let maxNative = 16;

    if (mapLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, Maxar, Earthstar Geographics';
      maxNative = 18;
    } else if (mapLayer === 'osm') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      maxNative = 19;
    } else if (mapLayer === 'ocean') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, GEBCO, NOAA, National Geographic';
      maxNative = 10; // Upscale beyond zoom 10 smoothly without 404/API key requests
    }

    L.tileLayer(tileUrl, {
      attribution,
      subdomains: 'abcd',
      maxZoom: 19,
      maxNativeZoom: maxNative,
      crossOrigin: true,
    }).addTo(map);

    return () => {
      // Keep instance intact across renders
    };
  }, [mapLayer]);

  // Update Markers, Heat Danger Pools & Ports
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
          const radiusMeters = (float.tchp / 100) * 160000; // ~80km - 140km radius
          const color = float.tchp > 75 ? '#ef4444' : '#f59e0b';

          const circle = L.circle([float.lat, float.lng], {
            radius: radiusMeters,
            color: color,
            weight: 1.5,
            opacity: 0.75,
            fillColor: color,
            fillOpacity: 0.18,
            dashArray: '4, 8',
          });

          circle.bindTooltip(`🔥 Cyclonic Thermal Pool (TCHP: ${float.tchp} kJ/cm²)`, {
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
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isSelected ? 'ring-4 ring-cyan-400 bg-slate-950 scale-110' : 'bg-slate-900 border-2'}" style="border-color: ${portColor}">
            <svg class="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v20m0-20a8 8 0 018 8v4a8 8 0 01-16 0V10a8 8 0 018-8z"></path>
            </svg>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/95 border border-slate-700 text-[10px] font-bold text-slate-200 shadow-md">
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
        <div class="p-1 text-slate-100 min-w-[200px]">
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
          <div class="absolute -top-6 whitespace-nowrap bg-slate-950/95 border border-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
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

  // 4. Render Live Tracked Vessel / Place & Geodesic Navigation Vectors
  useEffect(() => {
    const map = mapInstanceRef.current;
    const trackGroup = userTrackLayerRef.current;
    if (!map || !trackGroup) return;

    trackGroup.clearLayers();

    if (!localTrackedPlace) return;

    const { lat, lng, villageName, nearestFloat, riskLevel, distanceToFloatKm } = localTrackedPlace;

    const isHigh = riskLevel === 'HIGH_RISK';
    const isMod = riskLevel === 'MODERATE_RISK';
    const statusColor = isHigh ? '#ef4444' : isMod ? '#f59e0b' : '#38bdf8';

    // 1. Radar Pulse Beacon for User's Tracked Location
    const beaconHtml = `
      <div class="relative flex items-center justify-center cursor-pointer">
        <span class="absolute w-12 h-12 rounded-full animate-ping opacity-75" style="background-color: ${statusColor}"></span>
        <span class="absolute w-8 h-8 rounded-full opacity-50" style="background-color: ${statusColor}"></span>
        <div class="relative z-10 w-6 h-6 rounded-full bg-slate-950 border-2 flex items-center justify-center shadow-2xl" style="border-color: ${statusColor}">
          <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${statusColor}"></div>
        </div>
        <div class="absolute -top-7 whitespace-nowrap bg-slate-950/95 border border-cyan-500/80 text-cyan-300 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xl flex items-center gap-1">
          <span>📍</span>
          <span>${villageName}</span>
        </div>
      </div>
    `;

    const beaconIcon = L.divIcon({
      html: beaconHtml,
      className: 'custom-user-beacon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const userMarker = L.marker([lat, lng], { icon: beaconIcon });
    userMarker.bindPopup(`
      <div class="p-1 min-w-[220px]">
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">📍 Tracked Location</span>
          <span class="text-[9px] font-mono text-slate-400">${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E</span>
        </div>
        <h4 class="font-bold text-sm text-white">${villageName}</h4>
        <p class="text-xs text-slate-300 mt-0.5">${localTrackedPlace.state} (${localTrackedPlace.basin})</p>
        
        <div class="mt-2 p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-xs">
          <div class="flex justify-between text-slate-400">
            <span>Nearest ARGO Buoy:</span>
            <span class="font-mono text-cyan-300 font-bold">#${nearestFloat.wmoId}</span>
          </div>
          <div class="flex justify-between text-slate-400 mt-1">
            <span>Float Distance:</span>
            <span class="font-mono text-white font-bold">${Math.round(distanceToFloatKm)} km (${(distanceToFloatKm * 0.539957).toFixed(1)} NM)</span>
          </div>
          <div class="flex justify-between text-slate-400 mt-1">
            <span>Ocean Risk:</span>
            <span class="font-bold ${isHigh ? 'text-red-400' : isMod ? 'text-amber-400' : 'text-emerald-400'}">${riskLevel.replace('_', ' ')}</span>
          </div>
        </div>

        <p class="text-[11px] text-slate-300 mt-2 italic">
          ${localTrackedPlace.advisorySummary || 'Monitoring live sea surface temperature and cyclonic energy pools.'}
        </p>
      </div>
    `);

    trackGroup.addLayer(userMarker);

    // 2. Draw Geodesic Nautical Navigation Line to nearest ARGO Float
    if (showNavigationRoutes && nearestFloat) {
      const routeLine = L.polyline(
        [
          [lat, lng],
          [nearestFloat.lat, nearestFloat.lng],
        ],
        {
          color: statusColor,
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 8',
        }
      );

      routeLine.bindTooltip(`Course: ${(distanceToFloatKm * 0.539957).toFixed(1)} NM to ARGO #${nearestFloat.wmoId}`, {
        permanent: false,
        direction: 'center',
        className: 'bg-slate-950 text-cyan-200 font-mono text-[10px] border border-cyan-700/80 rounded px-2 py-0.5',
      });

      trackGroup.addLayer(routeLine);
    }

    // 3. Render Active Voyage Vessel & Auto-Radio Distress Beacon (if voyage active)
    if (voyageState && voyageState.isVoyageActive) {
      const vLat = voyageState.currentPosition.lat;
      const vLng = voyageState.currentPosition.lng;
      const isJammed = voyageState.connectionState === 'SIGNAL_JAMMED_DEADZONE';
      const captainName = currentUser?.name || 'Registered Captain';
      const boatName = currentUser?.boatName || 'Meenava Thalaivan';
      const boatReg = currentUser?.boatRegNumber || 'IND-TN-02-MM-1088';

      // Draw dashed line from Departure Village to Ship Position
      const departureLine = L.polyline(
        [
          [voyageState.departurePoint.lat, voyageState.departurePoint.lng],
          [vLat, vLng],
        ],
        {
          color: isJammed ? '#f43f5e' : '#38bdf8',
          weight: 3,
          dashArray: isJammed ? '4, 4' : '8, 8',
          opacity: 0.9,
        }
      );
      trackGroup.addLayer(departureLine);

      // Vessel Marker with Animated Radio Waves if Jammed
      const vesselHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          ${isJammed ? `
            <span class="absolute w-16 h-16 rounded-full animate-ping opacity-75 bg-rose-600"></span>
            <span class="absolute w-10 h-10 rounded-full opacity-50 bg-red-600 animate-pulse"></span>
          ` : `
            <span class="absolute w-8 h-8 rounded-full opacity-30 bg-cyan-400"></span>
          `}
          <div class="relative z-10 w-8 h-8 rounded-full ${isJammed ? 'bg-rose-950 border-2 border-rose-500 shadow-rose-900/80 shadow-2xl' : 'bg-slate-950 border-2 border-cyan-400 shadow-xl'} flex items-center justify-center">
            <span class="text-sm">${isJammed ? '🚨' : '🚢'}</span>
          </div>
          <div class="absolute -top-7 whitespace-nowrap ${isJammed ? 'bg-rose-950/95 border-rose-500 text-rose-200' : 'bg-slate-950/95 border-cyan-500/80 text-cyan-300'} border px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xl flex items-center gap-1">
            <span>${isJammed ? 'VHF CH 16 TX' : 'VESSEL'}</span>
            <span>• ${boatName} (${voyageState.currentOffshoreNm} NM)</span>
          </div>
        </div>
      `;

      const vesselIcon = L.divIcon({
        html: vesselHtml,
        className: 'custom-vessel-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const vesselMarker = L.marker([vLat, vLng], { icon: vesselIcon });
      vesselMarker.bindPopup(`
        <div class="p-1 min-w-[240px]">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider ${isJammed ? 'text-rose-400' : 'text-cyan-400'}">
              ${isJammed ? '🚨 AUTO-RADIO ACTIVE (JAMMED)' : '🚢 ACTIVE VOYAGE NAVIGATION'}
            </span>
            <span class="text-[9px] font-mono text-slate-400">${vLat.toFixed(3)}°N, ${vLng.toFixed(3)}°E</span>
          </div>
          <h4 class="font-bold text-sm text-white">${boatName} <span class="text-xs text-slate-400 font-mono">(${boatReg})</span></h4>
          <p class="text-xs text-emerald-400 font-semibold mt-0.5">Master: ${captainName}</p>
          
          <div class="mt-2 p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-xs space-y-1">
            <div class="flex justify-between text-slate-400">
              <span>Offshore Distance:</span>
              <span class="font-mono text-white font-bold">${voyageState.currentOffshoreNm} NM from ${voyageState.departurePoint.name}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Sailing Speed / Course:</span>
              <span class="font-mono text-cyan-300 font-bold">${voyageState.speedKnots} kts • ${voyageState.bearingDegrees}°</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Link Status:</span>
              <span class="font-bold ${isJammed ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}">
                ${isJammed ? 'SIGNAL JAMMED / DEADZONE' : 'SATELLITE CONNECTED'}
              </span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Auto Radio Distress:</span>
              <span class="font-mono text-amber-300 font-bold">VHF Ch 16 (156.8 MHz)</span>
            </div>
          </div>
        </div>
      `);

      trackGroup.addLayer(vesselMarker);
    }
  }, [localTrackedPlace, showNavigationRoutes, voyageState, currentUser]);

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

  // Perform Live Place Search or Coordinate Lookup
  const handleExecutePlaceSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryToSearch = searchPlaceQuery.trim();
    if (!queryToSearch) return;

    setIsSearchingPlace(true);
    setGpsError(null);

    try {
      const condition = await identifyVillageOrStateConditionAsync(queryToSearch, floats, false);
      setLocalTrackedPlace(condition);
      
      if (onLocationTracked) {
        onLocationTracked(condition);
      }

      // Fly map smoothly to the tracked place location
      const map = mapInstanceRef.current;
      if (map) {
        map.flyTo([condition.lat, condition.lng], condition.isInlandPlace ? 8 : 10, { duration: 1.2 });
      }
    } catch (err) {
      console.warn('Place lookup error:', err);
      setGpsError('Could not locate place. Please check the spelling or enter GPS coordinates.');
    } finally {
      setIsSearchingPlace(false);
    }
  };

  // Trigger Browser GPS Live Location Tracking
  const handleTrackLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        const condition = identifyVillageOrStateCondition(
          `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`,
          floats,
          false
        );

        setLocalTrackedPlace(condition);
        setIsLocatingGps(false);

        if (onLocationTracked) {
          onLocationTracked(condition);
        }

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([userLat, userLng], 9, { duration: 1.5 });
        }
      },
      (error) => {
        console.warn('GPS Error:', error);
        setIsLocatingGps(false);
        setGpsError('GPS permission denied or timed out. You can type any place name above.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full h-[440px] sm:h-[500px] lg:h-[580px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#020617]">
      
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Place Search & GPS Location Bar */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        
        {/* Search Input Box */}
        <form 
          onSubmit={handleExecutePlaceSearch}
          className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl w-full sm:max-w-md"
        >
          <div className="pl-2 text-cyan-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchPlaceQuery}
            onChange={(e) => setSearchPlaceQuery(e.target.value)}
            placeholder="Search any place / village / GPS (e.g. Kasimedu, Dhanushkodi)..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none px-1 font-medium"
          />
          {searchPlaceQuery && (
            <button
              type="button"
              onClick={() => setSearchPlaceQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isSearchingPlace}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all shrink-0 active:scale-95"
          >
            {isSearchingPlace ? 'Locating...' : 'Track'}
          </button>
        </form>

        {/* GPS Live Track & Basemap Switcher Row */}
        <div className="pointer-events-auto flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleTrackLiveGps}
            disabled={isLocatingGps}
            className="px-3.5 py-2 rounded-2xl bg-cyan-950/90 hover:bg-cyan-900/90 border border-cyan-600/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-2xl backdrop-blur-xl transition-all active:scale-95"
            title="Track my real-time GPS location"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isLocatingGps ? 'Tracking GPS...' : 'My Live GPS'}</span>
          </button>

          {/* Basemap Switcher */}
          <div className="flex bg-slate-950/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl p-1 shadow-2xl">
            <button
              onClick={() => setMapLayer('dark')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                mapLayer === 'dark' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dark Navigation Grid (Zero API Key)"
            >
              Dark
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                mapLayer === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Esri Satellite Imagery"
            >
              Satellite
            </button>
            <button
              onClick={() => setMapLayer('osm')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                mapLayer === 'osm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="OpenStreetMap Standard"
            >
              OpenSea
            </button>
            <button
              onClick={() => setMapLayer('ocean')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                mapLayer === 'ocean' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Bathymetric Ocean Floor"
            >
              Depth
            </button>
          </div>
        </div>

      </div>

      {/* Layer Toggles Floating Below Search */}
      <div className="absolute top-16 left-3.5 z-[1000] flex flex-wrap items-center gap-2">
        {/* Thermal Zone Toggle */}
        <button
          onClick={() => setShowThermalZones(!showThermalZones)}
          className={`px-3 py-1 rounded-xl border text-[11px] font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-xl transition-colors ${
            showThermalZones
              ? 'bg-red-950/80 border-red-700/80 text-red-300'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-400" />
          <span>Thermal Pools {showThermalZones ? 'ON' : 'OFF'}</span>
        </button>

        {/* Course Routes Toggle */}
        <button
          onClick={() => setShowNavigationRoutes(!showNavigationRoutes)}
          className={`px-3 py-1 rounded-xl border text-[11px] font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-xl transition-colors ${
            showNavigationRoutes
              ? 'bg-cyan-950/80 border-cyan-700/80 text-cyan-300'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Route className="w-3.5 h-3.5 text-cyan-400" />
          <span>Course Vector {showNavigationRoutes ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* GPS Error Notification if Any */}
      {gpsError && (
        <div className="absolute top-28 left-3.5 right-3.5 sm:left-auto sm:right-3.5 z-[1000] p-2.5 bg-rose-950/90 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center justify-between gap-2 shadow-2xl backdrop-blur-md">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tracked Location Live Telemetry Floating HUD (When User Places a Pin or GPS) */}
      {localTrackedPlace && (
        <div className="absolute top-28 right-3.5 z-[1000] bg-slate-950/95 border border-cyan-500/60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl max-w-xs text-left hidden md:block">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Live Tracked Vessel</span>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              localTrackedPlace.riskLevel === 'HIGH_RISK' ? 'bg-red-950 text-red-300 border border-red-800' :
              localTrackedPlace.riskLevel === 'MODERATE_RISK' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {localTrackedPlace.riskLevel.replace('_', ' ')}
            </span>
          </div>

          <h4 className="text-sm font-extrabold text-white truncate">{localTrackedPlace.villageName}</h4>
          <p className="text-[11px] text-slate-400 font-mono">{localTrackedPlace.lat.toFixed(3)}°N, {localTrackedPlace.lng.toFixed(3)}°E • {localTrackedPlace.state}</p>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Distance to Buoy:</span>
              <span className="font-bold text-cyan-300">{(localTrackedPlace.distanceToFloatKm * 0.539957).toFixed(1)} NM</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Nearest ARGO:</span>
              <span className="font-bold text-blue-300">#{localTrackedPlace.nearestFloat.wmoId}</span>
            </div>
          </div>

          {onAskChat && (
            <button
              onClick={() => onAskChat(`What are the real-time wave, wind, and sea safety conditions near ${localTrackedPlace.villageName} (${localTrackedPlace.state}) and ARGO buoy #${localTrackedPlace.nearestFloat.wmoId}?`)}
              className="mt-2.5 w-full py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Sea Report</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-2xl text-xs max-w-xs hidden sm:block">
        <div className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] uppercase tracking-wider text-slate-300">ARGO Sea Chart Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse"></span>
            <span>Cyclone Fuel &gt;50kJ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Rough Swell</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Safe Waters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>📍 Tracked Vessel</span>
          </div>
        </div>
      </div>

    </div>
  );
};

