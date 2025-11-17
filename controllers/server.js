
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serve the single-page UI from the `public/` folder so API and UI share the same origin.
app.use(express.static('public'));

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: true
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let poolPromise;
async function connectDb() {
  try {
    poolPromise = await sql.connect(dbConfig);
    console.log('MSSQL connected');
  } catch (err) {
    console.error('MSSQL connection failed:', err);
    // rethrow so endpoints know connection failed
    throw err;
  }
}

// Simple endpoints for approved recipients
app.get('/api/approved-recipients', async (req, res) => {
  try {
    const pool = poolPromise || await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT id, value, created_at FROM approved_recipients ORDER BY id');
    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load approved recipients' });
  }
});

app.post('/api/approved-recipients', async (req, res) => {
  try {
    const { value } = req.body;
    if (!value || !/^\d+$/.test(String(value))) return res.status(400).json({ error: 'value is required and must be digits only' });

    const pool = poolPromise || await sql.connect(dbConfig);
    const request = pool.request();
    request.input('value', sql.NVarChar(50), String(value));
    const insert = await request.query('INSERT INTO approved_recipients (value) OUTPUT INSERTED.id, INSERTED.value, INSERTED.created_at VALUES (@value)');
    res.status(201).json(insert.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create approved recipient' });
  }
});

app.delete('/api/approved-recipients/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
    const pool = poolPromise || await sql.connect(dbConfig);
    const del = await pool.request().input('id', sql.Int, id).query('DELETE FROM approved_recipients WHERE id = @id; SELECT @@ROWCOUNT as affected;');
    const affected = (del.recordset && del.recordset[0] && del.recordset[0].affected) || 0;
    res.json({ deleted: affected > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

const port = process.env.PORT || 4000;
connectDb().catch(() => {
  console.warn('Continuing without DB connection; endpoints will fail until DB is reachable.');
});
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));