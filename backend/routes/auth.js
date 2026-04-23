const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("password", sql.NVarChar, password)
      .query(`
        SELECT TOP 1 id, username, full_name, role, status
        FROM dbo.users
        WHERE username = @username
          AND password = @password
          AND status = 'ACTIVE'
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = result.recordset[0];

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

module.exports = router;

router.post("/forgot-password/question", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .query(`
        SELECT TOP 1 username, reset_question
        FROM dbo.users
        WHERE username = @username AND status = 'ACTIVE'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.recordset[0];

    if (!user.reset_question) {
      return res.status(400).json({
        success: false,
        message: "No reset question set for this account",
      });
    }

    return res.json({
      success: true,
      question: user.reset_question,
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password/question ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load reset question",
      error: error.message,
    });
  }
});

router.post("/forgot-password/reset", async (req, res) => {
  try {
    const { username, answer, newPassword } = req.body;

    if (!username || !answer || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Username, answer, and new password are required",
      });
    }

    const pool = await poolPromise;

    const checkResult = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("answer", sql.NVarChar, answer)
      .query(`
        SELECT TOP 1 id
        FROM dbo.users
        WHERE username = @username
          AND reset_answer = @answer
          AND status = 'ACTIVE'
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Incorrect reset answer",
      });
    }

    await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("newPassword", sql.NVarChar, newPassword)
      .query(`
        UPDATE dbo.users
        SET password = @newPassword
        WHERE username = @username
      `);

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password/reset ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
});