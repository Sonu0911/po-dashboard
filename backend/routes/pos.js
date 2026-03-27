const express = require('express');
const router = express.Router();
const pool = require('../db');

// Saare POs lao
router.get('/', async (req, res) => {
  try {
    const { brand, supplier, from_date, to_date } = req.query;
    
    let query = 'SELECT * FROM purchase_orders WHERE 1=1';
    let params = [];
    let i = 1;

    if (brand) {
      query += ` AND brand = $${i++}`;
      params.push(brand);
    }
    if (supplier) {
      query += ` AND supplier = $${i++}`;
      params.push(supplier);
    }
    if (from_date) {
      query += ` AND delivery_date >= $${i++}`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND delivery_date <= $${i++}`;
      params.push(to_date);
    }

    query += ' ORDER BY delivery_date ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ek PO ki lines lao
router.get('/:id/lines', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM po_lines WHERE po_number = $1',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;