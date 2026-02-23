import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { verifyAuth } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', verifyAuth);

// ════════════════════════════════════════════════════════════════
//  MAPPER HELPERS  — snake_case (DB) → camelCase (Frontend)
// ════════════════════════════════════════════════════════════════

const mapInventory = (r) => ({
    id: r.id, name: r.name, stock: Number(r.stock), unit: r.unit,
    avgCost: Number(r.avg_cost), lastPrice: Number(r.last_price),
    sellPrice: Number(r.sell_price), minStock: Number(r.min_stock),
    lastSupplier: r.last_supplier, category: r.category,
    barcode: r.barcode, imageUrl: r.image_url,
});

const mapOrder = (r) => ({
    id: r.id, type: r.type, date: r.date,
    customerName: r.customer_name, notes: r.notes,
    paymentMethod: r.payment_method, paymentStatus: r.payment_status,
    cashierName: r.cashier_name,
    items: r.items || [], expenses: r.expenses || [],
    financials: {
        revenue: Number(r.revenue), cogs: Number(r.cogs),
        grossProfit: Number(r.gross_profit),
        expenseTotal: Number(r.expense_total),
        netProfit: Number(r.net_profit),
    },
    createdAt: r.created_at,
});

const mapRestock = (r) => ({
    id: r.id, itemName: r.item_name, itemId: r.item_id,
    qty: Number(r.qty), unit: r.unit,
    pricePerUnit: Number(r.price_per_unit), totalCost: Number(r.total_cost),
    supplier: r.supplier, inputDate: r.input_date,
    barcode: r.barcode, category: r.category, createdAt: r.created_at,
});

const mapExpense = (r) => ({
    id: r.id, description: r.description, name: r.description,
    amount: Number(r.amount), date: r.date,
    category: r.category, createdAt: r.created_at,
});

const mapWithdrawal = (r) => ({
    id: r.id, amount: Number(r.amount), note: r.note,
    date: r.date, withdrawnBy: r.withdrawn_by, createdAt: r.created_at,
});

const mapProfile = (r) => r ? ({
    storeName: r.store_name, storeAddress: r.store_address,
    customAlias: r.custom_alias, phoneNumber: r.phone_number,
    photoURL: r.photo_url, ownerName: r.owner_name,
}) : null;

// ════════════════════════════════════════════════════════════════
//  GET /api/data  — Ambil semua data toko sekaligus
// ════════════════════════════════════════════════════════════════

const ORDERS_QUERY = `
    SELECT o.*,
        (SELECT COALESCE(json_agg(json_build_object(
            'itemId', oi.item_id, 'name', oi.name, 'qty', oi.qty,
            'unit', oi.unit, 'price', oi.price, 'subtotal', oi.subtotal,
            'costBasis', oi.cost_basis
        ) ORDER BY oi.id), '[]'::json) FROM order_items oi WHERE oi.order_id = o.id) AS items,
        (SELECT COALESCE(json_agg(json_build_object(
            'id', oe.id, 'description', oe.description, 'amount', oe.amount
        ) ORDER BY oe.id), '[]'::json) FROM order_expenses oe WHERE oe.order_id = o.id) AS expenses
    FROM orders o WHERE o.store_id = $1
    ORDER BY o.created_at DESC LIMIT 500
`;

