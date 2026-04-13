const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// GET all borrow records
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM BorrowRecords
      ORDER BY id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("GET borrow records error:", error.message);
    res.status(500).json({ message: "Failed to fetch borrow records" });
  }
});

// GET single borrow record
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM BorrowRecords WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("GET borrow record error:", error.message);
    res.status(500).json({ message: "Failed to fetch borrow record" });
  }
});

// CREATE borrow record
router.post("/", async (req, res) => {
  try {
    const {
      asset_id,
      asset_hostname,
      asset_serial,
      borrower_name,
      department,
      borrow_date,
      expected_return_date,
      actual_return_date,
      purpose,
      status,
    } = req.body;

    if (!asset_hostname || !borrower_name || !borrow_date || !expected_return_date || !purpose) {
      return res.status(400).json({
        message: "asset_hostname, borrower_name, borrow_date, expected_return_date, and purpose are required",
      });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("asset_id", sql.VarChar, asset_id || null)
      .input("asset_hostname", sql.VarChar, asset_hostname)
      .input("asset_serial", sql.VarChar, asset_serial || null)
      .input("borrower_name", sql.VarChar, borrower_name)
      .input("department", sql.VarChar, department || null)
      .input("borrow_date", sql.Date, borrow_date)
      .input("expected_return_date", sql.Date, expected_return_date)
      .input("actual_return_date", sql.Date, actual_return_date || null)
      .input("purpose", sql.VarChar, purpose)
      .input("status", sql.VarChar, status || "Borrowed")
      .query(`
        INSERT INTO BorrowRecords (
          asset_id,
          asset_hostname,
          asset_serial,
          borrower_name,
          department,
          borrow_date,
          expected_return_date,
          actual_return_date,
          purpose,
          status
        )
        VALUES (
          @asset_id,
          @asset_hostname,
          @asset_serial,
          @borrower_name,
          @department,
          @borrow_date,
          @expected_return_date,
          @actual_return_date,
          @purpose,
          @status
        )
      `);

    res.status(201).json({ message: "Borrow record created successfully" });
  } catch (error) {
    console.error("POST borrow record error:", error.message);
    res.status(500).json({ message: "Failed to create borrow record" });
  }
});

// UPDATE borrow record
router.put("/:id", async (req, res) => {
  try {
    const {
      asset_id,
      asset_hostname,
      asset_serial,
      borrower_name,
      department,
      borrow_date,
      expected_return_date,
      actual_return_date,
      purpose,
      status,
    } = req.body;

    if (!asset_hostname || !borrower_name || !borrow_date || !expected_return_date || !purpose) {
      return res.status(400).json({
        message: "asset_hostname, borrower_name, borrow_date, expected_return_date, and purpose are required",
      });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("asset_id", sql.VarChar, asset_id || null)
      .input("asset_hostname", sql.VarChar, asset_hostname)
      .input("asset_serial", sql.VarChar, asset_serial || null)
      .input("borrower_name", sql.VarChar, borrower_name)
      .input("department", sql.VarChar, department || null)
      .input("borrow_date", sql.Date, borrow_date)
      .input("expected_return_date", sql.Date, expected_return_date)
      .input("actual_return_date", sql.Date, actual_return_date || null)
      .input("purpose", sql.VarChar, purpose)
      .input("status", sql.VarChar, status || "Borrowed")
      .query(`
        UPDATE BorrowRecords
        SET
          asset_id = @asset_id,
          asset_hostname = @asset_hostname,
          asset_serial = @asset_serial,
          borrower_name = @borrower_name,
          department = @department,
          borrow_date = @borrow_date,
          expected_return_date = @expected_return_date,
          actual_return_date = @actual_return_date,
          purpose = @purpose,
          status = @status
        WHERE id = @id
      `);

    res.json({ message: "Borrow record updated successfully" });
  } catch (error) {
    console.error("PUT borrow record error:", error.message);
    res.status(500).json({ message: "Failed to update borrow record" });
  }
});

// DELETE borrow record
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM BorrowRecords WHERE id = @id");

    res.json({ message: "Borrow record deleted successfully" });
  } catch (error) {
    console.error("DELETE borrow record error:", error.message);
    res.status(500).json({ message: "Failed to delete borrow record" });
  }
});

module.exports = router;