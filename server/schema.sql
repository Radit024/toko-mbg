-- ================================================
-- Toko MBG — Neon PostgreSQL Schema
-- ================================================

-- Toko / Store profiles
CREATE TABLE IF NOT EXISTS stores (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid     TEXT NOT NULL UNIQUE,
    store_name    TEXT DEFAULT '',
    store_address TEXT DEFAULT '',
    custom_alias  TEXT UNIQUE,
    phone_number  TEXT DEFAULT '',
    photo_url     TEXT DEFAULT '',
    owner_name    TEXT DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Alias toko untuk akses cepat karyawan
CREATE TABLE IF NOT EXISTS store_aliases (
    alias      TEXT PRIMARY KEY,
    owner_uid  TEXT NOT NULL,
    store_name TEXT DEFAULT ''
);

-- Inventory / Stok Barang
CREATE TABLE IF NOT EXISTS inventory (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id      TEXT NOT NULL,
    name          TEXT NOT NULL,
    stock         NUMERIC DEFAULT 0,
    unit          TEXT DEFAULT 'pcs',
    avg_cost      NUMERIC DEFAULT 0,
    last_price    NUMERIC DEFAULT 0,
    sell_price    NUMERIC DEFAULT 0,
    min_stock     NUMERIC DEFAULT 5,
    last_supplier TEXT DEFAULT '',
    category      TEXT DEFAULT 'Umum',
    barcode       TEXT DEFAULT '',
    image_url     TEXT DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_store   ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(store_id, barcode);

-- Orders / Nota Penjualan
CREATE TABLE IF NOT EXISTS orders (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id       TEXT NOT NULL,
    type           TEXT DEFAULT 'sale',
    date           TEXT,
    customer_name  TEXT DEFAULT '-',
    notes          TEXT DEFAULT '',
    payment_method TEXT DEFAULT 'Cash',
    payment_status TEXT DEFAULT 'Lunas',
    cashier_name   TEXT DEFAULT '',
    revenue        NUMERIC DEFAULT 0,
    cogs           NUMERIC DEFAULT 0,
    gross_profit   NUMERIC DEFAULT 0,
    expense_total  NUMERIC DEFAULT 0,
    net_profit     NUMERIC DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_store   ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(store_id, created_at DESC);

-- Item di dalam order
CREATE TABLE IF NOT EXISTS order_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id    UUID,
    name       TEXT NOT NULL,
    qty        NUMERIC NOT NULL,
    unit       TEXT DEFAULT 'pcs',
    price      NUMERIC DEFAULT 0,
    subtotal   NUMERIC DEFAULT 0,
    cost_basis NUMERIC DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Biaya per-order
CREATE TABLE IF NOT EXISTS order_expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    amount      NUMERIC DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_expenses_order ON order_expenses(order_id);

-- Restock / Pembelian Stok
CREATE TABLE IF NOT EXISTS restock_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id       TEXT NOT NULL,
    item_name      TEXT NOT NULL,
    item_id        UUID,
    qty            NUMERIC NOT NULL,
    unit           TEXT DEFAULT 'pcs',
    price_per_unit NUMERIC DEFAULT 0,
    total_cost     NUMERIC DEFAULT 0,
    supplier       TEXT DEFAULT '',
    input_date     TEXT,
    barcode        TEXT DEFAULT '',
    category       TEXT DEFAULT 'Umum',
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_restock_store   ON restock_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_restock_created ON restock_logs(store_id, created_at DESC);

-- Biaya Umum
CREATE TABLE IF NOT EXISTS general_expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id    TEXT NOT NULL,
    description TEXT DEFAULT '',
    amount      NUMERIC DEFAULT 0,
    date        TEXT,
    category    TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gen_expenses_store ON general_expenses(store_id);

-- Penarikan Uang
CREATE TABLE IF NOT EXISTS withdrawals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id     TEXT NOT NULL,
    amount       NUMERIC DEFAULT 0,
    note         TEXT DEFAULT '',
    date         TEXT,
    withdrawn_by TEXT DEFAULT '',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_store ON withdrawals(store_id);
