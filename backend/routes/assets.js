const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { sql, poolPromise } = require("../db");
const ExcelJS = require("exceljs");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const normalize = (value) => String(value || "").trim().toUpperCase();

const normalizeDepartment = (value) => {
  const dept = String(value || "").trim();
  if (!dept) return null;

  const upperDept = dept.toUpperCase();

  if (upperDept.startsWith("MAINTENANCE")) return "Maintenance";
  if (upperDept.startsWith("OPERATION")) return "Operation";
  if (upperDept.startsWith("IT")) return "IT";
  if (upperDept.startsWith("OPM")) return "OPM";

  return dept;
};

const isAssignedCustodian = (value) => {
  const custodian = String(value || "").trim().toUpperCase();
  return !["", "-", "UNASSIGNED", "N/A", "NONE", "NULL"].includes(custodian);
};

const parseExcelDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) return value;

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const cleanValue = (value) => {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v === "" ? null : v;
};

const normalizeStatus = (value) => String(value || "").trim().toUpperCase();

const NON_ASSIGNABLE_STATUSES = new Set([
  "INACTIVE",
  "NOT WORKING",
  "UNDER REPAIR",
  "FOR REDEPLOYMENT",
  "FOR RE-DEPLOYMENT",
  "RETIRED",
  "FOR DISPOSAL",
]);

const BORROWABLE_ALLOWED_STATUSES = new Set([
  "ACTIVE",
  "WORKING",
]);

const getNormalizedCustodianByStatus = (custodian, status) => {
  const normalizedStatus = normalizeStatus(status);

  if (NON_ASSIGNABLE_STATUSES.has(normalizedStatus)) {
    return null;
  }

  return cleanValue(custodian);
};

const ASSET_TYPE_PREFIX_MAP = {
  LAPTOP: "LAP",
  DESKTOP: "DTP",
  PRINTER: "PRN",
  MONITOR: "MON",
  UPS: "UPS",
  ROUTER: "RTR",
  SWITCH: "SWT",
  "ACCESS POINT": "AP",
  SCANNER: "SCN",
  PROJECTOR: "PRO",
  TABLET: "TAB",
  "IP PHONE": "IPP",
  "BIOMETRIC DEVICE": "BIO",
  CCTV: "CCTV",
  "EXTERNAL DRIVE": "EXT",
  OTHER: "OTH",
};

const PRINTER_MERGE_QUERY = `
  MERGE INTO dbo.Printers AS target
  USING (
    SELECT
      @record_id AS record_id,
      @hostname AS hostname,
      @serial_number AS serial_number,
      @brand AS brand,
      @department AS department
  ) AS src
  ON (
    (src.serial_number IS NOT NULL AND src.serial_number <> '' AND target.serial_number = src.serial_number)
    OR
    (
      (src.serial_number IS NULL OR src.serial_number = '')
      AND src.hostname IS NOT NULL AND src.hostname <> ''
      AND target.hostname = src.hostname
      AND ISNULL(target.brand, '') = ISNULL(src.brand, '')
      AND ISNULL(target.department, '') = ISNULL(src.department, '')
    )
  )
  WHEN MATCHED THEN
    UPDATE SET
      hostname      = @hostname,
      serial_number = @serial_number,
      condition     = @condition,
      custodian     = @custodian,
      department    = @department,
      warranty_end  = @warranty_end,
      brand         = @brand,
      ip_address    = @ip_address,
      status        = @status
  WHEN NOT MATCHED THEN
    INSERT (
      record_id, hostname, serial_number, condition, custodian, department,
      warranty_end, brand, ip_address, status
    )
    VALUES (
      @record_id, @hostname, @serial_number, @condition, @custodian, @department,
      @warranty_end, @brand, @ip_address, @status
    );
`;
const insertPrinter = async (pool, f) => {
  const finalStatus = normalizeStatus(f.status) || "WORKING";
  const finalCustodian = getNormalizedCustodianByStatus(f.custodian, finalStatus);
  const recordId = cleanValue(f.record_id) || await getNextRecordId(pool, "Printer");

  return pool.request()
    .input("record_id", sql.VarChar(50), recordId)
    .input("hostname", sql.VarChar(100), cleanValue(f.hostname))
    .input("serial_number", sql.VarChar(100), cleanValue(f.serial_number))
    .input("condition", sql.VarChar(50), cleanValue(f.condition))
    .input("custodian", sql.VarChar(100), finalCustodian)
    .input("department", sql.VarChar(100), cleanValue(f.department))
    .input("warranty_end", sql.DateTime, parseExcelDate(f.warranty_end))
    .input("brand", sql.VarChar(100), cleanValue(f.brand))
    .input("ip_address", sql.VarChar(100), cleanValue(f.ip_address || f.ip_mac_address))
    .input("status", sql.VarChar(50), finalStatus)
    .query(PRINTER_MERGE_QUERY);
};

