"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { courierApi } from '../api/courier';
import { toast } from '@/lib/utils/toast';

export function useLocationTelemetry() {
  const [isSharing, setIsSharing] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('courier_location_sharing') === 'true';
    }
    return false;
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    try {
      const { latitude, longitude } = position.coords;
      await courierApi.updateLocation(latitude, longitude);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to update courier location:', err);
      setError('Telemetry Sync Failed');
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    // High accuracy for logistics
    watchId.current = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, [updateLocation]);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    if (isSharing) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isSharing, startTracking, stopTracking]);

  const toggleSharing = () => {
    const nextValue = !isSharing;
    setIsSharing(nextValue);
    localStorage.setItem('courier_location_sharing', String(nextValue));
    if (nextValue) {
      toast.success('Location sharing enabled');
    } else {
      toast.success('Location sharing disabled');
    }
  };

  return { isSharing, lastUpdate, error, toggleSharing };
}
