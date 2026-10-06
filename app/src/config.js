// Where the Adulted server lives. Set per build in eas.json (EXPO_PUBLIC_API_URL).
// Without it the app still works; only Ask Anything is turned off.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
export const BG = '#F1F4F7';
// The page runs as if it were served from this address. It never loads anything from it.
export const PAGE_URL = 'https://app.adulted.local/';
