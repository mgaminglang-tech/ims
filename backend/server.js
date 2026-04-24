const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("🚀 Starting IMS server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DB_SERVER:", process.env.DB_SERVER);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3001",
    "https://ims.mervinautomation.it.com",
    "https://mervinautomation.it.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("IMS backend is running");
});

app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Load DB only after app starts
const { poolPromise } = require("./db");

const assetsRoutes = require("./routes/assets");
const printersRoutes = require("./routes/printers");
const borrowRecordsRoutes = require("./routes/borrowRecords");
const accountsRoutes = require("./routes/accounts");
const formsRoutes = require("./routes/forms");
const scansRoutes = require("./routes/scans");
const dashboardRoutes = require("./routes/dashboard");
const documentsRoutes = require("./routes/documents");
const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/printers", printersRoutes);
app.use("/api/borrow-records", borrowRecordsRoutes);
app.use("/api/items", accountsRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/scans", scansRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentsRoutes);

app.get("/api/health", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query("SELECT 1 AS ok");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("Health check error:", err.message);
    res.status(503).json({
      status: "error",
      db: "disconnected",
      error: err.message,
    });
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
    console.error("Debug DB error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  res.status(500).json({ error: err.message || "Something went wrong!" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});