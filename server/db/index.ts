import fs from 'node:fs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDbPath(): string {
  const fromEnv = process.env.DATABASE_PATH?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  return path.join(process.cwd(), 'data', 'rabbitstation.db');
}

const dbPath = resolveDbPath();

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(SCHEMA_SQL);
    seedDatabase(db);
  }
  return db;
}

export function getDbPathForLogs(): string {
  return dbPath;
}
