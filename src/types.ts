export type OceanRiskLevel = 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';

export type RiskCategory = 
  | 'CYCLONE_HEAT_BUILDUP' 
  | 'ROUGH_SWELL' 
  | 'MARINE_HEATWAVE' 
  | 'SAFE_FISHING' 
  | 'MONSOON_TURBULENCE';

export interface DepthProfilePoint {
  depth: number; // meters (0 to 2000)
  temp: number; // °C
  salinity: number; // PSU
  pressure: number; // dbar
  density: number; // kg/m³
  soundSpeed: number; // m/s
}

export interface ArgoFloat {
  id: string;
  wmoId: string;
  name: string;
  basin: 'Bay of Bengal' | 'Arabian Sea' | 'Indian Ocean' | 'South China Sea' | 'Western Pacific' | 'Atlantic';
  lat: number;
  lng: number;
  cycleNumber: number;
  timestamp: string;
  surfaceTemp: number; // SST in °C
  surfaceSalinity: number; // PSU
  surfacePressure: number; // dbar
  tchp: number; // kJ/cm² (Tropical Cyclone Heat Potential)
  d26Depth: number; // meters (Depth of 26°C isotherm)
  mld: number; // Mixed Layer Depth in meters
  sstAnomaly: number; // °C difference from 30-year climatology
  waveHeight: number; // estimated significant wave height in meters
  windSpeedKnots: number; // estimated surface wind speed in knots
  riskLevel: OceanRiskLevel;
  riskCategory: RiskCategory;
  alertSummary: string;
  localWarningNotice: string;
  profilePoints: DepthProfilePoint[];
  batteryPercent: number;
  transmissionStatus: 'LIVE' | 'SYNCED' | 'DELAYED';
  nearestPortDistanceKm?: number;
  nearestPortName?: string;
}

export interface CoastalPort {
  id: string;
  name: string;
  nativeName: string;
  country: string;
  state?: string;
  basin: 'Bay of Bengal' | 'Arabian Sea' | 'Indian Ocean' | 'South China Sea' | 'Western Pacific' | 'Atlantic';
  lat: number;
  lng: number;
  primaryLanguage: string; // 'en', 'ta', 'ml', 'hi', 'te', 'bn', 'gu', 'mr', 'es'
  coastGuardContact: string;
  vhfChannel: string;
  currentWarningStatus: OceanRiskLevel;
  activeBoatsCount: number;
}

export interface OceanRiskAssessment {
  portId: string;
  portName: string;
  timestamp: string;
  overallStatus: OceanRiskLevel;
  threatTitle: string;
  simpleAdvice: string;
  scientificReason: string;
  localLanguageAdvice: Record<string, string>;
  cycloneHeatScore: number; // 0-100
  waveSurgeScore: number; // 0-100
  marineHeatwaveScore: number; // 0-100
  nearestFloatId: string;
  nearestFloatDistanceKm: number;
  tchpValue: number;
  d26Value: number;
  recommendedAction: 'DO_NOT_VENTURE' | 'RETURN_TO_HARBOR' | 'CAUTION_NEAR_COAST' | 'SAFE_TO_FISH';
  emergencySms: string;
  vhfBroadcastScript: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  language?: string;
  contextFloatId?: string;
  isOfflineResponse?: boolean;
  actionPills?: string[];
}

export interface SimulationPreset {
  id: string;
  title: string;
  description: string;
  basin: string;
  tempDelta: number;
  tchpDelta: number;
  waveDelta: number;
  riskLevel: OceanRiskLevel;
  badge: string;
}

export interface OfflineCacheStatus {
  isOffline: boolean;
  lastSyncTimestamp: number;
  cachedFloatsCount: number;
  cachedAdvisoriesCount: number;
  cacheStorageBytes: number;
}

export type BoatType = 
  | 'Motorized Trawler'
  | 'Artisanal Catamaran / FRP'
  | 'Deep-Sea Longliner & Gillnetter'
  | 'Traditional Canoe / Dinghy'
  | 'Coastal Patrol / Guard Craft';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  boatName: string;
  boatRegNumber: string;
  boatType: BoatType;
  state: string;
  villageOrPort: string;
  language: string;
  isLoggedIn: boolean;
  crewMembersCount?: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface CoastalVillage {
  id: string;
  name: string;
  nativeName: string;
  district: string;
  state: string;
  basin: 'Bay of Bengal' | 'Arabian Sea' | 'Indian Ocean' | 'South China Sea' | 'Western Pacific' | 'Atlantic';
  lat: number;
  lng: number;
  nearestPortId: string;
  nearestPortName: string;
  primaryFishCatch: string[];
  localCoastGuardHelpline: string;
  fleetSize?: number;
}

export interface CoastalState {
  name: string;
  nativeName: string;
  basin: 'Bay of Bengal' | 'Arabian Sea' | 'Indian Ocean';
  primaryLanguage: string;
  districts: string[];
}

export interface LocationTrackInfo {
  bearingDegrees: number; // 0 to 360
  compassDirection: string; // e.g. 'ENE', 'SSW'
  distanceKm: number;
  distanceNauticalMiles: number;
  estimatedTransitMinutes: number; // at standard 10 knot cruise
  safeReturnBearing: number; // Reciprocal heading back to port
  safeReturnDirection: string;
  nearestRefugeHarbor: string;
  nearestRefugeDistanceKm: number;
  waypoints: Array<{
    lat: number;
    lng: number;
    label: string;
    description: string;
    type: 'PORT_ORIGIN' | 'SAFE_CORRIDOR' | 'PFZ_ZONE' | 'BUOY_DESTINATION' | 'REFUGE_SHELTER';
  }>;
}