async function getNextRecordId(pool, assetType) {
  const normalizedAssetType = normalize(assetType);
  const prefix = ASSET_TYPE_PREFIX_MAP[normalizedAssetType] || "OTH";
  const tableName = prefix === "PRN" ? "dbo.Printers" : "dbo.assets";

  const result = await pool
    .request()
    .input("prefix", `${prefix}-%`)
    .query(`
      SELECT record_id
      FROM ${tableName}
      WHERE record_id LIKE @prefix
      ORDER BY record_id DESC
    `);

  let nextNumber = 1;

  if (result.recordset.length > 0) {
    let maxNumber = 0;

    for (const row of result.recordset) {
      const recordId = String(row.record_id || "").trim();
      const match = recordId.match(/-(\\d+)$/);

      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    nextNumber = maxNumber + 1;
  }

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

// GET all assets + printers
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const assetsResult = await pool.request().query(`
      SELECT
        id,
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
        specifications,
        created_at,
        'Asset' AS source
      FROM dbo.assets
    `);

    const printersResult = await pool.request().query(`
      SELECT
        id,
        record_id,
        'PRINTER' AS asset_type,
        hostname,
        serial_number,
        condition,
        custodian,
        department,
        warranty_end,
        NULL AS business_unit,
        brand,
        ip_address AS ip_mac_address,
        NULL AS wlan_address,
        NULL AS os_version,
        NULL AS office_version,
        NULL AS office_key,
        NULL AS processor,
        NULL AS ram,
        NULL AS storage,
        NULL AS monitor_info,
        NULL AS ups_info,
        status,
        NULL AS specifications,
        created_at,
        'Printer' AS source
      FROM dbo.Printers
    `);

    const rows = [...assetsResult.recordset, ...printersResult.recordset]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    res.json(rows);
  } catch (error) {
    console.error("GET /api/assets ERROR:", error);
    res.status(500).json({ message: "Failed to fetch assets", error: error.message });
  }
});

