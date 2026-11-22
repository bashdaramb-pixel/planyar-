import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

declare global {
  // eslint-disable-next-line no-var
  var planYarPool: Pool | undefined;
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured on the PlanYar service.");
  if (!global.planYarPool) {
    global.planYarPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return global.planYarPool;
}

async function ensureProjectsTable(pool: Pool) {
  await pool.query("CREATE TABLE IF NOT EXISTS projects (id BIGSERIAL PRIMARY KEY, name VARCHAR(180) NOT NULL, client VARCHAR(180) NOT NULL DEFAULT 'Not specified', system VARCHAR(80) NOT NULL, status VARCHAR(40) NOT NULL DEFAULT 'Planning', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
}

export async function GET() {
  try {
    const pool = getPool();
    await ensureProjectsTable(pool);
    const result = await pool.query("SELECT id, name, client, system, status FROM projects ORDER BY created_at DESC, id DESC");
    return NextResponse.json({ projects: result.rows });
  } catch (error) {
    console.error("PlanYar projects GET failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database request failed." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const client = typeof body.client === "string" ? body.client.trim() : "Not specified";
    const system = typeof body.system === "string" ? body.system.trim() : "";
    if (!name || name.length > 180 || !system || system.length > 80 || client.length > 180) {
      return NextResponse.json({ error: "Enter a valid project name, client and system." }, { status: 400 });
    }
    const pool = getPool();
    await ensureProjectsTable(pool);
    const result = await pool.query("INSERT INTO projects (name, client, system) VALUES ($1, $2, $3) RETURNING id, name, client, system, status", [name, client || "Not specified", system]);
    return NextResponse.json({ project: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("PlanYar projects POST failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save project." }, { status: 503 });
  }
}
