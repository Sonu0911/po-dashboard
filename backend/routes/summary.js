const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    // Live FX rate fetch karo
    let fxRate = 0.79; // fallback
    try {
      const fx = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      fxRate = fx.data.rates.GBP;
    } catch (e) {
      console.log('FX API error, using fallback rate');
    }

    const total = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_units) as total_units,
        SUM(gbp_value) as total_gbp_value
      FROM purchase_orders
    `);

    const byBrand = await pool.query(`
      SELECT brand, 
        COUNT(*) as orders,
        SUM(total_units) as units,
        SUM(gbp_value) as gbp_value
      FROM purchase_orders
      GROUP BY brand
    `);

    const bySupplier = await pool.query(`
      SELECT supplier,
        SUM(total_units) as units,
        SUM(gbp_value) as gbp_value
      FROM purchase_orders
      GROUP BY supplier
    `);

    res.json({
      summary: total.rows[0],
      byBrand: byBrand.rows,
      bySupplier: bySupplier.rows,
      fxRate,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;