// scripts/apply-migrations.mjs
// Applies supabase/migrations/*.sql (sorted) to the remote Supabase project.
// Usage:
//   SUPABASE_DB_URL='postgresql://...' node scripts/apply-migrations.mjs [--dry-run]
// SUPABASE_DB_URL = Dashboard -> Connect -> Session pooler connection string.
// Migrations are idempotent (IF NOT EXISTS / DROP IF EXISTS), safe to re-run.

import { readdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import dns from "node:dns";
import pg from "pg";

// Prefer IPv4 (broken IPv6 on some machines causes ECONNRESET).
dns.setDefaultResultOrder("ipv4first");

// Minimal .env.local loader (does not override real env vars).
function loadLocalEnv() {
  const p = new URL("../.env.local", import.meta.url);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadLocalEnv();

const dryRun = process.argv.includes("--dry-run");
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error(
    "Missing SUPABASE_DB_URL.\n" +
      "Set it to the Session pooler connection string from:\n" +
      "  Supabase Dashboard -> Connect -> Session pooler -> URI"
  );
  process.exit(1);
}

const dir = new URL("../supabase/migrations/", import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
if (files.length === 0) {
  console.error("No migration files found.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const file of files) {
    const sql = await readFile(new URL(file, dir), "utf8");
    process.stdout.write(`applying ${file} ... `);
    if (dryRun) {
      console.log("(dry-run)");
      continue;
    }
    // Multi-statement simple query => each file runs as one implicit transaction.
    await client.query(sql);
    console.log("ok");
  }
  console.log(dryRun ? "dry-run complete" : `applied ${files.length} migration(s)`);
} catch (err) {
  console.error(`\nFAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
