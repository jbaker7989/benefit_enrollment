import { randomUUID } from "node:crypto";
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

/**
 * Run `fn` inside a transaction, rolling back on any error.
 *
 * Repository methods compose transactions. The outermost caller owns the
 * BEGIN/COMMIT boundary. A nested call runs inside a SAVEPOINT so that if its
 * `fn` throws and the *outer* caller catches that error, only the inner work is
 * rolled back — the outer transaction stays open and must never commit the
 * inner partial write (STORY-031). An uncaught inner error still unwinds every
 * frame and rolls the whole unit of work back.
 */
export function transaction<T>(db: Db, fn: () => T): T {
  if (db.isTransaction) {
    // Savepoint names must be identifiers; UUID hex (no dashes) keeps each
    // nesting level distinct even when transactions compose recursively.
    const savepoint = `sp_${randomUUID().replace(/-/g, "")}`;
    db.exec(`SAVEPOINT ${savepoint}`);
    try {
      const result = fn();
      db.exec(`RELEASE ${savepoint}`);
      return result;
    } catch (err) {
      // Roll back only this savepoint's writes, then release it so the outer
      // transaction can continue.
      db.exec(`ROLLBACK TO ${savepoint}`);
      db.exec(`RELEASE ${savepoint}`);
      throw err;
    }
  }
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
