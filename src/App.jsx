import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackagePlus, 
  Package, 
  Wallet, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Trash2,
  Download,
  Printer,
  Menu,
  Plus,
  History,
  Truck,
  ShoppingBasket,
  Search,
  ArrowRight,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  LogIn,
  LogOut, 
  Calendar,
  Tag,
  User,
  Filter,
  RefreshCcw,
  CreditCard,
  Edit,
  X,
  Save,
  Lock, 
  Mail,
  UserPlus, 
  Copy,
  Users,
  CheckSquare,
  Square,
  Settings,
  Store,
  List,
  UserCheck,
  Scan,
  CheckCircle,
  Layers,
  Archive,
  BarChart3,
  HandCoins,      
  ArrowUpRight,
  Camera,
  XCircle,
  Check,
  Image as ImageIcon,
  Upload,
  Phone,
  MapPin,
  Shield,
  UserCog,
  ArrowDownUp // New Icon for Sorting
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  serverTimestamp,
  limit 
} from "firebase/firestore";

import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  updatePassword
} from "firebase/auth";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyC4HDfispWw3e6c_TIhnvy5JJll-I_p4XM",
  authDomain: "toko-mbg.firebaseapp.com",
  projectId: "toko-mbg",
  storageBucket: "toko-mbg.firebasestorage.app",
  messagingSenderId: "298104850594",
  appId: "1:298104850594:web:17a719e5ab1386fa32effb",
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'toko-mbg-default';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- Utility Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = timestamp;
  }
  const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('id-ID', options);
};

