import fs from "fs/promises";
import path from "path";
import { pool } from "@/lib/pool";

const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name text PRIMARY KEY,
      run_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied(): Promise<Set<string>> {
  const res = await pool.query<{ name: string }>("SELECT name FROM migrations ORDER BY name ASC");
  return new Set(res.rows.map(r => r.name));
}

async function getAllMigrations() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
}

async function applyUp(name: string) {
  const upPath = path.join(MIGRATIONS_DIR, name, "up.sql");
  const sql = await fs.readFile(upPath, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO migrations(name) VALUES($1)", [name]);
    await client.query("COMMIT");
    console.log(`Applied: ${name}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`Failed: ${name}`, e);
    process.exitCode = 1;
    throw e;
  } finally {
    client.release();
  }
}

async function applyDown(name: string) {
  const downPath = path.join(MIGRATIONS_DIR, name, "down.sql");
  const sql = await fs.readFile(downPath, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("DELETE FROM migrations WHERE name=$1", [name]);
    await client.query("COMMIT");
    console.log(`Reverted: ${name}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`Failed revert: ${name}`, e);
    process.exitCode = 1;
    throw e;
  } finally {
    client.release();
  }
}

async function up() {
  await ensureMigrationsTable();
  const applied = await getApplied();
  const all = await getAllMigrations();
  for (const name of all) {
    if (!applied.has(name)) {
      await applyUp(name);
    }
  }
}

async function down() {
  await ensureMigrationsTable();
  const res = await pool.query<{ name: string }>("SELECT name FROM migrations ORDER BY name DESC LIMIT 1");
  const last = res.rows[0]?.name;
  if (!last) {
    console.log("Nothing to revert.");
    return;
  }
  await applyDown(last);
}

const cmd = process.argv[2] || "up";
(cmd === "down" ? down() : up())
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
