import React, { useEffect, useState } from 'react';
import Clock from './components/Clock';
import Speedometer from './components/Speedometer';
import SpotifyPlayer from './components/SpotifyPlayer';
import { requestWakeLock } from './services/wakeLockService';

const App: React.FC = () => {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  useEffect(() => {
    const acquireLock = async () => {
      // If we already have a lock and it's not released, do nothing
      if (wakeLock && !wakeLock.released) return;
      
      if (document.visibilityState === 'visible') {
         const lock = await requestWakeLock();
         if (lock) setWakeLock(lock);
      }
    };

    // Try immediately
    acquireLock();

    // Re-acquire on visibility change (e.g. switching back to tab)
    const handleVisibilityChange = () => acquireLock();
    
    // Re-acquire on interaction (often required by browsers for Wake Lock)
    // We keep these listeners active to ensure we can always try to get the lock back
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

  return (
    <div className="flex flex-col h-screen w-full bg-dash-bg text-dash-text overflow-hidden relative selection:bg-dash-accent selection:text-white">
      
      {/* Top Section: Clock */}
      <div className="flex-none z-10">
        <Clock />
      </div>

      {/* Middle Section: Speedometer (Takes available space) */}
      <main className="flex-1 flex flex-col justify-center items-center w-full z-0">
        <Speedometer />
      </main>

      {/* Warning Footer (Overlay) */}
      <div className="absolute bottom-[290px] w-full text-center pointer-events-none z-0 opacity-40">
        <p className="text-[10px] text-dash-muted uppercase tracking-widest">
            Do not interact while riding
        </p>
      </div>

      {/* Bottom Section: Spotify Player */}
      <div className="flex-none z-20 w-full max-w-md mx-auto">
        <SpotifyPlayer />
      </div>
    </div>
  );
};

export default App;