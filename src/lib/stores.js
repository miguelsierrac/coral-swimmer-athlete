import { writable } from 'svelte/store';
import { localStore } from '$lib/infrastructure/LocalStore.js';

export const athlete = localStore('ATHLETE');

export const lastSync = localStore('LAST_SYNC');

export const token = localStore('TOKEN');

export const lastMeasurement = localStore('LAST_MEASUREMENT');

// Cached gamification data for instant rendering before fresh fetch
export const cachedLevels = localStore('CACHED_LEVELS', []);
export const cachedMeasurement = localStore('CACHED_MEASUREMENT', null);

export const popup = writable(null);

// Notification history – persisted across sessions, user-controlled
// Shape: { id, title, body, timestamp, read }
export const notifications = localStore('NOTIFICATIONS', []);

// Locally-submitted bitácoras waiting for the server gamification cycle
// Shape: { [athleteId]: [{ date: 'DD/MM/YYYY', meters: number }] }
export const pendingBitacoras = localStore('PENDING_BITACORAS', {});
