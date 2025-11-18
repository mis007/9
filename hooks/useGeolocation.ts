import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  coordinates: { lat: number; lng: number } | null;
  loading: boolean;
  error: GeolocationPositionError | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: true,
    error: null,
  });

  const getLocation = useCallback((highAccuracy = true) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      setState(s => ({ ...s, loading: false, error: new GeolocationPositionError() }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        loading: false,
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      // If high accuracy failed, retry with low accuracy for better success rate.
      if (highAccuracy && (error.code === 2 || error.code === 3)) {
        console.warn("High accuracy location failed, retrying with low accuracy.");
        getLocation(false);
      } else {
        console.warn(`Geolocation failed (Code: ${error.code}). Falling back to default coordinates. Message: ${error.message}`);
        setState({
          coordinates: null, // Fallback to a default location
          loading: false,
          error: error,
        });
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: highAccuracy,
      timeout: 15000,
      maximumAge: 0,
    });
  }, []);

  useEffect(() => {
    getLocation(true); // Start with high accuracy
  }, [getLocation]);

  return state;
};
