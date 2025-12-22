import React, { useState, useEffect, useRef } from 'react';
import { GeoState } from '../types';

const Speedometer: React.FC = () => {
  const [geoState, setGeoState] = useState<GeoState>({
    speed: null,
    accuracy: null,
    error: null,
  });

  // Rolling average buffer
  const speedHistory = useRef<number[]>([]);
  const MAX_HISTORY = 3;

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Speed is in m/s, convert to km/h (speed * 3.6)
        let rawSpeed = position.coords.speed;
        
        // Handle null speed (sometimes happens when stationary or acquiring fix)
        if (rawSpeed === null) rawSpeed = 0;
        
        // Convert to km/h
        const kmh = rawSpeed * 3.6;

        // Simple noise filtering: Ignore tiny movements if < 1.5 km/h
        const filteredSpeed = kmh < 1.5 ? 0 : kmh;

        // Rolling Average
        speedHistory.current.push(filteredSpeed);
        if (speedHistory.current.length > MAX_HISTORY) {
          speedHistory.current.shift();
        }

        const avgSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length;

        setGeoState({
          speed: Math.round(avgSpeed), // Display as integer
          accuracy: position.coords.accuracy,
          error: null,
        });
      },
      (error) => {
        setGeoState(prev => ({ ...prev, error: error.message }));
      },
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full">
        {/* Decorative Ring Background */}
       <div className="absolute w-64 h-64 rounded-full border border-dash-card opacity-30 pointer-events-none"></div>
       <div className="absolute w-56 h-56 rounded-full border border-dash-card opacity-20 pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center">
        <span className="text-dash-muted text-sm font-bold tracking-[0.2em] uppercase mb-2">Speed</span>
        
        {/* Speed Number */}
        <div className="text-[10rem] leading-none font-bold text-dash-text tracking-tighter tabular-nums drop-shadow-2xl">
          {geoState.speed !== null ? geoState.speed : '--'}
        </div>
        
        {/* Unit */}
        <div className="text-2xl font-bold text-dash-accent mt-2">km/h</div>

        {/* Debug/Status info */}
        {geoState.error && (
            <div className="absolute bottom-4 text-red-500 text-xs text-center px-4">
                GPS Error: {geoState.error}
            </div>
        )}
        {!geoState.error && !geoState.speed && geoState.speed !== 0 && (
            <div className="absolute bottom-4 text-dash-muted text-xs animate-pulse">
                Acquiring Satellite...
            </div>
        )}
      </div>
    </div>
  );
};

export default Speedometer;