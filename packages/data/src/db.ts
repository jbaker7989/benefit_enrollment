import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { SCHEMA_SQL } from "./schema";

export type Db = DatabaseSync;

/**
 * Open (or create) the SQLite database at `path`, enable foreign keys and WAL,
 * and apply the schema. `:memory:` is supported for tests.
 */
export function openDatabase(path: string): Db {
  // Ensure the parent directory exists; DatabaseSync throws "unable to open
  // database file" rather than creating missing directories. Skip for the
  // in-memory database, which has no filesystem path.
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA_SQL);
  return db;
}

/** Run `fn` inside a transaction, rolling back on any error. */
export function transaction<T>(db: Db, fn: () => T): T {
  // Repository methods compose transactions. The outermost caller owns the
  // boundary; an error from an inner operation still propagates and rolls the
  // entire unit of work back.
  if (db.isTransaction) return fn();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