// GET departments from both assets and printers
router.get("/departments", async (req, res) => {
  try {
    const pool = await poolPromise;

    const assetsDepartments = await pool.request().query(`
      SELECT DISTINCT LTRIM(RTRIM(department)) AS department
      FROM dbo.assets
      WHERE department IS NOT NULL
        AND LTRIM(RTRIM(department)) <> ''
    `);

    const printerDepartments = await pool.request().query(`
      SELECT DISTINCT LTRIM(RTRIM(department)) AS department
      FROM dbo.Printers
      WHERE department IS NOT NULL
        AND LTRIM(RTRIM(department)) <> ''
    `);

    const departments = [
      ...new Set(
        [
          ...assetsDepartments.recordset,
          ...printerDepartments.recordset,
        ]
          .map((row) => normalizeDepartment(row.department))
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    res.json(departments);
  } catch (error) {
    console.error("GET /api/assets/departments ERROR:", error);
    res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
});

// GET next record id
router.get("/next-record-id", async (req, res) => {
  try {
    const { asset_type } = req.query;
    const pool = await poolPromise;
    const recordId = await getNextRecordId(pool, asset_type);
    res.json({ record_id: recordId });
  } catch (error) {
    console.error("GET /api/assets/next-record-id ERROR:", error);
    res.status(500).json({ message: "Failed to generate record ID", error: error.message });
  }
});

// CREATE asset or printer
router.post("/", async (req, res) => {
  try {
    const {
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
      specifications,
    } = req.body;

    const pool = await poolPromise;
    const normalizedType = normalize(asset_type);
    const finalStatus = cleanValue(status) || "WORKING";
    const finalCustodian = getNormalizedCustodianByStatus(custodian, finalStatus);

   if (normalizedType === "PRINTER") {
  const recordId = await getNextRecordId(pool, "Printer");

  await pool.request()
    .input("record_id", sql.VarChar(50), recordId)
    .input("hostname", sql.VarChar(100), cleanValue(hostname))
    .input("serial_number", sql.VarChar(100), cleanValue(serial_number))
    .input("condition", sql.VarChar(50), cleanValue(condition))
    .input("custodian", sql.VarChar(100), finalCustodian)
    .input("department", sql.VarChar(100), cleanValue(department))
    .input("warranty_end", sql.DateTime, parseExcelDate(warranty_end))
    .input("brand", sql.VarChar(100), cleanValue(brand))
    .input("ip_address", sql.VarChar(100), cleanValue(ip_mac_address))
    .input("status", sql.VarChar(50), finalStatus)
    .query(`
      INSERT INTO dbo.Printers (
        record_id, hostname, serial_number, condition, custodian, department,
        warranty_end, brand, ip_address, status, created_at
      )
      VALUES (
        @record_id, @hostname, @serial_number, @condition, @custodian, @department,
        @warranty_end, @brand, @ip_address, @status, GETDATE()
      )
    `);

  return res.status(201).json({
    message: "Printer created successfully",
    record_id: recordId,
  });
}

    const recordId = await getNextRecordId(pool, asset_type);

    await pool.request()
      .input("record_id", sql.VarChar(50), recordId)
      .input("asset_type", sql.VarChar(50), cleanValue(asset_type))
      .input("hostname", sql.VarChar(100), cleanValue(hostname))
      .input("serial_number", sql.VarChar(100), cleanValue(serial_number))
      .input("condition", sql.VarChar(50), cleanValue(condition))
      .input("custodian", sql.VarChar(100), finalCustodian)
      .input("department", sql.VarChar(100), cleanValue(department))
      .input("warranty_end", sql.DateTime, parseExcelDate(warranty_end))
      .input("business_unit", sql.VarChar(100), cleanValue(business_unit))
      .input("brand", sql.VarChar(100), cleanValue(brand))
      .input("ip_mac_address", sql.VarChar(100), cleanValue(ip_mac_address))
      .input("wlan_address", sql.VarChar(100), cleanValue(wlan_address))
      .input("os_version", sql.VarChar(100), cleanValue(os_version))
      .input("office_version", sql.VarChar(100), cleanValue(office_version))
      .input("office_key", sql.VarChar(100), cleanValue(office_key))
      .input("processor", sql.VarChar(100), cleanValue(processor))
      .input("ram", sql.VarChar(100), cleanValue(ram))
      .input("storage", sql.VarChar(100), cleanValue(storage))
      .input("monitor_info", sql.VarChar(sql.MAX), cleanValue(monitor_info))
      .input("ups_info", sql.VarChar(sql.MAX), cleanValue(ups_info))
      .input("status", sql.VarChar(50), finalStatus)
      .input("specifications", sql.VarChar(sql.MAX), cleanValue(specifications))
      .query(`
        INSERT INTO dbo.assets (
          record_id, asset_type, hostname, serial_number, condition, custodian,
          department, warranty_end, business_unit, brand, ip_mac_address,
          wlan_address, os_version, office_version, office_key, processor,
          ram, storage, monitor_info, ups_info, status, specifications, created_at
        )
        VALUES (
          @record_id, @asset_type, @hostname, @serial_number, @condition, @custodian,
          @department, @warranty_end, @business_unit, @brand, @ip_mac_address,
          @wlan_address, @os_version, @office_version, @office_key, @processor,
          @ram, @storage, @monitor_info, @ups_info, @status, @specifications, GETDATE()
        )
      `);

    res.status(201).json({ message: "Asset created successfully", record_id: recordId });
  } catch (error) {
    console.error("POST /api/assets ERROR:", error);
    res.status(500).json({ message: "Failed to create asset", error: error.message });
  }
});

// UPDATE asset or printer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      source,
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
      specifications,
    } = req.body;

    const pool = await poolPromise;
    const normalizedSource = normalize(source);
    const normalizedType = normalize(asset_type);
    const finalStatus = cleanValue(status) || "WORKING";
    const finalCustodian = getNormalizedCustodianByStatus(custodian, finalStatus);

    if (normalizedSource === "PRINTER" || normalizedType === "PRINTER") {
      await pool.request()
        .input("id", sql.Int, parseInt(id, 10))
        .input("hostname", sql.VarChar(100), cleanValue(hostname))
        .input("serial_number", sql.VarChar(100), cleanValue(serial_number))
        .input("condition", sql.VarChar(50), cleanValue(condition))
        .input("custodian", sql.VarChar(100), finalCustodian)
        .input("department", sql.VarChar(100), cleanValue(department))
        .input("warranty_end", sql.DateTime, parseExcelDate(warranty_end))
        .input("brand", sql.VarChar(100), cleanValue(brand))
        .input("ip_address", sql.VarChar(100), cleanValue(ip_mac_address))
        .input("status", sql.VarChar(50), finalStatus)
        .query(`
          UPDATE dbo.Printers
          SET
            hostname = @hostname,
            serial_number = @serial_number,
            condition = @condition,
            custodian = @custodian,
            department = @department,
            warranty_end = @warranty_end,
            brand = @brand,
            ip_address = @ip_address,
            status = @status
          WHERE id = @id
        `);

      return res.json({ message: "Printer updated successfully" });
    }

    await pool.request()
      .input("id", sql.Int, parseInt(id, 10))
      .input("asset_type", sql.VarChar(50), cleanValue(asset_type))
      .input("hostname", sql.VarChar(100), cleanValue(hostname))
      .input("serial_number", sql.VarChar(100), cleanValue(serial_number))
      .input("condition", sql.VarChar(50), cleanValue(condition))
      .input("custodian", sql.VarChar(100), finalCustodian)
      .input("department", sql.VarChar(100), cleanValue(department))
      .input("warranty_end", sql.DateTime, parseExcelDate(warranty_end))
      .input("business_unit", sql.VarChar(100), cleanValue(business_unit))
      .input("brand", sql.VarChar(100), cleanValue(brand))
      .input("ip_mac_address", sql.VarChar(100), cleanValue(ip_mac_address))
      .input("wlan_address", sql.VarChar(100), cleanValue(wlan_address))
      .input("os_version", sql.VarChar(100), cleanValue(os_version))
      .input("office_version", sql.VarChar(100), cleanValue(office_version))
      .input("office_key", sql.VarChar(100), cleanValue(office_key))
      .input("processor", sql.VarChar(100), cleanValue(processor))
      .input("ram", sql.VarChar(100), cleanValue(ram))
      .input("storage", sql.VarChar(100), cleanValue(storage))
      .input("monitor_info", sql.VarChar(sql.MAX), cleanValue(monitor_info))
      .input("ups_info", sql.VarChar(sql.MAX), cleanValue(ups_info))
      .input("status", sql.VarChar(50), finalStatus)
      .input("specifications", sql.VarChar(sql.MAX), cleanValue(specifications))
      .query(`
        UPDATE dbo.assets
        SET
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
          status = @status,
          specifications = @specifications
        WHERE id = @id
      `);

    res.json({ message: "Asset updated successfully" });
  } catch (error) {
    console.error("PUT /api/assets/:id ERROR:", error);
    res.status(500).json({ message: "Failed to update asset", error: error.message });
  }
});

