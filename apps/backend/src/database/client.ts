import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import { runMigrations } from './schema';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './piacere.db';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(path.resolve(DB_PATH));
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    runMigrations(_db);
  }
  return _db;
}
