const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { poolPromise } = require("./db");

// Route imports
const assetsRoutes = require("./routes/assets");
const printersRoutes = require("./routes/printers");
const borrowRecordsRoutes = require("./routes/borrowRecords");
const accountsRoutes = require("./routes/accounts");
const formsRoutes = require("./routes/forms");
const scansRoutes = require("./routes/scans");
const dashboardRoutes = require("./routes/dashboard");
const documentsRoutes = require("./routes/documents");
const authRoutes = require("./routes/auth");
const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));

// ====================== ROUTES ======================
console.log("🔍 Checking route modules...");

const routes = [
   { path: "/api/auth", handler: authRoutes },
  { path: "/api/assets", handler: assetsRoutes },
  { path: "/api/printers", handler: printersRoutes },
  { path: "/api/borrow-records", handler: borrowRecordsRoutes },
  { path: "/api/items", handler: accountsRoutes },
  { path: "/api/forms", handler: formsRoutes },
  { path: "/api/scans", handler: scansRoutes },
  { path: "/api/dashboard", handler: dashboardRoutes },
  { path: "/api/documents", handler: documentsRoutes },
];

routes.forEach(({ path, handler }) => {
  if (typeof handler !== "function") {
    console.error(`❌ ERROR: ${path} handler is ${typeof handler}, expected function`);
    console.error(`   → Check file: ./routes/borrowRecords.js (currently exporting object)`);
  } else {
    console.log(`✅ ${path} → OK`);
    app.use(path, handler);
  }
});

// ====================== HEALTH & DEBUG ROUTES ======================
app.get("/api/health", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query("SELECT 1 AS ok");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "ok", db: "disconnected", error: err.message });
  }
});

app.get("/api/debug-db", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        DB_NAME() AS current_database,
        @@SERVERNAME AS server_name,
        SUSER_SNAME() AS login_name
    `);
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Debug DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Something went wrong!" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});