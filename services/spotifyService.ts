import { SPOTIFY_CONFIG } from '../constants';
import { SpotifyState } from '../types';

export const getLoginUrl = (): string => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId.trim(),
    response_type: 'token',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    scope: SPOTIFY_CONFIG.scopes.join(' '),
    show_dialog: 'true',
  });
  return `${SPOTIFY_CONFIG.authEndpoint}?${params.toString()}`;
};

export const getTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const params = new URLSearchParams(hash.substring(1));
  return params.get('access_token');
};

export const cleanUrl = () => {
  window.history.pushState("", document.title, window.location.pathname + window.location.search);
};

// API Calls
const apiCall = async (endpoint: string, token: string, method: string = 'GET', body?: any) => {
  const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    throw new Error('Token expired');
  }
  
  if (res.status === 204) return null; // No content
  return res.json();
};

export const getPlaybackState = async (token: string): Promise<SpotifyState | null> => {
  try {
    const data = await apiCall('me/player', token);
    if (!data) return null;
    
    return {
      isPlaying: data.is_playing,
      item: data.item,
      progress_ms: data.progress_ms,
    };
  } catch (e) {
    console.error("Spotify fetch error", e);
    throw e;
  }
};

export const nextTrack = async (token: string) => {
  return apiCall('me/player/next', token, 'POST');
};

export const prevTrack = async (token: string) => {
  return apiCall('me/player/previous', token, 'POST');
};

export const togglePlay = async (token: string, isPlaying: boolean) => {
  const endpoint = isPlaying ? 'me/player/pause' : 'me/player/play';
  return apiCall(endpoint, token, 'PUT');
};