export interface FishSpeciesBiodata {
  name: string;
  localName: string;
  scientificName: string;
  abundance: 'Abundant' | 'Moderate' | 'Seasonal' | 'Rare';
  optimalDepthRange: string;
  suggestedGear: string;
  waterLayer: 'Pelagic (Surface)' | 'Mesopelagic (Thermocline)' | 'Demersal (Seabed)';
}

export interface MarineBiodata {
  pfzStatus: 'HIGH_POTENTIAL' | 'MODERATE_POTENTIAL' | 'LOW_POTENTIAL';
  pfzReason: string;
  chlorophyllMgM3: number; // mg/m³
  phytoplanktonIndex: 'High Bloom' | 'Moderate Bloom' | 'Normal Oceanic';
  dissolvedOxygenMlPerL: number; // ml/L
  thermoclineDepthMeters: number; // depth where thermal gradient triggers fish school aggregation
  optimumCatchDepth: string; // e.g. "18m - 42m"
  seabedStructure: string; // e.g. "Sandy Continental Shelf"
  salinityHaloclinePsu: number;
  upwellingStrength: 'Strong Coastal Upwelling' | 'Moderate Upwelling' | 'Stratified Neutral';
  primarySpecies: FishSpeciesBiodata[];
}

export interface MobileSensorReading {
  isSensorSupported: boolean;
  isSensorActive: boolean;
  sensorSource: 'HARDWARE' | 'SIMULATED' | 'GPS_ONLY';
  isInternetJammed: boolean;
  signalStrengthPercent: number; // 0 if jammed
  compassHeading: number; // 0-360° (Alpha)
  pitchAngle: number; // -90° to +90° (Beta: Bow Up/Down)
  rollAngle: number; // -90° to +90° (Gamma: Port/Starboard Tilt)
  isCapsizingRisk: boolean; // true if absolute roll > 22°
  heaveAcceleration: number; // m/s² (vertical acceleration)
  waveChopIntensity: 'Calm (<0.5G)' | 'Moderate Swell (0.5-1.2G)' | 'Rough Heave (1.2-2.0G)' | 'Violent Wave Slam (>2.0G)';
  barometricPressureHpa: number; // hPa
  barometricPressureTrend: 'Rising (Fair Weather)' | 'Steady (Stable Sea)' | 'Falling (<1hPa/hr Warning)' | 'Severe Plunge (>3hPa/hr Cyclone Alert)';
  gpsSpeedKnots: number;
  gpsHeading: number;
  gpsAccuracyMeters: number;
  gpsLat?: number;
  gpsLng?: number;
  gpsAltitudeMeters?: number;
  ambientLightLux?: number;
  timestamp: string;
}

export interface VillageConditionResult {
  query: string;
  villageName: string;
  district: string;
  state: string;
  basin: string;
  lat: number;
  lng: number;
  matchedVillage?: CoastalVillage;
  nearestFloat: ArgoFloat;
  distanceToFloatKm: number;
  riskLevel: OceanRiskLevel;
  riskCategory: RiskCategory;
  advisoryTitle: string;
  advisorySummary: string;
  nativeAdvisory: string;
  safeDistanceNauticalMiles: number;
  tideAndCurrentStatus: string;
  recommendation: 'SAFE_TO_SAIL' | 'CAUTION_NEAR_COAST' | 'HAZARDOUS_DO_NOT_VENTURE';
  isCustomGeocoded: boolean;
  offlineEstimated: boolean;
  isInlandPlace?: boolean;
  placeType?: 'COASTAL_VILLAGE' | 'COASTAL_PORT' | 'INLAND_DISTRICT_OR_CITY' | 'MARITIME_SECTOR';
  nearestPortGateway?: string;
  distanceToCoastKm?: number;
  trackInfo: LocationTrackInfo;
  biodata: MarineBiodata;
  timestamp: string;
}

export interface RegisteredRadioPacket {
  id: string;
  captainName: string;
  phone: string;
  boatName: string;
  boatRegNumber: string;
  boatType: string;
  crewMembersCount: number;
  homeVillageOrPort: string;
  state: string;
  language: string;
  lat: number;
  lng: number;
  distanceOffshoreNm: number;
  headingDegrees: number;
  speedKnots: number;
  waveHeightM: number;
  tchpKjCm2: number;
  surfaceTempC: number;
  nearestFloatWmo: string;
  riskLevel: OceanRiskLevel;
  triggerReason: 'SIGNAL_JAMMED' | 'CAPSIZING_ALERT' | 'HIGH_SWELL' | 'MANUAL_MAYDAY' | 'DEADZONE_AUTO_TRIGGER';
  signalStatus: 'JAMMED / DEADZONE' | 'EMERGENCY TRANSMITTING' | 'RADIO BEACON ACTIVE' | 'COAST GUARD ACK';
  vhfChannel: string;
  hfFrequency: string;
  dscAlertFormat: string;
  spokenVhfScript: string;
  rawTelegramHex: string;
  timestamp: string;
  transmissionLog: {
    time: string;
    protocol: string;
    status: 'TRANSMITTED' | 'STANDBY' | 'ACKNOWLEDGED';
    details: string;
  }[];
}

export interface VoyageNavigationState {
  isVoyageActive: boolean;
  voyageStartTime?: number;
  distanceTravelledNm: number;
  currentOffshoreNm: number;
  departurePoint: {
    name: string;
    lat: number;
    lng: number;
    state: string;
  };
  currentPosition: {
    lat: number;
    lng: number;
  };
  bearingDegrees: number;
  speedKnots: number;
  connectionState: 'CELLULAR_4G' | 'SATELLITE_LINK' | 'SIGNAL_JAMMED_DEADZONE';
  autoDistressSent: boolean;
  activeRadioPacket: RegisteredRadioPacket | null;
}

