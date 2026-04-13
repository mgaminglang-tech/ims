const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// GET all items
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM items');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new item
router.post('/', async (req, res) => {
  try {
    const { item_name, quantity, status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('item_name', sql.VarChar, item_name)
      .input('quantity', sql.Int, quantity)
      .input('status', sql.VarChar, status)
      .query('INSERT INTO items (item_name, quantity, status) VALUES (@item_name, @quantity, @status)');
    res.json({ message: '✅ Item added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;