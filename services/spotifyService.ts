import { SPOTIFY_CONFIG } from '../constants';
import { SpotifyState } from '../types';

/**
 * PKCE Helpers
 */
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const initiateLogin = async () => {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  window.localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CONFIG.clientId.trim(),
    scope: SPOTIFY_CONFIG.scopes.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
  });

  window.location.href = `${SPOTIFY_CONFIG.authEndpoint}?${params.toString()}`;
};

export const getToken = async (code: string): Promise<{ access_token: string; refresh_token: string } | null> => {
  const codeVerifier = window.localStorage.getItem('spotify_code_verifier');

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SPOTIFY_CONFIG.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      code_verifier: codeVerifier!,
    }),
  };

  const body = await fetch('https://accounts.spotify.com/api/token', payload);
  if (!body.ok) return null;
  return await body.json();
};

export const refreshAccessToken = async (refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> => {
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SPOTIFY_CONFIG.clientId
    }),
  }
  const body = await fetch('https://accounts.spotify.com/api/token', payload);
  if (!body.ok) return null;
  return await body.json();
}

/**
 * Data Fetching
 */

export const cleanUrl = () => {
  window.history.pushState("", document.title, window.location.pathname + window.location.search);
};

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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data;
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
    if ((e as any).status === 404) return null;
    console.error("Spotify fetch error", e);
    throw e;
  }
};

export const getDevices = async (token: string) => {
  const data = await apiCall('me/player/devices', token);
  return data.devices || [];
};

export const nextTrack = async (token: string) => {
  return apiCall('me/player/next', token, 'POST');
};

export const prevTrack = async (token: string) => {
  return apiCall('me/player/previous', token, 'POST');
};

export const togglePlay = async (token: string, isPlaying: boolean) => {
  const endpoint = isPlaying ? 'me/player/pause' : 'me/player/play';
  try {
    return await apiCall(endpoint, token, 'PUT');
  } catch (e: any) {
    // If no active device, try to find one and force play on it
    if (e.status === 404 && !isPlaying) {
      const devices = await getDevices(token);
      if (devices.length > 0) {
        // Try playing on the first available device
        return await apiCall(`${endpoint}?device_id=${devices[0].id}`, token, 'PUT');
      }
    }
    throw e;
  }
};