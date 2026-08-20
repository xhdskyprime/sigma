import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'password123',
  port: parseInt(process.env.DB_PORT || '5432'),
};

const DB_NAME = 'db_sistemmonitoringjadwal';

async function initDatabase() {
  console.log('Connecting to default postgres database...');
  const rootClient = new pg.Client({ ...dbConfig, database: 'postgres' });
  await rootClient.connect();

  const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
  if (res.rowCount === 0) {
    console.log(`Database ${DB_NAME} does not exist. Creating...`);
    await rootClient.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`Database ${DB_NAME} created successfully.`);
  } else {
    console.log(`Database ${DB_NAME} already exists.`);
  }
  await rootClient.end();

  console.log(`Connecting to ${DB_NAME}...`);
  const client = new pg.Client({ ...dbConfig, database: DB_NAME });
  await client.connect();

  // Create Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      initial VARCHAR(10)
    )
  `);

  // Create Settings table
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY DEFAULT 1,
      email_sender VARCHAR(255),
      email_password VARCHAR(255),
      email_recipients JSONB DEFAULT '[]'::jsonb,
      email_schedule VARCHAR(20) DEFAULT '07:00',
      mobile_pin VARCHAR(20) DEFAULT '',
      announcements JSONB DEFAULT '[]'::jsonb
    )
  `);

  await client.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS mobile_pin VARCHAR(20) DEFAULT '';`);
  await client.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS announcements JSONB DEFAULT '[]'::jsonb;`);

  // Create Agendas table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agendas (
      id BIGINT PRIMARY KEY,
      title TEXT NOT NULL,
      date VARCHAR(20) NOT NULL,
      time_start VARCHAR(20),
      time_end VARCHAR(20),
      location TEXT,
      pic TEXT,
      unit TEXT,
      attendees TEXT,
      category VARCHAR(100),
      status VARCHAR(50),
      color VARCHAR(50),
      cat_color VARCHAR(50),
      note TEXT,
      admin JSONB,
      admin_files JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`ALTER TABLE agendas ALTER COLUMN id TYPE BIGINT;`);
  await client.query(`ALTER TABLE agendas ADD COLUMN IF NOT EXISTS note TEXT;`);

  // Create sequence for agendas if custom IDs used
  await client.query(`
    CREATE SEQUENCE IF NOT EXISTS agendas_id_seq;
  `);

  // Migrate Settings & Users from json if table empty
  const usersCount = await client.query(`SELECT count(*) FROM users`);
  const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
  
  if (parseInt(usersCount.rows[0].count) === 0) {
    console.log('Migrating users and settings to PostgreSQL...');
    let settingsData = {
      emailSender: 'umpegrsud3raksa@gmail.com',
      emailPassword: 'zymi fjyj xnlv xbbz',
      emailRecipients: ['xhdprime@gmail.com'],
      emailSchedule: '07:00',
      users: [
        { id: 1, role: 'admin', username: 'admin', password: bcrypt.hashSync('admin', 10), name: 'Admin RSUD', initial: 'AD' },
        { id: 2, role: 'direktur', username: 'direktur', password: bcrypt.hashSync('direktur', 10), name: 'Direktur RSUD', initial: 'DR' }
      ]
    };

    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        settingsData = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      } catch (err) {
        console.error('Error reading settings.json:', err);
      }
    }

    // Insert settings
    await client.query(
      `INSERT INTO settings (id, email_sender, email_password, email_recipients, email_schedule)
       VALUES (1, $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
       email_sender = EXCLUDED.email_sender,
       email_password = EXCLUDED.email_password,
       email_recipients = EXCLUDED.email_recipients,
       email_schedule = EXCLUDED.email_schedule`,
      [
        settingsData.emailSender || '',
        settingsData.emailPassword || '',
        JSON.stringify(settingsData.emailRecipients || []),
        settingsData.emailSchedule || '07:00'
      ]
    );

    // Insert users
    if (settingsData.users && settingsData.users.length > 0) {
      for (const u of settingsData.users) {
        await client.query(
          `INSERT INTO users (id, username, password, role, name, initial)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (username) DO UPDATE SET
           password = EXCLUDED.password, role = EXCLUDED.role, name = EXCLUDED.name, initial = EXCLUDED.initial`,
          [u.id, u.username, u.password, u.role, u.name, u.initial]
        );
      }
      await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
    }
  }

  // Migrate Agendas from json if table empty
  const agendasCount = await client.query(`SELECT count(*) FROM agendas`);
  const AGENDAS_FILE = path.join(__dirname, 'data', 'agendas.json');

  if (parseInt(agendasCount.rows[0].count) === 0 && fs.existsSync(AGENDAS_FILE)) {
    console.log('Migrating agendas to PostgreSQL...');
    try {
      const agendasData = JSON.parse(fs.readFileSync(AGENDAS_FILE, 'utf8'));
      let maxId = 0;
      for (const a of agendasData) {
        if (a.id > maxId) maxId = a.id;
        await client.query(
          `INSERT INTO agendas (id, title, date, time_start, time_end, location, pic, unit, attendees, category, status, color, cat_color, admin, admin_files)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, date = EXCLUDED.date, time_start = EXCLUDED.time_start, time_end = EXCLUDED.time_end,
           location = EXCLUDED.location, pic = EXCLUDED.pic, unit = EXCLUDED.unit, attendees = EXCLUDED.attendees,
           category = EXCLUDED.category, status = EXCLUDED.status, color = EXCLUDED.color, cat_color = EXCLUDED.cat_color,
           admin = EXCLUDED.admin, admin_files = EXCLUDED.admin_files`,
          [
            a.id,
            a.title,
            a.date,
            a.timeStart || '',
            a.timeEnd || '',
            a.location || '',
            a.pic || '',
            a.unit || '',
            a.attendees || '',
            a.category || '',
            a.status || '',
            a.color || '',
            a.catColor || '',
            JSON.stringify(a.admin || {}),
            JSON.stringify(a.adminFiles || {})
          ]
        );
      }
      if (maxId > 0) {
        await client.query(`SELECT setval('agendas_id_seq', $1)`, [maxId]);
      }
      console.log(`Migrated ${agendasData.length} agendas to PostgreSQL.`);
    } catch (err) {
      console.error('Error migrating agendas:', err);
    }
  }

  await client.end();
  console.log('Database initialization and migration completed successfully!');
}

initDatabase().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
