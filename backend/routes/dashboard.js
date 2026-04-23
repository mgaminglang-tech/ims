const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");

const normalize = (value) => String(value || "").trim().toUpperCase();

const isValidCustodian = (value) => {
  const custodian = String(value || "").trim().toUpperCase();
  return !!custodian && !["-", "UNASSIGNED", "N/A", "NONE", "NULL"].includes(custodian);
};

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const assetsResult = await pool.request().query(`
      SELECT
        asset_type,
        custodian,
        department,
        warranty_end,
        status
      FROM dbo.assets
    `);

    const printersResult = await pool.request().query(`
      SELECT
        'PRINTER' AS asset_type,
        custodian,
        department,
        warranty_end,
        status
      FROM dbo.Printers
    `);

    let borrowed = 0;
    let overdueReturn = 0;

    try {
      const borrowResult = await pool.request().query(`
        SELECT
          due_date,
          return_date,
          status
        FROM dbo.borrowed
      `);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const row of borrowResult.recordset) {
        const status = normalize(row.status || "");
        const isReturned =
          row.return_date !== null ||
          ["RETURNED", "COMPLETED", "CLOSED"].includes(status);

        if (!isReturned) {
          borrowed += 1;

          if (row.due_date) {
            const dueDate = new Date(row.due_date);
            dueDate.setHours(0, 0, 0, 0);

            if (!isNaN(dueDate.getTime()) && dueDate < today) {
              overdueReturn += 1;
            }
          }
        }
      }
    } catch (borrowError) {
      console.warn("Borrow records query skipped:", borrowError.message);
    }

    const rows = [...assetsResult.recordset, ...printersResult.recordset];

    const byType = {};
    const byStatus = {};
    const byDepartment = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    let totalAssets = rows.length;
    let inWarranty = 0;
    let expiringSoon = 0;
    let warrantyExpired = 0;
    let assigned = 0;
    let unassigned = 0;

    for (const row of rows) {
      const assetType = normalize(row.asset_type || "OTHER");
      const status = normalize(row.status || "UNKNOWN");
      const department = String(row.department || "").trim() || "Unassigned";

      byType[assetType] = (byType[assetType] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
      byDepartment[department] = (byDepartment[department] || 0) + 1;

      // Only WORKING assets should be counted as assigned/unassigned
      if (status === "WORKING") {
        if (isValidCustodian(row.custodian)) {
          assigned += 1;
        } else {
          unassigned += 1;
        }
      }

      if (row.warranty_end) {
        const warrantyDate = new Date(row.warranty_end);

        if (!isNaN(warrantyDate.getTime())) {
          warrantyDate.setHours(0, 0, 0, 0);

          if (warrantyDate < today) {
            warrantyExpired += 1;
          } else if (warrantyDate <= next30Days) {
            expiringSoon += 1;
          } else {
            inWarranty += 1;
          }
        }
      }
    }

    const working = byStatus["WORKING"] || 0;
    const notWorking = byStatus["NOT WORKING"] || 0;
    const underRepair = byStatus["UNDER REPAIR"] || 0;
    const forRedeployment =
      (byStatus["FOR RE-DEPLOYMENT"] || 0) +
      (byStatus["FOR REDEPLOYMENT"] || 0);
    const retired =
      (byStatus["FOR DISPOSAL"] || 0) +
      (byStatus["RETIRED"] || 0);

    res.json({
      totalAssets,
      byType,
      byStatus,
      byDepartment,
      summary: {
        totalAssets,
        assigned,
        unassigned,
        working,
        notWorking,
        underRepair,
        forRedeployment,
        retired,
        borrowed,
        overdueReturn,
        inWarranty,
        expiringSoon,
        warrantyExpired,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard ERROR:", error);
    res.status(500).json({
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
});

module.exports = router;