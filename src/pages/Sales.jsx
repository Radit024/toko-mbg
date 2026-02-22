import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Camera, Scan, Plus, CreditCard, Trash2, X, CheckCircle2, Package } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import CameraScanner from '../components/ui/CameraScanner';

export default function Sales({ inventory, handleSaveOrder }) {
    const [cart, setCart] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [notes, setNotes] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('Lunas');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const categories = ['Semua', ...new Set(inventory.map(i => i.category || 'Umum'))];
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const barcodeInputRef = useRef(null);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);

    const filteredInventory = inventory.filter(i => activeCategory === 'Semua' || (i.category || 'Umum') === activeCategory);
    const selectedItemData = inventory.find(i => i.id === selectedItemId);

    useEffect(() => {
        if (barcodeMode && barcodeInputRef.current) barcodeInputRef.current.focus();
    }, [barcodeMode]);

    const processBarcode = (scannedBarcode) => {
        const item = inventory.find(i => i.barcode === scannedBarcode);
        if (item) {
            if (item.stock <= 0) alert("Stok Habis!");
            else {
                if (navigator.vibrate) navigator.vibrate(200);
                setScanSuccess(true);
                setTimeout(() => setScanSuccess(false), 2000);
                const priceToUse = item.sellPrice || item.lastPrice || item.avgCost;
                setCart(prevCart => {
                    const existIdx = prevCart.findIndex(c => c.itemId === item.id);
                    if (existIdx >= 0) {
                        const newCart = [...prevCart];
                        if (newCart[existIdx].quantity + 1 > item.stock) { alert("Stok kurang!"); return prevCart; }
                        newCart[existIdx].quantity += 1;
                        newCart[existIdx].subtotal = newCart[existIdx].quantity * newCart[existIdx].price;
                        return newCart;
                    } else {
                        return [...prevCart, { itemId: item.id, itemName: item.name, unit: item.unit, quantity: 1, price: parseFloat(priceToUse), subtotal: parseFloat(priceToUse) }];
                    }
                });
            }
            setBarcodeBuffer('');
        } else {
            alert("Barang tidak ditemukan (Barcode: " + scannedBarcode + ")");
        }
    };

    const handleBarcodeScan = (e) => {
        if (e.key === 'Enter') processBarcode(e.target.value);
        else setBarcodeBuffer(e.target.value);
    };

    const addItem = () => {
        if (!selectedItemData || !qty || !price) return;
        if (selectedItemData.stock < parseFloat(qty)) return alert("Stok tidak cukup!");
        setCart([...cart, { itemId: selectedItemData.id, itemName: selectedItemData.name, unit: selectedItemData.unit, quantity: parseFloat(qty), price: parseFloat(price), subtotal: parseFloat(qty) * parseFloat(price) }]);
        setSelectedItemId(''); setQty(''); setPrice('');
    };

    const updateCartItem = (idx, field, value) => {
        const newCart = [...cart];
        const val = parseFloat(value);
        if (field === 'quantity') {
            const itemInv = inventory.find(i => i.id === newCart[idx].itemId);
            if (itemInv && val > itemInv.stock) return alert(`Stok hanya tersedia ${itemInv.stock}`);
        }
        newCart[idx][field] = isNaN(val) ? 0 : val;
        newCart[idx].subtotal = newCart[idx].quantity * newCart[idx].price;
        setCart(newCart);
    };

    const handleProcess = async () => {
        const success = await handleSaveOrder(cart, date, notes, customerName, paymentMethod, paymentStatus);
        if (success) { setCart([]); setNotes(''); setCustomerName(''); setPaymentMethod('Cash'); setPaymentStatus('Lunas'); }
    };

    const totalCart = cart.reduce((sum, i) => sum + i.subtotal, 0);

    const paymentMethods = ['Cash', 'QRIS', 'Transfer', 'Hutang'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pb-24 md:pb-8 animate-fade-in h-full">

            {/* Left Panel - Product Selection */}
            <div className="lg:col-span-3 space-y-4">

                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-200">
                                <ShoppingCart size={18} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">Kasir</h2>
                                <p className="text-xs text-slate-400">Tambah barang ke keranjang</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowCamera(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
                                <Camera size={14} /> Kamera
                            </button>
                            <button onClick={() => setBarcodeMode(!barcodeMode)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                                  ${barcodeMode ? 'bg-violet-600 text-white shadow-sm shadow-violet-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                <Scan size={14} /> USB {barcodeMode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Barcode USB Input */}
                    {barcodeMode && (
                        <div className="mb-4 relative">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                <label className="text-xs font-semibold text-violet-600">Mode Scan USB Aktif</label>
                            </div>
                            <input
                                ref={barcodeInputRef}
                                className="w-full px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-violet-300 transition-all"
                                placeholder="Klik sini lalu scan barcode..."
                                value={barcodeBuffer}
                                onChange={(e) => setBarcodeBuffer(e.target.value)}
                                onKeyDown={handleBarcodeScan}
                                autoFocus
                            />
                            {scanSuccess && (
                                <div className="absolute right-3 top-1/2 translate-y-1 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg animate-scale-in">
                                    <CheckCircle2 size={12} /> Berhasil!
                                </div>
                            )}
                        </div>
                    )}

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-4">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                                  ${activeCategory === cat
                                    ? 'bg-pink-500 text-white shadow-sm shadow-pink-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Product Select + Qty + Price */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Pilih Barang</label>
                            <select
                                className="input-modern"
                                value={selectedItemId}
                                onChange={e => {
                                    setSelectedItemId(e.target.value);
                                    const i = inventory.find(x => x.id === e.target.value);
                                    if (i) setPrice(i.sellPrice || i.lastPrice || i.avgCost);
                                }}
                            >
                                <option value="">-- Pilih Barang --</option>
                                {filteredInventory.map(i => (
                                    <option key={i.id} value={i.id} disabled={i.stock <= 0}>
                                        {i.name} {i.stock <= 0 ? '(Habis)' : `â€” Sisa: ${i.stock} ${i.unit}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedItemData && (
                            <div className="flex gap-2 p-3 bg-pink-50 rounded-xl border border-pink-100 text-xs animate-scale-in">
                                <Package size={14} className="text-pink-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-pink-700">{selectedItemData.name}</p>
                                    <p className="text-pink-400">
                                        Stok: <b>{selectedItemData.stock} {selectedItemData.unit}</b> â€¢
                                        Modal: <b>{formatCurrency(selectedItemData.avgCost)}</b>
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah</label>
                                <input type="number" className="input-modern" placeholder="0"
                                    value={qty} onChange={e => setQty(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Harga Jual (Rp)</label>
                                <input type="number" className="input-modern" placeholder="0"
                                    value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                        </div>

                        <button onClick={addItem} disabled={!selectedItemId || !qty || !price}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-pink-200 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed">
                            <Plus size={18} /> Tambah ke Keranjang
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel - Cart & Checkout */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-5 overflow-hidden">

                    {/* Cart Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white text-sm">Nota Penjualan</h3>
                            <p className="text-slate-400 text-xs">{cart.length} item dalam keranjang</p>
                        </div>
                        {cart.length > 0 && (
                            <button onClick={() => setCart([])} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Customer Info */}
                        <div className="space-y-2.5">
                            <input className="input-modern" placeholder="Nama Customer (Opsional)"
                                value={customerName} onChange={e => setCustomerName(e.target.value)} />
                            <input type="datetime-local" className="input-modern"
                                value={date} onChange={e => setDate(e.target.value)} />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                                <CreditCard size={12} /> Metode & Status
                            </label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {paymentMethods.map(m => (
                                    <button key={m} onClick={() => setPaymentMethod(m)}
                                        className={`py-2 rounded-xl text-xs font-semibold border transition-all
                                          ${paymentMethod === m
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Lunas', 'Belum Lunas'].map(s => (
                                    <button key={s} onClick={() => setPaymentStatus(s)}
                                        className={`py-2 rounded-xl text-xs font-semibold border transition-all
                                          ${paymentStatus === s
                                            ? s === 'Lunas'
                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                : 'bg-red-500 text-white border-red-500'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2">
                            {cart.length === 0 ? (
                                <div className="py-8 text-center">
                                    <ShoppingCart size={28} className="text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">Keranjang kosong</p>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 animate-scale-in">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-semibold text-slate-700 text-xs flex-1 mr-2">{item.itemName}</p>
                                            <button onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                                className="p-0.5 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number"
                                                className="w-14 px-2 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-center outline-none focus:border-pink-400"
                                                value={item.quantity}
                                                onChange={e => updateCartItem(idx, 'quantity', e.target.value)} />
                                            <span className="text-xs text-slate-400">Ã—</span>
                                            <input type="number"
                                                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 bg-white rounded-lg outline-none focus:border-pink-400"
                                                value={item.price}
                                                onChange={e => updateCartItem(idx, 'price', e.target.value)} />
                                            <span className="text-xs font-bold text-pink-600 shrink-0">{formatCurrency(item.subtotal)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Notes */}
                        <input className="input-modern text-xs" placeholder="Catatan (opsional)"
                            value={notes} onChange={e => setNotes(e.target.value)} />

                        {/* Total & Submit */}
                        <div className="border-t border-slate-100 pt-3">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-slate-600 text-sm">Total</span>
                                <span className="text-xl font-black text-slate-800">{formatCurrency(totalCart)}</span>
                            </div>
                            <button onClick={handleProcess} disabled={cart.length === 0}
                                className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold rounded-xl text-sm
                                  hover:opacity-90 transition-all shadow-lg shadow-slate-300 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed
                                  flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> Simpan Transaksi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showCamera && <CameraScanner onScanSuccess={processBarcode} onClose={() => setShowCamera(false)} />}
        </div>
    );
}
