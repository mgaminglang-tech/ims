const express = require("express");
const multer = require("multer");
const sql = require("mssql");
const archiver = require("archiver");
const { poolPromise } = require("../db");

const router = express.Router();

// Add file size limit and error handling for multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Multer error-handling middleware for multiple files
const handleUpload = (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Max size is 50MB." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ message: `Unknown error: ${err.message}` });
    }
    next();
  });
};

// GET all documents
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const debug = await pool.request().query(`
      SELECT
        DB_NAME() AS current_database,
        OBJECT_ID('dbo.documents') AS documents_object_id
    `);

    if (!debug.recordset[0].documents_object_id) {
      return res.status(500).json({
        message: "Table 'dbo.documents' does not exist in the current database.",
        debug: debug.recordset[0],
      });
    }

    const result = await pool.request().query(`
      SELECT id, document_name, file_name, file_type, file_size, created_at
      FROM dbo.documents
      ORDER BY id DESC
    `);

    res.json({
      debug: debug.recordset[0],
      data: result.recordset,
    });
  } catch (error) {
    console.error("GET documents error:", error);
    res.status(500).json({
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
});

// POST - Upload multiple documents
router.post("/", handleUpload, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded. Make sure the form field name is 'files'.",
      });
    }

    const pool = await poolPromise;
    const customDocumentName = req.body.document_name?.trim();
    const uploadedResults = [];

    for (const file of req.files) {
      const documentName = customDocumentName || file.originalname;

      console.log("Uploading document:", {
        documentName,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        bufferLength: file.buffer?.length ?? 0,
        isPdf: file.mimetype === "application/pdf",
      });

      if (!file.buffer || file.buffer.length === 0) {
        throw new Error(`File buffer is empty for ${file.originalname}`);
      }

      await pool
        .request()
        .input("document_name", sql.NVarChar(255), documentName)
        .input("file_name", sql.NVarChar(255), file.originalname)
        .input("file_type", sql.NVarChar(255), file.mimetype || "application/octet-stream")
        .input("file_size", sql.BigInt, file.size)
        .input("file_data", sql.VarBinary(sql.MAX), file.buffer)
        .query(`
          INSERT INTO dbo.documents (
            document_name,
            file_name,
            file_type,
            file_size,
            file_data,
            created_at
          )
          VALUES (
            @document_name,
            @file_name,
            @file_type,
            @file_size,
            @file_data,
            GETDATE()
          )
        `);

      uploadedResults.push({
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
      });
    }

    res.status(201).json({
      message: `${req.files.length} document(s) uploaded successfully`,
      uploaded: uploadedResults,
    });
  } catch (error) {
    console.error("POST documents error FULL:", error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
      sqlError: error.number ?? null,
      code: error.code ?? null,
    });
  }
});

// DOWNLOAD / PREVIEW a document
router.get("/:id/download", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid document ID." });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT file_name, file_type, file_data
        FROM dbo.documents
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Document not found." });
    }

    const doc = result.recordset[0];
    const safeFileName = encodeURIComponent(doc.file_name || `document-${id}`);

    res.setHeader("Content-Type", doc.file_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${safeFileName}`);
    res.send(doc.file_data);
  } catch (error) {
    console.error("DOWNLOAD document error:", error);
    res.status(500).json({
      message: "Failed to download document",
      error: error.message,
    });
  }
});

// DOWNLOAD MULTIPLE DOCUMENTS AS ZIP
router.post("/download-multiple", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No document IDs provided." });
    }

    const validIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    if (validIds.length === 0) {
      return res.status(400).json({ message: "Invalid document IDs." });
    }

    const pool = await poolPromise;
    const placeholders = validIds.map((_, i) => `@id${i}`).join(", ");
    const request = pool.request();

    validIds.forEach((id, i) => {
      request.input(`id${i}`, sql.Int, id);
    });

    const result = await request.query(`
      SELECT id, file_name, file_type, file_data
      FROM dbo.documents
      WHERE id IN (${placeholders})
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No documents found." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="documents.zip"');

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);

    result.recordset.forEach((doc) => {
      archive.append(doc.file_data, {
        name: doc.file_name || `document-${doc.id}`,
      });
    });

    await archive.finalize();
  } catch (error) {
    console.error("MULTIPLE DOWNLOAD error:", error);
    res.status(500).json({
      message: "Failed to download multiple documents",
      error: error.message,
    });
  }
});

// DELETE a document
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid document ID." });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM dbo.documents WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("DELETE documents error:", error);
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;