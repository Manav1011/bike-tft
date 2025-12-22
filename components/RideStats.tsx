import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RideSession, RideHistoryEntry } from '../types';
import { calculateDistance, saveRideToHistory, formatDuration } from '../services/rideService';

interface RideStatsProps {
    currentSpeed: number | null;
    currentCoords: GeolocationCoordinates | null;
}

const RideStats: React.FC<RideStatsProps> = ({ currentSpeed, currentCoords }) => {
    const navigate = useNavigate();
    const [session, setSession] = useState<RideSession | null>(null);
    const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Update timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (session?.isActive) {
            interval = setInterval(() => {
                setElapsedTime(Date.now() - session.startTime);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [session?.isActive, session?.startTime]);

    // Update distance and max speed
    useEffect(() => {
        if (!session?.isActive || !currentCoords) return;

        setSession(prev => {
            if (!prev) return null;

            let newDistance = prev.distance;
            if (lastCoords) {
                const d = calculateDistance(
                    lastCoords.lat,
                    lastCoords.lon,
                    currentCoords.latitude,
                    currentCoords.longitude
                );
                // Minimum movement threshold (e.g. 5 meters) to avoid GPS jitter
                if (d > 0.005) {
                    newDistance += d;
                    setLastCoords({ lat: currentCoords.latitude, lon: currentCoords.longitude });
                }
            } else {
                setLastCoords({ lat: currentCoords.latitude, lon: currentCoords.longitude });
            }

            return {
                ...prev,
                distance: newDistance,
                maxSpeed: Math.max(prev.maxSpeed, currentSpeed || 0)
            };
        });
    }, [currentCoords, currentSpeed, session?.isActive, lastCoords]);

    const startRide = () => {
        setSession({
            startTime: Date.now(),
            distance: 0,
            maxSpeed: 0,
            isActive: true
        });
        setElapsedTime(0);
        setLastCoords(null);
    };

    const endRide = async () => {
        if (!session) return;

        const finalSession: RideHistoryEntry = {
            ...session,
            id: Math.random().toString(36).substr(2, 9),
            endTime: Date.now(),
            isActive: false
        };

        await saveRideToHistory(finalSession);
        setSession(null);
        navigate('/logs');
    };

    return (
        <div className="w-full flex flex-col gap-2 p-3 font-orbitron relative">
            {session?.isActive ? (
                <div className="grid grid-cols-3 gap-2">
                    {/* Stats Boxes */}
                    <div className="bg-dash-card border border-dash-border p-2 transform -skew-x-12">
                        <div className="text-[10px] text-dash-cyan uppercase tracking-tighter">Distance</div>
                        <div className="text-lg font-black text-dash-text">{session.distance.toFixed(2)}<span className="text-[10px] ml-1 text-dash-accent">km</span></div>
                    </div>
                    <div className="bg-dash-card border border-dash-border p-2 transform -skew-x-12">
                        <div className="text-[10px] text-dash-cyan uppercase tracking-tighter">Time</div>
                        <div className="text-lg font-black text-dash-text">{formatDuration(elapsedTime)}</div>
                    </div>
                    <div className="bg-dash-card border border-dash-border p-2 transform -skew-x-12">
                        <div className="text-[10px] text-dash-cyan uppercase tracking-tighter">Max</div>
                        <div className="text-lg font-black text-dash-text">{session.maxSpeed}<span className="text-[10px] ml-1 text-dash-accent">km/h</span></div>
                    </div>

                    <button
                        onClick={endRide}
                        className="col-span-3 mt-1 py-2 bg-dash-red text-white text-xs font-black uppercase tracking-[0.2em] transform -skew-x-12 shadow-[0_0_10px_rgba(255,0,60,0.3)] hover:bg-red-700 active:scale-95 transition-all"
                    >
                        End Mission
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <button
                        onClick={startRide}
                        className="w-full py-2 bg-dash-border/40 hover:bg-dash-cyan hover:text-black text-dash-cyan border border-dash-cyan/30 text-xs font-black uppercase tracking-[0.3em] transform -skew-x-12 transition-all active:scale-95"
                    >
                        Initialize Ride
                    </button>
                    <button
                        onClick={() => navigate('/logs')}
                        className="w-full py-2 bg-black/40 hover:bg-white/10 text-dash-muted border border-dash-border text-[10px] uppercase font-bold tracking-widest transform -skew-x-12 transition-all"
                    >
                        View Logs
                    </button>
                </div>
            )}
        </div>
    );
};

export default RideStats;
