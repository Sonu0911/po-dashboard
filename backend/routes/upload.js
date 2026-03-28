const express = require('express');
const router = express.Router();
const fs = require('fs');
const pool = require('../db');
const pdfParse = require('pdf-parse');

router.post('/', async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file do!' });

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    console.log("PDF TEXT:", text.substring(0, 500));

    const poData = extractPOData(text);
    console.log("EXTRACTED:", poData);

    if (!poData.po_number) {
      return res.status(400).json({ error: 'PO number extract nahi hua — check console logs' });
    }

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

    // Size data extract aur insert karo
// Lines bhi insert karo
if (pdfData && poData.lines && poData.lines.length > 0) {
  for (const line of poData.lines) {
    await pool.query(
      'INSERT INTO po_lines (po_id, size, qty, ean, ppu) VALUES ($1, $2, $3, $4, $5)',
      [result.rows[0].id, line.size, line.qty, line.ean, line.ppu]
    );
  }
}

    fs.unlinkSync(req.file.path);
    res.json({ message: 'PO successfully import hua!', data: result.rows[0] });
    
  } catch (err) {
    console.log("FULL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

function extractPOData(text) {
  const get = (patterns) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  };

  let brand = 'Unknown';
  if (text.toLowerCase().includes('boohoo')) brand = 'boohoo';
  if (text.toLowerCase().includes('prettylittlething')) brand = 'PrettyLittleThing';
  if (text.toLowerCase().includes('coast')) brand = 'Coast';

  const currency = text.includes('USD') ? 'USD' : 'GBP';

  const totalNet = parseFloat(get([
    /TOTAL NET\s*([\d.]+)/,
    /TOTALNET\s*([\d.]+)/,
  ]) || '0');

  const totalUnits = parseInt(get([
    /TOTAL UNITS\s*(\d+)/,
    /TOTALUNITS\s*(\d+)/,
  ]) || '0');

  const fxRate = currency === 'USD' ? 0.79 : 1;

  return {
    po_number: get([
      /Purchase Order No\s*(\d+)/,
      /PurchaseOrderNo\s*(\d+)/,
    ]),
    brand,
    supplier: get([
      /Factory Name\s*(.+)/,
      /FactoryName\s*(.+)/,
    ]),
    buyer: get([
      /Buyer Name\s*(.+)/,
      /BuyerName\s*(.+)/,
    ]),
    currency,
    total_units: totalUnits,
    total_net: totalNet,
    gbp_value: parseFloat((totalNet * fxRate).toFixed(2)),
ppu: parseFloat(parseFloat(get([/Each([\d.]+)/]) || '0').toFixed(2)),
    ex_factory_date: get([/Ex Factory Date\s*(\d{2}\/\d{2}\/\d{4})/, /ExFactoryDate\s*(\d{2}\/\d{2}\/\d{4})/]),
    delivery_date: get([/Delivery Date\s*(\d{2}\/\d{2}\/\d{4})/, /DeliveryDate\s*(\d{2}\/\d{2}\/\d{4})/]),
    book_by_date: get([/Shipment Book with Forwarder By\s*(\d{2}\/\d{2}\/\d{4})/, /ShipmentBookwithForwarderBy\s*(\d{2}\/\d{2}\/\d{4})/]),
    order_placed_date: get([/Date Order Placed\s*(\d{2}\/\d{2}\/\d{4})/, /DateOrderPlaced\s*(\d{2}\/\d{2}\/\d{4})/]),
    freight: get([/Freight Method\s*(\w+)/, /FreightMethod\s*(\w+)/]),
    port: get([/Port of Loading\s*(\w+)/, /PortofLoading\s*(\w+)/]),
    incoterms: get([/Incoterms\s*(\w+)/]),
fabrication: text.includes('Faux Linen') ? 'Faux Linen' : text.includes('Linen Look') ? 'Linen Look' : text.includes('Mesh') ? 'Mesh' : 'N/A',
    category: text.includes('Dress') ? 'Dresses' : 'Tops',
  };
}module.exports = router;
