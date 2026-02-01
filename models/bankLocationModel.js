// models/bankLocationModel.js
import { poolPromise } from "./db.js";

export async function getAllBankLocations() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      return [];
    }

    const result = await pool.request().query(`
      SELECT Id, BankId, BankName, BankAddress, Region, Latitude, Longitude, OpenHours
      FROM dbo.BankLocations
      ORDER BY BankName;
    `);

    return result.recordset.map((row) => ({
      id: row.Id,
      bankId: row.BankId,
      name: row.BankName,
      address: row.BankAddress,
      region: row.Region || null,
      lat: row.Latitude !== null ? parseFloat(row.Latitude) : null,
      lng: row.Longitude !== null ? parseFloat(row.Longitude) : null,
      openHours: row.OpenHours || null,
    }));
  } catch (err) {
    console.error("❌ Error loading bank locations:", err.message);
    return [];
  }
}
