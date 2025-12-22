import React, { useState, useEffect, useCallback } from 'react';
import { SpotifyState, SpotifyAuthStatus } from '../types';
import { SPOTIFY_CONFIG } from '../constants';
import {
  initiateLogin,
  getToken,
  refreshAccessToken,
  cleanUrl,
  getPlaybackState,
  nextTrack,
  prevTrack,
  togglePlay
} from '../services/spotifyService';

// Icons
const PrevIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
);
const NextIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
);
const PlayIcon = () => (
  <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
  <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
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
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const localToken = localStorage.getItem('spotify_token');
      const refreshToken = localStorage.getItem('spotify_refresh_token');

      if (code) {
        // 1. If we have a code in the URL, exchange it for a token
        const result = await getToken(code);
        if (result) {
          setToken(result.access_token);
          localStorage.setItem('spotify_token', result.access_token);
          localStorage.setItem('spotify_refresh_token', result.refresh_token);
          setStatus(SpotifyAuthStatus.LOGGED_IN);
        } else {
          setStatus(SpotifyAuthStatus.LOGGED_OUT);
        }
        cleanUrl();
      } else if (localToken) {
        // 2. If we have a saved token, use it
        setToken(localToken);
        setStatus(SpotifyAuthStatus.LOGGED_IN);
      } else if (refreshToken) {
        // 3. If we have a refresh token, try to get a new access token
        const result = await refreshAccessToken(refreshToken);
        if (result) {
          setToken(result.access_token);
          localStorage.setItem('spotify_token', result.access_token);
          if (result.refresh_token) {
            localStorage.setItem('spotify_refresh_token', result.refresh_token);
          }
          setStatus(SpotifyAuthStatus.LOGGED_IN);
        }
      }
    };

    handleAuth();

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
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      if (refreshToken) {
        // Try refreshing
        const result = await refreshAccessToken(refreshToken);
        if (result) {
          setToken(result.access_token);
          localStorage.setItem('spotify_token', result.access_token);
          return;
        }
      }
      setToken(null);
      localStorage.removeItem('spotify_token');
      setStatus(SpotifyAuthStatus.EXPIRED);
    }
  }, [token]);

  useEffect(() => {
    if (status === SpotifyAuthStatus.LOGGED_IN) {
      fetchState();
      const interval = setInterval(fetchState, 3000);
      return () => clearInterval(interval);
    }
  }, [status, fetchState]);

  // Actions
  const handleAction = async (action: () => Promise<any>) => {
    if (!token) return;
    try {
      await action();
      setTimeout(fetchState, 500);
    } catch (e: any) {
      if (e.status === 404) {
        alert("No active Spotify device found. Please open Spotify on your phone first.");
      } else {
        console.error("Spotify action error", e);
      }
    }
  };

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

  if (status === SpotifyAuthStatus.LOGGED_OUT || status === SpotifyAuthStatus.EXPIRED) {
    return (
      <div className="w-full h-48 landscape:h-full bg-dash-panel bg-carbon rounded-t-3xl landscape:rounded-t-none landscape:rounded-l-3xl border-t landscape:border-t-0 landscape:border-l border-dash-border p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-dash-accent/5 pointer-events-none"></div>
        <p className="text-dash-cyan mb-4 text-center text-xs font-black tracking-widest uppercase font-orbitron">Authorization Required</p>
        <button
          onClick={() => initiateLogin()}
          className="bg-dash-accent hover:bg-orange-600 text-white font-black py-4 px-10 rounded-none transform -skew-x-12 transition-all flex items-center gap-3 border-r-4 border-b-4 border-white/20 shadow-[0_0_20px_rgba(255,77,0,0.3)]"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.299z" /></svg>
          ACTIVATE
        </button>
      </div>
    );
  }

  const track = playerState?.item;

  return (
    <div className="w-full bg-dash-panel bg-carbon landscape:h-full rounded-t-3xl landscape:rounded-t-none landscape:rounded-l-3xl border-t landscape:border-t-0 landscape:border-l border-dash-border p-5 flex flex-col justify-between h-[300px] relative overflow-hidden group">
      <div className="absolute inset-0 bg-dash-accent/5 pointer-events-none"></div>

      {/* Track Info */}
      <div className="flex landscape:flex-col items-center landscape:items-start space-x-4 landscape:space-x-0 landscape:space-y-4 mb-2 z-10">
        <div className="relative">
          {track?.album.images[0]?.url ? (
            <img
              src={track.album.images[0].url}
              alt="Album Art"
              className="w-16 h-16 landscape:w-40 landscape:h-40 rounded-none border-2 border-dash-border shadow-[0_0_15px_rgba(0,0,0,0.5)] transform -skew-x-6"
            />
          ) : (
            <div className="w-16 h-16 landscape:w-40 landscape:h-40 bg-dash-card border-2 border-dash-border flex items-center justify-center transform -skew-x-6">
              <MusicIcon />
            </div>
          )}
          {playerState?.isPlaying && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-dash-accent animate-ping rounded-full"></div>
          )}
        </div>

        <div className="flex-1 overflow-hidden font-rajdhani">
          <h3 className="text-dash-text text-xl font-black italic uppercase tracking-tighter truncate drop-shadow-md">
            {track?.name || 'SYSTEM_IDLE'}
          </h3>
          <p className="text-dash-accent text-sm font-bold tracking-widest uppercase truncate animate-pulse">
            {track?.artists.map(a => a.name).join(', ') || 'READY_FOR_INPUT'}
          </p>
        </div>
      </div>

      {/* Progress Bar (Visual Only) */}
      <div className="relative w-full h-2 bg-black/40 border border-dash-border/50 rounded-none transform -skew-x-12 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-dash-accent to-red-500 shadow-[0_0_10px_#FF4D00] transition-all duration-1000 ease-linear"
          style={{
            width: track ? `${(playerState!.progress_ms / track.duration_ms) * 100}%` : '0%'
          }}
        />
      </div>

      {/* Controls - HUGE targets for biking */}
      <div className="flex items-center justify-between px-2 z-10 mt-auto">
        <button
          onClick={() => handleAction(() => prevTrack(token!))}
          className="w-16 h-16 flex items-center justify-center rounded-none bg-dash-card border-2 border-dash-border text-dash-text hover:text-dash-cyan transition-all transform -skew-x-12 active:scale-90"
          aria-label="Previous"
        >
          <PrevIcon />
        </button>

        <button
          onClick={() => handleAction(() => togglePlay(token!, playerState?.isPlaying || false))}
          className="w-20 h-20 flex items-center justify-center rounded-none bg-dash-accent text-white shadow-[0_0_20px_rgba(255,77,0,0.4)] transition-all transform -skew-x-12 active:scale-95 border-r-4 border-b-4 border-white/20"
          aria-label={playerState?.isPlaying ? "Pause" : "Play"}
        >
          {playerState?.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          onClick={() => handleAction(() => nextTrack(token!))}
          className="w-16 h-16 flex items-center justify-center rounded-none bg-dash-card border-2 border-dash-border text-dash-text hover:text-dash-cyan transition-all transform -skew-x-12 active:scale-90"
          aria-label="Next"
        >
          <NextIcon />
        </button>
      </div>
    </div>
  );
};

export default SpotifyPlayer;