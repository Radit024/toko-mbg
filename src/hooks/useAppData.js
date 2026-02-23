import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, updateProfile, updatePassword } from "firebase/auth";
import { auth } from '../config/firebase';
import { api } from '../config/api';

export function useAppData() {
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
        if (window.confirm("Yakin ingin keluar aplikasi?")) {
            try {
                await signOut(auth);
                localStorage.removeItem('connected_store_id');
                setActiveTab('dashboard');
            } catch (error) { alert("Logout Gagal: " + error.message); }
        }
    };

    const handleConnectStore = async (targetInput) => {
        if (!targetInput) {
            localStorage.removeItem('connected_store_id');
            setActiveStoreId(user.uid);
            alert("Kembali ke Toko Pribadi (Mode Bos).");
            setShowStoreModal(false);
            return;
        }
        try {
            const result = await api.get(`/store/resolve/${encodeURIComponent(targetInput.toLowerCase())}`, user.uid);
            const targetUid = result.ownerUid || targetInput;
            if (result.storeName) {
                alert(`Berhasil menemukan toko: ${result.storeName}`);
            }
            localStorage.setItem('connected_store_id', targetUid);
            setActiveStoreId(targetUid);
            alert("Berhasil terhubung! Data akan disinkronkan.");
            setShowStoreModal(false);
        } catch (error) {
            // Jika alias tidak ditemukan, coba langsung pakai input sebagai UID
            localStorage.setItem('connected_store_id', targetInput);
            setActiveStoreId(targetInput);
            alert("Berhasil terhubung! Data akan disinkronkan.");
            setShowStoreModal(false);
        }
    };

    // --- PROFILE HANDLERS ---
    const handleUpdateStoreProfile = async (storeName, storeAddress) => {
        if (!activeStoreId) return;
        try {
            if (activeStoreId === user.uid) {
                await api.put('/store/profile', { storeName, storeAddress }, activeStoreId);
                alert("Informasi Toko Diperbarui!");
                await fetchAll();
            } else alert("Hanya pemilik toko yang bisa mengubah info toko.");
        } catch (e) { alert("Gagal update toko: " + e.message); }
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
            alert("Profil Pribadi Diperbarui!");
            await fetchAll();
        } catch (e) { alert("Gagal update profil: " + e.message); }
    };

    const handleChangePassword = async (newPass) => {
        try {
            await updatePassword(user, newPass);
            alert("Password berhasil diubah! Silakan login ulang nanti.");
        } catch (e) { alert("Gagal ganti password: " + e.message); }
    };

    // --- PURCHASE / RESTOCK HANDLERS ---
    const handlePurchase = async (data) => {
        if (!activeStoreId) { alert("Koneksi database belum siap."); return false; }
        const { itemName, quantity, pricePerUnit } = data;
        if (!itemName?.trim()) { alert("Nama produk wajib diisi!"); return false; }
        const qty = parseFloat(quantity);
        const price = parseFloat(pricePerUnit);
        if (!qty || qty <= 0) { alert("Jumlah stok masuk harus lebih dari 0!"); return false; }
        if (isNaN(price) || price < 0) { alert("Harga modal tidak valid!"); return false; }
        try {
            await api.post('/restock', data, activeStoreId);
            alert("Stok & Harga Jual berhasil disimpan!");
            await fetchAll();
            return true;
        } catch (error) { alert("Gagal: " + error.message); return false; }
    };

    const handleUpdateRestock = async (logId, newData, setEditingRestock) => {
        if (!activeStoreId) return;
        try {
            await api.put(`/restock/${logId}`, newData, activeStoreId);
            alert("Data Restock & Stok Gudang Diperbarui!");
            setEditingRestock(null);
            await fetchAll();
        } catch (e) { alert("Gagal update: " + e.message); }
    };

    const handleDeleteRestock = async (log) => {
        if (!window.confirm(`Hapus riwayat masuk "${log.itemName}"? Stok akan dikurangi.`)) return;
        try {
            await api.del(`/restock/${log.id}`, activeStoreId);
            alert("Riwayat dihapus.");
            await fetchAll();
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleSaveInventoryItem = async (data) => {
        if (!activeStoreId) return alert("Koneksi database belum siap.");
        const { id, name, category, unit, sellPrice, avgCost, stock, barcode, minStock } = data;
        if (!name?.trim()) return alert("Nama produk wajib diisi.");
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
            } else {
                await api.post('/inventory', payload, activeStoreId);
            }
            await fetchAll();
            return true;
        } catch (e) { alert("Gagal: " + e.message); return false; }
    };

    const handleDeleteInventoryItem = async (item) => {
        if (!window.confirm(`PERINGATAN 1/2: Hapus "${item.name}"?`)) return;
        if (!window.confirm(`PERINGATAN 2/2: Hapus Permanen?`)) return;
        try {
            await api.del(`/inventory/${item.id}`, activeStoreId);
            alert("Barang berhasil dihapus.");
            await fetchAll();
        } catch (e) { alert("Gagal menghapus: " + e.message); }
    };

    // --- ORDER / SALES HANDLERS ---
    const handleSaveOrder = async (cartItems, date, notes, customerName, paymentMethod, paymentStatus) => {
        if (!activeStoreId) return alert("Koneksi database belum siap.");
        if (cartItems.length === 0) return alert("Keranjang kosong!");
        try {
            await api.post('/orders', {
                items: cartItems, date, notes,
                customerName: customerName || '-',
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: paymentStatus || 'Lunas',
                cashierName: user.displayName || user.email,
            }, activeStoreId);
            alert("Pesanan Berhasil Disimpan!");
            await fetchAll();
            return true;
        } catch (error) { alert("Gagal: " + error.message); return false; }
    };

    const handleFullUpdateOrder = async (originalOrder, newItemList, metadata, setEditingOrder) => {
        if (!activeStoreId) return;
        try {
            await api.put(`/orders/${originalOrder.id}`, {
                items: newItemList, metadata,
            }, activeStoreId);
            alert("Nota berhasil diupdate!");
            setEditingOrder(null);
            await fetchAll();
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleQuickPay = async (orderId) => {
        if (!window.confirm("Tandai nota ini sebagai LUNAS?")) return;
        try {
            await api.put(`/orders/${orderId}/pay`, {}, activeStoreId);
            alert("Status diperbarui menjadi Lunas.");
            await fetchAll();
        } catch (e) { alert("Gagal update: " + e.message); }
    };

    const handleUpdateOrderExpenses = async (orderId, newExpensesList) => {
        if (!activeStoreId) return;
        try {
            await api.put(`/orders/${orderId}/expenses`, { expenses: newExpensesList }, activeStoreId);
            await fetchAll();
            return true;
        } catch (e) { alert("Gagal: " + e.message); return false; }
    };

    const handleDeleteOrder = async (order) => {
        if (!activeStoreId) return;
        if (!window.confirm("Hapus Nota? Stok akan dikembalikan.")) return;
        try {
            await api.del(`/orders/${order.id}`, activeStoreId);
            alert("Nota dihapus.");
            await fetchAll();
        } catch (error) { alert("Gagal: " + error.message); }
    };

    // --- EXPENSE & WITHDRAWAL HANDLERS ---
    const handleGeneralExpense = async (data) => {
        if (!activeStoreId) return;
        try {
            await api.post('/expenses', data, activeStoreId);
            alert("Biaya umum disimpan.");
            await fetchAll();
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleWithdrawal = async (data) => {
        if (!activeStoreId) return;
        try {
            await api.post('/withdrawals', data, activeStoreId);
            alert("Penarikan uang tercatat!");
            await fetchAll();
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleDeleteWithdrawal = async (id) => {
        if (!window.confirm("Hapus catatan penarikan ini?")) return;
        try {
            await api.del(`/withdrawals/${id}`, activeStoreId);
            await fetchAll();
        } catch (e) { alert("Gagal: " + e.message); }
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