const formatDateShort = (timestamp) => {
  if (!timestamp) return '-';
  let date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- Main Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State untuk Multi-User / Shared Store
  const [activeStoreId, setActiveStoreId] = useState(null); 
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeProfile, setStoreProfile] = useState(null); 
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMini, setIsSidebarMini] = useState(false);
    
  const [printOrder, setPrintOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingRestock, setEditingRestock] = useState(null);

  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [restockLogs, setRestockLogs] = useState([]); 
  
  const [withdrawals, setWithdrawals] = useState([]); 

  // --- Load HTML5-QRCode Script ---
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // --- Auth & Data Listeners ---

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

  useEffect(() => {
    if (!user || !activeStoreId) {
        setInventory([]);
        setOrders([]);
        setGeneralExpenses([]);
        setRestockLogs([]);
        setWithdrawals([]); 
        setStoreProfile(null);
        return;
    }

    if (!db) return;

    const userPath = (colName) => collection(db, "artifacts", appId, "users", activeStoreId, colName);

    // Listener Profile Toko
    const unsubProfile = onSnapshot(doc(db, "artifacts", appId, "users", activeStoreId, "settings", "profile"), (docSnap) => {
        if (docSnap.exists()) {
            setStoreProfile(docSnap.data());
        } else {
            setStoreProfile(null);
        }
    });

    const unsubInventory = onSnapshot(userPath("inventory"), 
      (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching inventory:", error)
    );

    const unsubOrders = onSnapshot(query(userPath("orders"), orderBy("createdAt", "desc"), limit(500)), 
      (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching orders:", error)
    );

    const unsubGenExp = onSnapshot(query(userPath("general_expenses"), orderBy("date", "desc"), limit(50)), 
      (s) => setGeneralExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching expenses:", error)
    );

    const unsubRestock = onSnapshot(query(userPath("restock_logs"), orderBy("createdAt", "desc"), limit(100)), // Increased limit for better sorting
      (s) => setRestockLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching logs:", error)
    );

    const unsubWithdrawals = onSnapshot(query(userPath("withdrawals"), orderBy("date", "desc"), limit(50)), 
      (s) => setWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error("Error fetching withdrawals:", error)
    );
      
    return () => { unsubInventory(); unsubOrders(); unsubGenExp(); unsubRestock(); unsubProfile(); unsubWithdrawals(); };
  }, [user, activeStoreId]); 

  // --- Helper Helpers ---
  const getStoreCollection = (colName) => {
    if (!activeStoreId) throw new Error("Store ID not set");
    return collection(db, "artifacts", appId, "users", activeStoreId, colName);
  };
    
  const getStoreDoc = (colName, docId) => {
    if (!activeStoreId) throw new Error("Store ID not set");
    return doc(db, "artifacts", appId, "users", activeStoreId, colName, docId);
  }

  const handleLogout = async () => {
    if(window.confirm("Yakin ingin keluar aplikasi?")) {
        try {
            await signOut(auth);
            localStorage.removeItem('connected_store_id'); 
            setActiveTab('dashboard');
        } catch (error) {
            alert("Logout Gagal: " + error.message);
        }
    }
  };

  const handleConnectStore = async (targetInput) => {
      if(!targetInput) {
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
      } catch (error) {
          alert("Gagal menghubungkan: " + error.message);
      }
  };

  // --- PROFILE LOGIC ---
  const handleUpdateStoreProfile = async (storeName, storeAddress) => {
    if (!activeStoreId) return;
    try {
        // Update data toko (hanya jika owner)
        if(activeStoreId === user.uid) {
            const profileRef = doc(db, "artifacts", appId, "users", activeStoreId, "settings", "profile");
            await setDoc(profileRef, { 
                storeName: storeName,
                storeAddress: storeAddress,
                updatedAt: serverTimestamp()
            }, { merge: true });
            alert("Informasi Toko Diperbarui!");
        } else {
            alert("Hanya pemilik toko yang bisa mengubah info toko.");
        }
    } catch (e) {
        alert("Gagal update toko: " + e.message);
    }
  };

  // --- FIXED: UPDATE PROFILE FUNCTION ---
  const handleUpdateUserProfile = async (displayName, photoURL, phoneNumber) => {
      try {
          // PERBAIKAN: Hapus photoURL dari updateProfile Auth
          // Karena string Base64 terlalu panjang untuk Auth Profile
          await updateProfile(user, { displayName }); 
          
          // Simpan no hp & FOTO di user settings (Firestore bisa nampung string panjang/Base64)
          // Ini solusi agar tidak error "Photo URL too long"
          const userRef = doc(db, "artifacts", appId, "users", user.uid, "settings", "profile");
          await setDoc(userRef, { 
              phoneNumber: phoneNumber,
              photoURL: photoURL, // Foto disimpan di sini (Aman)
              ownerName: displayName
          }, { merge: true });

          alert("Profil Pribadi Diperbarui!");
      } catch (e) {
          alert("Gagal update profil: " + e.message);
      }
  };

  const handleChangePassword = async (newPass) => {
      try {
          await updatePassword(user, newPass);
          alert("Password berhasil diubah! Silakan login ulang nanti.");
      } catch (e) {
          alert("Gagal ganti password (Login ulang dulu jika perlu): " + e.message);
      }
  };

  // --- RESTOCK & PRINT LOGIC ---

  const handlePurchase = async (data) => {
    if (!db || !activeStoreId) return alert("Koneksi database belum siap.");
    const { itemName, quantity, unit, pricePerUnit, supplier, date, barcode, category, sellPrice } = data; 
    const qty = parseFloat(quantity);
    const price = parseFloat(pricePerUnit);
    const sellingPrice = parseFloat(sellPrice) || 0;
    
    try {
      let existingItem = null;
      if (data.existingId) {
          existingItem = inventory.find(i => i.id === data.existingId);
      } else if (barcode) {
          existingItem = inventory.find(i => i.barcode === barcode);
      } else {
          existingItem = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      }

      let itemIdForLog = "";

      if (existingItem) {
        itemIdForLog = existingItem.id;
        const currentTotalValue = existingItem.stock * existingItem.avgCost;
        const newPurchaseValue = qty * price;
        const newTotalStock = existingItem.stock + qty;
        const newAvgCost = newTotalStock > 0 ? (currentTotalValue + newPurchaseValue) / newTotalStock : price;
        
        await updateDoc(getStoreDoc("inventory", existingItem.id), { 
            stock: newTotalStock, 
            avgCost: newAvgCost, 
            lastPrice: price, 
            sellPrice: sellingPrice > 0 ? sellingPrice : (existingItem.sellPrice || 0), 
            lastSupplier: supplier, 
            unit: unit || existingItem.unit,
            category: category || existingItem.category || 'Umum', 
            barcode: barcode || existingItem.barcode || '' 
        });
      } else {
        const newItemRef = await addDoc(getStoreCollection("inventory"), { 
            name: itemName, 
            stock: qty, 
            unit: unit, 
            avgCost: price, 
            lastPrice: price, 
            sellPrice: sellingPrice, 
            minStock: 5, 
            lastSupplier: supplier,
            category: category || 'Umum',
            barcode: barcode || ''
        });
        itemIdForLog = newItemRef.id;
      }

      await addDoc(getStoreCollection("restock_logs"), {
          itemName, 
          itemId: itemIdForLog,
          qty,
          unit,
          pricePerUnit: price,
          totalCost: qty * price,
          supplier,
          inputDate: date,
          createdAt: serverTimestamp(),
          barcode: barcode || '',
          category: category || 'Umum'
      });

      alert("Stok & Harga Jual berhasil disimpan!");
    } catch (error) { alert("Gagal: " + error.message); }
  };

  const handleUpdateRestock = async (logId, newData) => {
    if(!activeStoreId) return;
    try {
        const batch = writeBatch(db);
        const logRef = getStoreDoc("restock_logs", logId);
        const originalLog = restockLogs.find(r => r.id === logId);
        
        if(!originalLog) throw new Error("Log not found");
        
        const updatedLogData = {
            ...newData,
            totalCost: parseFloat(newData.qty) * parseFloat(newData.pricePerUnit)
        };
        batch.update(logRef, updatedLogData);

        const itemRef = getStoreDoc("inventory", originalLog.itemId);
        const itemSnap = await getDoc(itemRef);

        if(itemSnap.exists()) {
            const currentItem = itemSnap.data();
            
            const qtyDiff = parseFloat(newData.qty) - parseFloat(originalLog.qty);
            const newStock = currentItem.stock + qtyDiff;

            const currentTotalValue = currentItem.stock * currentItem.avgCost;
            const valueWithoutOldLog = currentTotalValue - (originalLog.qty * originalLog.pricePerUnit);
            const valueWithNewLog = valueWithoutOldLog + (newData.qty * newData.pricePerUnit);
            
            const newAvgCost = newStock > 0 ? valueWithNewLog / newStock : currentItem.avgCost;

            batch.update(itemRef, {
                name: newData.itemName,
                barcode: newData.barcode, 
                category: newData.category,
                lastSupplier: newData.supplier,
                stock: newStock,
                avgCost: newAvgCost,
                unit: newData.unit,
                sellPrice: parseFloat(newData.sellPrice) || currentItem.sellPrice || 0 // Update sell price in inventory too
            });
        }

        await batch.commit();
        alert("Data Restock & Stok Gudang Diperbarui!");
        setEditingRestock(null);
    } catch (e) {
        alert("Gagal update: " + e.message);
    }
  };

  const handleDeleteRestock = async (log) => {
      if(!window.confirm(`Hapus riwayat masuk "${log.itemName}"? Stok akan dikurangi.`)) return;
      try {
          const itemRef = getStoreDoc("inventory", log.itemId);
          const itemSnap = await getDoc(itemRef);

          if (itemSnap.exists()) {
              const currentStock = itemSnap.data().stock;
              const newStock = currentStock - log.qty;
              if (newStock < 0 && !window.confirm("Stok akan minus. Lanjut?")) return;
              await updateDoc(itemRef, { stock: newStock });
          } 
          await deleteDoc(getStoreDoc("restock_logs", log.id));
          alert("Riwayat dihapus.");
      } catch (e) { alert("Gagal: " + e.message); }
  };

  const handleDeleteInventoryItem = async (item) => {
      if(!window.confirm(`PERINGATAN 1/2: Anda yakin ingin menghapus barang "${item.name}" dari database gudang?`)) return;
      if(!window.confirm(`PERINGATAN 2/2: Hapus Permanen? Stok dan referensi barang ini akan hilang selamanya dan tidak bisa dikembalikan.`)) return;
      try {
          await deleteDoc(getStoreDoc("inventory", item.id));
          alert("Barang berhasil dihapus dari gudang.");
      } catch (e) {
          alert("Gagal menghapus: " + e.message);
      }
  };

  const handleSaveOrder = async (cartItems, date, notes, customerName, paymentMethod, paymentStatus) => {
    if (!db || !activeStoreId) return alert("Koneksi database belum siap.");
    if (cartItems.length === 0) return alert("Keranjang kosong!");

    try {
      const batch = writeBatch(db);
      let totalRevenue = 0;
      let totalCOGS = 0;

      for (const item of cartItems) {
        const inventoryItem = inventory.find(i => i.id === item.itemId);
        if (!inventoryItem) throw new Error(`Barang ${item.itemName} tidak ditemukan!`);
        
        const itemRef = getStoreDoc("inventory", item.itemId);
        const newStock = inventoryItem.stock - item.quantity;
        batch.update(itemRef, { stock: newStock });

        totalRevenue += item.subtotal;
        totalCOGS += (inventoryItem.avgCost * item.quantity);
      }

      const grossProfit = totalRevenue - totalCOGS;
      
      const orderRef = doc(getStoreCollection("orders"));
      const orderData = {
        type: 'sale',
        date: date,
        customerName: customerName || '-',
        items: cartItems.map(i => ({
          itemId: i.itemId,
          name: i.itemName,
          qty: i.quantity,
          unit: i.unit,
          price: i.price,
          subtotal: i.subtotal,
          costBasis: inventory.find(inv => inv.id === i.itemId)?.avgCost || 0
        })),
        expenses: [],
        financials: {
          revenue: totalRevenue,
          cogs: totalCOGS,
          grossProfit: grossProfit,
          expenseTotal: 0,
          netProfit: grossProfit
        },
        notes: notes,
        paymentMethod: paymentMethod || 'Cash', 
        paymentStatus: paymentStatus || 'Lunas',
        createdAt: serverTimestamp(),
        cashierName: user.displayName || user.email 
      };

      batch.set(orderRef, orderData);
      await batch.commit();
      alert("Pesanan Berhasil Disimpan!");
      return true;
    } catch (error) {
      console.error(error);
      alert("Gagal: " + error.message);
      return false;
    }
  };

  const handleFullUpdateOrder = async (originalOrder, newItemList, metadata) => {
    if (!activeStoreId) return;
    try {
        const batch = writeBatch(db);
        
        for (const oldItem of originalOrder.items) {
            const itemRef = getStoreDoc("inventory", oldItem.itemId);
            const currentInv = inventory.find(i => i.id === oldItem.itemId);
            if(currentInv) {
                batch.update(itemRef, { stock: currentInv.stock + oldItem.qty });
            }
        }

        let newRevenue = 0;
        let newCOGS = 0;
        let tempStockMap = {};
        inventory.forEach(i => tempStockMap[i.id] = i.stock);
        originalOrder.items.forEach(i => {
            if(tempStockMap[i.itemId] !== undefined) tempStockMap[i.itemId] += i.qty;
        });

        for (const newItem of newItemList) {
            const itemRef = getStoreDoc("inventory", newItem.itemId);
            const currentAvgCost = inventory.find(i => i.id === newItem.itemId)?.avgCost || 0;
            
            if(tempStockMap[newItem.itemId] < newItem.qty) throw new Error(`Stok ${newItem.name} kurang!`);

            tempStockMap[newItem.itemId] -= newItem.qty;
            batch.update(itemRef, { stock: tempStockMap[newItem.itemId] });

            newRevenue += newItem.subtotal;
            newCOGS += (currentAvgCost * newItem.qty);
        }

        const newGrossProfit = newRevenue - newCOGS;
        const currentExpenseTotal = originalOrder.financials.expenseTotal || 0;
        
        const orderRef = getStoreDoc("orders", originalOrder.id);
        const updatedOrderData = {
            ...metadata,
            items: newItemList,
            "financials.revenue": newRevenue,
            "financials.cogs": newCOGS,
            "financials.grossProfit": newGrossProfit,
            "financials.netProfit": newGrossProfit - currentExpenseTotal
        };

        batch.update(orderRef, updatedOrderData);
        await batch.commit();
        alert("Nota berhasil diupdate!");
        setEditingOrder(null);
    } catch (e) { alert("Gagal: " + e.message); }
  };

  const handleQuickPay = async (orderId) => {
      if(!window.confirm("Tandai nota ini sebagai LUNAS?")) return;
      try {
          await updateDoc(getStoreDoc("orders", orderId), { paymentStatus: 'Lunas' });
          alert("Status diperbarui menjadi Lunas.");
      } catch (e) { alert("Gagal update: " + e.message); }
  }

  const handleUpdateOrderExpenses = async (orderId, newExpensesList) => {
    if (!activeStoreId) return;
    try {
        const orderRef = getStoreDoc("orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if(!orderSnap.exists()) return alert("Nota hilang");
        
        const orderData = orderSnap.data();
        const totalExp = newExpensesList.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const newNetProfit = orderData.financials.grossProfit - totalExp;

        await updateDoc(orderRef, {
            expenses: newExpensesList,
            "financials.expenseTotal": totalExp,
            "financials.netProfit": newNetProfit
        });
        alert("Biaya nota diperbarui!");
        return true;
    } catch (e) { alert("Gagal: " + e.message); return false; }
  };

  const handleDeleteOrder = async (order) => {
    if (!activeStoreId) return;
    if (!window.confirm("Hapus Nota? Stok akan dikembalikan.")) return;
    try {
      const batch = writeBatch(db);
      for (const item of order.items) {
        const itemRef = getStoreDoc("inventory", item.itemId);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          batch.update(itemRef, { stock: itemSnap.data().stock + item.qty });
        }
      }
      batch.delete(getStoreDoc("orders", order.id));
      await batch.commit();
      alert("Nota dihapus.");
    } catch (error) { alert("Gagal: " + error.message); }
  };

  const handlePrint = (order, sequentialNumber) => {
      // Set data print
      setPrintOrder({...order, sequentialNumber});
      
      // Kasih delay biar React nge-render dulu struknya baru dialog print muncul
      setTimeout(() => {
          window.print();
          // Optional: setPrintOrder(null) kalo mau auto close preview setelah print
          // Tapi user biasanya suka liat preview dulu.
      }, 500); 
  };

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
      if(!window.confirm("Hapus catatan penarikan ini?")) return;
      await deleteDoc(getStoreDoc("withdrawals", id));
  }

  const stats = useMemo(() => {
    const salesRevenue = orders.reduce((acc, o) => acc + (o.financials?.revenue || 0), 0);
    const salesGrossProfit = orders.reduce((acc, o) => acc + (o.financials?.grossProfit || 0), 0);
    const totalCOGS = orders.reduce((acc, o) => acc + (o.financials?.cogs || 0), 0); 
    const orderExpenses = orders.reduce((acc, o) => acc + (o.financials?.expenseTotal || 0), 0);
    const generalExpTotal = generalExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    const netProfitGlobal = salesGrossProfit - orderExpenses - generalExpTotal;
    
    const totalWithdrawals = withdrawals.reduce((acc, w) => acc + (parseFloat(w.amount) || 0), 0);
    
    const paidOrders = orders.filter(o => o.paymentStatus === 'Lunas');
    const totalOmzetLunas = paidOrders.reduce((acc, o) => acc + (o.financials?.revenue || 0), 0);
    
    const cashOnHand = totalOmzetLunas - orderExpenses - generalExpTotal - totalWithdrawals;

    const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
    const outStock = inventory.filter(i => i.stock <= 0).length;
    const totalAssetValue = inventory.reduce((acc, i) => acc + (i.stock * i.avgCost), 0); 

    return { 
        salesRevenue, 
        salesGrossProfit, 
        totalCOGS, 
        orderExpenses, 
        generalExpTotal, 
        netProfitGlobal, 
        lowStock, 
        outStock,
        totalAssetValue,
        totalWithdrawals,
        cashOnHand 
    };
  }, [orders, generalExpenses, inventory, withdrawals]);

  // --- CHART COMPONENT ---
  const SimpleChart = ({ data }) => {
    const chartData = useMemo(() => {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            
            const dateStr = d.toLocaleDateString('id-ID'); 
            const labelStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            
            const dailyRevenue = data.filter(o => {
                let orderDateObj;
                if (o.date && o.date.seconds) {
                    orderDateObj = new Date(o.date.seconds * 1000);
                } else if (o.date) {
                    orderDateObj = new Date(o.date);
                } else {
                    return false;
                }
                return orderDateObj.toLocaleDateString('id-ID') === dateStr;
            }).reduce((sum, o) => sum + (o.financials?.revenue || 0), 0);

            last7Days.push({ label: labelStr, value: dailyRevenue });
        }
        return last7Days;
    }, [data]);

    const maxValue = Math.max(...chartData.map(d => d.value), 100000);

    return (
        <div className="h-48 flex items-end justify-between gap-2 pt-6">
            {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 group relative h-full justify-end">
                    <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {formatCurrency(d.value)}
                    </div>
                    <div 
                        className="w-full bg-pink-200 rounded-t-lg hover:bg-pink-500 transition-all duration-500 relative overflow-hidden min-h-[4px]"
                        style={{ height: `${(d.value / maxValue) * 100}%` }}
                    >
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-300 opacity-50"></div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    );
  };

  // --- SCANNER COMPONENT ---
  const CameraScanner = ({ onScanSuccess, onClose }) => {
      const [lastScanned, setLastScanned] = useState(null);
      const scanLockRef = useRef(false); // Lock biar gak spam scan

      useEffect(() => {
        if(!window.Html5QrcodeScanner) {
            alert("Library Scanner belum siap. Coba refresh halaman.");
            onClose();
            return;
        }

        const scanner = new window.Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // CEK LOCK: Jika sedang cooldown, abaikan scan ini
                if (scanLockRef.current) return;

                // AKTIFKAN LOCK
                scanLockRef.current = true;

                if (navigator.vibrate) navigator.vibrate(200);
                setLastScanned(decodedText);
                onScanSuccess(decodedText);
                
                // BUKA LOCK SETELAH 1.5 DETIK (Cooldown)
                setTimeout(() => {
                    setLastScanned(null);
                    scanLockRef.current = false; 
                }, 1500);
            },
            (errorMessage) => {
                // ignore errors during scanning
            }
        );

        return () => {
            try { scanner.clear(); } catch(e) { console.log("Scanner cleanup", e) }
        }
      }, []);

      return (
          <div className="fixed inset-0 z-[80] bg-black/80 flex flex-col items-center justify-center p-4">
               <div className="bg-white p-4 rounded-3xl w-full max-w-sm relative">
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-gray-100 rounded-full text-gray-600"><X size={20}/></button>
                    <h3 className="font-bold text-center mb-4">Scan Barcode Barang</h3>
                    
                    <div className="relative">
                        <div id="reader" className="w-full rounded-xl overflow-hidden"></div>
                        {lastScanned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 z-20 animate-fade-in backdrop-blur-sm">
                                <div className="text-white text-center">
                                    <CheckCircle size={48} className="mx-auto mb-2"/>
                                    <h4 className="font-bold text-xl">Berhasil!</h4>
                                    <p className="text-sm">{lastScanned}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <p className="text-center text-xs text-gray-500 mt-4">Arahkan kamera ke barcode barang.</p>
               </div>
          </div>
      )
  }

  // --- EDIT RESTOCK MODAL ---
  const EditRestockModal = () => {
      if(!editingRestock) return null;

      const [formData, setFormData] = useState({
          itemName: editingRestock.itemName || '',
          barcode: editingRestock.barcode || '',
          category: editingRestock.category || 'Umum',
          qty: editingRestock.qty || 0,
          unit: editingRestock.unit || 'pcs',
          pricePerUnit: editingRestock.pricePerUnit || 0,
          supplier: editingRestock.supplier || '',
          sellPrice: '',
          // TAMBAHAN: State untuk Tanggal
          inputDate: editingRestock.inputDate || new Date().toISOString().slice(0, 16) 
      });

      useEffect(() => {
          const item = inventory.find(i => i.id === editingRestock.itemId);
          if(item) {
              setFormData(prev => ({...prev, sellPrice: item.sellPrice || item.lastPrice || ''}));
          }
      }, []);

      const handleSave = () => {
          if(!formData.itemName || !formData.qty || !formData.pricePerUnit) return alert("Lengkapi data!");
          handleUpdateRestock(editingRestock.id, formData);
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button onClick={() => setEditingRestock(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18}/></button>
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Edit Data Masuk</h3>
                    <p className="text-xs text-gray-500">Koreksi typo, tanggal, atau harga.</p>
                </div>
                
                <div className="space-y-4">
                    {/* TAMBAHAN: Input Tanggal */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Tanggal Masuk</label>
                        <input type="datetime-local" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.inputDate} onChange={e => setFormData({...formData, inputDate: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Nama Barang</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Barcode</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Scan/Ketik..." />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Kategori</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                          </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Jumlah</label>
                            <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Harga Beli / Unit</label>
                            <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: e.target.value})} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-pink-500 ml-1">Harga Jual (Update)</label>
                        <input type="number" className="w-full p-3 bg-pink-50 border border-pink-100 rounded-xl font-bold text-pink-700" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} placeholder="Rp..." />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Supplier</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-700">
                        <AlertTriangle size={14} className="inline mr-1"/>
                        Mengubah jumlah/harga akan otomatis menyesuaikan stok & HPP gudang.
                    </div>

                    <button onClick={handleSave} className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-200">
                        Simpan Perubahan
                    </button>
                </div>
             </div>
        </div>
      )
  }

  // --- NEW: USER PROFILE MODAL ---
  const UserProfileModal = () => {
    if(!showProfileEdit) return null;
    
    // Local State for Tabs
    const [activeTab, setActiveTab] = useState('pribadi'); // pribadi, keamanan, toko
    
    // Form States
    // Priority: Store Profile (Firestore) -> Auth Profile (User)
    const [displayName, setDisplayName] = useState(storeProfile?.ownerName || user?.displayName || '');
    const [phoneNumber, setPhoneNumber] = useState(storeProfile?.phoneNumber || '');
    const [photo, setPhoto] = useState(storeProfile?.photoURL || user?.photoURL || '');
    const [storeName, setStoreName] = useState(storeProfile?.storeName || '');
    const [storeAddress, setStoreAddress] = useState(storeProfile?.storeAddress || '');
    const [newPassword, setNewPassword] = useState('');

    // Handle Photo Upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            // Firestore doc limit is 1MB. Base64 adds ~33% size. 
            // So file must be smaller than ~700KB.
            if(file.size > 700000) return alert("Ukuran foto terlalu besar! Maksimal 700KB agar muat di database.");
            
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result);
            reader.readAsDataURL(file);
        }
    }

    const isOwner = activeStoreId === user?.uid;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in">
             <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
                {/* Header Gradient */}
                <div className="h-24 bg-gradient-to-r from-pink-500 to-rose-400 absolute top-0 left-0 right-0 z-0"></div>
                
                {/* FIXED: Z-INDEX 50 so it's clickable above the header */}
                <button onClick={() => setShowProfileEdit(false)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm z-50 transition-all"><X size={20}/></button>

                {/* Profile Header */}
                <div className="relative z-10 px-6 pt-12 pb-4 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg mb-3 relative group cursor-pointer">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                             {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover"/> : <User size={40} className="text-gray-300"/>}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold cursor-pointer">
                             <Upload size={16} className="mb-1"/>
                             <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                        {/* Status Badge */}
                        <div className={`absolute bottom-0 right-0 border-2 border-white rounded-full p-1.5 ${isOwner ? 'bg-blue-500' : 'bg-gray-500'}`} title={isOwner ? "Owner" : "Staff"}>
                            {isOwner ? <Store size={12} className="text-white"/> : <User size={12} className="text-white"/>}
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{displayName || 'Tanpa Nama'}</h3>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOwner ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {isOwner ? 'Pemilik Toko' : 'Karyawan'}
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 gap-6">
                    <button onClick={()=>setActiveTab('pribadi')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab==='pribadi' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        Data Diri
                        {activeTab==='pribadi' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-t-full"></div>}
                    </button>
                    <button onClick={()=>setActiveTab('keamanan')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab==='keamanan' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        Keamanan
                        {activeTab==='keamanan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-t-full"></div>}
                    </button>
                    <button onClick={()=>setActiveTab('toko')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab==='toko' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        Info Toko
                        {activeTab==='toko' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-t-full"></div>}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {activeTab === 'pribadi' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Nama Panggilan</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                                    <input className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">No. Handphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                                    <input className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium" placeholder="08..." value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Email (Tidak bisa diubah)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                                    <input className="w-full pl-10 p-3 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-500" value={user?.email} disabled />
                                </div>
                            </div>
                            <button onClick={() => handleUpdateUserProfile(displayName, photo, phoneNumber)} className="w-full py-3 mt-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">Simpan Perubahan</button>
                        </div>
                    )}

                    {activeTab === 'keamanan' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                                <Shield className="text-yellow-600 shrink-0" size={20}/>
                                <p className="text-xs text-yellow-700">Untuk keamanan, ganti kata sandi secara berkala. Anda mungkin perlu login ulang setelah ini.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Kata Sandi Baru</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                                    <input type="password" className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium" placeholder="Minimal 6 karakter" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
                                </div>
                            </div>
                            <button onClick={() => handleChangePassword(newPassword)} disabled={!newPassword} className="w-full py-3 mt-2 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-200 transition-all disabled:bg-gray-300">Update Password</button>
                        </div>
                    )}

                    {activeTab === 'toko' && (
                        <div className="space-y-4 animate-fade-in">
                            {!isOwner && <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-600 border border-blue-100">Anda login sebagai staff. Informasi toko hanya bisa diubah oleh pemilik.</div>}
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Nama Toko</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                                    <input disabled={!isOwner} className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium disabled:bg-gray-100" value={storeName} onChange={e=>setStoreName(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Alamat / Lokasi</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16}/>
                                    <input disabled={!isOwner} className="w-full pl-10 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm font-medium disabled:bg-gray-100" placeholder="Contoh: Jl. Mawar No. 12" value={storeAddress} onChange={e=>setStoreAddress(e.target.value)} />
                                </div>
                            </div>
                            {isOwner && <button onClick={() => handleUpdateStoreProfile(storeName, storeAddress)} className="w-full py-3 mt-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all">Simpan Info Toko</button>}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all text-sm shadow-sm">
                        <LogOut size={16}/> Keluar Akun (Sign Out)
                    </button>
                </div>
             </div>
        </div>
    )
  }

  // --- MODAL COMPONENTS ---

  const ConnectStoreModal = () => {
      const [inputStoreId, setInputStoreId] = useState('');
      const [storeName, setStoreName] = useState(storeProfile?.storeName || '');
      const [customAlias, setCustomAlias] = useState(storeProfile?.customAlias || '');
      const [loadingAlias, setLoadingAlias] = useState(false);
      
      const isOwner = activeStoreId === user?.uid;

      const handleSaveProfile = async () => {
          if (!isOwner) return;
          try {
              // 1. Simpan Profile di User Settings
              const profileRef = doc(db, "artifacts", appId, "users", user.uid, "settings", "profile");
              await setDoc(profileRef, { 
                  storeName: storeName,
                  customAlias: customAlias,
                  updatedAt: serverTimestamp()
              }, { merge: true });

              // 2. Jika ada alias, simpan di public lookup
              if (customAlias) {
                  setLoadingAlias(true);
                  const aliasId = customAlias.toLowerCase().replace(/\s+/g, '-');
                  const aliasRef = doc(db, "artifacts", appId, "public", "data", "store_aliases", aliasId);
                  
                  // Cek apakah alias sudah diambil orang lain
                  const snap = await getDoc(aliasRef);
                  if (snap.exists() && snap.data().ownerUid !== user.uid) {
                      alert("Maaf, ID Custom ini sudah dipakai toko lain. Cari yang lain ya!");
                      setLoadingAlias(false);
                      return;
                  }

                  await setDoc(aliasRef, {
                      ownerUid: user.uid,
                      storeName: storeName
                  });
                  setLoadingAlias(false);
              }
              alert("Pengaturan Toko Disimpan!");
          } catch (e) {
              alert("Gagal simpan: " + e.message);
              setLoadingAlias(false);
          }
      };

      return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                  <button onClick={() => setShowStoreModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18}/></button>
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users size={32}/>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Hubungkan Tim</h3>
                      <p className="text-sm text-gray-500 mt-2">
                          Kelola koneksi tim atau masuk ke toko lain.
                      </p>
                  </div>

                  {isOwner ? (
                      <div className="space-y-4 mb-6 border-b border-gray-100 pb-6">
                          <h4 className="font-bold text-gray-800 text-sm bg-pink-50 p-2 rounded-lg text-center">Pengaturan Toko Saya</h4>
                          
                          <div>
                              <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">Nama Toko (Untuk Dashboard)</label>
                              <input 
                                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                                  placeholder="Contoh: Mutiara Store Pusat"
                                  value={storeName}
                                  onChange={e => setStoreName(e.target.value)}
                              />
                          </div>

                          <div>
                              <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">ID Custom / Alias (Opsional)</label>
                              <div className="flex gap-2">
                                <input 
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                                    placeholder="Contoh: mutiara-pusat"
                                    value={customAlias}
                                    onChange={e => setCustomAlias(e.target.value)}
                                />
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">Buat ID pendek agar karyawan mudah login (tanpa copas ID panjang).</p>
                          </div>

                          <button onClick={handleSaveProfile} className="w-full py-2 bg-gray-800 text-white text-xs font-bold rounded-xl hover:bg-gray-700">
                              {loadingAlias ? "Menyimpan..." : "Simpan Info Toko"}
                          </button>

                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-4">
                              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">ID Asli (Backup)</label>
                              <div className="flex gap-2 items-center">
                                  <code className="text-xs text-gray-600 truncate flex-1">{user?.uid}</code>
                                  <button onClick={() => {navigator.clipboard.writeText(user?.uid); alert("Disalin!");}} className="p-1 bg-white border rounded hover:text-pink-600"><Copy size={14}/></button>
                              </div>
                          </div>
                      </div>
                  ) : null}

                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Masuk ke Toko Lain (Untuk Karyawan)</label>
                          <input 
                              className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                              placeholder="Masukkan ID Custom atau ID Asli Bos..."
                              value={inputStoreId}
                              onChange={(e) => setInputStoreId(e.target.value)}
                          />
                      </div>
                      <button 
                          onClick={() => handleConnectStore(inputStoreId)}
                          disabled={!inputStoreId}
                          className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-200"
                      >
                          Sambungkan Sekarang
                      </button>
                      
                      {!isOwner && (
                          <button 
                              onClick={() => handleConnectStore(null)}
                              className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                          >
                              Kembali ke Toko Pribadi Saya
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )
  }

  // --- MODAL TARIK TUNAI ---
  const WithdrawalModal = ({ onClose }) => {
      const [amount, setAmount] = useState('');
      const [note, setNote] = useState('');
      const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

      const handleSubmit = () => {
          if(!amount) return alert("Isi jumlah uang!");
          handleWithdrawal({
              amount: parseFloat(amount),
              note: note || 'Penarikan Modal/Prive',
              date: date,
              user: user.displayName || 'Staff'
          });
          setAmount(''); setNote('');
          onClose();
      }

      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18}/></button>
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gray-200">
                        <HandCoins size={28}/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Tarik Uang / Modal</h3>
                    <p className="text-xs text-gray-500">Ambil uang dari laci untuk keperluan pribadi atau simpanan bos.</p>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Jumlah Penarikan</label>
                        <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-300 font-bold text-lg" placeholder="Rp 0" value={amount} onChange={e=>setAmount(e.target.value)} autoFocus/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Keterangan</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-300" placeholder="Cth: Ambil Modal Balik, Gaji Bos" value={note} onChange={e=>setNote(e.target.value)}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Tanggal</label>
                        <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={date} onChange={e=>setDate(e.target.value)}/>
                    </div>
                    <button onClick={handleSubmit} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200">
                        Konfirmasi Ambil Uang
                    </button>
                </div>

                <div className="border-t border-gray-100 pt-4 flex-1 overflow-hidden flex flex-col">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Riwayat Penarikan Terakhir</h4>
                    <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-1">
                        {withdrawals.map(w => (
                           <div key={w.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg text-sm">
                               <div>
                                   <div className="font-bold text-gray-800">{w.note}</div>
                                   <div className="text-[10px] text-gray-400">{formatDate(w.date)}</div>
                               </div>
                               <div className="text-right">
                                   <div className="font-bold text-red-500">-{formatCurrency(w.amount)}</div>
                                   <button onClick={() => handleDeleteWithdrawal(w.id)} className="text-[9px] text-gray-400 underline hover:text-red-500">Hapus</button>
                               </div>
                           </div>
                        ))}
                        {withdrawals.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Belum ada riwayat.</p>}
                    </div>
                </div>
            </div>
        </div>
      )
  }

  const EditOrderModal = () => {
      if (!editingOrder) return null;
      
      const [formData, setFormData] = useState({
          customerName: editingOrder.customerName,
          date: typeof editingOrder.date === 'string' ? editingOrder.date : new Date(editingOrder.date.seconds * 1000).toISOString().slice(0, 16),
          paymentMethod: editingOrder.paymentMethod || 'Cash',
          paymentStatus: editingOrder.paymentStatus || 'Lunas',
          notes: editingOrder.notes || ''
      });

      const [editItems, setEditItems] = useState(
        editingOrder.items.map(i => ({...i})) 
      );
      
      const [newItemId, setNewItemId] = useState('');

      const handleQtyChange = (idx, newQty) => {
          const updated = [...editItems];
          updated[idx].qty = parseFloat(newQty);
          updated[idx].subtotal = updated[idx].qty * updated[idx].price;
          setEditItems(updated);
      };

      const handlePriceChange = (idx, newPrice) => {
          const updated = [...editItems];
          updated[idx].price = parseFloat(newPrice);
          updated[idx].subtotal = updated[idx].qty * updated[idx].price;
          setEditItems(updated);
      };

      const handleDeleteItem = (idx) => {
          if(window.confirm("Hapus item ini dari nota?")) {
              setEditItems(editItems.filter((_, i) => i !== idx));
          }
      };

      const handleAddItem = () => {
          if(!newItemId) return;
          const invItem = inventory.find(i => i.id === newItemId);
          if(!invItem) return;

          const existIdx = editItems.findIndex(i => i.itemId === newItemId);
          if(existIdx >= 0) {
              const updated = [...editItems];
              updated[existIdx].qty += 1;
              updated[existIdx].subtotal = updated[existIdx].qty * updated[existIdx].price;
              setEditItems(updated);
          } else {
              setEditItems([...editItems, {
                  itemId: invItem.id,
                  name: invItem.name,
                  qty: 1,
                  unit: invItem.unit,
                  price: invItem.sellPrice || invItem.lastPrice || 0,
                  subtotal: invItem.sellPrice || invItem.lastPrice || 0,
                  costBasis: invItem.avgCost
              }]);
          }
          setNewItemId('');
      };

      const grandTotal = editItems.reduce((sum, i) => sum + i.subtotal, 0);

      const handleSave = () => {
          if(editItems.length === 0) return alert("Nota tidak boleh kosong itemnya!");
          handleFullUpdateOrder(editingOrder, editItems, formData);
      };

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Edit Transaksi</h3>
                        <p className="text-xs text-gray-500">Nota #{editingOrder.id.slice(-4).toUpperCase()}</p>
                      </div>
                      <button onClick={() => setEditingOrder(null)} className="p-2 bg-white rounded-full hover:bg-gray-200 shadow-sm"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Customer</label>
                              <input 
                                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                                  value={formData.customerName}
                                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Tanggal</label>
                              <input 
                                  type="datetime-local"
                                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                                  value={formData.date}
                                  onChange={e => setFormData({...formData, date: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Status</label>
                              <select 
                                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                                  value={formData.paymentStatus}
                                  onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                              >
                                  <option value="Lunas">Lunas</option>
                                  <option value="Belum Lunas">Belum Lunas</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Metode</label>
                              <select 
                                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                                  value={formData.paymentMethod}
                                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                              >
                                  <option value="Cash">Cash</option>
                                  <option value="QRIS">QRIS</option>
                                  <option value="Transfer">Transfer</option>
                                  <option value="Hutang">Hutang</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-end mb-2 border-b border-gray-100 pb-2">
                            <label className="text-sm font-bold text-gray-700">Item Pesanan</label>
                            <div className="flex gap-2 w-1/2">
                                <select 
                                    className="w-full p-2 text-xs bg-gray-50 border rounded-lg"
                                    value={newItemId}
                                    onChange={e => setNewItemId(e.target.value)}
                                >
                                    <option value="">+ Tambah Barang...</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                                <button onClick={handleAddItem} disabled={!newItemId} className="bg-pink-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-pink-700">Add</button>
                            </div>
                          </div>
                          
                          <div className="space-y-3 bg-gray-50 p-3 rounded-xl max-h-60 overflow-y-auto custom-scrollbar">
                              {editItems.map((item, idx) => (
                                  <div key={idx} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <div className="text-xs font-bold text-gray-700">{item.name}</div>
                                              <div className="text-[10px] text-gray-400">Unit: {item.unit}</div>
                                          </div>
                                          <button onClick={() => handleDeleteItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                          <div className="flex items-center bg-gray-50 rounded border px-1">
                                              <input type="number" className="w-12 p-1 text-xs bg-transparent text-center font-bold outline-none" 
                                                value={item.qty} onChange={e => handleQtyChange(idx, e.target.value)} />
                                          </div>
                                          <div className="text-xs text-gray-400">x</div>
                                          <div className="flex-1 bg-gray-50 rounded border px-1">
                                                <input type="number" className="w-full p-1 text-xs bg-transparent text-right outline-none" 
                                                value={item.price} onChange={e => handlePriceChange(idx, e.target.value)} />
                                          </div>
                                          <div className="font-bold text-xs text-pink-600 min-w-[60px] text-right">
                                                {formatCurrency(item.subtotal)}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              {editItems.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Tidak ada barang.</p>}
                          </div>
                          <div className="flex justify-end mt-2 text-lg font-bold text-gray-800">
                              Total Baru: <span className="text-pink-600 ml-2">{formatCurrency(grandTotal)}</span>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">Catatan</label>
                          <textarea 
                              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                              rows="2"
                              value={formData.notes}
                              onChange={e => setFormData({...formData, notes: e.target.value})}
                          />
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-3xl">
                      <button onClick={() => setEditingOrder(null)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100">Batal</button>
                      <button onClick={handleSave} className="flex-[2] py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 flex justify-center items-center gap-2">
                        <Save size={18}/> Simpan & Update Stok
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const LoginPage = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const [isSignUp, setIsSignUp] = useState(false);
      const [rememberMe, setRememberMe] = useState(true);

      const handleSubmit = async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
              // Atur persistensi sebelum login
              await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
              
              if (isSignUp) {
                  await createUserWithEmailAndPassword(auth, email, password);
                  alert("Akun berhasil dibuat! Silakan masuk.");
              } else {
                  await signInWithEmailAndPassword(auth, email, password);
              }
          } catch (error) {
              alert((isSignUp ? "Daftar Gagal: " : "Login Gagal: ") + error.message);
          }
          setLoading(false);
      };

      const handleGoogleLogin = async () => {
          setLoading(true);
          try {
              // Atur persistensi sebelum login
              await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
              await signInWithPopup(auth, googleProvider);
          } catch (error) {
              console.error("Login Error:", error);
              let msg = "Login Google Gagal: " + error.message;
              if (error.code === 'auth/operation-not-allowed') msg = "Provider Google belum aktif.";
              else if (error.code === 'auth/popup-closed-by-user') msg = "Login dibatalkan.";
              else if (error.code === 'auth/unauthorized-domain') msg = "Domain belum diizinkan.";
              alert(msg);
          }
          setLoading(false);
      }

      return (
        <div className="fixed inset-0 z-[60] bg-gradient-to-br from-pink-50 to-white flex flex-col items-center justify-center p-6 animate-fade-in text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-pink-600 to-rose-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-pink-200 mb-8 animate-bounce-slow">
                <ShoppingBasket size={48} strokeWidth={2}/>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">Mutiara <span className="text-pink-600">Store</span></h1>
            <p className="text-gray-500 text-sm mb-8 max-w-sm">
                {isSignUp ? "Buat akun baru untuk mengelola toko Anda sendiri." : "Login duls yuu buat mengelola toko. Nanti kamu juga bisa terhubung satu sama lain! (Ada mode bos & karyawan)"}
            </p>
            
            <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-pink-100 border border-pink-50 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                        <input type="email" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}/>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                        <input type="password" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}/>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe ? <CheckSquare size={20} className="text-pink-600"/> : <Square size={20} className="text-gray-400"/>}
                        <span>Ingat Saya (Tetap Login)</span>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-pink-600 transition-all shadow-lg hover:shadow-pink-300 flex justify-center items-center gap-2">
                        {loading ? 'Memproses...' : (isSignUp ? <><UserPlus size={18}/> Daftar Akun</> : <><LogIn size={18}/> Masuk Aplikasi</>)}
                    </button>
                </form>
                
                <div className="flex items-center gap-4 my-2"><div className="h-px bg-gray-100 flex-1"></div><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atau masuk dengan</span><div className="h-px bg-gray-100 flex-1"></div></div>
                
                <div className="flex justify-center">
                    <button 
                        onClick={handleGoogleLogin} 
                        disabled={loading} 
                        className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center group"
                        title="Masuk dengan Google"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                    </button>
                </div>

                <div className="pt-2"><button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-pink-600 font-bold hover:underline">{isSignUp ? "Sudah punya akun? Login disini" : "Belum punya akun? Daftar sekarang"}</button></div>
            </div>
            <div className="absolute bottom-8 text-gray-400 text-xs">&copy; 2026 Mutiara Store Management System v5.1 (Direct Edit & Delete)</div>
        </div>
      );
  };

  const Dashboard = () => {
    const [showWithdraw, setShowWithdraw] = useState(false);

    return (
    <div className="space-y-8 pb-24 md:pb-0 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Halo, {storeProfile?.ownerName || user?.displayName || user?.email?.split('@')[0]}! 👋</h2>
            <div className="text-gray-500 text-sm font-medium flex gap-2 items-center">
               <Store size={14}/> {storeProfile?.storeName || 'Toko Saya'}
               {activeStoreId !== user?.uid && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">MODE KARYAWAN</span>}
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={() => setShowStoreModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 text-pink-600 rounded-xl font-bold text-sm hover:bg-pink-50 transition-all shadow-sm">
                  <Users size={18}/> {activeStoreId === user?.uid ? "Tim" : "Ganti Toko"}
             </button>
             {/* Profile Avatar Button */}
             <button onClick={() => setShowProfileEdit(true)} className="relative group">
                 <div className="w-10 h-10 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden flex items-center justify-center">
                     {/* PREFER STORE PROFILE PHOTO FIRST */}
                     {storeProfile?.photoURL ? <img src={storeProfile.photoURL} className="w-full h-full object-cover"/> : <User size={24} className="text-pink-400"/>}
                 </div>
                 <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
             </button>
          </div>
      </div>
      
      {/* --- BAGIAN 1: STATISTIK UTAMA (Omzet, Profit, Exp, Net) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 rounded-3xl shadow-lg shadow-pink-200 text-white relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
           <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={80}/></div>
           <div className="text-pink-100 font-medium text-sm uppercase tracking-wider mb-2">Total Omzet</div>
           <h3 className="text-3xl font-bold">{formatCurrency(stats.salesRevenue)}</h3>
           <p className="text-pink-100 text-xs mt-2 opacity-80">Pendapatan Kotor</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg transition-all group hover:scale-[1.02] duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl group-hover:bg-pink-600 group-hover:text-white transition-colors"><Wallet size={24}/></div>
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Profit</span>
           </div>
           <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.salesGrossProfit)}</h3>
           <p className="text-xs text-gray-400 mt-1">Laba Kotor (Jual - Modal)</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg transition-all group hover:scale-[1.02] duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors"><Truck size={24}/></div>
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Expenses</span>
           </div>
           <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</h3>
           <p className="text-xs text-gray-400 mt-1">Total Pengeluaran & Ops</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-lg transition-all group hover:scale-[1.02] duration-300">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors"><DollarSign size={24}/></div>
             <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Net Profit</span>
           </div>
           <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.netProfitGlobal)}</h3>
           <p className="text-xs text-gray-400 mt-1">Laba Bersih Toko</p>
        </div>
      </div>

      {/* --- BAGIAN 2: INFO MODAL & STOK --- */}
      <h3 className="text-lg font-bold text-gray-800 mt-2">Info Modal & Stok</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 hover:shadow-lg transition-all group">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Archive size={24}/></div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">ASET GUDANG</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalAssetValue)}</h3>
              <p className="text-sm text-gray-500 mt-2">Nilai uang barang yang <b>belum terjual</b> (Stok x Harga Beli).</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 hover:shadow-lg transition-all group">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Layers size={24}/></div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">MODAL TERJUAL (HPP)</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalCOGS)}</h3>
              <p className="text-sm text-gray-500 mt-2">Total modal yang sudah <b>kembali</b> dari hasil penjualan.</p>
          </div>
      </div>

      {/* --- BAGIAN 3: DOMPET TOKO (NEW BLACK CARD) --- */}
      {/* Posisi dibawah info modal & stok sesuai request */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
           <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120}/></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
               <div>
                   <div className="flex items-center gap-2 mb-1 text-gray-300">
                       <Wallet size={18}/> <span className="text-xs font-bold uppercase tracking-wider">Dompet Toko (Saldo Real)</span>
                   </div>
                   <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{formatCurrency(stats.cashOnHand)}</h1>
                   <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                       <span>Omzet Lunas: <span className="text-white">{formatCurrency(stats.salesRevenue)}</span></span>
                       <span className="hidden md:inline">•</span>
                       <span>Expenses: <span className="text-white">-{formatCurrency(stats.orderExpenses + stats.generalExpTotal)}</span></span>
                       <span className="hidden md:inline">•</span>
                       <span>Ditarik: <span className="text-orange-300">-{formatCurrency(stats.totalWithdrawals)}</span></span>
                   </div>
               </div>
               <button onClick={() => setShowWithdraw(true)} className="w-full md:w-auto px-6 py-3 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2">
                   <HandCoins size={18}/> Ambil Uang / Modal
               </button>
           </div>
      </div>

      {/* --- BAGIAN 4: CHART --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 mt-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-pink-600"/>
                <h3 className="font-bold text-lg text-gray-800">Tren Penjualan (7 Hari Terakhir)</h3>
            </div>
            <div className="text-xs text-gray-400">Update Realtime</div>
          </div>
          <SimpleChart data={orders} />
      </div>

      {/* --- BAGIAN 5: TRANSAKSI & STATUS GUDANG --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-pink-50 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-pink-50 flex justify-between items-center">
             <h3 className="font-bold text-lg text-gray-800">Transaksi Terakhir</h3>
             <button onClick={()=>setActiveTab('history')} className="text-sm font-bold text-pink-600 hover:underline flex items-center gap-1">Lihat Semua <ArrowRight size={14}/></button>
           </div>
           <div className="divide-y divide-gray-50">
             {orders.slice(0, 5).map(o => (
               <div key={o.id} className="p-4 hover:bg-pink-50/30 transition-colors flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                      <FileText size={18}/>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{o.customerName || 'Pelanggan Umum'}</p>
                      <p className="text-xs text-gray-400">{formatDate(o.date)} &bull; {o.items.length} Barang</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(o.financials.revenue)}</p>
                    <p className="text-xs text-emerald-500 font-medium">+{formatCurrency(o.financials.netProfit)}</p>
                  </div>
               </div>
             ))}
             {orders.length === 0 && <div className="p-8 text-center text-gray-400">Belum ada transaksi.</div>}
           </div>
        </div>

        {/* STATUS GUDANG (Seperti V2 Lama) */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-50 p-6 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Status Gudang</h3>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-500" size={20}/>
                  <span className="text-sm font-medium text-red-700">Stok Habis</span>
                </div>
                <span className="font-bold text-xl text-red-700">{stats.outStock}</span>
              </div>
              <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="text-yellow-600" size={20}/>
                  <span className="text-sm font-medium text-yellow-700">Stok Menipis</span>
                </div>
                <span className="font-bold text-xl text-yellow-700">{stats.lowStock}</span>
              </div>
              <button onClick={()=>setActiveTab('inventory')} className="w-full py-3 mt-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors hover:shadow-lg">
                Cek Gudang
              </button>
            </div>
        </div>
      </div>

      {showWithdraw && <WithdrawalModal onClose={() => setShowWithdraw(false)} />}
    </div>
  )};

  const SalesPage = () => {
    const [cart, setCart] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [notes, setNotes] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash'); 
    const [paymentStatus, setPaymentStatus] = useState('Lunas');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    
    // Feature 2: Category Filter
    const [activeCategory, setActiveCategory] = useState('Semua');
    const categories = ['Semua', ...new Set(inventory.map(i => i.category || 'Umum'))];

    // Feature 3: Barcode Mode & Camera
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const barcodeInputRef = useRef(null);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false); // New: Scan indicator

    const filteredInventory = inventory.filter(i => {
        if(activeCategory === 'Semua') return true;
        return (i.category || 'Umum') === activeCategory;
    });

    const selectedItemData = inventory.find(i => i.id === selectedItemId);

    // Auto focus barcode
    useEffect(() => {
        if (barcodeMode && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [barcodeMode]);

    const processBarcode = (scannedBarcode) => {
        const item = inventory.find(i => i.barcode === scannedBarcode);
        if(item) {
            if(item.stock <= 0) {
                alert("Stok Habis!");
            } else {
                // Getar & Indikator
                if (navigator.vibrate) navigator.vibrate(200);
                setScanSuccess(true);
                setTimeout(() => setScanSuccess(false), 2000);

                const priceToUse = item.sellPrice || item.lastPrice || item.avgCost; 

                // PERBAIKAN: Gunakan functional update (prevCart) agar data tidak tertimpa
                setCart(prevCart => {
                    const existIdx = prevCart.findIndex(c => c.itemId === item.id);
                    if(existIdx >= 0) {
                        // Jika barang sudah ada, update qty
                        const newCart = [...prevCart];
                        if(newCart[existIdx].quantity + 1 > item.stock) {
                            alert("Stok kurang!");
                            return prevCart; // Kembalikan cart lama jika stok habis
                        }
                        newCart[existIdx].quantity += 1;
                        newCart[existIdx].subtotal = newCart[existIdx].quantity * newCart[existIdx].price;
                        return newCart;
                    } else {
                        // Jika barang baru, tambahkan ke list
                        return [...prevCart, {
                            itemId: item.id,
                            itemName: item.name,
                            unit: item.unit,
                            quantity: 1,
                            price: parseFloat(priceToUse),
                            subtotal: parseFloat(priceToUse)
                        }];
                    }
                });
            }
            setBarcodeBuffer(''); // Clear
        } else {
            alert("Barang tidak ditemukan (Barcode: " + scannedBarcode + ")");
        }
    }

    const handleBarcodeScan = (e) => {
        if(e.key === 'Enter') {
            processBarcode(e.target.value);
        } else {
            setBarcodeBuffer(e.target.value);
        }
    }

    const addItem = () => {
      if (!selectedItemData || !qty || !price) return;
      if (selectedItemData.stock < parseFloat(qty)) return alert("Stok tidak cukup!");
      
      setCart([...cart, {
        itemId: selectedItemData.id,
        itemName: selectedItemData.name,
        unit: selectedItemData.unit,
        quantity: parseFloat(qty),
        price: parseFloat(price),
        subtotal: parseFloat(qty) * parseFloat(price)
      }]);
      setSelectedItemId(''); setQty(''); setPrice('');
    };

    // Helper untuk update cart langsung di list
    const updateCartItem = (idx, field, value) => {
        const newCart = [...cart];
        const val = parseFloat(value);
        
        if (field === 'quantity') {
             // Cek stok
             const itemInv = inventory.find(i => i.id === newCart[idx].itemId);
             if (itemInv && val > itemInv.stock) {
                 alert(`Stok hanya tersedia ${itemInv.stock}`);
                 return;
             }
        }

        newCart[idx][field] = isNaN(val) ? 0 : val;
        newCart[idx].subtotal = newCart[idx].quantity * newCart[idx].price;
        setCart(newCart);
    };

    const handleProcess = async () => {
       const success = await handleSaveOrder(cart, date, notes, customerName, paymentMethod, paymentStatus); 
       if(success) { 
           setCart([]); 
           setNotes(''); 
           setCustomerName(''); 
           setPaymentMethod('Cash');
           setPaymentStatus('Lunas');
       }
    };

    const totalCart = cart.reduce((sum, i) => sum + i.subtotal, 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 md:pb-0 animate-fade-in">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 border-b border-pink-50 pb-4">
                 <div className="flex items-center gap-3 w-full">
                     <div className="p-3 bg-pink-100 text-pink-600 rounded-xl"><ShoppingCart size={24}/></div>
                     <div><h3 className="font-bold text-xl text-gray-800">Kasir</h3><p className="text-xs text-gray-500">Input barang belanjaan cust kita gess!</p></div>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                     <button onClick={() => setShowCamera(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-blue-700 shadow-lg">
                         <Camera size={16}/> Scan Kamera
                     </button>
                     <button onClick={() => setBarcodeMode(!barcodeMode)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${barcodeMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>
                         <Scan size={16}/> {barcodeMode ? 'USB Mode ON' : 'USB Mode OFF'}
                     </button>
                 </div>
              </div>
              
              {barcodeMode && (
                  <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 relative">
                      <label className="text-xs font-bold text-purple-600 mb-1 block">Scan Barcode (USB/Bluetooth) Disini</label>
                      <input 
                        ref={barcodeInputRef}
                        className="w-full p-3 bg-white border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Klik disini lalu scan..."
                        value={barcodeBuffer}
                        onChange={(e) => setBarcodeBuffer(e.target.value)}
                        onKeyDown={handleBarcodeScan}
                        autoFocus
                      />
                      {scanSuccess && (
                          <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce flex items-center gap-1">
                              <Check size={12}/> Berhasil Masuk!
                          </div>
                      )}
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className="md:col-span-2">
                   <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                       {categories.map(cat => (
                           <button 
                             key={cat} 
                             onClick={() => setActiveCategory(cat)}
                             className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                           >
                               {cat}
                           </button>
                       ))}
                   </div>

                   <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Pilih Barang</label>
                   <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none transition-all max-w-full"
                     value={selectedItemId} onChange={e => {
                         setSelectedItemId(e.target.value);
                         const i = inventory.find(x => x.id === e.target.value);
                         if(i) setPrice(i.sellPrice || i.lastPrice || i.avgCost); // Auto-fill Selling Price
                     }}>
                     <option value="">-- Cari Barang --</option>
                     {filteredInventory.map(i => <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock} {i.unit})</option>)}
                   </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Jumlah</label>
                    <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none transition-all" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Harga Jual (Bisa Diedit)</label>
                    <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none transition-all" placeholder="Rp" value={price} onChange={e => setPrice(e.target.value)} />
                 </div>
              </div>
              <button onClick={addItem} disabled={!selectedItemId} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex justify-center items-center gap-2 hover:shadow-lg hover:-translate-y-1">
                <Plus size={20}/> Tambah ke Keranjang
              </button>
          </div>
        </div>

        <div className="lg:col-span-1">
           <div className="bg-white p-6 rounded-3xl shadow-lg shadow-pink-100 border border-pink-100 sticky top-6">
             <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Nota Penjualan</h3>
             <div className="space-y-3 mb-4">
                 <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-pink-300" placeholder="Nama Customer (Opsional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                 <input type="datetime-local" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-pink-300" value={date} onChange={e => setDate(e.target.value)} />
                 
                 <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><CreditCard size={12}/> METODE & STATUS</label>
                    <div className="flex gap-2">
                        <select 
                            className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-pink-300"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="Cash">Cash</option>
                            <option value="QRIS">QRIS</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Hutang">Hutang</option>
                        </select>
                        <select 
                            className={`flex-1 p-3 border rounded-xl text-sm outline-none font-bold ${paymentStatus === 'Lunas' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                            <option value="Lunas">Lunas</option>
                            <option value="Belum Lunas">Belum Lunas</option>
                        </select>
                    </div>
                 </div>
             </div>
             
             {/* LIST BARANG DI KERANJANG (DENGAN EDIT LANGSUNG) */}
             <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
                 {cart.map((item, idx) => (
                   <div key={idx} className="flex flex-col gap-2 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                     <div className="flex justify-between items-start">
                        <div className="font-bold text-gray-700 text-sm">{item.itemName}</div>
                        <button onClick={() => setCart(cart.filter((_,i)=>i!==idx))} className="text-red-400 text-xs hover:text-red-600 font-bold">Hapus</button>
                     </div>
                     
                     <div className="flex items-center gap-2">
                         <div className="flex items-center bg-white rounded-lg border border-pink-100 px-1">
                             <input 
                               type="number" 
                               className="w-10 p-1 text-xs bg-transparent text-center outline-none font-bold text-gray-600" 
                               value={item.quantity} 
                               onChange={e => updateCartItem(idx, 'quantity', e.target.value)}
                             />
                         </div>
                         <span className="text-xs text-gray-400">x</span>
                         <div className="flex-1 bg-white rounded-lg border border-pink-100 px-1 flex items-center">
                             <span className="text-[10px] text-gray-400 pl-1">Rp</span>
                             <input 
                               type="number" 
                               className="w-full p-1 text-xs bg-transparent outline-none font-medium text-gray-600" 
                               value={item.price} 
                               onChange={e => updateCartItem(idx, 'price', e.target.value)}
                             />
                         </div>
                     </div>
                     
                     <div className="text-right font-bold text-pink-700 text-sm">
                        {formatCurrency(item.subtotal)}
                     </div>
                   </div>
                 ))}
                 {cart.length === 0 && <div className="text-center text-gray-400 text-sm py-4 italic">Belum ada barang</div>}
             </div>

             <div className="flex justify-between text-xl font-bold text-gray-800 mb-6 border-t pt-4"><span>Total</span><span className="text-pink-600">{formatCurrency(totalCart)}</span></div>
             <button onClick={handleProcess} disabled={cart.length === 0} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 disabled:bg-gray-300 transition-all shadow-lg shadow-gray-200 hover:-translate-y-1">Simpan Transaksi</button>
           </div>
        </div>
        
        {showCamera && <CameraScanner onScanSuccess={processBarcode} onClose={() => setShowCamera(false)} />}
      </div>
    );
  };

  const ExpensesPage = () => {
    const [tab, setTab] = useState('nota'); 
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [tempExpenses, setTempExpenses] = useState([{ name: '', amount: '' }]);
    const [genDate, setGenDate] = useState(new Date().toISOString().slice(0, 10));
    const [genTitle, setGenTitle] = useState('');
    const [genAmount, setGenAmount] = useState('');

    const recentOrders = orders.slice(0, 50); 
    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    useEffect(() => {
        if(selectedOrder && selectedOrder.expenses) {
            setTempExpenses(selectedOrder.expenses.length > 0 ? selectedOrder.expenses : [{ name: '', amount: '' }]);
        } else {
            setTempExpenses([{ name: '', amount: '' }]);
        }
    }, [selectedOrderId, selectedOrder]);

    const handleExpChange = (index, field, value) => {
        const newExps = [...tempExpenses];
        newExps[index][field] = value;
        setTempExpenses(newExps);
    };

    const addExpRow = () => setTempExpenses([...tempExpenses, { name: '', amount: '' }]);
    const removeExpRow = (index) => {
        const newExps = tempExpenses.filter((_, i) => i !== index);
        setTempExpenses(newExps.length ? newExps : [{ name: '', amount: '' }]);
    };

    const saveBulkExpenses = async () => {
        if(!selectedOrderId) return;
        const cleanExpenses = tempExpenses.filter(e => e.name && e.amount);
        const success = await handleUpdateOrderExpenses(selectedOrderId, cleanExpenses);
        if(success) { alert("Semua biaya berhasil disimpan!"); }
    };

    const submitGenExp = () => {
        handleGeneralExpense({ date: genDate, title: genTitle, amount: parseFloat(genAmount) });
        setGenTitle(''); setGenAmount('');
    };

    return (
        <div className="pb-24 md:pb-0 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
               <div><h2 className="text-2xl font-bold text-gray-800">Pusat Biaya & Operasional</h2><p className="text-gray-500 text-sm">Kelola pengeluaran nota dan biaya umum toko</p></div>
               <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
                 <button onClick={()=>setTab('nota')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${tab==='nota' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>Biaya per Nota</button>
                 <button onClick={()=>setTab('umum')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${tab==='umum' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>Biaya Umum Toko</button>
               </div>
              </div>

              {tab === 'nota' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Truck size={24}/></div>
                             <h3 className="font-bold text-xl text-gray-800">Input Biaya Nota (Bulk)</h3>
                          </div>
                          <p className="text-sm text-gray-500 mb-6 bg-pink-50 p-4 rounded-xl border border-pink-100">Masukkin semua biaya operasional kita gesss (Bensin, Makan, Parkir).</p>
                          
                          <div className="space-y-5">
                             <div>
                                 <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Pilih Nota / Transaksi</label>
                                 <select className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-pink-300 outline-none max-w-full" 
                                   value={selectedOrderId} onChange={e=>setSelectedOrderId(e.target.value)}>
                                     <option value="">-- Cari Nota Terakhir --</option>
                                     {recentOrders.map(o => (
                                         <option key={o.id} value={o.id}>{formatDate(o.date)} - {o.customerName || 'No Name'} - {formatCurrency(o.financials.revenue)}</option>
                                     ))}
                                 </select>
                             </div>

                             {selectedOrder && (
                                 <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                                     <div className="flex justify-between text-sm"><span className="text-gray-500">Laba Kotor:</span><span className="font-bold text-gray-800">{formatCurrency(selectedOrder.financials.grossProfit)}</span></div>
                                     <div className="flex justify-between text-sm pt-2 border-t font-bold"><span className="text-gray-500">Net Profit Saat Ini:</span><span className="text-green-600">{formatCurrency(selectedOrder.financials.netProfit)}</span></div>
                                 </div>
                             )}

                             <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 ml-1 block">Daftar Biaya</label>
                                {tempExpenses.map((exp, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input className="flex-[2] p-3 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-pink-300 w-full" placeholder="Nama Biaya" value={exp.name} onChange={(e) => handleExpChange(idx, 'name', e.target.value)} />
                                        <input type="number" className="flex-1 p-3 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-1 focus:ring-pink-300 w-24" placeholder="Rp" value={exp.amount} onChange={(e) => handleExpChange(idx, 'amount', e.target.value)} />
                                        <button onClick={() => removeExpRow(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                <button onClick={addExpRow} className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 mt-2"><Plus size={14}/> Tambah Baris Biaya</button>
                             </div>
                             <button onClick={saveBulkExpenses} disabled={!selectedOrderId} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 disabled:bg-gray-200 transition-all shadow-lg shadow-pink-200 disabled:shadow-none">Simpan Semua Biaya</button>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 h-fit">
                           <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-red-100 text-red-600 rounded-xl"><Wallet size={24}/></div><h3 className="font-bold text-xl text-gray-800">Input Biaya Umum</h3></div>
                           <div className="space-y-5">
                               <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Tanggal</label><input type="date" className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300" value={genDate} onChange={e=>setGenDate(e.target.value)}/></div>
                               <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Keperluan</label><input className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300" placeholder="Contoh: Listrik, Gaji Karyawan" value={genTitle} onChange={e=>setGenTitle(e.target.value)}/></div>
                               <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Nominal</label><input type="number" className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-pink-300" placeholder="Rp" value={genAmount} onChange={e=>setGenAmount(e.target.value)}/></div>
                               <button onClick={submitGenExp} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">Simpan Pengeluaran</button>
                           </div>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100">
                           <h3 className="font-bold text-gray-800 mb-6">Riwayat Pengeluaran Umum</h3>
                           <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                               {generalExpenses.map(ge => (
                                   <div key={ge.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                                           <div><div className="font-bold text-gray-800">{ge.title}</div><div className="text-xs text-gray-400 font-medium">{formatDate(ge.date)}</div></div>
                                           <div className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-lg">-{formatCurrency(ge.amount)}</div>
                                   </div>
                               ))}
                               {generalExpenses.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada data</p>}
                           </div>
                        </div>
                  </div>
              )}
        </div>
    )
  }

  const HistoryPage = () => {
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('orders'); // 'orders' or 'customers'
    const [expandedCustomer, setExpandedCustomer] = useState(null);
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
    const toggleCustomerExpand = (name) => setExpandedCustomer(expandedCustomer === name ? null : name);

    // Filter Logic with Dates
    const filteredOrders = orders.filter(order => {
        const query = searchQuery.toLowerCase();
        const idMatch = order.id.toLowerCase().includes(query);
        const customerMatch = (order.customerName || '').toLowerCase().includes(query);
        const noteMatch = (order.notes || '').toLowerCase().includes(query);
        
        let dateMatch = true;
        if (filterDateStart && filterDateEnd) {
             const oDate = new Date(order.date.toDate ? order.date.toDate() : order.date);
             const start = new Date(filterDateStart);
             const end = new Date(filterDateEnd);
             end.setHours(23, 59, 59); // include end of day
             dateMatch = oDate >= start && oDate <= end;
        }

        return (idMatch || customerMatch || noteMatch) && dateMatch;
    });

    // Group by Customer Logic
    const customerGroups = useMemo(() => {
        const groups = {};
        filteredOrders.forEach(order => {
            const name = order.customerName || 'No Name';
            if(!groups[name]) {
                groups[name] = {
                    name,
                    orders: [],
                    totalRevenue: 0,
                    totalNetProfit: 0
                };
            }
            groups[name].orders.push(order);
            groups[name].totalRevenue += (order.financials?.revenue || 0);
            groups[name].totalNetProfit += (order.financials?.netProfit || 0);
        });
        
        // Convert to array and sort by Name A-Z
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredOrders]);

    // Calculate sequential number helper
    // Since orders are sorted DESC in `orders` state (from firestore query),
    // The total length minus index gives sequential ID for visual.
    const getSequentialID = (orderId) => {
        // We find the index in the FULL orders list (not filtered) to maintain consistency
        // OR we just assume the `orders` list is the full history.
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return "???";
        const num = orders.length - index;
        return `NOTA #${String(num).padStart(5, '0')}`;
    };

    return (
      <div className="pb-24 md:pb-0 animate-fade-in">
         <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Riwayat & Cetak Nota</h2>
                <p className="text-sm text-gray-500">Lihat data penjualan dan cetak ulang struk.</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                 {/* DATE FILTER */}
                 <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-pink-100 shadow-sm">
                      <input type="date" className="text-xs p-2 outline-none rounded-lg" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                      <span className="text-gray-400">-</span>
                      <input type="date" className="text-xs p-2 outline-none rounded-lg" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                 </div>

                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input 
                        className="w-full pl-10 p-3 border border-pink-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 transition-all" 
                        placeholder="Cari nota, nama, id..." 
                        value={searchQuery} 
                        onChange={e=>setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="bg-gray-100 p-1 rounded-xl flex shrink-0">
                    <button 
                        onClick={() => setViewMode('orders')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'orders' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}
                        title="Lihat per Nota"
                    >
                        <List size={20}/>
                    </button>
                    <button 
                        onClick={() => setViewMode('customers')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'customers' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}
                        title="Lihat per Customer (Group)"
                    >
                        <UserCheck size={20}/>
                    </button>
                </div>
            </div>
         </div>

         {viewMode === 'orders' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {filteredOrders.map(order => (
                  <div key={order.id} 
                       className={`bg-white p-6 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1 duration-300 ${expandedId === order.id ? 'ring-2 ring-pink-200' : ''}`}
                       onClick={() => toggleExpand(order.id)}>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-1 rounded mb-2 w-fit">{getSequentialID(order.id)}</div>
                            <h4 className="font-bold text-gray-800">{order.customerName || 'No Name'}</h4>
                            <p className="text-xs text-gray-400">{formatDate(order.date)}</p>
                            <div className="flex gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${order.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {order.paymentStatus || 'Lunas'}
                                </span>
                                {order.cashierName && <span className="text-[10px] font-bold bg-blue-50 text-blue-500 px-2 py-0.5 rounded mt-1 inline-block">Kasir: {order.cashierName.split('@')[0]}</span>}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg text-gray-800">{formatCurrency(order.financials.revenue)}</p>
                        </div>
                    </div>
                    
                    {expandedId === order.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 text-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          <h5 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wide">Rincian Barang:</h5>
                          <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between text-gray-600 text-xs">
                                <span>{item.name} <span className="text-gray-400">({item.qty} x {formatCurrency(item.price)})</span></span>
                                <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                             <span>Modal Barang:</span>
                             <span>{formatCurrency(order.financials.cogs)}</span>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <p><strong>Metode Bayar:</strong> {order.paymentMethod || 'Cash'}</p>
                              <p><strong>Catatan:</strong> {order.notes || '-'}</p>
                          </div>
                      </div>
                    )}
                    
                    {order.expenses && order.expenses.length > 0 && (
                        <div className="bg-orange-50 p-3 rounded-xl text-xs mb-4 border border-orange-100 mt-2">
                            <span className="font-bold text-orange-700 block mb-1">Biaya Operasional:</span> 
                            {order.expenses.map((e, idx) => (
                               <div key={idx} className="flex justify-between text-orange-600">
                                 <span>{e.name}</span>
                                 <span>-{formatCurrency(e.amount)}</span>
                               </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4 mt-2">
                        <span className="text-gray-400 font-medium">Laba Bersih:</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{formatCurrency(order.financials.netProfit)}</span>
                    </div>

                    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setEditingOrder(order)} className="p-2 text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors" title="Edit Data Nota"><Edit size={16}/></button>
                        <button onClick={() => handleDeleteOrder(order)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Hapus Nota"><Trash2 size={16}/></button>
                        <button onClick={() => handlePrint(order, getSequentialID(order.id))} className="flex-1 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"><Printer size={16}/> Cetak</button>
                        
                        {order.paymentStatus === 'Belum Lunas' && (
                            <button onClick={() => handleQuickPay(order.id)} className="p-2 text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors" title="Tandai Lunas"><CheckCircle size={16}/></button>
                        )}
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                   <div className="col-span-full text-center py-10 text-gray-400">
                       Tidak ada transaksi yang ditemukan.
                   </div>
                )}
             </div>
         ) : (
             <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
                 <div className="bg-pink-50 border border-pink-100 p-4 rounded-xl text-sm text-pink-700 flex items-center gap-3">
                     <UserCheck size={20}/>
                     <span>Menampilkan total laba bersih per customer dari <strong>{filteredOrders.length}</strong> transaksi yang sesuai filter pencarian.</span>
                 </div>
                 
                 {customerGroups.map((group, idx) => (
                     <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                         <div 
                            className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleCustomerExpand(group.name)}
                         >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                    {group.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                                    <p className="text-xs text-gray-400">{group.orders.length} Transaksi</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Total Laba Bersih</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(group.totalNetProfit)}</p>
                            </div>
                         </div>

                         {expandedCustomer === group.name && (
                             <div className="bg-gray-50 p-4 border-t border-gray-100 animate-fade-in">
                                 <table className="w-full text-sm">
                                     <thead>
                                         <tr className="text-left text-gray-400 text-xs uppercase">
                                             <th className="pb-2">Tanggal</th>
                                             <th className="pb-2">ID Nota</th>
                                             <th className="pb-2 text-right">Omzet</th>
                                             <th className="pb-2 text-right">Laba</th>
                                             <th className="pb-2 text-center">Status</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-gray-200">
                                         {group.orders.map(order => (
                                             <tr key={order.id}>
                                                 <td className="py-2 text-gray-600">{formatDate(order.date)}</td>
                                                 <td className="py-2 font-bold text-pink-600">{getSequentialID(order.id)}</td>
                                                 <td className="py-2 text-right">{formatCurrency(order.financials.revenue)}</td>
                                                 <td className="py-2 text-right text-emerald-600 font-bold">{formatCurrency(order.financials.netProfit)}</td>
                                                 <td className="py-2 text-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded ${order.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {order.paymentStatus || 'Lunas'}
                                                    </span>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         )}
                     </div>
                 ))}
             </div>
         )}
      </div>
    );
  };

const ReceiptTemplate = ({ order }) => {
    if (!order) return null;
    return (
        <div id="print-area" className="hidden print:block bg-white text-black font-mono" 
            style={{ 
                width: '58mm', // Lebar standar kertas thermal 58mm
                padding: '2mm', 
                boxSizing: 'border-box', 
                fontSize: '10px',
                lineHeight: '1.2'
            }}>
            
            {/* Header */}
            <div className="text-center mb-2 border-b border-black border-dashed pb-2">
                <div className="flex justify-center mb-1">
                      {/* Icon Keranjang diganti simple untuk thermal */}
                      <ShoppingBasket size={24} color="black" />
                </div>
                <h1 className="text-xl font-bold uppercase tracking-wider">MUTIARA STORE</h1>
                <p className="text-[9px] mt-1">Jl. Polowijen 2 No. 469</p>
                <p className="text-[9px]">083834701439 / 081233635650</p>
            </div>

            {/* Info Transaksi */}
            <div className="mb-2 text-[9px]">
                <div className="flex justify-between"><span>Tgl :</span><span>{formatDateShort(order.date)}</span></div>
                <div className="flex justify-between"><span>Jam :</span><span>{new Date(order.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span></div>
                <div className="flex justify-between"><span>Cust:</span><span className="font-bold">{order.customerName || 'Umum'}</span></div>
                {order.cashierName && <div className="flex justify-between"><span>Kasir:</span><span>{order.cashierName.split('@')[0]}</span></div>}
                <div className="flex justify-between mt-1">
                    <span className="font-bold text-lg">{order.sequentialNumber || `#${order.id.slice(-4).toUpperCase()}`}</span>
                </div>
            </div>

            {/* Tabel Barang */}
            <div className="border-t border-b border-black border-dashed py-1 mb-2">
                {order.items.map((item, index) => (
                    <div key={index} className="mb-1">
                        <div className="font-bold truncate">{item.name}</div>
                        <div className="flex justify-between">
                            <span>{item.qty} x {formatCurrency(item.price).replace('Rp', '')}</span>
                            <span>{formatCurrency(item.subtotal).replace('Rp', '')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total & Pembayaran */}
            <div className="flex flex-col items-end text-[11px] font-bold mb-2">
                <div className="w-full flex justify-between"><span>Total :</span><span>{formatCurrency(order.financials.revenue)}</span></div>
                <div className="w-full flex justify-between text-[9px] font-normal mt-1">
                    <span>Bayar ({order.paymentMethod}):</span>
                    <span>{order.paymentStatus || 'Lunas'}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 pt-2 border-t border-black border-dashed">
                <p className="text-[10px] font-bold">TERIMA KASIH</p>
                <p className="text-[8px] mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
            </div>
        </div>
    );
  };

  const NavButton = ({ id, label, icon: Icon }) => (
    <button onClick={() => {setActiveTab(id); setIsSidebarOpen(false)}} 
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 shrink-0 ${activeTab === id ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 scale-105' : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600'} ${isSidebarMini ? 'justify-center px-2' : ''}`}
      title={isSidebarMini ? label : ''}
    >
      <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} /> 
      {!isSidebarMini && <span className="font-bold text-base tracking-wide">{label}</span>}
    </button>
  );

  const InventoryPage = () => {
      const [search, setSearch] = useState('');
      const filtered = inventory.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        (i.category && i.category.toLowerCase().includes(search.toLowerCase())) ||
        (i.barcode && i.barcode.includes(search))
      );
      
      return (
        <div className="pb-24 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Stok Gudang</h2>
                <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                   <input className="w-full pl-10 p-3 border border-pink-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 transition-all" placeholder="Cari nama, barcode, kategori..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {filtered.map(i => (
                     <div key={i.id} className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50 hover:shadow-lg hover:-translate-y-1 transition-all group relative">
                         <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{i.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{i.category || 'Umum'}</span>
                                    {i.barcode && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1"><Scan size={10}/> {i.barcode}</span>}
                                </div>
                            </div>
                            
                            {/* --- NEW: DELETE BUTTON --- */}
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${i.stock<=i.minStock?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{i.stock} {i.unit}</span>
                                <button onClick={() => handleDeleteInventoryItem(i)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all" title="Hapus Barang Permanen">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                         </div>
                         <div className="flex justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-xl mb-2">
                            <span>Modal Avg:</span>
                            <span className="font-bold text-gray-700">{formatCurrency(i.avgCost)}</span>
                         </div>
                         {/* Show Selling Price if Available */}
                         <div className="flex justify-between text-sm text-pink-600 bg-pink-50/50 p-3 rounded-xl">
                            <span>Harga Jual:</span>
                            <span className="font-bold">{i.sellPrice ? formatCurrency(i.sellPrice) : '-'}</span>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
      )
  }

  const PurchasesPage = () => {
    // Tambah totalPrice di state form
    const [form, setForm] = useState({ 
        itemName: '', 
        quantity: '', 
        pricePerUnit: '', 
        totalPrice: '', // NEW: Field Total
        unit: 'pcs', 
        supplier: '', 
        date: new Date().toISOString().slice(0, 16), 
        barcode: '', 
        category: 'Umum', 
        sellPrice: '' 
    });
    
    const [mode, setMode] = useState('existing');
    const [showCamera, setShowCamera] = useState(false);
    const quantityInputRef = useRef(null);
    
    // Filter States
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [visibleLimit, setVisibleLimit] = useState(10);
    const [searchSupplier, setSearchSupplier] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    
    // --- LOGIC KALKULATOR CERDAS ---
    const handleQtyChange = (val) => {
        const newQty = val;
        const unitPrice = parseFloat(form.pricePerUnit) || 0;
        // Kalau Qty berubah, update Total (Total = Qty * Harga Satuan)
        const newTotal = newQty && unitPrice ? (parseFloat(newQty) * unitPrice).toString() : form.totalPrice;
        
        setForm({ ...form, quantity: newQty, totalPrice: newTotal });
    };

    const handleUnitPriceChange = (val) => {
        const newPrice = val;
        const qty = parseFloat(form.quantity) || 0;
        // Kalau Harga Satuan berubah, update Total (Total = Qty * Harga Satuan)
        const newTotal = qty && newPrice ? (qty * parseFloat(newPrice)).toString() : '';
        
        setForm({ ...form, pricePerUnit: newPrice, totalPrice: newTotal });
    };

    const handleTotalPriceChange = (val) => {
        const newTotal = val;
        const qty = parseFloat(form.quantity) || 0;
        // Kalau Total berubah, update Harga Satuan (Satuan = Total / Qty)
        // Cegah pembagian dengan 0
        const newUnitPrice = qty > 0 && newTotal ? (parseFloat(newTotal) / qty).toString() : '';

        setForm({ ...form, totalPrice: newTotal, pricePerUnit: newUnitPrice });
    };
    // -------------------------------

    const handleExistSelect = (e) => { 
        const i = inventory.find(x => x.id === e.target.value); 
        if(i) {
            setForm({ 
                ...form, 
                itemName: i.name, 
                unit: i.unit, 
                category: i.category || 'Umum', 
                barcode: i.barcode || '', 
                existingId: i.id, 
                sellPrice: i.sellPrice || i.lastPrice || '' 
            }); 
            if(quantityInputRef.current) quantityInputRef.current.focus();
        }
    }
    
    const submit = (e) => { 
        e.preventDefault(); 
        handlePurchase(form); 
        // Reset form termasuk totalPrice
        setForm({ ...form, quantity: '', pricePerUnit: '', totalPrice: '', barcode: '', existingId: null, sellPrice: '' }); 
    }

    const processBarcodeRestock = (scannedBarcode) => {
        setForm(prev => ({ ...prev, barcode: scannedBarcode }));
        const exists = inventory.find(i => i.barcode === scannedBarcode);
        if (exists) {
            setMode('existing');
            setForm(prev => ({ 
                ...prev, 
                barcode: scannedBarcode,
                itemName: exists.name, 
                unit: exists.unit, 
                category: exists.category || 'Umum', 
                existingId: exists.id, 
                sellPrice: exists.sellPrice || exists.lastPrice || '' 
            }));
        } else {
            setMode('new');
            setForm(prev => ({...prev, barcode: scannedBarcode, itemName: '', existingId: null}));
        }
    }

    // Filter Logic (Sama seperti sebelumnya)
    const filteredLogs = useMemo(() => {
        let logs = [...restockLogs];
        if (filterStartDate || filterEndDate) {
            const start = filterStartDate ? new Date(filterStartDate) : new Date(0);
            const end = filterEndDate ? new Date(filterEndDate) : new Date(8640000000000000); 
            end.setHours(23, 59, 59, 999);
            logs = logs.filter(log => {
                const logDate = log.inputDate ? new Date(log.inputDate) : new Date();
                return logDate >= start && logDate <= end;
            });
        }
        if (searchSupplier) {
            const query = searchSupplier.toLowerCase();
            logs = logs.filter(log => (log.supplier || '').toLowerCase().includes(query));
        }
        logs.sort((a, b) => {
            const dateA = new Date(a.inputDate || 0);
            const dateB = new Date(b.inputDate || 0);
            const costA = a.totalCost || 0;
            const costB = b.totalCost || 0;
            switch (sortBy) {
                case 'oldest': return dateA - dateB;
                case 'highest': return costB - costA;
                case 'lowest': return costA - costB;
                case 'newest': default: return dateB - dateA;
            }
        });
        return logs;
    }, [restockLogs, filterStartDate, filterEndDate, searchSupplier, sortBy]);

    const visibleLogs = filteredLogs.slice(0, visibleLimit);

    return (
        <div className="w-full pb-32 md:pb-0 animate-fade-in space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Restock Gudang</h2>
                    <p className="text-gray-500 text-sm">Input pembelian barang baru atau tambah stok.</p>
                </div>
                <button onClick={() => setShowCamera(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-blue-700 shadow-lg w-fit">
                    <Camera size={16}/> Scan Barcode
                </button>
              </div>

              <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-pink-100 w-full">
                  <div className="bg-pink-50/50 p-1.5 rounded-2xl mb-6 max-w-md mx-auto w-full flex relative">
                     <button onClick={()=>{setMode('existing'); setForm({...form, existingId: null});}} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all relative z-10 ${mode==='existing' ? 'text-pink-600 shadow-sm bg-white' : 'text-gray-400 hover:text-gray-600'}`}>Stok Lama</button>
                     <button onClick={()=>{setMode('new'); setForm({...form, existingId: null});}} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all relative z-10 ${mode==='new' ? 'text-pink-600 shadow-sm bg-white' : 'text-gray-400 hover:text-gray-600'}`}>Barang Baru</button>
                  </div>

                  <form onSubmit={submit} className="space-y-5">
                      <div className="space-y-4">
                          <div>
                             <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><Calendar size={12}/> TANGGAL MASUK</label>
                             <input type="datetime-local" className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all text-sm md:text-base font-medium text-gray-700" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
                          </div>

                          <div>
                             <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><Package size={12}/> {mode === 'existing' ? 'PILIH BARANG' : 'NAMA BARANG BARU'}</label>
                             {mode === 'existing' ? (
                                 <div className="relative">
                                     <select className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all appearance-none text-sm md:text-base" onChange={handleExistSelect} value={form.existingId || ''}>
                                         <option value="">-- Cari / Scan Barang --</option>
                                         {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                     </select>
                                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={16} className="rotate-90"/></div>
                                 </div>
                             ) : (
                                 <div className="flex gap-2">
                                     <input className="flex-[3] p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 w-full text-sm md:text-base placeholder:text-gray-300" placeholder="Nama Barang" value={form.itemName} onChange={e=>setForm({...form, itemName: e.target.value})}/>
                                 </div>
                             )}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs font-bold text-gray-400 ml-1 mb-1">BARCODE (Auto)</label>
                              <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm" placeholder="Scan/Ketik Barcode" value={form.barcode} onChange={e=>setForm({...form, barcode: e.target.value})}/>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-400 ml-1 mb-1">KATEGORI</label>
                              <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm" placeholder="Cth: Makanan, Minuman" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} list="categories"/>
                              <datalist id="categories"><option value="Makanan" /><option value="Minuman" /><option value="Sembako" /><option value="Rokok" /><option value="Alat Tulis" /></datalist>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                          <div className="col-span-1">
                             <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">JUMLAH</label>
                             <input 
                                ref={quantityInputRef}
                                type="number" step="0.01" inputMode="decimal" 
                                className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-center font-bold text-gray-800 text-sm md:text-base" 
                                placeholder="0" 
                                value={form.quantity} 
                                onChange={e => handleQtyChange(e.target.value)} // UPDATED
                            />
                          </div>
                          <div className="col-span-1">
                             <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">SATUAN</label>
                             <input className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-center text-sm md:text-base" placeholder="Unit" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})}/>
                          </div>
                          <div className="col-span-1 md:col-span-1">
                             <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><Tag size={12}/> HARGA SATUAN</label>
                             <input type="number" inputMode="numeric" className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base" placeholder="Rp" 
                                value={form.pricePerUnit} 
                                onChange={e => handleUnitPriceChange(e.target.value)} // UPDATED
                             />
                          </div>
                          <div className="col-span-1 md:col-span-1">
                             {/* INPUT BARU: TOTAL HARGA */}
                             <label className="text-xs font-bold text-blue-500 ml-1 mb-1 flex items-center gap-1"><DollarSign size={12}/> TOTAL BELI</label>
                             <input type="number" inputMode="numeric" className="w-full p-3 md:p-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 text-sm md:text-base font-bold text-blue-700" placeholder="Rp" 
                                value={form.totalPrice} 
                                onChange={e => handleTotalPriceChange(e.target.value)} // UPDATED
                             />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-pink-500 ml-1 mb-1 flex items-center gap-1"><DollarSign size={12}/> HARGA JUAL (RENCANA)</label>
                          <input type="number" inputMode="numeric" className="w-full p-3 md:p-4 bg-pink-50 border border-pink-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-400 text-sm md:text-base font-bold text-pink-700" placeholder="Rp (Otomatis muncul di kasir)" value={form.sellPrice} onChange={e=>setForm({...form, sellPrice: e.target.value})}/>
                          <p className="text-[10px] text-gray-400 mt-1 ml-1">*Harga ini akan otomatis terisi jika barang lama dipilih, tapi tetap bisa diedit.</p>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1"><User size={12}/> SUPPLIER</label>
                          <input className="w-full p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 text-sm md:text-base" placeholder="Nama Toko / Supplier" value={form.supplier} onChange={e=>setForm({...form, supplier: e.target.value})}/>
                      </div>

                      <button className="w-full p-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg text-base md:text-lg mt-4 active:scale-95 flex justify-center items-center gap-2">
                        <PackagePlus size={20}/> Simpan Stok
                      </button>
                  </form>
              </div>

              {/* LIST RIWAYAT MASUK (Sama, tidak perlu diubah logicnya) */}
              <div className="space-y-4">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                    <div className="flex items-center gap-2">
                        <History size={20} className="text-pink-600"/>
                        <h3 className="font-bold text-lg text-gray-800">Riwayat Masuk ({filteredLogs.length})</h3>
                    </div>
                    
                    <div className="flex flex-col xl:flex-row gap-2 w-full md:w-auto">
                        <div className="relative min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={14}/>
                            <input className="w-full pl-9 p-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-300 shadow-sm" placeholder="Cari Supplier..." value={searchSupplier} onChange={(e) => setSearchSupplier(e.target.value)}/>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <div className="relative">
                                <ArrowDownUp size={14} className="absolute left-2 top-2.5 text-gray-400"/>
                                <select className="pl-7 p-2 bg-gray-50 rounded-lg text-xs border border-gray-200 outline-none w-full md:w-auto cursor-pointer font-bold text-gray-600" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="newest">Terbaru</option>
                                    <option value="oldest">Terlama</option>
                                    <option value="highest">Termahal (Total)</option>
                                    <option value="lowest">Termurah (Total)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-2 border-l border-gray-100">
                                <Filter size={14} className="text-gray-400"/>
                                <span className="text-xs font-bold text-gray-500 hidden md:inline">Tgl:</span>
                            </div>
                            <input type="date" className="p-2 bg-gray-50 rounded-lg text-xs border border-gray-200 outline-none" value={filterStartDate} onChange={e=>setFilterStartDate(e.target.value)} placeholder="Dari"/>
                            <span className="text-gray-400 hidden md:block">-</span>
                            <input type="date" className="p-2 bg-gray-50 rounded-lg text-xs border border-gray-200 outline-none" value={filterEndDate} onChange={e=>setFilterEndDate(e.target.value)} placeholder="Sampai"/>
                            {(filterStartDate || filterEndDate || searchSupplier || sortBy !== 'newest') && (
                                <button onClick={() => {setFilterStartDate(''); setFilterEndDate(''); setSearchSupplier(''); setSortBy('newest');}} className="p-2 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100"><RefreshCcw size={14}/></button>
                            )}
                        </div>
                    </div>
                 </div>

                 <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-pink-50/50 text-gray-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4">Tanggal Input</th>
                                    <th className="p-4">Barang</th>
                                    <th className="p-4 text-center">Jml</th>
                                    <th className="p-4 text-right">Harga Beli</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {visibleLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-pink-50/20">
                                        <td className="p-4 text-gray-500">{formatDate(log.inputDate)}</td>
                                        <td className="p-4 font-bold text-gray-700">{log.itemName}</td>
                                        <td className="p-4 text-center">{log.qty} {log.unit}</td>
                                        <td className="p-4 text-right">{formatCurrency(log.pricePerUnit)}</td>
                                        <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(log.totalCost)}</td>
                                        <td className="p-4 text-gray-500 text-xs">{log.supplier || '-'}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setEditingRestock(log)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit size={16}/></button>
                                                <button onClick={() => handleDeleteRestock(log)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {visibleLogs.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Tidak ada riwayat ditemukan.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                 </div>
                 
                 <div className="md:hidden space-y-3">
                    {visibleLogs.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-md mb-1 inline-block">{formatDate(log.inputDate)}</span>
                                    <h4 className="font-bold text-gray-800 text-lg">{log.itemName}</h4>
                                    <p className="text-xs text-gray-400">{log.supplier || 'Tanpa Supplier'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingRestock(log)} className="p-2 text-blue-400 bg-blue-50 rounded-xl"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteRestock(log)} className="p-2 text-red-400 bg-red-50 rounded-xl"><Trash2 size={18}/></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                <div className="flex-1 text-center border-r border-gray-200">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Jumlah</p>
                                    <p className="font-bold text-gray-800">{log.qty} <span className="text-xs font-normal">{log.unit}</span></p>
                                </div>
                                <div className="flex-1 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total Beli</p>
                                    <p className="font-bold text-gray-800">{formatCurrency(log.totalCost)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {visibleLogs.length === 0 && <div className="text-center text-gray-400 py-10">Tidak ada riwayat ditemukan.</div>}
                 </div>

                 {visibleLogs.length < filteredLogs.length && (
                    <button onClick={() => setVisibleLimit(prev => prev + 10)} className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm mt-4">
                        Muat Lebih Banyak ({filteredLogs.length - visibleLogs.length} lagi)
                    </button>
                 )}
              </div>
              
              {showCamera && <CameraScanner onScanSuccess={processBarcodeRestock} onClose={() => setShowCamera(false)} />}
        </div>
    )
  }

  const ReportsPage = () => {
    const currentMonth = new Date().getMonth();
    const monthlyOrders = orders.filter(o => {
        const orderDate = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
        return orderDate.getMonth() === currentMonth;
    });

    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [isAllData, setIsAllData] = useState(false);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i); 

    const getFilteredOrdersForReport = () => {
        if(isAllData) return orders;

        return orders.filter(o => {
            const d = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
            const sameMonth = d.getMonth() === parseInt(selectedMonth);
            const sameYear = d.getFullYear() === parseInt(selectedYear);
            return sameMonth && sameYear;
        });
    }

    const downloadTxCSV = () => {
      const dataToDownload = getFilteredOrdersForReport();
      
      const headers = [
          'Order_ID', 
          'Tanggal', 
          'Jam',
          'Customer', 
          'Kasir', 
          'Nama_Barang_Terjual',
          'Qty', 
          'Satuan', 
          'Harga_Jual_Satuan', 
          'Modal_Satuan',
          'Subtotal_Jual',
          'Subtotal_Modal',
          'Total_Nota',
          'Total_Laba_Nota',
          'Metode_Pembayaran', 
          'Status_Pembayaran', 
          'Catatan'
      ];
      
      const rows = [];

      dataToDownload.forEach(o => {
        const orderDate = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
        const dateStr = orderDate.toLocaleDateString('id-ID');
        const timeStr = orderDate.toLocaleTimeString('id-ID');

        const orderId = `"${o.id}"`; 
        const customer = `"${o.customerName || '-'}"`;
        const cashier = `"${o.cashierName ? o.cashierName.split('@')[0] : '-'}"`;
        const paymentMethod = `"${o.paymentMethod || 'Cash'}"`;
        const paymentStatus = `"${o.paymentStatus || 'Lunas'}"`;
        const notes = `"${o.notes || ''}"`;
        
        const totalRevenue = o.financials.revenue;
        const totalNetProfit = o.financials.netProfit;

        if (o.items && o.items.length > 0) {
            o.items.forEach(item => {
                const modalSatuan = item.costBasis || 0;
                const subtotalModal = modalSatuan * item.qty;

                rows.push([
                    orderId,
                    `"${dateStr}"`,
                    `"${timeStr}"`,
                    customer,
                    cashier,
                    `"${item.name}"`,
                    item.qty,
                    `"${item.unit}"`,
                    item.price,
                    modalSatuan,
                    item.subtotal,
                    subtotalModal,
                    totalRevenue,
                    totalNetProfit,
                    paymentMethod,
                    paymentStatus,
                    notes
                ]);
            });
        } else {
            rows.push([
                orderId, `"${dateStr}"`, `"${timeStr}"`, customer, cashier,
                "-", 0, "-", 0, 0, 0, 0,
                totalRevenue, totalNetProfit,
                paymentMethod, paymentStatus, notes
            ]);
        }
      });

      const csvContent = "sep=;\n" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const fileName = isAllData ? `Laporan_Detail_Transaksi_SemuaData.csv` : `Laporan_Detail_Transaksi_${months[selectedMonth]}_${selectedYear}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
    };
    
    const downloadStockCSV = () => {
       const rows = inventory.map(i => [
           `"${i.name}"`, 
           i.stock, 
           `"${i.unit}"`, 
           i.avgCost, 
           i.stock * i.avgCost,
           i.sellPrice || 0, // Added sell price to report
           `"${i.lastSupplier || '-'}"`
       ]);
       
       const headers = ['Nama Barang', 'Stok Saat Ini', 'Satuan', 'Harga Rata-rata Beli', 'Total Nilai Aset', 'Harga Jual (Rencana)', 'Supplier Terakhir'];
       
       const csvContent = "sep=;\n" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
       const url = URL.createObjectURL(blob);
       const link = document.createElement("a");
       link.setAttribute("href", url);
       link.setAttribute("download", `Laporan_Stok_Aset_${new Date().toISOString().slice(0,10)}.csv`);
       document.body.appendChild(link);
       link.click();
    };
    
    const totalAssetValue = inventory.reduce((sum, i) => sum + (i.stock * i.avgCost), 0);

    return (
      <div className="pb-24 md:pb-0 space-y-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800">Pusat Laporan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={28}/></div>
                  <div>
                      <h3 className="font-bold text-xl text-gray-800">Laporan Transaksi</h3>
                      <p className="text-sm text-gray-400">Rekap semua penjualan dan pembelian barang.</p>
                  </div>
               </div>
               
               <div className="mb-4 space-y-3">
                   <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Pilih Periode Download</label>
                   
                   <div className="flex gap-2">
                       <select 
                           disabled={isAllData}
                           className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                           value={selectedMonth}
                           onChange={(e) => setSelectedMonth(e.target.value)}
                       >
                           {months.map((m, idx) => (
                               <option key={idx} value={idx}>{m}</option>
                           ))}
                       </select>
                       <select 
                           disabled={isAllData}
                           className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                           value={selectedYear}
                           onChange={(e) => setSelectedYear(e.target.value)}
                       >
                           {years.map((y) => (
                               <option key={y} value={y}>{y}</option>
                           ))}
                       </select>
                   </div>
                   
                   <div className="flex items-center gap-2 mt-2">
                       <input 
                           type="checkbox" 
                           id="allData" 
                           checked={isAllData} 
                           onChange={(e) => setIsAllData(e.target.checked)}
                           className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                       />
                       <label htmlFor="allData" className="text-sm text-gray-600">Download Semua Data (Tanpa Filter)</label>
                   </div>
               </div>

               <div className="flex gap-2 flex-col md:flex-row">
                   <button onClick={() => window.print()} className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex justify-center gap-2 items-center"><Printer size={18}/> Print</button>
                   <button onClick={downloadTxCSV} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex justify-center gap-2 items-center"><Download size={18}/> Excel/CSV</button>
               </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Package size={28}/></div>
                  <div>
                      <h3 className="font-bold text-xl text-gray-800">Laporan Stok Aset</h3>
                      <p className="text-sm text-gray-400">Nilai aset stok saat ini berdasarkan rata-rata harga beli.</p>
                  </div>
               </div>
               <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                   <span className="text-xs font-bold text-emerald-700 uppercase">Total Aset:</span>
                   <span className="ml-2 font-bold text-xl text-emerald-800">{formatCurrency(totalAssetValue)}</span>
               </div>
               <button onClick={downloadStockCSV} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex justify-center gap-2 items-center"><Download size={18}/> Download Stok</button>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-pink-50">
                <h3 className="font-bold text-lg text-gray-800">Preview Laporan (Bulan Ini)</h3>
            </div>
            
            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-pink-50/50 text-gray-500 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4 whitespace-nowrap">Tanggal</th>
                            <th className="p-4 whitespace-nowrap">Uraian / Nota</th>
                            <th className="p-4 whitespace-nowrap">Customer</th>
                            <th className="p-4 text-right whitespace-nowrap">Omzet (Jual)</th>
                            <th className="p-4 text-right whitespace-nowrap">Modal (HPP)</th>
                            <th className="p-4 text-right whitespace-nowrap">Biaya Ops</th>
                            <th className="p-4 text-right whitespace-nowrap">Laba Bersih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {monthlyOrders.slice(0, 10).map(o => (
                            <tr key={o.id} className="hover:bg-pink-50/20 transition-colors">
                                <td className="p-4 whitespace-nowrap">{formatDate(o.date)}</td>
                                <td className="p-4 font-bold text-gray-700 whitespace-nowrap">#{o.id.slice(-4).toUpperCase()}</td>
                                <td className="p-4 text-gray-600 whitespace-nowrap">{o.customerName || '-'}</td>
                                <td className="p-4 text-right text-gray-800 font-medium whitespace-nowrap">{formatCurrency(o.financials.revenue)}</td>
                                <td className="p-4 text-right text-gray-500 whitespace-nowrap">{formatCurrency(o.financials.cogs)}</td>
                                <td className="p-4 text-right text-red-400 whitespace-nowrap">{formatCurrency(o.financials.expenseTotal)}</td>
                                <td className="p-4 text-right font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(o.financials.netProfit)}</td>
                            </tr>
                        ))}
                        {monthlyOrders.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Belum ada data bulan ini.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden p-4 space-y-4">
                {monthlyOrders.slice(0, 10).map(o => (
                  <div key={o.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                         <div>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded mr-2">{formatDate(o.date)}</span>
                            <span className="font-bold text-pink-600 text-sm">#{o.id.slice(-4).toUpperCase()}</span>
                         </div>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.paymentStatus === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{o.paymentStatus}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                         <div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                           <p className="font-bold text-gray-800">{o.customerName || 'Umum'}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-xl">
                         <div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase">Omzet</p>
                           <p className="font-bold text-blue-600 text-sm">{formatCurrency(o.financials.revenue)}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] text-gray-400 font-bold uppercase">Laba Bersih</p>
                           <p className="font-bold text-emerald-600 text-sm">{formatCurrency(o.financials.netProfit)}</p>
                         </div>
                      </div>
                   </div>
                ))}
                {monthlyOrders.length === 0 && <div className="p-8 text-center text-gray-400">Belum ada data bulan ini.</div>}
            </div>
        </div>
      </div>
    );
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center text-pink-600">Loading...</div>;
  if (!user) return <LoginPage />;

  return (
    <div className="flex min-h-screen bg-[#FDF2F8] font-sans text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-pink-100 transform transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarMini ? 'w-20' : 'w-80'} print:hidden flex flex-col h-full`}>
          
          <div className={`flex items-center gap-4 mb-2 shrink-0 ${isSidebarMini ? 'p-4 justify-center' : 'p-8'}`}>
             <div className="w-12 h-12 bg-gradient-to-tr from-pink-600 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200 shrink-0">
               <ShoppingBasket size={24} strokeWidth={2.5}/>
             </div>
             {!isSidebarMini && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <h1 className="font-extrabold text-2xl tracking-tight text-gray-800 leading-none">Mutiara</h1>
                   <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Store</span>
                 </div>
             )}
          </div>
          
          <div className="hidden md:flex justify-end px-4 mb-2 shrink-0">
             <button onClick={() => setIsSidebarMini(!isSidebarMini)} className="p-1.5 rounded-lg bg-pink-50 text-pink-400 hover:text-pink-600 hover:bg-pink-100 transition-colors">
                 {isSidebarMini ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
             </button>
          </div>

          <nav className={`space-y-2 overflow-y-auto custom-scrollbar flex-1 ${isSidebarMini ? 'px-2' : 'px-6'}`}>
              {!isSidebarMini && <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Utama</p>}
              <NavButton id="dashboard" label="Dashboard" icon={LayoutDashboard} />
              <NavButton id="sales" label="Kasir (Jual)" icon={ShoppingCart} />
              <NavButton id="expenses" label="Biaya & Ops" icon={Wallet} />
              <NavButton id="history" label="Riwayat Nota" icon={History} />
              
              {!isSidebarMini && <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-6">Gudang</p>}
              <NavButton id="inventory" label="Stok Barang" icon={Package} />
              <NavButton id="purchases" label="Restock (Beli)" icon={PackagePlus} />
              <NavButton id="reports" label="Laporan" icon={FileText} />
              
              <div className="h-20"></div> 
          </nav>

          <div className={`p-4 border-t border-pink-50 shrink-0 ${isSidebarMini ? 'flex justify-center' : ''}`}>
              <button 
                onClick={handleLogout}
                className={`flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all ${isSidebarMini ? 'justify-center' : ''}`}
                title="Keluar Aplikasi"
              >
                  <LogOut size={20}/>
                  {!isSidebarMini && <span className="font-bold">Keluar</span>}
              </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={()=>setIsSidebarOpen(false)}/>}

      <main className={`flex-1 transition-all duration-300 print:ml-0 print:w-full print:p-0 ${isSidebarMini ? 'md:ml-20' : 'md:ml-80'}`}>
          <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-50 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
             <div className="font-bold text-lg text-gray-800 flex items-center gap-2"><ShoppingBasket className="text-pink-600"/> Mutiara Store</div>
             <button onClick={()=>setIsSidebarOpen(true)} className="p-2 bg-pink-50 text-pink-600 rounded-xl"><Menu/></button>
          </div>

          <div className={`p-4 md:p-10 max-w-7xl mx-auto`}>
             {activeTab === 'dashboard' && <Dashboard />}
             {activeTab === 'sales' && <SalesPage />}
             {activeTab === 'expenses' && <ExpensesPage />}
             {activeTab === 'history' && <HistoryPage />}
             {activeTab === 'inventory' && <InventoryPage />}
             {activeTab === 'purchases' && <PurchasesPage />}
             {activeTab === 'reports' && <ReportsPage />}
          </div>
          
          {printOrder && <ReceiptTemplate order={printOrder} />}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex justify-around z-40 pb-safe print:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
         <button onClick={()=>setActiveTab('dashboard')} className={`p-3 rounded-2xl transition-all ${activeTab==='dashboard'?'bg-pink-50 text-pink-600':'text-gray-400'}`}><LayoutDashboard size={24}/></button>
         <button onClick={()=>setActiveTab('sales')} className={`p-3 rounded-2xl transition-all ${activeTab==='sales'?'bg-pink-600 text-white shadow-lg shadow-pink-200 -translate-y-2':'text-gray-400'}`}><Plus size={28}/></button>
         <button onClick={()=>setActiveTab('history')} className={`p-3 rounded-2xl transition-all ${activeTab==='history'?'bg-pink-50 text-pink-600':'text-gray-400'}`}><History size={24}/></button>
      </div>

      {editingOrder && <EditOrderModal />}
      {editingRestock && <EditRestockModal />}
      {showStoreModal && <ConnectStoreModal />}
      {showProfileEdit && <UserProfileModal />}

      <style>{`
        @media print {
           aside, .md\\:hidden, button, .print\\:hidden, nav, header { display: none !important; }
           body { background: white; margin: 0; padding: 0; }
           main { margin: 0; padding: 0; width: 100%; visibility: hidden; }
           #print-area { display: block !important; visibility: visible; position: absolute; top: 0; left: 0; width: 58mm; margin: 0; }
           @page { size: auto; margin: 0mm; }
        }

        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #fce7f3; border-radius: 20px; }
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}