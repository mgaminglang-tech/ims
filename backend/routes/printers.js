const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ─────────────────────────────────────────
// GET all printers
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT * FROM dbo.Printers ORDER BY id DESC"
    );
    res.json(result.recordset);
  } catch (error) {
    console.error("GET /api/printers ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch printers", error: error.message });
  }
});

// ─────────────────────────────────────────
// GET one printer
// ─────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM dbo.Printers WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Printer not found" });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("GET printer error:", error.message);
    res.status(500).json({ message: "Failed to fetch printer", error: error.message });
  }
});

// ─────────────────────────────────────────
// CREATE printer
// ─────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      hostname, serial_number, condition,
      department, warranty_end, brand, ip_address, status,
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input("hostname",      sql.VarChar,  hostname      || null)
      .input("serial_number", sql.VarChar,  serial_number || null)
      .input("condition",     sql.VarChar,  condition     || null)
      .input("department",    sql.VarChar,  department    || null)
      .input("warranty_end",  sql.DateTime, warranty_end  || null)
      .input("brand",         sql.VarChar,  brand         || null)
      .input("ip_address",    sql.VarChar,  ip_address    || null)
      .input("status",        sql.VarChar,  status        || null)
      .query(`
        INSERT INTO dbo.Printers
          (hostname, serial_number, condition, department, warranty_end, brand, ip_address, status)
        VALUES
          (@hostname, @serial_number, @condition, @department, @warranty_end, @brand, @ip_address, @status)
      `);

    res.status(201).json({ message: "Printer created successfully" });
  } catch (error) {
    console.error("POST printer error:", error.message);
    res.status(500).json({ message: "Failed to create printer", error: error.message });
  }
});

// ─────────────────────────────────────────
// UPDATE printer
// ─────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const {
      hostname, serial_number, condition,
      department, warranty_end, brand, ip_address, status,
    } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input("id",            sql.Int,      req.params.id)
      .input("hostname",      sql.VarChar,  hostname      || null)
      .input("serial_number", sql.VarChar,  serial_number || null)
      .input("condition",     sql.VarChar,  condition     || null)
      .input("department",    sql.VarChar,  department    || null)
      .input("warranty_end",  sql.DateTime, warranty_end  || null)
      .input("brand",         sql.VarChar,  brand         || null)
      .input("ip_address",    sql.VarChar,  ip_address    || null)
      .input("status",        sql.VarChar,  status        || null)
      .query(`
        UPDATE dbo.Printers SET
          hostname      = @hostname,
          serial_number = @serial_number,
          condition     = @condition,
          department    = @department,
          warranty_end  = @warranty_end,
          brand         = @brand,
          ip_address    = @ip_address,
          status        = @status
        WHERE id = @id
      `);

    res.json({ message: "Printer updated successfully" });
  } catch (error) {
    console.error("PUT printer error:", error.message);
    res.status(500).json({ message: "Failed to update printer", error: error.message });
  }
});

// ─────────────────────────────────────────
// DELETE printer
// ─────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM dbo.Printers WHERE id = @id");

    res.json({ message: "Printer deleted successfully" });
  } catch (error) {
    console.error("DELETE printer error:", error.message);
    res.status(500).json({ message: "Failed to delete printer", error: error.message });
  }
});

module.exports = router;