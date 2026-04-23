const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

// ===============================
// CREATE borrow record
// ===============================
router.post("/", async (req, res) => {
  try {
    const {
      asset_id,
      borrower_name,
      borrow_date,
      expected_return_date,
      status,
    } = req.body;

    if (!asset_id || !borrower_name || !borrow_date || !expected_return_date) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    const parsedAssetId = Number(asset_id);

    if (!Number.isInteger(parsedAssetId)) {
      return res.status(400).json({
        message: "Invalid asset_id.",
      });
    }

    const parsedBorrowDate = new Date(borrow_date);
    const parsedExpectedReturnDate = new Date(expected_return_date);

    if (
      isNaN(parsedBorrowDate.getTime()) ||
      isNaN(parsedExpectedReturnDate.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid borrow date or expected return date.",
      });
    }

    if (parsedExpectedReturnDate < parsedBorrowDate) {
      return res.status(400).json({
        message: "Expected return date cannot be earlier than borrow date.",
      });
    }

    const pool = await poolPromise;

    // Check if asset exists
    const assetCheck = await pool.request()
      .input("asset_id", sql.Int, parsedAssetId)
      .query(`
        SELECT id, hostname, serial_number, department, status
        FROM dbo.assets
        WHERE id = @asset_id
      `);

    if (assetCheck.recordset.length === 0) {
      return res.status(404).json({
        message: "Selected asset does not exist in assets table.",
      });
    }

    // Prevent duplicate active borrow
    const existingBorrow = await pool.request()
      .input("asset_id", sql.Int, parsedAssetId)
      .query(`
        SELECT TOP 1 id
        FROM dbo.borrowed
        WHERE asset_id = @asset_id
          AND UPPER(LTRIM(RTRIM(ISNULL(status, '')))) = 'BORROWED'
        ORDER BY id DESC
      `);

    if (existingBorrow.recordset.length > 0) {
      return res.status(409).json({
        message: "This asset is already marked as borrowed.",
      });
    }

    // Insert borrow record
    await pool.request()
      .input("asset_id", sql.Int, parsedAssetId)
      .input("borrowed_by", sql.VarChar(100), borrower_name.trim())
      .input("borrowed_date", sql.DateTime, parsedBorrowDate)
      .input("return_date", sql.DateTime, parsedExpectedReturnDate)
      .input("status", sql.VarChar(50), status || "Borrowed")
      .query(`
        INSERT INTO dbo.borrowed (
          asset_id,
          borrowed_by,
          borrowed_date,
          return_date,
          status,
          created_at,
          updated_at
        )
        VALUES (
          @asset_id,
          @borrowed_by,
          @borrowed_date,
          @return_date,
          @status,
          GETDATE(),
          GETDATE()
        )
      `);

    // Sync asset status
    await pool.request()
      .input("asset_id", sql.Int, parsedAssetId)
      .query(`
        UPDATE dbo.assets
        SET status = 'BORROWED'
        WHERE id = @asset_id
      `);

    res.status(201).json({
      message: "Borrow record created successfully",
    });
  } catch (error) {
    console.error("POST /api/borrow-records error:", error);
    res.status(500).json({
      message: "Failed to create borrow record",
      error: error.message,
    });
  }
});

// ===============================
// GET all borrow records
// ===============================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        b.id,
        b.asset_id,
        b.borrowed_by AS borrower_name,
        b.borrowed_date AS borrow_date,
        b.return_date AS expected_return_date,
        b.actual_return_date,
        b.returned_by,
        b.condition_upon_return,
        b.remarks,
        b.status,
        b.created_at,
        b.updated_at,
        a.hostname AS asset_hostname,
        a.serial_number AS asset_serial,
        a.department,
        a.asset_type,
        a.brand,
        a.custodian
      FROM dbo.borrowed b
      LEFT JOIN dbo.assets a
        ON b.asset_id = a.id
      ORDER BY b.id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("GET /api/borrow-records error:", error);
    res.status(500).json({
      message: "Failed to fetch borrow records",
      error: error.message,
    });
  }
});

// ===============================
// RETURN item
// ===============================
router.put("/:id/return", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      actual_return_date,
      returned_by,
      remarks,
      return_condition,
    } = req.body;

    const borrowId = Number(id);

    if (!Number.isInteger(borrowId)) {
      return res.status(400).json({
        message: "Invalid borrow record id.",
      });
    }

    const pool = await poolPromise;

    // Get borrow record
    const borrowResult = await pool.request()
      .input("id", sql.Int, borrowId)
      .query(`
        SELECT id, asset_id, status
        FROM dbo.borrowed
        WHERE id = @id
      `);

    if (borrowResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Borrow record not found.",
      });
    }

    const borrowRecord = borrowResult.recordset[0];
    const normalizedBorrowStatus = String(borrowRecord.status || "")
      .trim()
      .toUpperCase();

    if (normalizedBorrowStatus === "RETURNED") {
      return res.status(400).json({
        message: "This item is already returned.",
      });
    }

    const parsedActualReturnDate = actual_return_date
      ? new Date(actual_return_date)
      : new Date();

    if (isNaN(parsedActualReturnDate.getTime())) {
      return res.status(400).json({
        message: "Invalid actual return date.",
      });
    }

    const normalizedCondition = String(return_condition || "GOOD")
      .trim()
      .toUpperCase();

    let nextAssetStatus = "INACTIVE";

    if (normalizedCondition === "GOOD" || normalizedCondition === "EXCELLENT") {
      nextAssetStatus = "INACTIVE";
    } else if (normalizedCondition === "DAMAGED") {
      nextAssetStatus = "UNDER REPAIR";
    } else if (
      normalizedCondition === "DEFECTIVE" ||
      normalizedCondition === "NOT WORKING" ||
      normalizedCondition === "BROKEN" ||
      normalizedCondition === "BEYOND REPAIR"
    ) {
      nextAssetStatus = "NOT WORKING";
    }

    // Update borrowed record
    await pool.request()
      .input("id", sql.Int, borrowId)
      .input("actual_return_date", sql.DateTime, parsedActualReturnDate)
      .input(
        "returned_by",
        sql.VarChar(100),
        returned_by ? returned_by.trim() : null
      )
      .input("remarks", sql.VarChar(sql.MAX), remarks ? remarks.trim() : null)
      .input("condition_upon_return", sql.VarChar(100), normalizedCondition)
      .query(`
        UPDATE dbo.borrowed
        SET
          status = 'Returned',
          actual_return_date = @actual_return_date,
          returned_by = @returned_by,
          condition_upon_return = @condition_upon_return,
          remarks = @remarks,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Update asset status after return
    await pool.request()
      .input("asset_id", sql.Int, borrowRecord.asset_id)
      .input("status", sql.VarChar(50), nextAssetStatus)
      .query(`
        UPDATE dbo.assets
        SET status = @status
        WHERE id = @asset_id
      `);

    res.json({
      message: "Item returned successfully",
      assetStatus: nextAssetStatus,
    });
  } catch (error) {
    console.error("PUT /api/borrow-records/:id/return error:", error);
    res.status(500).json({
      message: "Failed to return item",
      error: error.message,
    });
  }
});

module.exports = router;