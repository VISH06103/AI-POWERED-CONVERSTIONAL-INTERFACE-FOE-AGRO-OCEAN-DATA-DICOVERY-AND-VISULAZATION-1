import { useState, useEffect, useRef, useCallback } from 'react';
import { MobileSensorReading } from '../types';

interface UseMobileSensorsOptions {
  isSimulatedJammed?: boolean;
  onJammerAlert?: () => void;
}

export function useMobileSensors(options: UseMobileSensorsOptions = {}) {
  const { isSimulatedJammed = false, onJammerAlert } = options;

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [sensorSource, setSensorSource] = useState<'HARDWARE' | 'SIMULATED' | 'GPS_ONLY'>('SIMULATED');
  const [hasHardwareSensors, setHasHardwareSensors] = useState<boolean>(false);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(true);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');

  // Simulated / Baseline Values for manual testing & desktop
  const [simulatedRoll, setSimulatedRoll] = useState<number>(4); // degrees tilt
  const [simulatedPitch, setSimulatedPitch] = useState<number>(-2); // degrees pitch
  const [simulatedHeading, setSimulatedHeading] = useState<number>(118); // degrees
  const [simulatedSpeedKnots, setSimulatedSpeedKnots] = useState<number>(8.5); // knots
  const [simulatedBaroHpa, setSimulatedBaroHpa] = useState<number>(1011.2); // hPa

  // Live state
  const [sensorReading, setSensorReading] = useState<MobileSensorReading>({
    isSensorSupported: false,
    isSensorActive: true,
    sensorSource: 'SIMULATED',
    isInternetJammed: isSimulatedJammed,
    signalStrengthPercent: isSimulatedJammed ? 0 : 92,
    compassHeading: 118,
    pitchAngle: -2,
    rollAngle: 4,
    isCapsizingRisk: false,
    heaveAcceleration: 0.35,
    waveChopIntensity: 'Calm (<0.5G)',
    barometricPressureHpa: 1011.2,
    barometricPressureTrend: 'Steady (Stable Sea)',
    gpsSpeedKnots: 8.5,
    gpsHeading: 118,
    gpsAccuracyMeters: 4.2,
    timestamp: new Date().toISOString(),
  });

  const watchIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Network online/offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      if (onJammerAlert) onJammerAlert();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onJammerAlert]);

  // Sound chime for capsizing alert
  const triggerAlarmTone = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 alarm
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  }, []);

  // Request Mobile Sensor Permissions (iOS / Android DeviceOrientation)
  const requestSensorAccess = async () => {
    if (
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionState('granted');
          setSensorSource('HARDWARE');
        } else {
          setPermissionState('denied');
        }
      } catch (err) {
        console.warn('Sensor permission error:', err);
        setPermissionState('denied');
      }
    } else {
      setPermissionState('granted');
      setSensorSource('HARDWARE');
    }
  };

  // Attach Hardware Orientation & Motion Listeners
  useEffect(() => {
    let hasReceivedHardwareData = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null || e.beta !== null || e.gamma !== null) {
        hasReceivedHardwareData = true;
        setHasHardwareSensors(true);
        setSensorSource('HARDWARE');

        const heading = e.alpha !== null ? Math.round(e.alpha) : simulatedHeading;
        const pitch = e.beta !== null ? Math.round(e.beta) : simulatedPitch;
        const roll = e.gamma !== null ? Math.round(e.gamma) : simulatedRoll;
        const isCap = Math.abs(roll) > 22;

        if (isCap) triggerAlarmTone();

        setSensorReading((prev) => ({
          ...prev,
          compassHeading: heading,
          pitchAngle: pitch,
          rollAngle: roll,
          isCapsizingRisk: isCap,
          sensorSource: 'HARDWARE',
          timestamp: new Date().toISOString(),
        }));
      }
    };

    const handleMotion = (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        const { z = 0 } = e.accelerationIncludingGravity;
        const heave = Math.abs((z || 9.8) - 9.8);
        const intensity =
          heave > 2.0
            ? 'Violent Wave Slam (>2.0G)'
            : heave > 1.2
            ? 'Rough Heave (1.2-2.0G)'
            : heave > 0.5
            ? 'Moderate Swell (0.5-1.2G)'
            : 'Calm (<0.5G)';

        setSensorReading((prev) => ({
          ...prev,
          heaveAcceleration: Number(heave.toFixed(2)),
          waveChopIntensity: intensity,
        }));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);

    // Watch real GPS if available
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const speedKnots = pos.coords.speed !== null ? Number((pos.coords.speed * 1.94384).toFixed(1)) : simulatedSpeedKnots;
          const heading = pos.coords.heading !== null ? Math.round(pos.coords.heading) : simulatedHeading;

          setSensorReading((prev) => ({
            ...prev,
            gpsLat: pos.coords.latitude,
            gpsLng: pos.coords.longitude,
            gpsAccuracyMeters: Number(pos.coords.accuracy.toFixed(1)),
            gpsAltitudeMeters: pos.coords.altitude !== null ? Number(pos.coords.altitude.toFixed(1)) : undefined,
            gpsSpeedKnots: speedKnots,
            gpsHeading: heading,
          }));
        },
        (err) => console.warn('GPS watcher notice:', err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [simulatedHeading, simulatedPitch, simulatedRoll, simulatedSpeedKnots, triggerAlarmTone]);

  // Ambient slight wave roll oscillation for realistic desktop simulation
  useEffect(() => {
    if (sensorSource === 'HARDWARE') return;

    let frame = 0;
    const interval = setInterval(() => {
      frame += 0.08;
      // Gentle sea roll sine oscillation
      const dynamicRoll = Number((simulatedRoll + Math.sin(frame) * 2.5).toFixed(1));
      const dynamicPitch = Number((simulatedPitch + Math.cos(frame * 0.7) * 1.5).toFixed(1));
      const dynamicHeave = Number((0.35 + Math.abs(Math.sin(frame * 1.2)) * 0.4).toFixed(2));
      const isCap = Math.abs(dynamicRoll) > 22;

      if (isCap) triggerAlarmTone();

      const isJammed = isSimulatedJammed || !isOnline;

      setSensorReading((prev) => ({
        ...prev,
        isInternetJammed: isJammed,
        signalStrengthPercent: isJammed ? 0 : 90,
        rollAngle: dynamicRoll,
        pitchAngle: dynamicPitch,
        heaveAcceleration: dynamicHeave,
        compassHeading: simulatedHeading,
        gpsSpeedKnots: simulatedSpeedKnots,
        barometricPressureHpa: simulatedBaroHpa,
        barometricPressureTrend:
          simulatedBaroHpa < 1000
            ? 'Severe Plunge (>3hPa/hr Cyclone Alert)'
            : simulatedBaroHpa < 1008
            ? 'Falling (<1hPa/hr Warning)'
            : 'Steady (Stable Sea)',
        isCapsizingRisk: isCap,
        sensorSource: 'SIMULATED',
        timestamp: new Date().toISOString(),
      }));
    }, 200);

    return () => clearInterval(interval);
  }, [sensorSource, simulatedRoll, simulatedPitch, simulatedHeading, simulatedSpeedKnots, simulatedBaroHpa, isSimulatedJammed, isOnline, triggerAlarmTone]);

  return {
    sensorReading,
    isOnline,
    isInternetJammed: isSimulatedJammed || !isOnline,
    hasHardwareSensors,
    permissionState,
    requestSensorAccess,
    // Simulator setters
    setSimulatedRoll,
    setSimulatedPitch,
    setSimulatedHeading,
    setSimulatedSpeedKnots,
    setSimulatedBaroHpa,
  };
}