// DELETE asset or printer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const source = normalize(req.query.source || req.body?.source);

    const pool = await poolPromise;

    if (source === "PRINTER") {
      await pool.request()
        .input("id", sql.Int, parseInt(id, 10))
        .query(`DELETE FROM dbo.Printers WHERE id = @id`);

      return res.json({ message: "Printer deleted successfully" });
    }

    await pool.request()
      .input("id", sql.Int, parseInt(id, 10))
      .query(`DELETE FROM dbo.assets WHERE id = @id`);

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/assets/:id ERROR:", error);
    res.status(500).json({ message: "Failed to delete asset", error: error.message });
  }
});

// GET borrowable items
router.get("/borrowable", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        a.id,
        a.record_id,
        a.asset_type,
        a.hostname,
        a.serial_number,
        a.department,
        a.status,
        a.custodian
      FROM dbo.assets a
      WHERE (
        a.custodian IS NULL
        OR LTRIM(RTRIM(a.custodian)) = ''
        OR UPPER(LTRIM(RTRIM(a.custodian))) IN ('-', 'UNASSIGNED', 'N/A', 'NONE', 'NULL')
      )
      AND UPPER(LTRIM(RTRIM(ISNULL(a.status, '')))) IN ('ACTIVE', 'WORKING')
      ORDER BY a.asset_type, a.hostname
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("GET /api/assets/borrowable ERROR:", error);
    res.status(500).json({ message: "Failed to fetch borrowable assets", error: error.message });
  }
});

// GET export
const getExportFileName = (reportType) => {
  const date = new Date().toISOString().split("T")[0];

  const reportNames = {
    executive_summary: "Executive_Summary_Report",
    full_inventory: "Full_Inventory_Report",
    troubleshooting: "Troubleshooting_Report",
    non_working: "Non_Working_Assets_Report",
  };

  return `${reportNames[reportType] || "IMS_Asset_Export"}_${date}.xlsx`;
};

