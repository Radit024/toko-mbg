import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

async function init() {
    try {
        console.log('Membuat tabel di database...');
        await pool.query(schema);
        console.log('✅ Schema berhasil dibuat!');
    } catch (err) {
        console.error('❌ Gagal membuat schema:', err.message);
    } finally {
        await pool.end();
    }
}

init();
