import React, { useState, useRef, useEffect } from 'react';
import {
    Search, Scan, Camera, Minus, Plus, Trash2,
    CheckCircle2, Percent, FileText, Clock, Printer,
    ShoppingBag, ChevronDown, User, X, ShoppingCart
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import CameraScanner from '../components/ui/CameraScanner';

const TAX_RATE = Number(import.meta.env.VITE_TAX_RATE) || 0.11;

const CATEGORY_ICONS_MAP = {
    Semua: '⊞', Makanan: '🍽', Minuman: '☕', Sembako: '🌾', Rumah: '🏠',
    Buah: '🍎', Sayur: '🥬', Daging: '🥩', Snack: '🍬', Kesehatan: '💊',
    Air: '💧', Baju: '👕', Pakaian: '👕', Elektronik: '📺', Umum: '🛒',
};

export default function Sales({ inventory, handleSaveOrder }) {
    const [orderNumber] = useState(() => `MBG-${Math.floor(Math.random() * 9000) + 1000}`);
    const [cart, setCart] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [notes, setNotes] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('Lunas');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [discount, setDiscount] = useState(0);
    const [showDiscount, setShowDiscount] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showPaymentOpts, setShowPaymentOpts] = useState(false);
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [showCartModal, setShowCartModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);
    const barcodeInputRef = useRef(null);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');

    const categories = ['Semua', ...new Set(inventory.map(i => i.category || 'Umum'))];

    const filteredInventory = inventory.filter(i => {
        const matchCat = activeCategory === 'Semua' || (i.category || 'Umum') === activeCategory;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || i.name.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q) || (i.barcode || '').includes(q);
        return matchCat && matchSearch;
    });

    useEffect(() => {
        if (barcodeMode && barcodeInputRef.current) barcodeInputRef.current.focus();
    }, [barcodeMode]);

    // Close modal on cart empty
    useEffect(() => {
        if (cart.length === 0) setShowCartModal(false);
    }, [cart.length]);

    const addToCart = (item) => {
        if (item.stock <= 0) return alert('Stok Habis!');
        const price = parseFloat(item.sellPrice || item.lastPrice || item.avgCost || 0);
        setCart(prev => {
            const idx = prev.findIndex(c => c.itemId === item.id);
            if (idx >= 0) {
                const nc = [...prev];
                if (nc[idx].quantity + 1 > item.stock) { alert(`Stok hanya tersedia ${item.stock}`); return prev; }
                nc[idx].quantity += 1;
                nc[idx].subtotal = nc[idx].quantity * nc[idx].price;
                return nc;
            }
            return [...prev, { itemId: item.id, itemName: item.name, unit: item.unit, imageUrl: item.imageUrl || null, quantity: 1, price, subtotal: price }];
        });
    };

    const updateQty = (idx, delta) => {
        const nc = [...cart];
        const nq = nc[idx].quantity + delta;
        if (nq <= 0) { setCart(cart.filter((_, i) => i !== idx)); return; }
        const inv = inventory.find(i => i.id === nc[idx].itemId);
        if (delta > 0 && inv && nq > inv.stock) return alert(`Stok hanya tersedia ${inv.stock}`);
        nc[idx].quantity = nq;
        nc[idx].subtotal = nq * nc[idx].price;
        setCart(nc);
    };

    const processBarcode = (code) => {
        const item = inventory.find(i => i.barcode === code);
        if (item) {
            if (navigator.vibrate) navigator.vibrate(150);
            setScanSuccess(true);
            setTimeout(() => setScanSuccess(false), 2000);
            addToCart(item);
        } else {
            alert('Barang tidak ditemukan (Barcode: ' + code + ')');
        }
        setBarcodeBuffer('');
    };

    const handleBarcodeScan = (e) => {
        if (e.key === 'Enter') processBarcode(e.target.value);
        else setBarcodeBuffer(e.target.value);
    };

    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax - discount;

    const handleProcess = async () => {
        const success = await handleSaveOrder(cart, date, notes, customerName || 'Pelanggan Umum', paymentMethod, paymentStatus);
        if (success) {
            setCart([]); setNotes(''); setCustomerName('');
            setPaymentMethod('Cash'); setPaymentStatus('Lunas'); setDiscount(0);
            setShowDiscount(false); setShowNotes(false); setShowCartModal(false);
        }
    };

    // Reusable Order Panel content
    const OrderPanel = ({ isModal = false }) => (
        <div className={`flex flex-col bg-white overflow-hidden ${isModal ? 'rounded-3xl' : 'rounded-2xl border border-slate-100 shadow-sm'}`}>
            {/* Order Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Order #{orderNumber}</h3>
                <div className="flex items-center gap-1">
                    {cart.length > 0 && (
                        <button onClick={() => { setCart([]); setDiscount(0); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all">
                            <Trash2 size={15} />
                        </button>
                    )}
                    {isModal && (
                        <button onClick={() => setShowCartModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all ml-1">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Customer */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={13} className="text-slate-500" />
                </div>
                <input
                    className="flex-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 bg-transparent"
                    placeholder="Pelanggan Umum"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                />
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </div>

            {/* Cart Items */}
            <div className={`overflow-y-auto custom-scrollbar ${isModal ? 'max-h-56' : 'flex-1'}`}>
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300 py-12">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                            <Camera size={20} className="text-slate-300" />
                        </div>
                        <p className="text-xs">Scan item to add...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {cart.map((item, idx) => (
                            <div key={idx} className="px-4 py-3 flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                                    {item.imageUrl
                                        ? <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                                        : <ShoppingBag size={14} className="text-slate-400" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 truncate">{item.itemName}</p>
                                    <p className="text-xs font-bold text-slate-800">{formatCurrency(item.subtotal)}</p>
                                    <p className="text-[10px] text-slate-400">@ {formatCurrency(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                                        <Minus size={9} className="text-slate-600" />
                                    </button>
                                    <span className="w-5 text-center text-xs font-bold text-slate-700 tabular-nums">{item.quantity}</span>
                                    <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-full bg-pink-500 hover:bg-pink-600 flex items-center justify-center transition-colors">
                                        <Plus size={9} className="text-white" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="border-t border-slate-100 px-5 py-3 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                    <span>Pajak (11%)</span>
                    <span className="font-medium text-slate-700">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-emerald-600 font-medium">Diskon</span>
                    <span className="font-medium text-emerald-600">-{formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Total</span>
                    <span className="font-black text-slate-800 text-base tabular-nums">{formatCurrency(total)}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-2 border-t border-slate-100 grid grid-cols-4 gap-1">
                {[
                    { icon: Printer, label: 'Struk', action: () => window.print() },
                    { icon: FileText, label: 'Catatan', action: () => setShowNotes(v => !v), active: showNotes },
                    { icon: Clock, label: 'Pending', action: () => setShowPaymentOpts(v => !v), active: showPaymentOpts },
                    { icon: Percent, label: 'Diskon', action: () => setShowDiscount(v => !v), active: showDiscount },
                ].map(({ icon: Icon, label, action, active }) => (
                    <button key={label} onClick={action}
                        className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all
                          ${active ? 'bg-pink-50 text-pink-600' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700'}`}>
                        <Icon size={15} />
                        <span className="text-[10px] font-medium">{label}</span>
                    </button>
                ))}
            </div>

            {showDiscount && (
                <div className="px-4 pb-2">
                    <input type="number" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-pink-300 transition-colors"
                        placeholder="Nominal diskon (Rp)" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
                </div>
            )}
            {showNotes && (
                <div className="px-4 pb-2">
                    <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-pink-300 transition-colors"
                        placeholder="Catatan transaksi..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
            )}
            {showPaymentOpts && (
                <div className="px-4 pb-3 space-y-2">
                    <div className="grid grid-cols-4 gap-1.5">
                        {['Cash', 'QRIS', 'Transfer', 'Hutang'].map(m => (
                            <button key={m} onClick={() => setPaymentMethod(m)}
                                className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all
                                  ${paymentMethod === m ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {['Lunas', 'Belum Lunas'].map(s => (
                            <button key={s} onClick={() => setPaymentStatus(s)}
                                className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all
                                  ${paymentStatus === s
                                    ? s === 'Lunas' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <input type="datetime-local" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs focus:border-pink-300 transition-colors"
                        value={date} onChange={e => setDate(e.target.value)} />
                </div>
            )}

            {/* Bayar Button */}
            <div className="px-4 py-4 border-t border-slate-100">
                <button
                    onClick={handleProcess}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl text-sm
                      transition-all shadow-lg shadow-pink-200 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed
                      flex items-center justify-between px-5"
                >
                    <span>Bayar</span>
                    <span className="tabular-nums">{formatCurrency(total)}</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] landscape:h-[calc(100vh-6rem)] gap-4 animate-fade-in">

                {/* Left - Product Browser */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-w-0">

                    {/* Top Bar */}
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:border-pink-300 transition-colors"
                                placeholder="Cari nama produk atau SKU..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setBarcodeMode(!barcodeMode)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                              ${barcodeMode ? 'bg-violet-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                        >
                            <Scan size={14} /> <span className="hidden sm:inline">Scan Barcode</span><span className="sm:hidden">Scan</span>
                        </button>
                        <button
                            onClick={() => setShowCamera(true)}
                            className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-all"
                        >
                            <Camera size={14} />
                        </button>
                    </div>

                    {/* USB Barcode Input */}
                    {barcodeMode && (
                        <div className="px-4 py-2 bg-violet-50 border-b border-violet-100 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                <span className="text-xs font-semibold text-violet-600">USB Aktif</span>
                            </div>
                            <div className="relative flex-1">
                                <input
                                    ref={barcodeInputRef}
                                    className="w-full px-3 py-2 bg-white border border-violet-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-violet-300"
                                    placeholder="Klik sini lalu scan barcode..."
                                    value={barcodeBuffer}
                                    onChange={e => setBarcodeBuffer(e.target.value)}
                                    onKeyDown={handleBarcodeScan}
                                    autoFocus
                                />
                                {scanSuccess && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                        <CheckCircle2 size={10} /> Berhasil!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Category Tabs */}
                    <div className="px-4 py-2.5 flex gap-2 overflow-x-auto border-b border-slate-100 custom-scrollbar">
                        {categories.map(cat => {
                            const isActive = activeCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                                      ${isActive
                                        ? 'bg-pink-500 text-white shadow-sm shadow-pink-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {filteredInventory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
                                <ShoppingBag size={36} className="mb-2" />
                                <p className="text-sm">Tidak ada produk</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {filteredInventory.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        disabled={item.stock <= 0}
                                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden text-left hover:border-pink-200 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="relative">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
                                            ) : (
                                                <div className="w-full h-28 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                    <ShoppingBag size={26} className="text-slate-300" />
                                                </div>
                                            )}
                                            <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                                                Stok: {item.stock}
                                            </span>
                                        </div>
                                        <div className="p-2.5">
                                            <p className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2 mb-1 min-h-[2rem]">{item.name}</p>
                                            <p className="text-sm font-bold text-pink-600">
                                                {formatCurrency(item.sellPrice || item.lastPrice || item.avgCost || 0)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right - Order Panel (desktop only) */}
                <div className="hidden lg:flex w-80 shrink-0 flex-col">
                    <OrderPanel />
                </div>
            </div>

            {/* Floating Cart Button — mobile only, shown when cart has items */}
            {cart.length > 0 && (
                <button
                    onClick={() => setShowCartModal(true)}
                    className="fixed bottom-24 right-4 z-40 lg:hidden flex items-center gap-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-pink-300 font-bold text-sm active:scale-95 transition-all"
                >
                    <div className="relative">
                        <ShoppingCart size={18} />
                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-pink-500 text-[10px] font-black rounded-full flex items-center justify-center">
                            {cart.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                    </div>
                    <span>Lihat Pesanan</span>
                    <span className="tabular-nums">{formatCurrency(total)}</span>
                </button>
            )}

            {/* Cart Modal — mobile */}
            {showCartModal && (
                <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCartModal(false)} />
                    {/* Sheet */}
                    <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl shadow-2xl">
                        {/* Drag handle */}
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full z-10" />
                        <div className="pt-4">
                            <OrderPanel isModal />
                        </div>
                    </div>
                </div>
            )}

            {showCamera && <CameraScanner onScanSuccess={processBarcode} onClose={() => setShowCamera(false)} />}
        </>
    );
}
