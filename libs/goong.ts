// Only place that reads Goong env (constitution XXV). Keys are browser-side; restrict them by domain in the Goong console.
const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY?.trim();

export const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY?.trim() || undefined;

export const GOONG_REST_BASE = "https://rsapi.goong.io";

export const GOONG_STYLE_URL: string | null = MAPTILES_KEY
  ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAPTILES_KEY}`
  : null;

export const isGoongMapConfigured = GOONG_STYLE_URL !== null;
