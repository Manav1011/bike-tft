import React from 'react';
import { RideHistoryEntry } from '../types';
import { formatDuration } from '../services/rideService';

interface RideHistoryProps {
    history: RideHistoryEntry[];
    onClose: () => void;
    onClear: () => void;
}

const RideHistory: React.FC<RideHistoryProps> = ({ history, onClose, onClear }) => {
    return (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-4 flex flex-col font-orbitron border-r border-dash-border/30">
            <div className="flex justify-between items-center mb-6 border-b border-dash-border/30 pb-2">
                <h2 className="text-dash-cyan text-sm font-black italic tracking-[0.2em] uppercase">Mission Logs</h2>
                <button
                    onClick={onClose}
                    className="text-dash-muted hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs uppercase tracking-widest">No Logs Found</span>
                    </div>
                ) : (
                    history.map((ride) => (
                        <div key={ride.id} className="bg-dash-card/50 border border-dash-border/30 p-3 transform -skew-x-6 relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-dash-accent opacity-50"></div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-dash-muted uppercase">
                                    {new Date(ride.startTime).toLocaleDateString()} {new Date(ride.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[10px] text-dash-cyan font-bold italic">#{ride.id.slice(0, 4).toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <div className="text-[8px] text-dash-muted uppercase tracking-tighter">Dist</div>
                                    <div className="text-xs font-bold text-dash-text">{ride.distance.toFixed(1)}km</div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-dash-muted uppercase tracking-tighter">Time</div>
                                    <div className="text-xs font-bold text-dash-text">{formatDuration(ride.endTime - ride.startTime)}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-dash-muted uppercase tracking-tighter">Max</div>
                                    <div className="text-xs font-bold text-dash-text text-dash-accent">{ride.maxSpeed}km/h</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {history.length > 0 && (
                <button
                    onClick={onClear}
                    className="mt-6 w-full py-2 border border-dash-red/30 text-dash-red hover:bg-dash-red hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] transform -skew-x-12"
                >
                    Purge All Logs
                </button>
            )}
        </div>
    );
};

export default RideHistory;
