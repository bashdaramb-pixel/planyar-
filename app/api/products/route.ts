import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

declare global {
  // eslint-disable-next-line no-var
  var planYarProductsPool: Pool | undefined;
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  if (!global.planYarProductsPool) {
    global.planYarProductsPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return global.planYarProductsPool;
}

async function ensureProductsTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      sku VARCHAR(100) UNIQUE,
      name VARCHAR(220) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Other',
      brand VARCHAR(120) NOT NULL DEFAULT '',
      model VARCHAR(120) NOT NULL DEFAULT '',
      specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      datasheet_url TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query("CREATE INDEX IF NOT EXISTS products_name_search_idx ON products USING GIN (to_tsvector('simple', name || ' ' || brand || ' ' || model || ' ' || category))");
}

function normalizeProduct(input: Record<string, unknown>) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const sku = typeof input.sku === "string" ? input.sku.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "Other";
  const brand = typeof input.brand === "string" ? input.brand.trim() : "";
  const model = typeof input.model === "string" ? input.model.trim() : "";
  const price = Number(input.unit_price ?? input.price ?? 0);
  const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "USD";
  const datasheetUrl = typeof input.datasheet_url === "string" ? input.datasheet_url.trim() : "";
  const imageUrl = typeof input.image_url === "string" ? input.image_url.trim() : "";
  const specifications = input.specifications && typeof input.specifications === "object" && !Array.isArray(input.specifications)
    ? input.specifications : {};
  if (!name || name.length > 220 || sku.length > 100 || category.length > 100 || brand.length > 120 || model.length > 120) {
    throw new Error("Product name is required and product fields must be within the allowed lengths.");
  }
  if (!Number.isFinite(price) || price < 0 || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Enter a valid non-negative price and a 3-letter currency code.");
  }
  for (const url of [datasheetUrl, imageUrl]) {
    if (url && !/^https?:\/\//i.test(url)) throw new Error("Datasheet and image links must use http:// or https://.");
  }
  return { sku: sku || null, name, category: category || "Other", brand, model, specifications, price, currency, datasheetUrl, imageUrl };
}

const columns = "id, sku, name, category, brand, model, specifications, unit_price, currency, datasheet_url, image_url, created_at, updated_at";

export async function GET(request: Request) {
  try {
    const pool = getPool();
    await ensureProductsTable(pool);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const category = (url.searchParams.get("category") || "").trim();
    const result = await pool.query(
      `SELECT ${columns} FROM products
       WHERE ($1 = '' OR to_tsvector('simple', name || ' ' || brand || ' ' || model || ' ' || category) @@ plainto_tsquery('simple', $1))
       AND ($2 = '' OR category = $2)
       ORDER BY updated_at DESC, id DESC LIMIT 500`,
      [q, category],
    );
    return NextResponse.json({ products: result.rows });
  } catch (error) {
    console.error("PlanYar products GET failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load products." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pool = getPool();
    await ensureProductsTable(pool);
    const inputs = Array.isArray(body.products) ? body.products : [body];
    if (!inputs.length || inputs.length > 500) return NextResponse.json({ error: "Submit between 1 and 500 products per import." }, { status: 400 });
    const normalized = inputs.map((item) => normalizeProduct(item as Record<string, unknown>));
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const saved = [];
      for (const p of normalized) {
        const result = await client.query(
          `INSERT INTO products (sku, name, category, brand, model, specifications, unit_price, currency, datasheet_url, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (sku) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, brand=EXCLUDED.brand,
             model=EXCLUDED.model, specifications=EXCLUDED.specifications, unit_price=EXCLUDED.unit_price,
             currency=EXCLUDED.currency, datasheet_url=EXCLUDED.datasheet_url, image_url=EXCLUDED.image_url,
             updated_at=NOW()
           WHERE products.sku IS NOT NULL
           RETURNING ${columns}`,
          [p.sku, p.name, p.category, p.brand, p.model, JSON.stringify(p.specifications), p.price, p.currency, p.datasheetUrl, p.imageUrl],
        );
        if (result.rows[0]) saved.push(result.rows[0]);
        else if (!p.sku) {
          const inserted = await client.query(
            `INSERT INTO products (name, category, brand, model, specifications, unit_price, currency, datasheet_url, image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${columns}`,
            [p.name, p.category, p.brand, p.model, JSON.stringify(p.specifications), p.price, p.currency, p.datasheetUrl, p.imageUrl],
          );
          saved.push(inserted.rows[0]);
        }
      }
      await client.query("COMMIT");
      return NextResponse.json({ imported: saved.length, products: saved }, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("PlanYar products POST failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save products." }, { status: 400 });
  }
}
