import { localStore } from "./infrastructure/LocalStore.js";

export const athlete = localStore("ATHLETE");

export const lastSync = localStore("LAST_SYNC");