router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const pool = await poolPromise;
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames.find(
      (s) => s.toUpperCase().trim() !== "README"
    );

    if (!sheetName) {
      return res.status(400).json({ message: "No valid sheet found in file." });
    }

    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      raw: true,
    });

    if (!rawRows.length) {
      return res.status(400).json({ message: "Sheet has no rows." });
    }

    const headerMap = {
      asset_type: ["asset_type", "asset type", "type"],
      hostname: ["hostname", "host name", "computer name"],
      serial_number: ["serial_number", "serial number", "serial"],
      condition: ["condition"],
      custodian: ["custodian", "assigned to", "employee", "owner"],
      department: ["department", "dept"],
      warranty_end: ["warranty_end", "warranty end", "warranty"],
      business_unit: ["business_unit", "business unit"],
      brand: ["brand"],
      ip_mac_address: ["ip_mac_address", "ip/mac address", "ip address", "ip_mac"],
      wlan_address: ["wlan_address", "wlan address"],
      os_version: ["os_version", "os version"],
      office_version: ["office_version", "office version"],
      office_key: ["office_key", "office key"],
      processor: ["processor"],
      ram: ["ram"],
      storage: ["storage"],
      monitor_info: ["monitor_info", "monitor info"],
      ups_info: ["ups_info", "ups info"],
      status: ["status"],
      specifications: ["specifications", "specs"],
    };

    const normalizeHeader = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    let headerRowIndex = -1;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i].map(normalizeHeader);

      const score = [
        row.includes("asset type") || row.includes("asset_type") || row.includes("type"),
        row.includes("hostname"),
        row.includes("serial number") || row.includes("serial_number") || row.includes("serial"),
        row.includes("department"),
        row.includes("status"),
      ].filter(Boolean).length;

      if (score >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({
        message: "Could not find a valid header row in the file.",
      });
    }

    const headers = rawRows[headerRowIndex].map(normalizeHeader);

    const getColIndex = (possibleNames) =>
      headers.findIndex((h) => possibleNames.includes(h));

    const colIndex = {};
    for (const key of Object.keys(headerMap)) {
      colIndex[key] = getColIndex(headerMap[key]);
    }

    const dataRows = rawRows
      .slice(headerRowIndex + 1)
      .filter((row) => row.some((cell) => String(cell || "").trim() !== ""));

    if (!dataRows.length) {
      return res.status(400).json({
        message: "No data rows found below the header.",
      });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      const item = {
        asset_type: colIndex.asset_type >= 0 ? row[colIndex.asset_type] : "OTHER",
        hostname: colIndex.hostname >= 0 ? row[colIndex.hostname] : null,
        serial_number: colIndex.serial_number >= 0 ? row[colIndex.serial_number] : null,
        condition: colIndex.condition >= 0 ? row[colIndex.condition] : null,
        custodian: colIndex.custodian >= 0 ? row[colIndex.custodian] : null,
        department: colIndex.department >= 0 ? row[colIndex.department] : null,
        warranty_end: colIndex.warranty_end >= 0 ? row[colIndex.warranty_end] : null,
        business_unit: colIndex.business_unit >= 0 ? row[colIndex.business_unit] : null,
        brand: colIndex.brand >= 0 ? row[colIndex.brand] : null,
        ip_mac_address: colIndex.ip_mac_address >= 0 ? row[colIndex.ip_mac_address] : null,
        wlan_address: colIndex.wlan_address >= 0 ? row[colIndex.wlan_address] : null,
        os_version: colIndex.os_version >= 0 ? row[colIndex.os_version] : null,
        office_version: colIndex.office_version >= 0 ? row[colIndex.office_version] : null,
        office_key: colIndex.office_key >= 0 ? row[colIndex.office_key] : null,
        processor: colIndex.processor >= 0 ? row[colIndex.processor] : null,
        ram: colIndex.ram >= 0 ? row[colIndex.ram] : null,
        storage: colIndex.storage >= 0 ? row[colIndex.storage] : null,
        monitor_info: colIndex.monitor_info >= 0 ? row[colIndex.monitor_info] : null,
        ups_info: colIndex.ups_info >= 0 ? row[colIndex.ups_info] : null,
        status: colIndex.status >= 0 ? row[colIndex.status] : "WORKING",
        specifications: colIndex.specifications >= 0 ? row[colIndex.specifications] : null,
      };

      const normalizedType = normalize(item.asset_type);

      const hasUsefulData =
        cleanValue(item.hostname) ||
        cleanValue(item.serial_number) ||
        cleanValue(item.brand) ||
        cleanValue(item.department);

      if (!hasUsefulData) {
        skipped += 1;
        continue;
      }

      try {
        const finalStatus = normalizeStatus(item.status) || "WORKING";
        const finalCustodian = getNormalizedCustodianByStatus(item.custodian, finalStatus);

        if (normalizedType === "PRINTER") {
          await insertPrinter(pool, {
            ...item,
            status: finalStatus,
            custodian: finalCustodian,
          });

          inserted += 1;
          continue;
        }

        const cleanedSerial = cleanValue(item.serial_number);
        const cleanedHostname = cleanValue(item.hostname);
        const cleanedAssetType = cleanValue(item.asset_type) || "Other";
        const cleanedDepartment = cleanValue(item.department);
        const cleanedBrand = cleanValue(item.brand);

        let existingAsset = null;

        if (cleanedSerial) {
          const serialMatch = await pool.request()
            .input("serial_number", sql.VarChar(100), cleanedSerial)
            .query(`
              SELECT TOP 1 id, record_id
              FROM dbo.assets
              WHERE serial_number = @serial_number
              ORDER BY id DESC
            `);

          if (serialMatch.recordset.length > 0) {
            existingAsset = serialMatch.recordset[0];
          }
        }

        if (!existingAsset && cleanedHostname) {
          const fallbackMatch = await pool.request()
            .input("hostname", sql.VarChar(100), cleanedHostname)
            .input("asset_type", sql.VarChar(50), cleanedAssetType)
            .input("department", sql.VarChar(100), cleanedDepartment)
            .input("brand", sql.VarChar(100), cleanedBrand)
            .query(`
              SELECT TOP 1 id, record_id
              FROM dbo.assets
              WHERE hostname = @hostname
                AND ISNULL(asset_type, '') = ISNULL(@asset_type, '')
                AND ISNULL(department, '') = ISNULL(@department, '')
                AND ISNULL(brand, '') = ISNULL(@brand, '')
              ORDER BY id DESC
            `);

          if (fallbackMatch.recordset.length > 0) {
            existingAsset = fallbackMatch.recordset[0];
          }
        }

        if (existingAsset) {
          await pool.request()
            .input("id", sql.Int, existingAsset.id)
            .input("asset_type", sql.VarChar(50), cleanedAssetType)
            .input("hostname", sql.VarChar(100), cleanedHostname)
            .input("serial_number", sql.VarChar(100), cleanedSerial)
            .input("condition", sql.VarChar(50), cleanValue(item.condition))
            .input("custodian", sql.VarChar(100), finalCustodian)
            .input("department", sql.VarChar(100), cleanedDepartment)
            .input("warranty_end", sql.DateTime, parseExcelDate(item.warranty_end))
            .input("business_unit", sql.VarChar(100), cleanValue(item.business_unit))
            .input("brand", sql.VarChar(100), cleanedBrand)
            .input("ip_mac_address", sql.VarChar(100), cleanValue(item.ip_mac_address))
            .input("wlan_address", sql.VarChar(100), cleanValue(item.wlan_address))
            .input("os_version", sql.VarChar(100), cleanValue(item.os_version))
            .input("office_version", sql.VarChar(100), cleanValue(item.office_version))
            .input("office_key", sql.VarChar(100), cleanValue(item.office_key))
            .input("processor", sql.VarChar(100), cleanValue(item.processor))
            .input("ram", sql.VarChar(100), cleanValue(item.ram))
            .input("storage", sql.VarChar(100), cleanValue(item.storage))
            .input("monitor_info", sql.VarChar(sql.MAX), cleanValue(item.monitor_info))
            .input("ups_info", sql.VarChar(sql.MAX), cleanValue(item.ups_info))
            .input("status", sql.VarChar(50), finalStatus)
            .input("specifications", sql.VarChar(sql.MAX), cleanValue(item.specifications))
            .query(`
              UPDATE dbo.assets
              SET
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
                status = @status,
                specifications = @specifications
              WHERE id = @id
            `);

          updated += 1;
        } else {
          const recordId = await getNextRecordId(pool, item.asset_type || "Other");

          await pool.request()
            .input("record_id", sql.VarChar(50), recordId)
            .input("asset_type", sql.VarChar(50), cleanedAssetType)
            .input("hostname", sql.VarChar(100), cleanedHostname)
            .input("serial_number", sql.VarChar(100), cleanedSerial)
            .input("condition", sql.VarChar(50), cleanValue(item.condition))
            .input("custodian", sql.VarChar(100), finalCustodian)
            .input("department", sql.VarChar(100), cleanedDepartment)
            .input("warranty_end", sql.DateTime, parseExcelDate(item.warranty_end))
            .input("business_unit", sql.VarChar(100), cleanValue(item.business_unit))
            .input("brand", sql.VarChar(100), cleanedBrand)
            .input("ip_mac_address", sql.VarChar(100), cleanValue(item.ip_mac_address))
            .input("wlan_address", sql.VarChar(100), cleanValue(item.wlan_address))
            .input("os_version", sql.VarChar(100), cleanValue(item.os_version))
            .input("office_version", sql.VarChar(100), cleanValue(item.office_version))
            .input("office_key", sql.VarChar(100), cleanValue(item.office_key))
            .input("processor", sql.VarChar(100), cleanValue(item.processor))
            .input("ram", sql.VarChar(100), cleanValue(item.ram))
            .input("storage", sql.VarChar(100), cleanValue(item.storage))
            .input("monitor_info", sql.VarChar(sql.MAX), cleanValue(item.monitor_info))
            .input("ups_info", sql.VarChar(sql.MAX), cleanValue(item.ups_info))
            .input("status", sql.VarChar(50), finalStatus)
            .input("specifications", sql.VarChar(sql.MAX), cleanValue(item.specifications))
            .query(`
              INSERT INTO dbo.assets (
                record_id, asset_type, hostname, serial_number, condition, custodian,
                department, warranty_end, business_unit, brand, ip_mac_address,
                wlan_address, os_version, office_version, office_key, processor,
                ram, storage, monitor_info, ups_info, status, specifications, created_at
              )
              VALUES (
                @record_id, @asset_type, @hostname, @serial_number, @condition, @custodian,
                @department, @warranty_end, @business_unit, @brand, @ip_mac_address,
                @wlan_address, @os_version, @office_version, @office_key, @processor,
                @ram, @storage, @monitor_info, @ups_info, @status, @specifications, GETDATE()
              )
            `);

          inserted += 1;
        }
      } catch (rowError) {
        skipped += 1;
        errors.push(`Row ${headerRowIndex + i + 2}: ${rowError.message}`);
      }
    }

    return res.json({
      message: "Import completed",
      inserted,
      updated,
      skipped,
      headerRow: headerRowIndex + 1,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("POST /api/assets/import ERROR:", error);
    return res.status(500).json({
      message: "Import failed",
      error: error.message,
    });
  }
});

