import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Use a singleton pattern to prevent multiple database connections
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database('sqlite.db');
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

export const db = getDb(); 