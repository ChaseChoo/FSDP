// models/appointmentModel.js
import { mssql, poolPromise } from "./db.js";

export async function createAppointmentTable() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.log("Database not available, skipping table creation");
      return;
    }

    await pool
      .request()
      .query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='appointments' AND xtype='U')
        CREATE TABLE appointments (
          id INT PRIMARY KEY IDENTITY(1,1),
          userId INT,
          bankId VARCHAR(100),
          bankName VARCHAR(255),
          bankAddress VARCHAR(500),
          appointmentDate DATE,
          appointmentTime VARCHAR(10),
          status VARCHAR(50) DEFAULT 'confirmed',
          serviceType VARCHAR(255),
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE(),
          notes VARCHAR(MAX),
          FOREIGN KEY (userId) REFERENCES users(id)
        );
        
        -- Add serviceType column if it doesn't exist
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('appointments') AND name = 'serviceType')
        BEGIN
          ALTER TABLE appointments ADD serviceType VARCHAR(255);
        END
      `);
    console.log("✅ Appointments table created or already exists");
  } catch (err) {
    console.error("❌ Error creating appointments table:", err);
  }
}

export async function bookAppointment(userId, appointmentData) {
  try {
    const pool = await poolPromise;
    if (!pool) {
      throw new Error("Database connection not available");
    }

    const {
      bankId,
      bankName,
      bankAddress,
      appointmentDate,
      appointmentTime,
      serviceType,
      notes,
    } = appointmentData;

    const result = await pool
      .request()
      .input("userId", mssql.Int, userId)
      .input("bankId", mssql.VarChar(100), bankId)
      .input("bankName", mssql.VarChar(255), bankName)
      .input("bankAddress", mssql.VarChar(500), bankAddress)
      .input("appointmentDate", mssql.Date, appointmentDate)
      .input("appointmentTime", mssql.VarChar(10), appointmentTime)
      .input("serviceType", mssql.VarChar(255), serviceType || notes || null)
      .input("notes", mssql.VarChar(mssql.MAX), notes || serviceType || null)
      .query(`
        INSERT INTO appointments (userId, bankId, bankName, bankAddress, appointmentDate, appointmentTime, status, serviceType, notes, createdAt, updatedAt)
        VALUES (@userId, @bankId, @bankName, @bankAddress, @appointmentDate, @appointmentTime, 'confirmed', @serviceType, @notes, GETDATE(), GETDATE());
        
        SELECT SCOPE_IDENTITY() as id;
      `);

    const appointmentId = result.recordset[0].id;

    // Return the full appointment details
    return {
      id: appointmentId,
      userId,
      bankId,
      bankName,
      bankAddress,
      appointmentDate,
      appointmentTime,
      serviceType: notes || serviceType || null,
      status: "confirmed",
    };
  } catch (err) {
    console.error("❌ Error booking appointment:", err);
    throw err;
  }
}

export async function getAppointmentById(appointmentId) {
  try {
    const pool = await poolPromise;
    if (!pool) {
      throw new Error("Database connection not available");
    }

    const result = await pool
      .request()
      .input("appointmentId", mssql.Int, appointmentId)
      .query(`
        SELECT * FROM appointments WHERE id = @appointmentId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (err) {
    console.error("❌ Error fetching appointment:", err);
    throw err;
  }
}

export async function getUserAppointments(userId) {
  try {
    const pool = await poolPromise;
    if (!pool) {
      throw new Error("Database connection not available");
    }

    const result = await pool
      .request()
      .input("userId", mssql.Int, userId)
      .query(`
        SELECT * FROM appointments 
        WHERE userId = @userId 
        ORDER BY appointmentDate DESC, appointmentTime DESC
      `);

    return result.recordset;
  } catch (err) {
    console.error("❌ Error fetching user appointments:", err);
    throw err;
  }
}

export async function cancelAppointment(appointmentId) {
  try {
    const pool = await poolPromise;
    if (!pool) {
      throw new Error("Database connection not available");
    }

    const result = await pool
      .request()
      .input("appointmentId", mssql.Int, appointmentId)
      .query(`
        UPDATE appointments 
        SET status = 'cancelled', updatedAt = GETDATE()
        WHERE id = @appointmentId;
        
        SELECT * FROM appointments WHERE id = @appointmentId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (err) {
    console.error("❌ Error cancelling appointment:", err);
    throw err;
  }
}

export async function updateAppointment(appointmentId, updateData) {
  try {
    const pool = await poolPromise;
    if (!pool) {
      throw new Error("Database connection not available");
    }

    const allowedFields = [
      "appointmentDate",
      "appointmentTime",
      "notes",
      "status",
    ];
    const updates = [];
    const request = pool.request().input("appointmentId", mssql.Int, appointmentId);

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = @${key}`);

        if (key === "appointmentDate") {
          request.input(key, mssql.Date, value);
        } else if (key === "appointmentTime") {
          request.input(key, mssql.VarChar(10), value);
        } else if (key === "status") {
          request.input(key, mssql.VarChar(50), value);
        } else {
          request.input(key, mssql.VarChar(mssql.MAX), value);
        }
      }
    }

    if (updates.length === 0) {
      throw new Error("No valid fields to update");
    }

    updates.push("updatedAt = GETDATE()");

    const result = await request.query(`
      UPDATE appointments 
      SET ${updates.join(", ")}
      WHERE id = @appointmentId;
      
      SELECT * FROM appointments WHERE id = @appointmentId
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (err) {
    console.error("❌ Error updating appointment:", err);
    throw err;
  }
}

export async function getAppointmentsByDateRange(startDate, endDate) {
  try {
    const pool = await poolPromise;
    if (!pool) {
      throw new Error("Database connection not available");
    }

    const result = await pool
      .request()
      .input("startDate", mssql.Date, startDate)
      .input("endDate", mssql.Date, endDate)
      .query(`
        SELECT * FROM appointments 
        WHERE appointmentDate BETWEEN @startDate AND @endDate
        AND status = 'confirmed'
        ORDER BY appointmentDate, appointmentTime
      `);

    return result.recordset;
  } catch (err) {
    console.error("❌ Error fetching appointments by date range:", err);
    throw err;
  }
}
