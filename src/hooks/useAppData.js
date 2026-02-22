import { useState, useEffect, useMemo } from 'react';
import {
    collection, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc,
    onSnapshot, query, orderBy, writeBatch, serverTimestamp, limit
} from "firebase/firestore";
import { onAuthStateChanged, signOut, updateProfile, updatePassword } from "firebase/auth";
import { auth, db, appId } from '../config/firebase';

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

    // --- FIRESTORE DATA ---
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

    // --- FIRESTORE SNAPSHOT LISTENERS ---
    useEffect(() => {
        if (!user || !activeStoreId || !db) {
            setInventory([]); setOrders([]); setGeneralExpenses([]);
            setRestockLogs([]); setWithdrawals([]); setStoreProfile(null);
            return;
        }

        const userPath = (colName) => collection(db, "artifacts", appId, "users", activeStoreId, colName);

        const unsubProfile = onSnapshot(
            doc(db, "artifacts", appId, "users", activeStoreId, "settings", "profile"),
            (docSnap) => setStoreProfile(docSnap.exists() ? docSnap.data() : null)
        );
        const unsubInventory = onSnapshot(userPath("inventory"),
            (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubOrders = onSnapshot(
            query(userPath("orders"), orderBy("createdAt", "desc"), limit(500)),
            (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubGenExp = onSnapshot(
            query(userPath("general_expenses"), orderBy("date", "desc"), limit(50)),
            (s) => setGeneralExpenses(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubRestock = onSnapshot(
            query(userPath("restock_logs"), orderBy("createdAt", "desc"), limit(100)),
            (s) => setRestockLogs(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubWithdrawals = onSnapshot(
            query(userPath("withdrawals"), orderBy("date", "desc"), limit(50)),
            (s) => setWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        return () => {
            unsubProfile(); unsubInventory(); unsubOrders();
            unsubGenExp(); unsubRestock(); unsubWithdrawals();
        };
    }, [user, activeStoreId]);

    // --- FIRESTORE HELPERS ---
    const getStoreCollection = (colName) =>
        collection(db, "artifacts", appId, "users", activeStoreId, colName);
    const getStoreDoc = (colName, docId) =>
        doc(db, "artifacts", appId, "users", activeStoreId, colName, docId);

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
            const aliasRef = doc(db, 'artifacts', appId, 'public', 'data', 'store_aliases', targetInput.toLowerCase());
            const aliasSnap = await getDoc(aliasRef);
            let targetUid = targetInput;
            if (aliasSnap.exists()) {
                targetUid = aliasSnap.data().ownerUid;
                alert(`Berhasil menemukan toko: ${aliasSnap.data().storeName || targetInput}`);
            }
            localStorage.setItem('connected_store_id', targetUid);
            setActiveStoreId(targetUid);
            alert("Berhasil terhubung! Data akan disinkronkan.");
            setShowStoreModal(false);
        } catch (error) { alert("Gagal menghubungkan: " + error.message); }
    };

    // --- PROFILE HANDLERS ---
    const handleUpdateStoreProfile = async (storeName, storeAddress) => {
        if (!activeStoreId) return;
        try {
            if (activeStoreId === user.uid) {
                await setDoc(getStoreDoc("settings", "profile"), {
                    storeName, storeAddress, updatedAt: serverTimestamp()
                }, { merge: true });
                alert("Informasi Toko Diperbarui!");
            } else alert("Hanya pemilik toko yang bisa mengubah info toko.");
        } catch (e) { alert("Gagal update toko: " + e.message); }
    };

    const handleUpdateUserProfile = async (displayName, photoURL, phoneNumber) => {
        try {
            await updateProfile(user, { displayName });
            const userRef = doc(db, "artifacts", appId, "users", user.uid, "settings", "profile");
            await setDoc(userRef, { phoneNumber, photoURL, ownerName: displayName }, { merge: true });
            alert("Profil Pribadi Diperbarui!");
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
        if (!db || !activeStoreId) return alert("Koneksi database belum siap.");
        const { itemName, quantity, unit, pricePerUnit, supplier, date, barcode, category, sellPrice } = data;
        const qty = parseFloat(quantity);
        const price = parseFloat(pricePerUnit);
        const sellingPrice = parseFloat(sellPrice) || 0;
        try {
            let existingItem = null;
            if (data.existingId) existingItem = inventory.find(i => i.id === data.existingId);
            else if (barcode) existingItem = inventory.find(i => i.barcode === barcode);
            else existingItem = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());

            let itemIdForLog = "";
            if (existingItem) {
                itemIdForLog = existingItem.id;
                const newTotalStock = existingItem.stock + qty;
                const newAvgCost = newTotalStock > 0
                    ? ((existingItem.stock * existingItem.avgCost) + (qty * price)) / newTotalStock
                    : price;
                await updateDoc(getStoreDoc("inventory", existingItem.id), {
                    stock: newTotalStock, avgCost: newAvgCost, lastPrice: price,
                    sellPrice: sellingPrice > 0 ? sellingPrice : (existingItem.sellPrice || 0),
                    lastSupplier: supplier, unit: unit || existingItem.unit,
                    category: category || existingItem.category || 'Umum',
                    barcode: barcode || existingItem.barcode || ''
                });
            } else {
                const newItemRef = await addDoc(getStoreCollection("inventory"), {
                    name: itemName, stock: qty, unit, avgCost: price, lastPrice: price,
                    sellPrice: sellingPrice, minStock: 5, lastSupplier: supplier,
                    category: category || 'Umum', barcode: barcode || ''
                });
                itemIdForLog = newItemRef.id;
            }
            await addDoc(getStoreCollection("restock_logs"), {
                itemName, itemId: itemIdForLog, qty, unit, pricePerUnit: price,
                totalCost: qty * price, supplier, inputDate: date,
                createdAt: serverTimestamp(), barcode: barcode || '', category: category || 'Umum'
            });
            alert("Stok & Harga Jual berhasil disimpan!");
        } catch (error) { alert("Gagal: " + error.message); }
    };

    const handleUpdateRestock = async (logId, newData, setEditingRestock) => {
        if (!activeStoreId) return;
        try {
            const batch = writeBatch(db);
            const originalLog = restockLogs.find(r => r.id === logId);
            if (!originalLog) throw new Error("Log not found");

            batch.update(getStoreDoc("restock_logs", logId), {
                ...newData,
                totalCost: parseFloat(newData.qty) * parseFloat(newData.pricePerUnit)
            });

            const itemSnap = await getDoc(getStoreDoc("inventory", originalLog.itemId));
            if (itemSnap.exists()) {
                const cur = itemSnap.data();
                const qtyDiff = parseFloat(newData.qty) - parseFloat(originalLog.qty);
                const newStock = cur.stock + qtyDiff;
                const valueWithoutOld = (cur.stock * cur.avgCost) - (originalLog.qty * originalLog.pricePerUnit);
                const newAvgCost = newStock > 0
                    ? (valueWithoutOld + (newData.qty * newData.pricePerUnit)) / newStock
                    : cur.avgCost;
                batch.update(getStoreDoc("inventory", originalLog.itemId), {
                    name: newData.itemName, barcode: newData.barcode, category: newData.category,
                    lastSupplier: newData.supplier, stock: newStock, avgCost: newAvgCost, unit: newData.unit,
                    sellPrice: parseFloat(newData.sellPrice) || cur.sellPrice || 0
                });
            }
            await batch.commit();
            alert("Data Restock & Stok Gudang Diperbarui!");
            setEditingRestock(null);
        } catch (e) { alert("Gagal update: " + e.message); }
    };

    const handleDeleteRestock = async (log) => {
        if (!window.confirm(`Hapus riwayat masuk "${log.itemName}"? Stok akan dikurangi.`)) return;
        try {
            const itemSnap = await getDoc(getStoreDoc("inventory", log.itemId));
            if (itemSnap.exists()) {
                const newStock = itemSnap.data().stock - log.qty;
                if (newStock < 0 && !window.confirm("Stok akan minus. Lanjut?")) return;
                await updateDoc(getStoreDoc("inventory", log.itemId), { stock: newStock });
            }
            await deleteDoc(getStoreDoc("restock_logs", log.id));
            alert("Riwayat dihapus.");
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleDeleteInventoryItem = async (item) => {
        if (!window.confirm(`PERINGATAN 1/2: Hapus "${item.name}"?`)) return;
        if (!window.confirm(`PERINGATAN 2/2: Hapus Permanen?`)) return;
        try {
            await deleteDoc(getStoreDoc("inventory", item.id));
            alert("Barang berhasil dihapus.");
        } catch (e) { alert("Gagal menghapus: " + e.message); }
    };

    // --- ORDER / SALES HANDLERS ---
    const handleSaveOrder = async (cartItems, date, notes, customerName, paymentMethod, paymentStatus) => {
        if (!db || !activeStoreId) return alert("Koneksi database belum siap.");
        if (cartItems.length === 0) return alert("Keranjang kosong!");
        try {
            const batch = writeBatch(db);
            let totalRevenue = 0; let totalCOGS = 0;
            for (const item of cartItems) {
                const inv = inventory.find(i => i.id === item.itemId);
                if (!inv) throw new Error(`Barang ${item.itemName} tidak ditemukan!`);
                batch.update(getStoreDoc("inventory", item.itemId), { stock: inv.stock - item.quantity });
                totalRevenue += item.subtotal;
                totalCOGS += inv.avgCost * item.quantity;
            }
            const grossProfit = totalRevenue - totalCOGS;
            const orderRef = doc(getStoreCollection("orders"));
            batch.set(orderRef, {
                type: 'sale', date, customerName: customerName || '-',
                items: cartItems.map(i => ({
                    itemId: i.itemId, name: i.itemName, qty: i.quantity, unit: i.unit,
                    price: i.price, subtotal: i.subtotal,
                    costBasis: inventory.find(inv => inv.id === i.itemId)?.avgCost || 0
                })),
                expenses: [],
                financials: { revenue: totalRevenue, cogs: totalCOGS, grossProfit, expenseTotal: 0, netProfit: grossProfit },
                notes, paymentMethod: paymentMethod || 'Cash', paymentStatus: paymentStatus || 'Lunas',
                createdAt: serverTimestamp(), cashierName: user.displayName || user.email
            });
            await batch.commit();
            alert("Pesanan Berhasil Disimpan!");
            return true;
        } catch (error) { alert("Gagal: " + error.message); return false; }
    };

    const handleFullUpdateOrder = async (originalOrder, newItemList, metadata, setEditingOrder) => {
        if (!activeStoreId) return;
        try {
            const batch = writeBatch(db);
            for (const oldItem of originalOrder.items) {
                const cur = inventory.find(i => i.id === oldItem.itemId);
                if (cur) batch.update(getStoreDoc("inventory", oldItem.itemId), { stock: cur.stock + oldItem.qty });
            }

            let newRevenue = 0; let newCOGS = 0;
            const tempStockMap = {};
            inventory.forEach(i => { tempStockMap[i.id] = i.stock; });
            originalOrder.items.forEach(i => { if (tempStockMap[i.itemId] !== undefined) tempStockMap[i.itemId] += i.qty; });

            for (const newItem of newItemList) {
                const currentAvgCost = inventory.find(i => i.id === newItem.itemId)?.avgCost || 0;
                if (tempStockMap[newItem.itemId] < newItem.qty) throw new Error(`Stok ${newItem.name} kurang!`);
                tempStockMap[newItem.itemId] -= newItem.qty;
                batch.update(getStoreDoc("inventory", newItem.itemId), { stock: tempStockMap[newItem.itemId] });
                newRevenue += newItem.subtotal;
                newCOGS += currentAvgCost * newItem.qty;
            }

            const newGrossProfit = newRevenue - newCOGS;
            const currentExpenseTotal = originalOrder.financials.expenseTotal || 0;
            batch.update(getStoreDoc("orders", originalOrder.id), {
                ...metadata, items: newItemList,
                "financials.revenue": newRevenue, "financials.cogs": newCOGS,
                "financials.grossProfit": newGrossProfit,
                "financials.netProfit": newGrossProfit - currentExpenseTotal
            });
            await batch.commit();
            alert("Nota berhasil diupdate!");
            setEditingOrder(null);
        } catch (e) { alert("Gagal: " + e.message); }
    };

    const handleQuickPay = async (orderId) => {
        if (!window.confirm("Tandai nota ini sebagai LUNAS?")) return;
        try {
            await updateDoc(getStoreDoc("orders", orderId), { paymentStatus: 'Lunas' });
            alert("Status diperbarui menjadi Lunas.");
        } catch (e) { alert("Gagal update: " + e.message); }
    };

    const handleUpdateOrderExpenses = async (orderId, newExpensesList) => {
        if (!activeStoreId) return;
        try {
            const orderSnap = await getDoc(getStoreDoc("orders", orderId));
            if (!orderSnap.exists()) return alert("Nota hilang");
            const totalExp = newExpensesList.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            const newNetProfit = orderSnap.data().financials.grossProfit - totalExp;
            await updateDoc(getStoreDoc("orders", orderId), {
                expenses: newExpensesList,
                "financials.expenseTotal": totalExp,
                "financials.netProfit": newNetProfit
            });
            return true;
        } catch (e) { alert("Gagal: " + e.message); return false; }
    };

    const handleDeleteOrder = async (order) => {
        if (!activeStoreId) return;
        if (!window.confirm("Hapus Nota? Stok akan dikembalikan.")) return;
        try {
            const batch = writeBatch(db);
            for (const item of order.items) {
                const itemSnap = await getDoc(getStoreDoc("inventory", item.itemId));
                if (itemSnap.exists()) batch.update(getStoreDoc("inventory", item.itemId), { stock: itemSnap.data().stock + item.qty });
            }
            batch.delete(getStoreDoc("orders", order.id));
            await batch.commit();
            alert("Nota dihapus.");
        } catch (error) { alert("Gagal: " + error.message); }
    };

    // --- EXPENSE & WITHDRAWAL HANDLERS ---
    const handleGeneralExpense = async (data) => {
        if (!activeStoreId) return;
        await addDoc(getStoreCollection("general_expenses"), { ...data, createdAt: serverTimestamp() });
        alert("Biaya umum disimpan.");
    };

    const handleWithdrawal = async (data) => {
        if (!activeStoreId) return;
        await addDoc(getStoreCollection("withdrawals"), { ...data, createdAt: serverTimestamp() });
        alert("Penarikan uang tercatat!");
    };

    const handleDeleteWithdrawal = async (id) => {
        if (!window.confirm("Hapus catatan penarikan ini?")) return;
        await deleteDoc(getStoreDoc("withdrawals", id));
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
        // firestore data
        inventory, orders, generalExpenses, restockLogs, withdrawals,
        // computed
        stats,
        // handlers
        handleLogout,
        handleConnectStore,
        handleUpdateStoreProfile,
        handleUpdateUserProfile,
        handleChangePassword,
        handlePurchase,
        handleUpdateRestock,
        handleDeleteRestock,
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
