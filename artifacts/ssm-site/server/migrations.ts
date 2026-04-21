import { pool } from './db';

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS post_sections (
    id            SERIAL PRIMARY KEY,
    post_id       INTEGER NOT NULL,
    type          TEXT    NOT NULL DEFAULT 'text',
    title         TEXT,
    body          TEXT,
    image_url     TEXT,
    caption       TEXT,
    variant       TEXT,
    items         TEXT,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMP DEFAULT NOW()
  )`,
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const sql of MIGRATIONS) {
      await client.query(sql);
    }
    console.log('[migrations] All migrations applied.');
  } finally {
    client.release();
  }
}
