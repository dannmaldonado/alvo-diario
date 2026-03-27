/**
 * PocketBase Client (Legacy)
 *
 * NOTE: This file is maintained for backward compatibility.
 * New code should import `pb` and utilities from `src/services/api.ts` instead.
 *
 * This instance uses environment-based configuration which allows
 * different PocketBase URLs for development and production.
 */

import PocketBase from 'pocketbase';

const POCKETBASE_API_URL = (import.meta.env.VITE_PB_URL as string | undefined) || 'http://localhost:8090';

const pocketbaseClient = new PocketBase(POCKETBASE_API_URL);

export default pocketbaseClient;
export { pocketbaseClient };
