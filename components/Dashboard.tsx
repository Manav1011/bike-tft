import React, { useEffect, useState, useRef } from 'react';
import Clock from './Clock';
import Speedometer from './Speedometer';
import SpotifyPlayer from './SpotifyPlayer';
import RideStats from './RideStats';
import { requestWakeLock } from '../services/wakeLockService';
import { GeoState } from '../types';

const Dashboard: React.FC = () => {
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
    const [geoState, setGeoState] = useState<GeoState>({
        speed: null,
        accuracy: null,
        error: null,
    });
    const [currentCoords, setCurrentCoords] = useState<GeolocationCoordinates | null>(null);

    // Rolling average buffer for speedometer smoothing
    const speedHistory = useRef<number[]>([]);
    const MAX_HISTORY = 3;

    useEffect(() => {
        const acquireLock = async () => {
            if (wakeLock && !wakeLock.released) return;
            if (document.visibilityState === 'visible') {
                const lock = await requestWakeLock();
                if (lock) setWakeLock(lock);
            }
        };

        acquireLock();
        const handleVisibilityChange = () => acquireLock();
        const handleInteraction = () => acquireLock();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            if (wakeLock) wakeLock.release();
        };
    }, [wakeLock]);

    // Global Geolocation Tracking
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
                setCurrentCoords(position.coords);
                let rawSpeed = position.coords.speed;
                if (rawSpeed === null) rawSpeed = 0;
                const kmh = rawSpeed * 3.6;
                const filteredSpeed = kmh < 1.5 ? 0 : kmh;

                speedHistory.current.push(filteredSpeed);
                if (speedHistory.current.length > MAX_HISTORY) {
                    speedHistory.current.shift();
                }

                const avgSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length;

                setGeoState({
                    speed: Math.round(avgSpeed),
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
        <div className="flex flex-col landscape:flex-row h-screen w-full bg-dash-bg text-dash-text overflow-hidden relative selection:bg-dash-accent selection:text-white">

            {/* Background Carbon Overlay */}
            <div className="absolute inset-0 bg-carbon opacity-5 pointer-events-none"></div>

            {/* Left/Top Section: Telemetry & Time */}
            <div className="flex-none z-20 w-full landscape:w-[260px] landscape:h-full flex flex-col bg-dash-bg/60 landscape:bg-gradient-to-r landscape:from-black/80 landscape:to-transparent backdrop-blur-sm border-b landscape:border-b-0 landscape:border-r border-dash-border/10">
                <div className="p-3 pt-6 flex flex-col gap-4">
                    <Clock />

                    {/* Horizontal Divider Line */}
                    <div className="w-full flex items-center gap-2 opacity-30">
                        <div className="h-[1px] flex-1 bg-dash-border"></div>
                        <div className="w-1 h-1 bg-dash-cyan rotate-45"></div>
                        <div className="h-[1px] w-8 bg-dash-border"></div>
                    </div>

                    <RideStats currentSpeed={geoState.speed} currentCoords={currentCoords} />

                    {/* Hidden Secondary Telemetry (Decorative for racer feel) */}
                    <div className="px-3 py-2 flex justify-between font-orbitron text-[8px] text-dash-cyan/40 border-t border-dash-border/10 mt-2">
                        <div className="flex flex-col">
                            <span>ALT: 422M</span>
                            <span>HDG: 284° NW</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span>SYS: OPTIMAL</span>
                            <span>GPS: {geoState.accuracy ? `${geoState.accuracy.toFixed(0)}m` : 'SEARCHING'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Section: Main HUD (Speedometer) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <main className="flex-1 flex flex-col justify-center items-center w-full z-0 overflow-hidden">
                    <Speedometer speed={geoState.speed} error={geoState.error} />
                </main>

                {/* Subtle HUD Warning */}
                <div className="absolute top-2 w-full text-center pointer-events-none z-30 opacity-20">
                    <p className="text-[8px] text-dash-muted uppercase tracking-[0.4em] font-orbitron">
                        Safe Operation Required
                    </p>
                </div>
            </div>

            {/* Right/Bottom Section: Comms/Music */}
            <div className="flex-none z-20 w-full landscape:w-[300px] landscape:h-full bg-dash-bg/60 landscape:bg-gradient-to-l landscape:from-black/80 landscape:to-transparent backdrop-blur-sm landscape:flex landscape:items-center">
                <SpotifyPlayer />
            </div>
        </div>
    );
};

export default Dashboard;
