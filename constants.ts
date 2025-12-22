// Colors for reference in code logic if needed
export const COLORS = {
  bg: '#040404',
  panel: '#090808',
  accent: '#DD6713',
  text: '#FCFCFC',
};

// Spotify Configuration
// IMPORTANT: To make this work, you must create a Spotify App at https://developer.spotify.com/dashboard
// and add your URL (e.g., localhost or your vercel domain) to the Redirect URIs.
export const SPOTIFY_CONFIG = {
  clientId: 'YOUR_SPOTIFY_CLIENT_ID_HERE', // User needs to replace this
  redirectUri: window.location.origin + '/', // Redirects back to the app root
  scopes: [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state',
  ],
  authEndpoint: 'https://accounts.spotify.com/authorize',
};

export const SPEED_SMOOTHING_FACTOR = 0.2; // Low pass filter factor