router.get("/export", async (req, res) => {
  try {
    const { reportType, assetType, status, department, limit } = req.query;
    const pool = await poolPromise;

    const assetsResult = await pool.request().query(`
      SELECT
        id,
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
        specifications,
        'Asset' AS source
      FROM dbo.assets
    `);

    const printersResult = await pool.request().query(`
      SELECT
        id,
        record_id,
        'PRINTER' AS asset_type,
        hostname,
        serial_number,
        condition,
        custodian,
        department,
        warranty_end,
        NULL AS business_unit,
        brand,
        ip_address AS ip_mac_address,
        NULL AS wlan_address,
        NULL AS os_version,
        NULL AS office_version,
        NULL AS office_key,
        NULL AS processor,
        NULL AS ram,
        NULL AS storage,
        NULL AS monitor_info,
        NULL AS ups_info,
        status,
        NULL AS specifications,
        'Printer' AS source
      FROM dbo.Printers
    `);

    let rows = [...assetsResult.recordset, ...printersResult.recordset];

    const normalize = (value) => String(value || "").trim().toUpperCase();

    const matchesStatus = (rowStatus, selectedStatus) => {
      const current = normalize(rowStatus);

      if (!selectedStatus || selectedStatus === "all") return true;
      if (selectedStatus === "working") return current === "WORKING";
      if (selectedStatus === "not_working") return current === "NOT WORKING";
      if (selectedStatus === "inactive") return current === "INACTIVE";
      if (selectedStatus === "redeployment") {
        return current === "FOR RE-DEPLOYMENT" || current === "FOR REDEPLOYMENT";
      }
      if (selectedStatus === "disposal") {
        return current === "FOR DISPOSAL" || current === "RETIRED";
      }

      return true;
    };

    rows = rows.filter((item) => {
      const itemAssetType = normalize(item.asset_type);
      const itemDepartment = String(item.department || "").trim();

      const assetTypeMatch =
        !assetType ||
        assetType === "all" ||
        itemAssetType === normalize(assetType);

      const statusMatch = matchesStatus(item.status, status);

      const departmentMatch =
        !department ||
        department === "all" ||
        itemDepartment === department;

      return assetTypeMatch && statusMatch && departmentMatch;
    });

    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      rows = rows.slice(0, parsedLimit);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("IMS Assets Export");

    const allHeaders = [
      "ID",
      "Record ID",
      "Asset Type",
      "Hostname",
      "Serial Number",
      "Condition",
      "Custodian",
      "Department",
      "Warranty End",
      "Business Unit",
      "Brand",
      "IP / MAC Address",
      "WLAN Address",
      "OS Version",
      "Office Version",
      "Office Key",
      "Processor",
      "RAM",
      "Storage",
      "Monitor Info",
      "UPS Info",
      "Status",
      "Specifications",
      "Source",
    ];

    const reportColumns = {
      executive_summary: [
        "ID",
        "Record ID",
        "Asset Type",
        "Hostname",
        "Serial Number",
        "Custodian",
        "Department",
        "Business Unit",
        "Brand",
        "Status",
        "Source",
      ],
      full_inventory: allHeaders,
      troubleshooting: [
        "ID",
        "Asset Type",
        "Hostname",
        "Serial Number",
        "Brand",
        "IP / MAC Address",
        "WLAN Address",
        "OS Version",
        "Office Version",
        "Processor",
        "RAM",
        "Storage",
        "Status",
        "Source",
      ],
      non_working: [
        "ID",
        "Asset Type",
        "Hostname",
        "Custodian",
        "Department",
        "Brand",
        "Status",
        "Specifications",
        "Source",
      ],
    };

    const reportTitles = {
      executive_summary: "Executive Summary Report",
      full_inventory: "Full Inventory Report",
      troubleshooting: "Troubleshooting Report",
      non_working: "Non-Working Assets Report",
    };

    const selectedHeaders = reportColumns[reportType] || allHeaders;
    const selectedReportTitle =
      reportTitles[reportType] || "Asset Export Report";

    const lastColumnLetter = String.fromCharCode(64 + selectedHeaders.length);

    worksheet.mergeCells(`A1:${lastColumnLetter}1`);
    worksheet.getCell("A1").value = "IT Inventory Management System";
    worksheet.getCell("A1").font = {
      bold: true,
      size: 18,
      color: { argb: "FFFFFFFF" },
      name: "Calibri",
    };
    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2563EB" },
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells(`A2:${lastColumnLetter}2`);
    worksheet.getCell("A2").value = selectedReportTitle;
    worksheet.getCell("A2").font = {
      bold: true,
      size: 13,
      color: { argb: "0F172A" },
      name: "Calibri",
    };
    worksheet.getCell("A2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell("A2").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E0F2FE" },
    };
    worksheet.getRow(2).height = 22;

    worksheet.mergeCells(`A3:${lastColumnLetter}3`);
    worksheet.getCell("A3").value =
      `Generated: ${new Date().toLocaleString()}   |   Total Records: ${rows.length}`;
    worksheet.getCell("A3").font = {
      italic: true,
      size: 10,
      color: { argb: "475569" },
      name: "Calibri",
    };
    worksheet.getCell("A3").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell("A3").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF7ED" },
    };
    worksheet.getRow(3).height = 20;

    worksheet.addRow([]);
    worksheet.addRow(selectedHeaders);

    const headerRow = worksheet.getRow(5);
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
        name: "Calibri",
        size: 11,
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2563EB" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "D6E4F0" } },
        left: { style: "thin", color: { argb: "D6E4F0" } },
        bottom: { style: "thin", color: { argb: "D6E4F0" } },
        right: { style: "thin", color: { argb: "D6E4F0" } },
      };
    });

    const rowBuilder = {
      "ID": (item) => item.id ?? "",
      "Record ID": (item) => item.record_id ?? "",
      "Asset Type": (item) => item.asset_type ?? "",
      "Hostname": (item) => item.hostname ?? "",
      "Serial Number": (item) => item.serial_number ?? "",
      "Condition": (item) => item.condition ?? "",
      "Custodian": (item) => item.custodian ?? "",
      "Department": (item) => item.department ?? "",
      "Warranty End": (item) =>
        item.warranty_end ? new Date(item.warranty_end).toLocaleDateString() : "",
      "Business Unit": (item) => item.business_unit ?? "",
      "Brand": (item) => item.brand ?? "",
      "IP / MAC Address": (item) => item.ip_mac_address ?? "",
      "WLAN Address": (item) => item.wlan_address ?? "",
      "OS Version": (item) => item.os_version ?? "",
      "Office Version": (item) => item.office_version ?? "",
      "Office Key": (item) => item.office_key ?? "",
      "Processor": (item) => item.processor ?? "",
      "RAM": (item) => item.ram ?? "",
      "Storage": (item) => item.storage ?? "",
      "Monitor Info": (item) => item.monitor_info ?? "",
      "UPS Info": (item) => item.ups_info ?? "",
      "Status": (item) => item.status ?? "",
      "Specifications": (item) => item.specifications ?? "",
      "Source": (item) => item.source ?? "",
    };

    rows.forEach((item) => {
      const rowValues = selectedHeaders.map((header) => {
        const getter = rowBuilder[header];
        if (!getter) return "";
        return getter(item);
      });

      const row = worksheet.addRow(rowValues);

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } },
        };
        cell.font = {
          color: { argb: "0F172A" },
          name: "Calibri",
          size: 10,
        };
      });

      if (row.number % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F8FAFC" },
          };
        });
      }
    });

    selectedHeaders.forEach((header, index) => {
      const widths = {
        "ID": 8,
        "Record ID": 15,
        "Asset Type": 15,
        "Hostname": 18,
        "Serial Number": 20,
        "Condition": 14,
        "Custodian": 20,
        "Department": 18,
        "Warranty End": 15,
        "Business Unit": 18,
        "Brand": 16,
        "IP / MAC Address": 18,
        "WLAN Address": 18,
        "OS Version": 16,
        "Office Version": 16,
        "Office Key": 18,
        "Processor": 18,
        "RAM": 12,
        "Storage": 14,
        "Monitor Info": 20,
        "UPS Info": 20,
        "Status": 16,
        "Specifications": 24,
        "Source": 12,
      };

      worksheet.getColumn(index + 1).width = widths[header] || 18;
    });

    worksheet.views = [{ state: "frozen", ySplit: 5 }];
    worksheet.autoFilter = {
      from: "A5",
      to: `${lastColumnLetter}5`,
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getExportFileName(reportType)}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("GET /api/assets/export ERROR:", error);
    res.status(500).json({
      message: "Failed to export assets",
      error: error.message,
    });
  }
});

router.get("/types", async (req, res) => {
  try {
    const types = [
      "Laptop",
      "Desktop",
      "Printer",
      "Monitor",
      "UPS",
      "Router",
      "Switch",
      "Access Point",
      "Scanner",
      "Projector",
      "Tablet",
      "IP Phone",
      "Biometric Device",
      "CCTV",
      "External Drive",
      "Other",
    ];

    res.json(types);
  } catch (error) {
    console.error("GET /api/assets/types ERROR:", error);
    res.status(500).json({
      message: "Failed to load asset types",
      error: error.message,
    });
  }
});

module.exports = router;