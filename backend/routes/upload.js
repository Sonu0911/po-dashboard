const express = require('express');
const router = express.Router();
const pdfParse = require('pdf-parse');
const fs = require('fs');
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file do!' });

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    // PDF se data extract karo
    const poData = extractPOData(text);

    // Database mein save karo
    const result = await pool.query(`
      INSERT INTO purchase_orders 
        (po_number, brand, supplier, buyer, currency, total_units, 
         total_net, gbp_value, ppu, ex_factory_date, delivery_date, 
         book_by_date, order_placed_date, freight, port, incoterms, fabrication, category)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (po_number) DO UPDATE SET
        total_units = EXCLUDED.total_units,
        gbp_value = EXCLUDED.gbp_value
      RETURNING *
    `, [
      poData.po_number, poData.brand, poData.supplier, poData.buyer,
      poData.currency, poData.total_units, poData.total_net, poData.gbp_value,
      poData.ppu, poData.ex_factory_date, poData.delivery_date,
      poData.book_by_date, poData.order_placed_date, poData.freight,
      poData.port, poData.incoterms, poData.fabrication, poData.category
    ]);

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ 
      message: 'PO successfully import hua!', 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function extractPOData(text) {
  const get = (pattern) => {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  };

  // Brand detect karo
  let brand = 'Unknown';
  if (text.includes('boohoo')) brand = 'boohoo';
  else if (text.includes('PrettyLittleThing')) brand = 'PrettyLittleThing';
  else if (text.includes('coast')) brand = 'Coast';

  // Currency detect karo
  const currency = text.includes('All Amounts in USD') ? 'USD' : 'GBP';

  const totalNet = parseFloat(get(/TOTAL NET\s+([\d.]+)/) || '0');
  const fxRate = currency === 'USD' ? 0.79 : 1;

  return {
    po_number: get(/Purchase Order No\s+(\d+)/),
    brand,
    supplier: get(/Factory Name\s+(.+)/),
    buyer: get(/Buyer Name\s+(.+)/),
    currency,
    total_units: parseInt(get(/TOTAL UNITS\s+(\d+)/) || '0'),
    total_net: totalNet,
    gbp_value: parseFloat((totalNet * fxRate).toFixed(2)),
    ppu: parseFloat(get(/Each\s+([\d.]+)/) || '0'),
    ex_factory_date: get(/Ex Factory Date\s+(\d{2}\/\d{2}\/\d{4})/),
    delivery_date: get(/Delivery Date\s+(\d{2}\/\d{2}\/\d{4})/),
    book_by_date: get(/Shipment Book with Forwarder By\s+(\d{2}\/\d{2}\/\d{4})/),
    order_placed_date: get(/Date Order Placed\s+(\d{2}\/\d{2}\/\d{4})/),
    freight: get(/Freight Method\s+(.+)/),
    port: get(/Port of Loading\s+(.+)/),
    incoterms: get(/Incoterms\s+(.+)/),
    fabrication: get(/Fabrication\s+(.+)/),
    category: text.includes('Dress') ? 'Dresses' : 'Tops',
  };
}

module.exports = router;