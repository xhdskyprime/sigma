import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/db_sistemmonitoringjadwal';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 1000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
