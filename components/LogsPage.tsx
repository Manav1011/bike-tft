import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RideHistoryEntry } from '../types';
import { getRideHistory, clearRideHistory, deleteRideById, formatDuration } from '../services/rideService';

const LogsPage: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<RideHistoryEntry[]>([]);

    const fetchHistory = async () => {
        const data = await getRideHistory();
        setHistory(data);
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleClearHistory = async () => {
        if (confirm("Purge all telemetry logs? This cannot be undone.")) {
            await clearRideHistory();
            setHistory([]);
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (confirm("Delete this telemetry record?")) {
            await deleteRideById(id);
            await fetchHistory();
        }
    };

    return (
        <div className="h-screen w-full bg-dash-bg bg-carbon p-6 flex flex-col font-orbitron text-dash-text relative overflow-hidden">
            {/* Background Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>

            {/* Header */}
            <div className="flex-none flex justify-between items-center mb-8 border-b-2 border-dash-cyan/20 pb-4 relative z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 bg-dash-card border border-dash-border hover:bg-dash-cyan hover:text-black transition-all transform -skew-x-12"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-[0.2em] uppercase text-dash-cyan">Mission Logs</h1>
                        <p className="text-[10px] text-dash-muted tracking-[0.4em] uppercase">Historical Telemetry Data</p>
                    </div>
                </div>

                {history.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="py-2 px-6 border border-dash-red/30 text-dash-red hover:bg-dash-red hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] transform -skew-x-12"
                    >
                        Purge All
                    </button>
                )}
            </div>

            {/* Grid of Logs - Scrollable Area */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="col-span-full h-full flex flex-col items-center justify-center opacity-30">
                        <svg className="w-16 h-16 mb-4 text-dash-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm uppercase tracking-[0.5em] font-bold">No Records Found</span>
                    </div>
                ) : (
                    history.map((ride) => (
                        <div key={ride.id} className="bg-dash-panel border border-dash-border/40 p-5 transform -skew-x-2 relative group hover:border-dash-cyan/50 transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-dash-cyan/40 group-hover:bg-dash-cyan transition-all"></div>

                            {/* Delete specific log button */}
                            <button
                                onClick={() => handleDeleteLog(ride.id)}
                                className="absolute top-4 right-4 p-1.5 text-dash-muted hover:text-dash-red transition-all transform skew-x-2 opacity-0 group-hover:opacity-100"
                                title="Delete Log"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-dash-text uppercase">
                                        {new Date(ride.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <span className="text-[10px] text-dash-muted uppercase">
                                        {new Date(ride.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <span className="text-xs text-dash-cyan font-black italic tracking-tighter mr-6">
                                    LOG_ID: {ride.id.toUpperCase()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-black/30 p-3 border-l-2 border-dash-accent">
                                    <div className="text-[9px] text-dash-muted uppercase tracking-widest mb-1">Total Distance</div>
                                    <div className="text-xl font-black text-dash-text">{ride.distance.toFixed(2)}<span className="text-xs ml-1 text-dash-accent font-normal">KM</span></div>
                                </div>
                                <div className="bg-black/30 p-3 border-l-2 border-dash-cyan">
                                    <div className="text-[9px] text-dash-muted uppercase tracking-widest mb-1">Mission Time</div>
                                    <div className="text-xl font-black text-dash-text">{formatDuration(ride.endTime! - ride.startTime)}</div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-dash-border/20">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-dash-muted uppercase tracking-widest">Peak Velocity</span>
                                    <span className="text-sm font-bold text-dash-accent">{ride.maxSpeed} KM/H</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] text-dash-muted uppercase tracking-widest">Status</span>
                                    <span className="text-[8px] text-green-500 font-bold uppercase tracking-widest">Archived</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Decorative Technical Footer */}
            <div className="flex-none mt-4 text-center opacity-10 pointer-events-none">
                <p className="text-[10px] tracking-[1em] uppercase">--- End of Telemetry Stream ---</p>
            </div>
        </div>
    );
};

export default LogsPage;
