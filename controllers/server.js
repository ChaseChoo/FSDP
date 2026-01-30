
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import appointmentRoutes from '../routes/appointmentRoutes.js';
import { createAppointmentTable } from '../models/appointmentModel.js';

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
    trustServerCertificate: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {})
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const DEFAULT_EXTERNAL_ID = process.env.DEFAULT_EXTERNAL_ID || 'PUBLIC';

let cachedPool = null;
let poolError = null;
let poolErrorLogged = false;

async function getPool() {
  if (cachedPool) return cachedPool;
  if (poolError) throw poolError;
  try {
    cachedPool = await sql.connect(dbConfig);
    console.log('MSSQL connected');
    return cachedPool;
  } catch (err) {
    poolError = err;
    if (!poolErrorLogged) {
      console.error('MSSQL connection failed (showing once):', err.message);
      poolErrorLogged = true;
    }
    throw err;
  }
}

// Simple endpoints for approved recipients
app.get('/api/approved-recipients', async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('externalId', sql.NVarChar(200), DEFAULT_EXTERNAL_ID);
    const result = await request.query('SELECT Id AS id, Value AS value, CreatedAt FROM ApprovedRecipients WHERE ExternalId = @externalId ORDER BY Id DESC');
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

    const pool = await getPool();
    const request = pool.request();
    request.input('externalId', sql.NVarChar(200), DEFAULT_EXTERNAL_ID);
    request.input('value', sql.NVarChar(200), String(value));
    const insert = await request.query(
      'INSERT INTO ApprovedRecipients (ExternalId, Label, Value, CreatedAt, UpdatedAt) ' +
      'OUTPUT INSERTED.Id AS id, INSERTED.Value AS value, INSERTED.CreatedAt ' +
      'VALUES (@externalId, \'\', @value, SYSUTCDATETIME(), SYSUTCDATETIME())'
    );
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
    const pool = await getPool();
    const del = await pool.request()
      .input('id', sql.Int, id)
      .input('externalId', sql.NVarChar(200), DEFAULT_EXTERNAL_ID)
      .query('DELETE FROM ApprovedRecipients WHERE Id = @id AND ExternalId = @externalId; SELECT @@ROWCOUNT as affected;');
    const affected = (del.recordset && del.recordset[0] && del.recordset[0].affected) || 0;
    res.json({ deleted: affected > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Update an existing approved recipient (digits-only value)
app.put('/api/approved-recipients/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
    const { value } = req.body;
    if (!value || !/^\d+$/.test(String(value))) return res.status(400).json({ error: 'value is required and must be digits only' });

    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.Int, id);
    request.input('externalId', sql.NVarChar(200), DEFAULT_EXTERNAL_ID);
    request.input('value', sql.NVarChar(200), String(value));
    const upd = await request.query(
      "UPDATE ApprovedRecipients SET Value = @value, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id AND ExternalId = @externalId; " +
      "SELECT Id AS id, Value AS value, CreatedAt FROM ApprovedRecipients WHERE Id = @id AND ExternalId = @externalId;"
    );
    const updated = (upd.recordset && upd.recordset[0]) || null;
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update approved recipient' });
  }
});

// Bank appointment routes
app.get('/bank-appointment', (req, res) => {
  res.sendFile('bank-appointment.html', { root: 'public' });
});

app.get('/appointment-confirmation', (req, res) => {
  res.sendFile('appointment-confirmation.html', { root: 'public' });
});

// Mount appointment API routes
app.use('/api', appointmentRoutes);

const port = process.env.PORT || 3000;

// Initialize database and create tables
(async () => {
  try {
    await getPool();
    console.log('Database connected successfully');
    await createAppointmentTable();
    console.log('Appointment table ready');
  } catch (err) {
    console.warn('Continuing without DB connection; endpoints will fail until DB is reachable.');
  }
})();

app.listen(port, () => console.log(`API listening on http://localhost:${port}`));