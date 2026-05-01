import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running CRM migration...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      primary_contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      service_type TEXT NOT NULL DEFAULT 'General',
      status TEXT NOT NULL DEFAULT 'active',
      contract_start TIMESTAMP,
      contract_end TIMESTAMP,
      profile_photo_url TEXT,
      invoice_status TEXT NOT NULL DEFAULT 'paid',
      notes TEXT,
      from_inquiry_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS client_contact_history (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS client_tasks (
      id SERIAL PRIMARY KEY,
      client_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'open',
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS client_invoices (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      status TEXT NOT NULL DEFAULT 'outstanding',
      invoice_date TIMESTAMP DEFAULT NOW(),
      due_date TIMESTAMP,
      file_object_name TEXT,
      file_filename TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS client_files (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      object_name TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'application/pdf',
      label TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('CRM migration complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
