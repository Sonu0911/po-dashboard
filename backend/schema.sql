CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  brand VARCHAR(100),
  supplier VARCHAR(200),
  buyer VARCHAR(100),
  currency VARCHAR(10),
  total_units INTEGER,
  total_net DECIMAL(10,2),
  gbp_value DECIMAL(10,2),
  ppu DECIMAL(10,2),
  ex_factory_date DATE,
  delivery_date DATE,
  book_by_date DATE,
  order_placed_date DATE,
  freight VARCHAR(50),
  port VARCHAR(20),
  incoterms VARCHAR(20),
  fabrication VARCHAR(100),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_lines (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id),
  size VARCHAR(10),
  qty INTEGER,
  ean VARCHAR(20),
  ppu DECIMAL(10,2)
);