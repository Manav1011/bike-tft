import React, { useState, useEffect, useCallback } from 'react';
import { SpotifyState, SpotifyAuthStatus } from '../types';
import { SPOTIFY_CONFIG } from '../constants';
import { 
  getLoginUrl, 
  getTokenFromUrl, 
  cleanUrl, 
  getPlaybackState, 
  nextTrack, 
  prevTrack, 
  togglePlay 
} from '../services/spotifyService';

// Icons
const PrevIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
);
const NextIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
);
const PlayIcon = () => (
  <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
);
const PauseIcon = () => (
  <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
);
const MusicIcon = () => (
    <svg className="w-12 h-12 text-dash-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
);

const SpotifyPlayer: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SpotifyAuthStatus>(SpotifyAuthStatus.LOGGED_OUT);
  const [playerState, setPlayerState] = useState<SpotifyState | null>(null);

  // Check if user has configured the Client ID
  const isConfigured = SPOTIFY_CONFIG.clientId !== 'YOUR_SPOTIFY_CLIENT_ID_HERE';

  // Auth Handling
  useEffect(() => {
    const hashToken = getTokenFromUrl();
    const localToken = localStorage.getItem('spotify_token');

    if (hashToken) {
      setToken(hashToken);
      localStorage.setItem('spotify_token', hashToken);
      setStatus(SpotifyAuthStatus.LOGGED_IN);
      cleanUrl();
    } else if (localToken) {
      setToken(localToken);
      setStatus(SpotifyAuthStatus.LOGGED_IN);
    }
    
    // Listen for storage events to sync login state across tabs (e.g. if login opened in new tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spotify_token' && e.newValue) {
        setToken(e.newValue);
        setStatus(SpotifyAuthStatus.LOGGED_IN);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Polling for status
  const fetchState = useCallback(async () => {
    if (!token) return;
    try {
      const state = await getPlaybackState(token);
      setPlayerState(state);
    } catch (error) {
      // If error (likely 401), logout
      setToken(null);
      localStorage.removeItem('spotify_token');
      setStatus(SpotifyAuthStatus.EXPIRED);
    }
  }, [token]);

  useEffect(() => {
    if (status === SpotifyAuthStatus.LOGGED_IN) {
      fetchState(); // Initial fetch
      const interval = setInterval(fetchState, 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [status, fetchState]);

  // Actions
  const handleAction = async (action: () => Promise<any>) => {
    if (!token) return;
    try {
      await action();
      setTimeout(fetchState, 500); // Refresh state shortly after action
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Show setup instructions if not configured
  if (!isConfigured) {
    return (
      <div className="w-full h-48 bg-dash-panel rounded-t-3xl border-t border-dash-border p-6 flex flex-col items-center justify-center text-center">
        <div className="text-dash-accent mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-dash-text font-bold text-sm mb-1">Setup Required</h3>
        <p className="text-dash-muted text-xs px-4">
          Open <code className="text-dash-sub bg-dash-card px-1 rounded">constants.ts</code> and replace <code className="text-dash-sub">YOUR_SPOTIFY_CLIENT_ID_HERE</code> with your ID.
        </p>
      </div>
    );
  }

  // 2. Show login button if configured but logged out
  if (status === SpotifyAuthStatus.LOGGED_OUT || status === SpotifyAuthStatus.EXPIRED) {
    return (
      <div className="w-full h-48 bg-dash-panel rounded-t-3xl border-t border-dash-border p-6 flex flex-col items-center justify-center">
        <p className="text-dash-muted mb-4 text-center text-sm">Connect to Spotify for Controls</p>
        <a 
          href={getLoginUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.299z"/></svg>
          Login
        </a>
      </div>
    );
  }

  const track = playerState?.item;

  return (
    <div className="w-full bg-dash-panel rounded-t-3xl border-t border-dash-border p-5 flex flex-col justify-between h-[280px]">
      
      {/* Track Info */}
      <div className="flex items-center space-x-4 mb-2">
        {track?.album.images[0]?.url ? (
          <img 
            src={track.album.images[0].url} 
            alt="Album Art" 
            className="w-16 h-16 rounded-md shadow-lg border border-dash-border"
          />
        ) : (
            <div className="w-16 h-16 rounded-md bg-dash-card flex items-center justify-center">
                <MusicIcon />
            </div>
        )}
        <div className="flex-1 overflow-hidden">
          <h3 className="text-dash-text text-lg font-bold truncate">
            {track?.name || 'Not Playing'}
          </h3>
          <p className="text-dash-accent text-sm truncate font-medium">
            {track?.artists.map(a => a.name).join(', ') || 'Spotify Connected'}
          </p>
        </div>
      </div>

      {/* Progress Bar (Visual Only) */}
      <div className="w-full h-1 bg-dash-card rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-dash-accent transition-all duration-1000 ease-linear"
            style={{ 
                width: track ? `${(playerState!.progress_ms / track.duration_ms) * 100}%` : '0%' 
            }}
          />
      </div>

      {/* Controls - HUGE targets for biking */}
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={() => handleAction(() => prevTrack(token!))}
          className="w-20 h-20 flex items-center justify-center rounded-full bg-dash-card active:bg-dash-border text-dash-text transition-colors"
          aria-label="Previous"
        >
          <PrevIcon />
        </button>

        <button 
          onClick={() => handleAction(() => togglePlay(token!, playerState?.isPlaying || false))}
          className="w-24 h-24 flex items-center justify-center rounded-full bg-dash-accent active:bg-orange-600 text-white shadow-lg transition-transform active:scale-95"
          aria-label={playerState?.isPlaying ? "Pause" : "Play"}
        >
          {playerState?.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button 
          onClick={() => handleAction(() => nextTrack(token!))}
          className="w-20 h-20 flex items-center justify-center rounded-full bg-dash-card active:bg-dash-border text-dash-text transition-colors"
          aria-label="Next"
        >
          <NextIcon />
        </button>
      </div>
    </div>
  );
};

export default SpotifyPlayer;