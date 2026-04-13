const express = require("express");
const cors = require("cors");
require("dotenv").config();

const assetsRoutes = require("./routes/assets");
const borrowRecordsRoutes = require("./routes/borrowRecords");
const accountsRoutes = require("./routes/accounts");
const formsRoutes = require("./routes/forms");
const scansRoutes = require("./routes/scans");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/assets", assetsRoutes);
app.use("/api/borrow-records", borrowRecordsRoutes);
app.use("/api/items", accountsRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/scans", scansRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});