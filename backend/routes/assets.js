const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// GET all assets
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM Assets
      ORDER BY id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("GET assets error:", error.message);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

// GET single asset
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM Assets WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("GET asset error:", error.message);
    res.status(500).json({ message: "Failed to fetch asset" });
  }
});

// CREATE asset
router.post("/", async (req, res) => {
  try {
    const {
      record_id,
      asset_type,
      hostname,
      serial_number,
      condition,
      custodian,
      department,
      warranty_end,
      business_unit,
      brand,
      ip_mac_address,
      wlan_address,
      os_version,
      office_version,
      office_key,
      processor,
      ram,
      storage,
      monitor_info,
      ups_info,
      status,
    } = req.body;

    const pool = await poolPromise;
    await pool
      .request()
      .input("record_id", sql.VarChar, record_id || null)
      .input("asset_type", sql.VarChar, asset_type || null)
      .input("hostname", sql.VarChar, hostname || null)
      .input("serial_number", sql.VarChar, serial_number || null)
      .input("condition", sql.VarChar, condition || null)
      .input("custodian", sql.VarChar, custodian || null)
      .input("department", sql.VarChar, department || null)
      .input("warranty_end", sql.Date, warranty_end || null)
      .input("business_unit", sql.VarChar, business_unit || null)
      .input("brand", sql.VarChar, brand || null)
      .input("ip_mac_address", sql.VarChar, ip_mac_address || null)
      .input("wlan_address", sql.VarChar, wlan_address || null)
      .input("os_version", sql.VarChar, os_version || null)
      .input("office_version", sql.VarChar, office_version || null)
      .input("office_key", sql.VarChar, office_key || null)
      .input("processor", sql.VarChar, processor || null)
      .input("ram", sql.VarChar, ram || null)
      .input("storage", sql.VarChar, storage || null)
      .input("monitor_info", sql.VarChar, monitor_info || null)
      .input("ups_info", sql.VarChar, ups_info || null)
      .input("status", sql.VarChar, status || null)
      .query(`
        INSERT INTO Assets (
          record_id, asset_type, hostname, serial_number, condition,
          custodian, department, warranty_end, business_unit, brand,
          ip_mac_address, wlan_address, os_version, office_version,
          office_key, processor, ram, storage, monitor_info, ups_info, status
        )
        VALUES (
          @record_id, @asset_type, @hostname, @serial_number, @condition,
          @custodian, @department, @warranty_end, @business_unit, @brand,
          @ip_mac_address, @wlan_address, @os_version, @office_version,
          @office_key, @processor, @ram, @storage, @monitor_info, @ups_info, @status
        )
      `);

    res.status(201).json({ message: "Asset created successfully" });
  } catch (error) {
    console.error("POST asset error:", error.message);
    res.status(500).json({ message: "Failed to create asset" });
  }
});

// UPDATE asset
router.put("/:id", async (req, res) => {
  try {
    const {
      record_id,
      asset_type,
      hostname,
      serial_number,
      condition,
      custodian,
      department,
      warranty_end,
      business_unit,
      brand,
      ip_mac_address,
      wlan_address,
      os_version,
      office_version,
      office_key,
      processor,
      ram,
      storage,
      monitor_info,
      ups_info,
      status,
    } = req.body;

    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("record_id", sql.VarChar, record_id || null)
      .input("asset_type", sql.VarChar, asset_type || null)
      .input("hostname", sql.VarChar, hostname || null)
      .input("serial_number", sql.VarChar, serial_number || null)
      .input("condition", sql.VarChar, condition || null)
      .input("custodian", sql.VarChar, custodian || null)
      .input("department", sql.VarChar, department || null)
      .input("warranty_end", sql.Date, warranty_end || null)
      .input("business_unit", sql.VarChar, business_unit || null)
      .input("brand", sql.VarChar, brand || null)
      .input("ip_mac_address", sql.VarChar, ip_mac_address || null)
      .input("wlan_address", sql.VarChar, wlan_address || null)
      .input("os_version", sql.VarChar, os_version || null)
      .input("office_version", sql.VarChar, office_version || null)
      .input("office_key", sql.VarChar, office_key || null)
      .input("processor", sql.VarChar, processor || null)
      .input("ram", sql.VarChar, ram || null)
      .input("storage", sql.VarChar, storage || null)
      .input("monitor_info", sql.VarChar, monitor_info || null)
      .input("ups_info", sql.VarChar, ups_info || null)
      .input("status", sql.VarChar, status || null)
      .query(`
        UPDATE Assets
        SET
          record_id = @record_id,
          asset_type = @asset_type,
          hostname = @hostname,
          serial_number = @serial_number,
          condition = @condition,
          custodian = @custodian,
          department = @department,
          warranty_end = @warranty_end,
          business_unit = @business_unit,
          brand = @brand,
          ip_mac_address = @ip_mac_address,
          wlan_address = @wlan_address,
          os_version = @os_version,
          office_version = @office_version,
          office_key = @office_key,
          processor = @processor,
          ram = @ram,
          storage = @storage,
          monitor_info = @monitor_info,
          ups_info = @ups_info,
          status = @status
        WHERE id = @id
      `);

    res.json({ message: "Asset updated successfully" });
  } catch (error) {
    console.error("PUT asset error:", error.message);
    res.status(500).json({ message: "Failed to update asset" });
  }
});

// DELETE asset
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Assets WHERE id = @id");

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("DELETE asset error:", error.message);
    res.status(500).json({ message: "Failed to delete asset" });
  }
});

module.exports = router;