import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';

/**
 * Production EAS builds should switch this to SQLiteAdapter (JSI).
 * LokiJS is the Expo Go / web-safe adapter so sync protocol can be developed
 * without a custom native build. Persistence uses IndexedDB/localStorage on web
 * and a JS document store on native Expo Go.
 */
const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  dbName: 'cognigame',
});

export const database = new Database({
  adapter,
  modelClasses: [],
});

export function nowClock(): Record<string, number> {
  return { '*': Date.now() };
}