app.get('/api/data', async (req, res) => {
    try {
        const sid = req.storeId;
        const [inv, ord, rest, exp, wdr, prof] = await Promise.all([
            pool.query('SELECT * FROM inventory WHERE store_id = $1 ORDER BY name', [sid]),
            pool.query(ORDERS_QUERY, [sid]),
            pool.query('SELECT * FROM restock_logs WHERE store_id = $1 ORDER BY created_at DESC LIMIT 100', [sid]),
            pool.query('SELECT * FROM general_expenses WHERE store_id = $1 ORDER BY date DESC LIMIT 50', [sid]),
            pool.query('SELECT * FROM withdrawals WHERE store_id = $1 ORDER BY date DESC LIMIT 50', [sid]),
            pool.query('SELECT * FROM stores WHERE owner_uid = $1', [sid]),
        ]);
        res.json({
            inventory: inv.rows.map(mapInventory),
            orders: ord.rows.map(mapOrder),
            restockLogs: rest.rows.map(mapRestock),
            generalExpenses: exp.rows.map(mapExpense),
            withdrawals: wdr.rows.map(mapWithdrawal),
            storeProfile: mapProfile(prof.rows[0]),
        });
    } catch (err) {
        console.error('GET /api/data error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════
//  STORE PROFILE & ALIASES
// ════════════════════════════════════════════════════════════════

app.put('/api/store/profile', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sid = req.storeId;
        const b = req.body;

        const existing = await client.query('SELECT * FROM stores WHERE owner_uid = $1', [sid]);
        if (existing.rows.length === 0) {
            await client.query(`
                INSERT INTO stores (owner_uid, store_name, store_address, custom_alias, phone_number, photo_url, owner_name)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
            `, [sid, b.storeName || '', b.storeAddress || '', b.customAlias || null, b.phoneNumber || '', b.photoURL || '', b.ownerName || '']);
        } else {
            const c = existing.rows[0];
            await client.query(`
                UPDATE stores SET
                    store_name=$2, store_address=$3, custom_alias=$4,
                    phone_number=$5, photo_url=$6, owner_name=$7, updated_at=NOW()
                WHERE owner_uid=$1
            `, [
                sid,
                b.storeName !== undefined ? b.storeName : c.store_name,
                b.storeAddress !== undefined ? b.storeAddress : c.store_address,
                b.customAlias !== undefined ? (b.customAlias || null) : c.custom_alias,
                b.phoneNumber !== undefined ? b.phoneNumber : c.phone_number,
                b.photoURL !== undefined ? b.photoURL : c.photo_url,
                b.ownerName !== undefined ? b.ownerName : c.owner_name,
            ]);
        }

        // Handle alias
        if (b.customAlias) {
            const aliasId = b.customAlias.toLowerCase().replace(/\s+/g, '-');
            const taken = await client.query(
                'SELECT owner_uid FROM store_aliases WHERE alias=$1 AND owner_uid!=$2', [aliasId, sid]
            );
            if (taken.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'ID Custom sudah dipakai toko lain' });
            }
            await client.query('DELETE FROM store_aliases WHERE owner_uid=$1', [sid]);
            await client.query(
                'INSERT INTO store_aliases (alias, owner_uid, store_name) VALUES ($1,$2,$3)',
                [aliasId, sid, b.storeName || '']
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /api/store/profile error:', err);
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

app.get('/api/store/resolve/:alias', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT owner_uid, store_name FROM store_aliases WHERE alias=$1',
            [req.params.alias.toLowerCase()]
        );
        if (result.rows.length > 0) {
            res.json({ ownerUid: result.rows[0].owner_uid, storeName: result.rows[0].store_name });
        } else {
            res.json({ ownerUid: req.params.alias, storeName: null });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user/profile', async (req, res) => {
    try {
        const uid = req.user.uid;
        const { phoneNumber, photoURL, ownerName } = req.body;
        await pool.query(`
            INSERT INTO stores (owner_uid, phone_number, photo_url, owner_name)
            VALUES ($1,$2,$3,$4)
            ON CONFLICT (owner_uid) DO UPDATE SET
                phone_number=$2, photo_url=$3, owner_name=$4, updated_at=NOW()
        `, [uid, phoneNumber || '', photoURL || '', ownerName || '']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════
//  INVENTORY
// ════════════════════════════════════════════════════════════════

app.post('/api/inventory', async (req, res) => {
    try {
        const b = req.body;
        const result = await pool.query(`
            INSERT INTO inventory (store_id, name, stock, unit, avg_cost, last_price, sell_price, min_stock, last_supplier, category, barcode)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id
        `, [
            req.storeId, b.name, b.stock || 0, b.unit || 'pcs',
            b.avgCost || 0, b.lastPrice || b.avgCost || 0,
            b.sellPrice || 0, b.minStock || 5, b.lastSupplier || '',
            b.category || 'Umum', b.barcode || ''
        ]);
        res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const b = req.body;
        await pool.query(`
            UPDATE inventory SET
                name=$3, stock=$4, unit=$5, avg_cost=$6, last_price=$7,
                sell_price=$8, min_stock=$9, last_supplier=$10, category=$11,
                barcode=$12, updated_at=NOW()
            WHERE id=$1 AND store_id=$2
        `, [
            req.params.id, req.storeId,
            b.name, b.stock ?? 0, b.unit || 'pcs',
            b.avgCost ?? 0, b.lastPrice ?? b.avgCost ?? 0,
            b.sellPrice ?? 0, b.minStock ?? 5,
            b.lastSupplier ?? '', b.category || 'Umum', b.barcode || ''
        ]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/inventory/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM inventory WHERE id=$1 AND store_id=$2', [req.params.id, req.storeId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════
//  RESTOCK / PURCHASE
// ════════════════════════════════════════════════════════════════

app.post('/api/restock', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sid = req.storeId;
        const b = req.body;
        const itemName = b.itemName;
        const qty = parseFloat(b.quantity);
        const price = parseFloat(b.pricePerUnit);
        const sellingPrice = parseFloat(b.sellPrice) || 0;

        let itemId = null;
        let existingItem = null;

        // Cari item yang sudah ada
        if (b.existingId) {
            const r = await client.query('SELECT * FROM inventory WHERE id=$1 AND store_id=$2', [b.existingId, sid]);
            existingItem = r.rows[0];
        } else if (b.barcode) {
            const r = await client.query('SELECT * FROM inventory WHERE barcode=$1 AND store_id=$2 AND barcode!=\'\'', [b.barcode, sid]);
            existingItem = r.rows[0];
        }
        if (!existingItem) {
            const r = await client.query('SELECT * FROM inventory WHERE LOWER(name)=LOWER($1) AND store_id=$2', [itemName, sid]);
            existingItem = r.rows[0];
        }

        if (existingItem) {
            itemId = existingItem.id;
            const curStock = Number(existingItem.stock);
            const curAvg = Number(existingItem.avg_cost);
            const newStock = curStock + qty;
            const newAvgCost = newStock > 0
                ? ((curStock * curAvg) + (qty * price)) / newStock
                : price;
            await client.query(`
                UPDATE inventory SET
                    stock=$3, avg_cost=$4, last_price=$5,
                    sell_price = CASE WHEN $6 > 0 THEN $6 ELSE sell_price END,
                    last_supplier=$7, unit=COALESCE(NULLIF($8,''), unit),
                    category=COALESCE(NULLIF($9,''), category),
                    barcode=COALESCE(NULLIF($10,''), barcode), updated_at=NOW()
                WHERE id=$1 AND store_id=$2
            `, [
                itemId, sid, newStock, newAvgCost, price,
                sellingPrice, b.supplier || '', b.unit || '', b.category || '', b.barcode || ''
            ]);
        } else {
            const r = await client.query(`
                INSERT INTO inventory (store_id, name, stock, unit, avg_cost, last_price, sell_price, min_stock, last_supplier, category, barcode)
                VALUES ($1,$2,$3,$4,$5,$6,$7,5,$8,$9,$10) RETURNING id
            `, [sid, itemName, qty, b.unit || 'pcs', price, price, sellingPrice, b.supplier || '', b.category || 'Umum', b.barcode || '']);
            itemId = r.rows[0].id;
        }

        await client.query(`
            INSERT INTO restock_logs (store_id, item_name, item_id, qty, unit, price_per_unit, total_cost, supplier, input_date, barcode, category)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `, [sid, itemName, itemId, qty, b.unit || 'pcs', price, qty * price, b.supplier || '', b.date || new Date().toISOString(), b.barcode || '', b.category || 'Umum']);

        await client.query('COMMIT');
        res.json({ success: true, itemId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /api/restock error:', err);
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

app.put('/api/restock/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sid = req.storeId;
        const logId = req.params.id;
        const b = req.body;

        // Ambil log asli
        const logRes = await client.query('SELECT * FROM restock_logs WHERE id=$1 AND store_id=$2', [logId, sid]);
        if (logRes.rows.length === 0) throw new Error('Log tidak ditemukan');
        const origLog = logRes.rows[0];

        const newQty = parseFloat(b.qty);
        const newPrice = parseFloat(b.pricePerUnit);

        // Update inventory
        if (origLog.item_id) {
            const invRes = await client.query('SELECT * FROM inventory WHERE id=$1 AND store_id=$2', [origLog.item_id, sid]);
            if (invRes.rows.length > 0) {
                const cur = invRes.rows[0];
                const curStock = Number(cur.stock);
                const curAvg = Number(cur.avg_cost);
                const origQty = Number(origLog.qty);
                const origPrice = Number(origLog.price_per_unit);

                const qtyDiff = newQty - origQty;
                const newStock = curStock + qtyDiff;
                const valueWithoutOld = (curStock * curAvg) - (origQty * origPrice);
                const newAvgCost = newStock > 0 ? (valueWithoutOld + (newQty * newPrice)) / newStock : curAvg;

                await client.query(`
                    UPDATE inventory SET
                        name=$3, barcode=$4, category=$5, last_supplier=$6,
                        stock=$7, avg_cost=$8, unit=$9,
                        sell_price = CASE WHEN $10 > 0 THEN $10 ELSE sell_price END,
                        updated_at=NOW()
                    WHERE id=$1 AND store_id=$2
                `, [
                    origLog.item_id, sid,
                    b.itemName, b.barcode || '', b.category || 'Umum', b.supplier || '',
                    newStock, newAvgCost, b.unit || 'pcs', parseFloat(b.sellPrice) || 0
                ]);
            }
        }

        // Update restock log
        await client.query(`
            UPDATE restock_logs SET
                item_name=$3, qty=$4, unit=$5, price_per_unit=$6,
                total_cost=$7, supplier=$8, input_date=$9, barcode=$10, category=$11
            WHERE id=$1 AND store_id=$2
        `, [
            logId, sid, b.itemName, newQty, b.unit || 'pcs', newPrice,
            newQty * newPrice, b.supplier || '', b.inputDate || '', b.barcode || '', b.category || 'Umum'
        ]);

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

app.delete('/api/restock/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sid = req.storeId;
        const logRes = await client.query('SELECT * FROM restock_logs WHERE id=$1 AND store_id=$2', [req.params.id, sid]);
        if (logRes.rows.length === 0) throw new Error('Log tidak ditemukan');
        const log = logRes.rows[0];

        if (log.item_id) {
            const invRes = await client.query('SELECT stock FROM inventory WHERE id=$1 AND store_id=$2', [log.item_id, sid]);
            if (invRes.rows.length > 0) {
                const newStock = Number(invRes.rows[0].stock) - Number(log.qty);
                await client.query('UPDATE inventory SET stock=$3, updated_at=NOW() WHERE id=$1 AND store_id=$2', [log.item_id, sid, newStock]);
            }
        }
        await client.query('DELETE FROM restock_logs WHERE id=$1 AND store_id=$2', [req.params.id, sid]);

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

// ════════════════════════════════════════════════════════════════
//  ORDERS / PENJUALAN
// ════════════════════════════════════════════════════════════════

app.post('/api/orders', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sid = req.storeId;
        const b = req.body;
        const cartItems = b.items || [];

        let totalRevenue = 0;
        let totalCOGS = 0;

        for (const item of cartItems) {
            const invRes = await client.query('SELECT * FROM inventory WHERE id=$1 AND store_id=$2', [item.itemId, sid]);
            if (invRes.rows.length === 0) throw new Error(`Barang ${item.itemName || item.name} tidak ditemukan!`);
            const inv = invRes.rows[0];
            const newStock = Number(inv.stock) - item.quantity;
            if (newStock < 0) throw new Error(`Stok ${inv.name} tidak cukup!`);
            await client.query('UPDATE inventory SET stock=$3, updated_at=NOW() WHERE id=$1 AND store_id=$2', [item.itemId, sid, newStock]);
            totalRevenue += item.subtotal;
            totalCOGS += Number(inv.avg_cost) * item.quantity;
        }

        const grossProfit = totalRevenue - totalCOGS;
        const cashierName = b.cashierName || req.user.name || req.user.email;

        const orderRes = await client.query(`
            INSERT INTO orders (store_id, type, date, customer_name, notes, payment_method, payment_status, cashier_name, revenue, cogs, gross_profit, expense_total, net_profit)
            VALUES ($1,'sale',$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11) RETURNING id
        `, [sid, b.date, b.customerName || '-', b.notes || '', b.paymentMethod || 'Cash', b.paymentStatus || 'Lunas', cashierName, totalRevenue, totalCOGS, grossProfit, grossProfit]);

        const orderId = orderRes.rows[0].id;
        for (const item of cartItems) {
            const invRes = await client.query('SELECT avg_cost FROM inventory WHERE id=$1', [item.itemId]);
            const costBasis = invRes.rows.length > 0 ? Number(invRes.rows[0].avg_cost) : 0;
            await client.query(`
                INSERT INTO order_items (order_id, item_id, name, qty, unit, price, subtotal, cost_basis)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `, [orderId, item.itemId, item.itemName || item.name, item.quantity, item.unit || 'pcs', item.price, item.subtotal, costBasis]);
        }

        await client.query('COMMIT');
        res.json({ success: true, orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /api/orders error:', err);
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

app.put('/api/orders/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sid = req.storeId;
        const orderId = req.params.id;
        const { items: newItems, metadata } = req.body;

        // 1. Kembalikan stok lama
        const oldItemsRes = await client.query('SELECT * FROM order_items WHERE order_id=$1', [orderId]);
        for (const old of oldItemsRes.rows) {
            if (old.item_id) {
                await client.query('UPDATE inventory SET stock=stock+$1, updated_at=NOW() WHERE id=$2 AND store_id=$3',
                    [old.qty, old.item_id, sid]);
            }
        }

        // 2. Kurangi stok baru dan hitung totals
        let newRevenue = 0, newCOGS = 0;
        for (const item of newItems) {
            const invRes = await client.query('SELECT * FROM inventory WHERE id=$1 AND store_id=$2', [item.itemId, sid]);
            if (invRes.rows.length === 0) throw new Error(`Item tidak ditemukan`);
            const inv = invRes.rows[0];
            if (Number(inv.stock) < item.qty) throw new Error(`Stok ${item.name} kurang!`);
            await client.query('UPDATE inventory SET stock=stock-$1, updated_at=NOW() WHERE id=$2 AND store_id=$3',
                [item.qty, item.itemId, sid]);
            newRevenue += item.subtotal;
            newCOGS += Number(inv.avg_cost) * item.qty;
        }

        const newGrossProfit = newRevenue - newCOGS;
        const orderRes = await client.query('SELECT expense_total FROM orders WHERE id=$1', [orderId]);
        const expTotal = Number(orderRes.rows[0]?.expense_total || 0);

        // 3. Update order
        await client.query(`
            UPDATE orders SET date=$3, customer_name=$4, notes=$5, payment_method=$6, payment_status=$7,
                revenue=$8, cogs=$9, gross_profit=$10, net_profit=$11
            WHERE id=$1 AND store_id=$2
        `, [orderId, sid, metadata.date, metadata.customerName, metadata.notes,
            metadata.paymentMethod, metadata.paymentStatus,
            newRevenue, newCOGS, newGrossProfit, newGrossProfit - expTotal]);

        // 4. Replace items
        await client.query('DELETE FROM order_items WHERE order_id=$1', [orderId]);
        for (const item of newItems) {
            await client.query(`
                INSERT INTO order_items (order_id, item_id, name, qty, unit, price, subtotal, cost_basis)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `, [orderId, item.itemId, item.name, item.qty, item.unit || 'pcs', item.price, item.subtotal, item.costBasis || 0]);
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

app.put('/api/orders/:id/expenses', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orderId = req.params.id;
        const expensesList = req.body.expenses || [];

        await client.query('DELETE FROM order_expenses WHERE order_id=$1', [orderId]);
        const totalExp = expensesList.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        for (const exp of expensesList) {
            await client.query(
                'INSERT INTO order_expenses (order_id, description, amount) VALUES ($1,$2,$3)',
                [orderId, exp.description || '', parseFloat(exp.amount) || 0]
            );
        }

        const orderRes = await client.query('SELECT gross_profit FROM orders WHERE id=$1', [orderId]);
        const grossProfit = Number(orderRes.rows[0]?.gross_profit || 0);

        await client.query(
            'UPDATE orders SET expense_total=$2, net_profit=$3 WHERE id=$1',
            [orderId, totalExp, grossProfit - totalExp]
        );

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

app.put('/api/orders/:id/pay', async (req, res) => {
    try {
        await pool.query(
            "UPDATE orders SET payment_status='Lunas' WHERE id=$1 AND store_id=$2",
            [req.params.id, req.storeId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sid = req.storeId;
        const orderId = req.params.id;

        // Kembalikan stok
        const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id=$1', [orderId]);
        for (const item of itemsRes.rows) {
            if (item.item_id) {
                await client.query('UPDATE inventory SET stock=stock+$1, updated_at=NOW() WHERE id=$2 AND store_id=$3',
                    [item.qty, item.item_id, sid]);
            }
        }
        await client.query('DELETE FROM orders WHERE id=$1 AND store_id=$2', [orderId, sid]);

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

// ════════════════════════════════════════════════════════════════
//  GENERAL EXPENSES
// ════════════════════════════════════════════════════════════════

app.post('/api/expenses', async (req, res) => {
    try {
        const b = req.body;
        const result = await pool.query(`
            INSERT INTO general_expenses (store_id, description, amount, date, category)
            VALUES ($1,$2,$3,$4,$5) RETURNING id
        `, [req.storeId, b.description || b.name || '', parseFloat(b.amount) || 0, b.date || new Date().toISOString(), b.category || '']);
        res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════
//  WITHDRAWALS
// ════════════════════════════════════════════════════════════════

app.post('/api/withdrawals', async (req, res) => {
    try {
        const b = req.body;
        const result = await pool.query(`
            INSERT INTO withdrawals (store_id, amount, note, date, withdrawn_by)
            VALUES ($1,$2,$3,$4,$5) RETURNING id
        `, [req.storeId, parseFloat(b.amount) || 0, b.note || '', b.date || new Date().toISOString(), b.withdrawnBy || req.user.name || req.user.email || '']);
        res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/withdrawals/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM withdrawals WHERE id=$1 AND store_id=$2', [req.params.id, req.storeId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════
//  STATIC FILES (Production)
// ════════════════════════════════════════════════════════════════

import { fileURLToPath } from 'url';
import path from 'path';

if (process.env.NODE_ENV === 'production') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// ════════════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER — ensures all errors return JSON
// ════════════════════════════════════════════════════════════════

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ════════════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});

