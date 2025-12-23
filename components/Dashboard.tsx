import React, { useEffect, useState, useRef } from 'react';
import Clock from './Clock';
import Speedometer from './Speedometer';
import SpotifyPlayer from './SpotifyPlayer';
import RideStats from './RideStats';
import { requestWakeLock } from '../services/wakeLockService';
import { GeoState } from '../types';

const Dashboard: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };
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
            maximumAge: 5000, // Use cached position if less than 5s old
            timeout: 15000,   // Wait up to 15s for fresh data
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
                <div className="p-2 landscape:p-3 landscape:pt-6 flex flex-col gap-2 landscape:gap-4">
                    <Clock />

                    {/* Horizontal Divider Line - Hidden on small portrait */}
                    <div className="hidden landscape:flex w-full items-center gap-2 opacity-30">
                        <div className="h-[1px] flex-1 bg-dash-border"></div>
                        <div className="w-1 h-1 bg-dash-cyan rotate-45"></div>
                        <div className="h-[1px] w-8 bg-dash-border"></div>
                    </div>

                    <RideStats currentSpeed={geoState.speed} currentCoords={currentCoords} />

                    {/* Hidden Secondary Telemetry (Decorative for racer feel) - Only in landscape */}
                    <div className="hidden landscape:flex px-3 py-2 justify-between font-orbitron text-[8px] text-dash-cyan/40 border-t border-dash-border/10 mt-2">
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
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <main className="flex-1 flex flex-col justify-center items-center w-full z-0 overflow-hidden">
                    <Speedometer speed={geoState.speed} error={geoState.error} />
                </main>

                {/* Fullscreen & Install Controls */}
                <div className="absolute top-4 right-4 flex gap-2 z-40">
                    {deferredPrompt && (
                        <button
                            onClick={handleInstall}
                            className="flex items-center gap-2 px-3 py-2 bg-dash-cyan/20 border border-dash-cyan/40 text-dash-cyan text-[10px] font-black uppercase tracking-widest transform -skew-x-12 animate-pulse"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Install App
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                document.documentElement.requestFullscreen().catch(e => console.error(e));
                            } else {
                                if (document.exitFullscreen) document.exitFullscreen();
                            }
                        }}
                        className="p-2 bg-dash-bg/40 border border-dash-border/30 text-dash-cyan/60 hover:text-dash-cyan transition-all transform -skew-x-12 backdrop-blur-md"
                        title="Toggle Fullscreen"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                    {/* Reload Button */}
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 bg-dash-bg/40 border border-dash-border/30 text-dash-cyan/60 hover:text-dash-cyan transition-all transform -skew-x-12 backdrop-blur-md"
                        title="System Reboot (Reload)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Subtle HUD Warning - Positioned higher in portrait */}
                <div className="absolute top-2 landscape:top-2 w-full text-center pointer-events-none z-30 opacity-10">
                    <p className="text-[7px] landscape:text-[8px] text-dash-muted uppercase tracking-[0.4em] font-orbitron">
                        Safe Operation Required
                    </p>
                </div>
            </div>

            {/* Right/Bottom Section: Comms/Music */}
            <div className="flex-none z-20 w-full landscape:w-[300px] landscape:h-full bg-dash-bg/60 landscape:bg-gradient-to-l landscape:from-black/80 landscape:to-transparent backdrop-blur-sm flex items-center">
                <SpotifyPlayer />
            </div>
        </div>
    );
};

export default Dashboard;
