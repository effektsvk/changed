import { Database } from "bun:sqlite";
import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import _debug from "debug";

const debugDbInit = _debug("app:db:init");
const debug = _debug("app:db:helper");

const DEFAULT_DB_DIR = join(homedir(), ".config/changelog-cli");
const DEFAULT_DB_PATH = join(DEFAULT_DB_DIR, "cache.db");
const DB_PATH = process.env.CHG_CACHE_DB_PATH ?? DEFAULT_DB_PATH;

// Ensure the directory exists
if (!existsSync(DEFAULT_DB_DIR)) {
  debug(`Creating directory ${DEFAULT_DB_DIR}`);
  mkdirSync(DEFAULT_DB_DIR, { recursive: true });
}

const initDb = () => {
  debugDbInit(`Initializing database at ${DB_PATH}`);
  const db = new Database(DB_PATH, { create: true });

  const schema = `
    create table if not exists repo (
      id integer primary key autoincrement,
      name text not null,
      changelogText text not null,
      version text not null,
      lastUpdatedAt datetime not null default current_timestamp,
      created_at datetime not null default current_timestamp
    );
    create table if not exists db_version (
      id integer primary key autoincrement,
      version integer not null,
      created_at datetime not null default current_timestamp
    );
    insert into db_version (version) values (1);
  `;
  db.exec(schema);
  return db;
};

// TODO: add migration support

export const db = initDb();
