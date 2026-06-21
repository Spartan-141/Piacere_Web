import path from 'path';
import dotenv from 'dotenv';
import { runMigrations } from './schema';

dotenv.config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../piacere.db');

let _db: any = null;

export function getDb(): any {
  if (!_db) {
    const resolvedPath = path.resolve(DB_PATH);
    try {
      // Intentar con better-sqlite3 primero
      const Database = require('better-sqlite3');
      _db = new Database(resolvedPath);
      _db.pragma('journal_mode = WAL');
      _db.pragma('foreign_keys = ON');
      console.log('✅ Conectado usando better-sqlite3');
    } catch (err: any) {
      console.warn('⚠️ Falló la carga de better-sqlite3. Intentando con node:sqlite nativo...');
      try {
        const { DatabaseSync } = require('node:sqlite');
        const nativeDb = new DatabaseSync(resolvedPath);
        
        // Wrapper para compatibilidad con better-sqlite3
        _db = {
          native: nativeDb,
          exec: (sql: string) => nativeDb.exec(sql),
          prepare: (sql: string) => {
            const stmt = nativeDb.prepare(sql);
            return {
              all: (...args: any[]) => stmt.all(...args),
              get: (...args: any[]) => stmt.get(...args),
              run: (...args: any[]) => {
                const result = stmt.run(...args);
                return {
                  changes: result.changes,
                  lastInsertRowid: result.lastInsertRowid
                };
              }
            };
          },
          transaction: (fn: Function) => {
            return (...args: any[]) => {
              nativeDb.exec('BEGIN');
              try {
                const result = fn(...args);
                nativeDb.exec('COMMIT');
                return result;
              } catch (e) {
                nativeDb.exec('ROLLBACK');
                throw e;
              }
            };
          },
          pragma: (sql: string) => nativeDb.exec(`PRAGMA ${sql}`),
          close: () => nativeDb.close()
        };
        console.log('✅ Conectado usando node:sqlite (Nativo)');
      } catch (nativeErr) {
        console.error('❌ Error fatal: No se pudo cargar ningún cliente de SQLite.');
        throw nativeErr;
      }
    }
    runMigrations(_db);
  }
  return _db;
}
