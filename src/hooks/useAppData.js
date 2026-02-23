import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, updateProfile, updatePassword } from "firebase/auth";
import { auth } from '../config/firebase';
import { api } from '../config/api';

export function useAppData({ toast, confirm } = {}) {
    // Fallbacks to native browser dialogs if no notification system provided
    const _toast = toast || ((msg) => alert(msg));
    const _confirm = confirm || ((title, msg) => Promise.resolve(window.confirm(msg || title)));

    // --- AUTH & STORE ---
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [activeStoreId, setActiveStoreId] = useState(null);
    const [storeProfile, setStoreProfile] = useState(null);

    // --- MODAL FLAGS ---
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    // --- DATA ---
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [generalExpenses, setGeneralExpenses] = useState([]);
    const [restockLogs, setRestockLogs] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);

    // --- LOAD HTML5-QRCODE SCRIPT ---
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    // --- AUTH LISTENER ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const savedStoreId = localStorage.getItem('connected_store_id');
                setActiveStoreId(savedStoreId || currentUser.uid);
            } else {
                setActiveStoreId(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- FETCH ALL DATA FROM API ---
    const fetchAll = useCallback(async () => {
        if (!user || !activeStoreId) {
            setInventory([]); setOrders([]); setGeneralExpenses([]);
            setRestockLogs([]); setWithdrawals([]); setStoreProfile(null);
            return;
        }
        try {
            const data = await api.get('/data', activeStoreId);
            setInventory(data.inventory || []);
            setOrders(data.orders || []);
            setGeneralExpenses(data.generalExpenses || []);
            setRestockLogs(data.restockLogs || []);
            setWithdrawals(data.withdrawals || []);
            setStoreProfile(data.storeProfile || null);
        } catch (err) {
            console.error('Fetch data error:', err);
        }
    }, [user, activeStoreId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // --- AUTH HANDLERS ---
    const handleLogout = async (setActiveTab) => {
        const ok = await _confirm('Keluar Aplikasi?', 'Yakin ingin keluar dari sesi ini?', { type: 'confirm', confirmLabel: 'Ya, Keluar' });
        if (!ok) return;
        try {
            await signOut(auth);
            localStorage.removeItem('connected_store_id');
            setActiveTab('dashboard');
        } catch (error) { _toast('Logout Gagal: ' + error.message, 'error'); }
    };

    const handleConnectStore = async (targetInput) => {
        if (!targetInput) {
            localStorage.removeItem('connected_store_id');
            setActiveStoreId(user.uid);
            _toast('Kembali ke Toko Pribadi (Mode Bos).', 'info');
            setShowStoreModal(false);
            return;
        }
        try {
            const result = await api.get(`/store/resolve/${encodeURIComponent(targetInput.toLowerCase())}`, user.uid);
            const targetUid = result.ownerUid || targetInput;
            localStorage.setItem('connected_store_id', targetUid);
            setActiveStoreId(targetUid);
            _toast(result.storeName ? `Terhubung ke toko: ${result.storeName}` : 'Berhasil terhubung!', 'success');
            setShowStoreModal(false);
        } catch (error) {
            localStorage.setItem('connected_store_id', targetInput);
            setActiveStoreId(targetInput);
            _toast('Berhasil terhubung! Data akan disinkronkan.', 'success');
            setShowStoreModal(false);
        }
    };

    // --- PROFILE HANDLERS ---
    const handleUpdateStoreProfile = async (storeName, storeAddress) => {
        if (!activeStoreId) return;
        try {
            if (activeStoreId === user.uid) {
                await api.put('/store/profile', { storeName, storeAddress }, activeStoreId);
                _toast('Informasi toko berhasil diperbarui.', 'success');
                await fetchAll();
            } else _toast('Hanya pemilik toko yang bisa mengubah info toko.', 'warning');
        } catch (e) { _toast('Gagal update toko: ' + e.message, 'error'); }
    };

    const handleSaveStoreSettings = async (storeName, customAlias) => {
        if (activeStoreId !== user.uid) throw new Error("Hanya pemilik toko");
        await api.put('/store/profile', { storeName, customAlias }, activeStoreId);
        await fetchAll();
    };

    const handleUpdateUserProfile = async (displayName, photoURL, phoneNumber) => {
        try {
            await updateProfile(user, { displayName });
            await api.put('/user/profile', {
                phoneNumber, photoURL, ownerName: displayName
            }, user.uid);
            _toast('Profil pribadi berhasil diperbarui.', 'success');
            await fetchAll();
        } catch (e) { _toast('Gagal update profil: ' + e.message, 'error'); }
    };

    const handleChangePassword = async (newPass) => {
        try {
            await updatePassword(user, newPass);
            _toast('Password berhasil diubah! Silakan login ulang nanti.', 'success');
        } catch (e) { _toast('Gagal ganti password: ' + e.message, 'error'); }
    };

    // --- PURCHASE / RESTOCK HANDLERS ---
    const handlePurchase = async (data) => {
        if (!activeStoreId) { _toast('Koneksi database belum siap.', 'error'); return false; }
        const { itemName, quantity, pricePerUnit } = data;
        if (!itemName?.trim()) { _toast('Nama produk wajib diisi!', 'warning'); return false; }
        const qty = parseFloat(quantity);
        const price = parseFloat(pricePerUnit);
        if (!qty || qty <= 0) { _toast('Jumlah stok masuk harus lebih dari 0!', 'warning'); return false; }
        if (isNaN(price) || price < 0) { _toast('Harga modal tidak valid!', 'warning'); return false; }
        try {
            await api.post('/restock', data, activeStoreId);
            _toast('Stok & harga jual berhasil disimpan.', 'success');
            await fetchAll();
            return true;
        } catch (error) { _toast('Gagal: ' + error.message, 'error'); return false; }
    };

    const handleUpdateRestock = async (logId, newData, setEditingRestock) => {
        if (!activeStoreId) return;
        try {
            await api.put(`/restock/${logId}`, newData, activeStoreId);
            _toast('Data restock & stok gudang berhasil diperbarui.', 'success');
            setEditingRestock(null);
            await fetchAll();
        } catch (e) { _toast('Gagal update: ' + e.message, 'error'); }
    };

    const handleDeleteRestock = async (log) => {
        const ok = await _confirm(
            'Hapus Riwayat Restock?',
            `Tindakan ini akan menghapus riwayat masuk "${log.itemName}" dan stok akan dikurangi.`,
            { itemName: log.itemName, type: 'delete' }
        );
        if (!ok) return;
        try {
            await api.del(`/restock/${log.id}`, activeStoreId);
            _toast('Riwayat restock berhasil dihapus.', 'success');
            await fetchAll();
        } catch (e) { _toast('Gagal: ' + e.message, 'error'); }
    };

    const handleSaveInventoryItem = async (data) => {
        if (!activeStoreId) { _toast('Koneksi database belum siap.', 'error'); return false; }
        const { id, name, category, unit, sellPrice, avgCost, stock, barcode, minStock } = data;
        if (!name?.trim()) { _toast('Nama produk wajib diisi.', 'warning'); return false; }
        const payload = {
            name: name.trim(), category: category || 'Umum', unit: unit || 'pcs',
            sellPrice: parseFloat(sellPrice) || 0, avgCost: parseFloat(avgCost) || 0,
            lastPrice: parseFloat(avgCost) || 0, barcode: barcode || '',
            minStock: parseFloat(minStock) || 5, stock: parseFloat(stock) || 0,
            lastSupplier: '',
        };
        try {
            if (id) {
                await api.put(`/inventory/${id}`, payload, activeStoreId);
                _toast('Detail produk berhasil diperbarui. Stok terkini telah disinkronisasi.', 'success');
            } else {
                await api.post('/inventory', payload, activeStoreId);
                _toast('Produk baru berhasil ditambahkan ke inventaris.', 'success');
            }
            await fetchAll();
            return true;
        } catch (e) { _toast('Gagal: ' + e.message, 'error'); return false; }
    };

    const handleDeleteInventoryItem = async (item) => {
        const ok = await _confirm(
            'Hapus Produk Ini?',
            `Tindakan ini akan menghapus "${item.name}" secara permanen dari inventaris toko Anda. Data yang dihapus tidak dapat dikembalikan.`,
            { itemName: item.name, type: 'delete' }
        );
        if (!ok) return;
        try {
            await api.del(`/inventory/${item.id}`, activeStoreId);
            _toast(`"${item.name}" berhasil dihapus dari inventaris.`, 'success');
            await fetchAll();
        } catch (e) { _toast('Gagal menghapus: ' + e.message, 'error'); }
    };

    // --- ORDER / SALES HANDLERS ---
    const handleSaveOrder = async (cartItems, date, notes, customerName, paymentMethod, paymentStatus) => {
        if (!activeStoreId) { _toast('Koneksi database belum siap.', 'error'); return false; }
        if (cartItems.length === 0) { _toast('Keranjang kosong!', 'warning'); return false; }
        try {
            await api.post('/orders', {
                items: cartItems, date, notes,
                customerName: customerName || '-',
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: paymentStatus || 'Lunas',
                cashierName: user.displayName || user.email,
            }, activeStoreId);
            _toast('Pesanan berhasil disimpan.', 'success', { title: 'Pesanan Tersimpan' });
            await fetchAll();
            return true;
        } catch (error) { _toast('Gagal: ' + error.message, 'error'); return false; }
    };

    const handleFullUpdateOrder = async (originalOrder, newItemList, metadata, setEditingOrder) => {
        if (!activeStoreId) return;
        try {
            await api.put(`/orders/${originalOrder.id}`, {
                items: newItemList, metadata,
            }, activeStoreId);
            _toast('Nota berhasil diperbarui.', 'success');
            setEditingOrder(null);
            await fetchAll();
        } catch (e) { _toast('Gagal: ' + e.message, 'error'); }
    };

    const handleQuickPay = async (orderId) => {
        const ok = await _confirm('Tandai Lunas?', 'Tandai nota ini sebagai LUNAS?', { type: 'confirm', confirmLabel: 'Ya, Lunas' });
        if (!ok) return;
        try {
            await api.put(`/orders/${orderId}/pay`, {}, activeStoreId);
            _toast('Status nota diperbarui menjadi Lunas.', 'success');
            await fetchAll();
        } catch (e) { _toast('Gagal update: ' + e.message, 'error'); }
    };

    const handleUpdateOrderExpenses = async (orderId, newExpensesList) => {
        if (!activeStoreId) return;
        try {
            await api.put(`/orders/${orderId}/expenses`, { expenses: newExpensesList }, activeStoreId);
            await fetchAll();
            return true;
        } catch (e) { _toast('Gagal: ' + e.message, 'error'); return false; }
    };

    const handleDeleteOrder = async (order) => {
        if (!activeStoreId) return;
        const ok = await _confirm(
            'Hapus Nota Ini?',
            `Hapus nota ini? Stok barang akan dikembalikan ke inventaris.`,
            { type: 'delete', confirmLabel: 'Ya, Hapus' }
        );
        if (!ok) return;
        try {
            await api.del(`/orders/${order.id}`, activeStoreId);
            _toast('Nota berhasil dihapus. Stok telah dikembalikan.', 'success');
            await fetchAll();
        } catch (error) { _toast('Gagal: ' + error.message, 'error'); }
    };

    // --- EXPENSE & WITHDRAWAL HANDLERS ---
    const handleGeneralExpense = async (data) => {
        if (!activeStoreId) return;
        try {
            await api.post('/expenses', data, activeStoreId);
            _toast('Biaya umum berhasil disimpan.', 'success');
            await fetchAll();
        } catch (e) { _toast('Gagal: ' + e.message, 'error'); }
    };

    const handleWithdrawal = async (data) => {
        if (!activeStoreId) return;
        try {
            await api.post('/withdrawals', data, activeStoreId);
            _toast('Penarikan uang berhasil tercatat.', 'success');
            await fetchAll();
        } catch (e) { _toast('Gagal: ' + e.message, 'error'); }
    };

    const handleDeleteWithdrawal = async (id) => {
        const ok = await _confirm('Hapus Penarikan?', 'Hapus catatan penarikan ini secara permanen?', { type: 'delete', confirmLabel: 'Ya, Hapus' });
        if (!ok) return;
        try {
            await api.del(`/withdrawals/${id}`, activeStoreId);
            _toast('Catatan penarikan berhasil dihapus.', 'success');
            await fetchAll();
        } catch (e) { _toast('Gagal: ' + e.message, 'error'); }
    };

    // --- COMPUTED STATS ---
    const stats = useMemo(() => {
        const salesRevenue = orders.reduce((acc, o) => acc + (o.financials?.revenue || 0), 0);
        const salesGrossProfit = orders.reduce((acc, o) => acc + (o.financials?.grossProfit || 0), 0);
        const totalCOGS = orders.reduce((acc, o) => acc + (o.financials?.cogs || 0), 0);
        const orderExpenses = orders.reduce((acc, o) => acc + (o.financials?.expenseTotal || 0), 0);
        const generalExpTotal = generalExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
        const netProfitGlobal = salesGrossProfit - orderExpenses - generalExpTotal;
        const totalWithdrawals = withdrawals.reduce((acc, w) => acc + (parseFloat(w.amount) || 0), 0);
        const totalOmzetLunas = orders
            .filter(o => o.paymentStatus === 'Lunas')
            .reduce((acc, o) => acc + (o.financials?.revenue || 0), 0);
        const cashOnHand = totalOmzetLunas - orderExpenses - generalExpTotal - totalWithdrawals;
        const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
        const outStock = inventory.filter(i => i.stock <= 0).length;
        const totalAssetValue = inventory.reduce((acc, i) => acc + (i.stock * i.avgCost), 0);
        return {
            salesRevenue, salesGrossProfit, totalCOGS, orderExpenses, generalExpTotal,
            netProfitGlobal, lowStock, outStock, totalAssetValue, totalWithdrawals, cashOnHand
        };
    }, [orders, generalExpenses, inventory, withdrawals]);

    return {
        // auth
        user, authLoading, activeStoreId,
        // store/profile
        storeProfile,
        // modal flags
        showStoreModal, setShowStoreModal,
        showProfileEdit, setShowProfileEdit,
        showWithdraw, setShowWithdraw,
        // data
        inventory, orders, generalExpenses, restockLogs, withdrawals,
        // computed
        stats,
        // handlers
        handleLogout,
        handleConnectStore,
        handleSaveStoreSettings,
        handleUpdateStoreProfile,
        handleUpdateUserProfile,
        handleChangePassword,
        handlePurchase,
        handleUpdateRestock,
        handleDeleteRestock,
        handleSaveInventoryItem,
        handleDeleteInventoryItem,
        handleSaveOrder,
        handleFullUpdateOrder,
        handleQuickPay,
        handleUpdateOrderExpenses,
        handleDeleteOrder,
        handleGeneralExpense,
        handleWithdrawal,
        handleDeleteWithdrawal,
    };
}
