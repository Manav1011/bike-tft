export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
    name: string;
  };
  duration_ms: number;
}

export interface SpotifyState {
  isPlaying: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
}

export interface GeoState {
  speed: number | null; // Speed in km/h
  accuracy: number | null; // Accuracy in meters
  error: string | null;
}

export enum SpotifyAuthStatus {
  LOGGED_OUT,
  LOGGED_IN,
  EXPIRED
}

export interface RideSession {
  startTime: number;
  endTime?: number;
  distance: number; // in km
  maxSpeed: number; // in km/h
  isActive: boolean;
}

export interface RideHistoryEntry extends RideSession {
  id: string;
  endTime: number;
}