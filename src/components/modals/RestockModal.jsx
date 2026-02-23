import React, { useState, useRef } from 'react';
import {
    X, PackagePlus, Camera, Calendar, Package, ChevronDown,
    Tag, DollarSign, Barcode, Info, Save
} from 'lucide-react';
import CameraScanner from '../ui/CameraScanner';

const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all";

export default function RestockModal({ inventory, handlePurchase, onClose }) {
    const [form, setForm] = useState({
        itemName: '', quantity: '', pricePerUnit: '', totalPrice: '',
        unit: 'pcs', supplier: '', date: new Date().toISOString().slice(0, 16),
        barcode: '', category: 'Umum', sellPrice: '', existingId: null,
    });
    const [mode, setMode] = useState('existing');
    const [showCamera, setShowCamera] = useState(false);
    const quantityInputRef = useRef(null);

    const categories = [...new Set(inventory.map(i => i.category).filter(Boolean))].sort();

    // Margin calculation
    const modal = parseFloat(form.pricePerUnit) || 0;
    const jual = parseFloat(form.sellPrice) || 0;
    const marginPct = modal > 0 && jual > 0 ? (((jual - modal) / modal) * 100).toFixed(1) : null;

    const handleQtyChange = (val) => {
        const unitPrice = parseFloat(form.pricePerUnit) || 0;
        const newTotal = val && unitPrice ? (parseFloat(val) * unitPrice).toString() : form.totalPrice;
        setForm(f => ({ ...f, quantity: val, totalPrice: newTotal }));
    };

    const handleUnitPriceChange = (val) => {
        const qty = parseFloat(form.quantity) || 0;
        const newTotal = qty && val ? (qty * parseFloat(val)).toString() : '';
        setForm(f => ({ ...f, pricePerUnit: val, totalPrice: newTotal }));
    };

    const handleTotalPriceChange = (val) => {
        const qty = parseFloat(form.quantity) || 0;
        const newUnitPrice = qty > 0 && val ? (parseFloat(val) / qty).toString() : '';
        setForm(f => ({ ...f, totalPrice: val, pricePerUnit: newUnitPrice }));
    };

    const handleExistSelect = (e) => {
        const i = inventory.find(x => x.id === e.target.value);
        if (i) {
            setForm(f => ({
                ...f, itemName: i.name, unit: i.unit,
                category: i.category || 'Umum', barcode: i.barcode || '',
                existingId: i.id, sellPrice: i.sellPrice || i.lastPrice || '',
            }));
            if (quantityInputRef.current) quantityInputRef.current.focus();
        }
    };

    const processBarcodeRestock = (scannedBarcode) => {
        const exists = inventory.find(i => i.barcode === scannedBarcode);
        if (exists) {
            setMode('existing');
            setForm(f => ({
                ...f, barcode: scannedBarcode, itemName: exists.name,
                unit: exists.unit, category: exists.category || 'Umum',
                existingId: exists.id, sellPrice: exists.sellPrice || '',
            }));
        } else {
            setMode('new');
            setForm(f => ({ ...f, barcode: scannedBarcode, itemName: '', existingId: null }));
        }
        setShowCamera(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        await handlePurchase(form);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

                {/* Dialog */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-200">
                                <PackagePlus size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">Tambah / Restock Barang</h3>
                                <p className="text-[11px] text-slate-400">Isi detail produk di bawah ini untuk menambah stok ke inventaris.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Mode toggle */}
                    <div className="flex gap-2 px-6 pt-4">
                        <button type="button"
                            onClick={() => { setMode('existing'); setForm(f => ({ ...f, existingId: null, itemName: '' })); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border ${mode === 'existing' ? 'bg-pink-50 border-pink-300 text-pink-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            Stok Lama
                        </button>
                        <button type="button"
                            onClick={() => { setMode('new'); setForm(f => ({ ...f, existingId: null })); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border ${mode === 'new' ? 'bg-pink-50 border-pink-300 text-pink-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            Barang Baru
                        </button>
                    </div>

                    {/* Body — two column */}
                    <form onSubmit={submit} className="px-6 py-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* ── LEFT: IDENTITAS PRODUK ── */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Package size={13} className="text-pink-500" />
                                    <span className="text-[11px] font-bold text-pink-500 tracking-widest uppercase">Identitas Produk</span>
                                </div>

                                {/* Nama / Pilih barang */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                                        {mode === 'existing' ? 'Pilih Barang dari Stok' : 'Nama Produk'}
                                    </label>
                                    {mode === 'existing' ? (
                                        <div className="relative">
                                            <select className={`${inputCls} appearance-none pr-8`}
                                                onChange={handleExistSelect} value={form.existingId || ''}>
                                                <option value="">-- Pilih Barang --</option>
                                                {inventory.map(i => (
                                                    <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock} {i.unit})</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <input className={inputCls} placeholder="Contoh: Kopi Susu Gula Aren"
                                            value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} />
                                    )}
                                </div>

                                {/* Kategori */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kategori</label>
                                    <div className="relative">
                                        <select className={`${inputCls} appearance-none pr-8`} value={form.category}
                                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            {!categories.includes(form.category) && (
                                                <option value={form.category}>{form.category}</option>
                                            )}
                                            <option value="Umum">Umum</option>
                                            <option value="Makanan">Makanan</option>
                                            <option value="Minuman">Minuman</option>
                                            <option value="Sembako">Sembako</option>
                                            <option value="Rokok">Rokok</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Barcode / SKU */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Barcode / SKU</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Barcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input className={`${inputCls} pl-8`} placeholder="Scan atau ketik manual"
                                                value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
                                        </div>
                                        <button type="button" onClick={() => setShowCamera(true)}
                                            className="w-10 h-10 flex items-center justify-center bg-pink-50 border border-pink-200 rounded-xl text-pink-500 hover:bg-pink-100 transition-colors flex-shrink-0">
                                            <Camera size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Biarkan kosong untuk generate SKU otomatis.</p>
                                </div>

                                {/* Supplier */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Supplier</label>
                                    <input className={inputCls} placeholder="Nama Toko / Supplier"
                                        value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
                                </div>

                                {/* Tanggal Masuk */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                        <Calendar size={12} /> Tanggal Masuk
                                    </label>
                                    <input type="datetime-local" className={inputCls}
                                        value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                            </div>

                            {/* ── RIGHT: HARGA & STOK ── */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign size={13} className="text-pink-500" />
                                    <span className="text-[11px] font-bold text-pink-500 tracking-widest uppercase">Harga &amp; Stok</span>
                                </div>

                                {/* Harga Modal + Harga Jual */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Harga Modal</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rp</span>
                                            <input type="number" className={`${inputCls} pl-8`} placeholder="0"
                                                value={form.pricePerUnit} onChange={e => handleUnitPriceChange(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Harga Jual</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rp</span>
                                            <input type="number"
                                                className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                                                placeholder="0" value={form.sellPrice}
                                                onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Margin info */}
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-pink-50 border border-pink-100 rounded-xl">
                                    <Info size={14} className="text-pink-400 flex-shrink-0" />
                                    {marginPct !== null ? (
                                        <p className="text-xs text-pink-600">
                                            Margin keuntungan saat ini adalah <span className="font-bold">{marginPct}%</span>.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-pink-500">
                                            Margin keuntungan yang disarankan adalah <span className="font-bold">20%</span>.
                                        </p>
                                    )}
                                </div>

                                {/* Total Beli */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                                        <Tag size={11} /> Total Pembelian
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 text-xs font-semibold">Rp</span>
                                        <input type="number"
                                            className="w-full pl-8 pr-3 py-2.5 bg-pink-50 border border-pink-200 rounded-xl outline-none text-sm font-bold text-pink-700 focus:ring-2 focus:ring-pink-100 transition-all"
                                            placeholder="0" value={form.totalPrice} onChange={e => handleTotalPriceChange(e.target.value)} />
                                    </div>
                                </div>

                                {/* Stok Awal + Satuan */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Stok Masuk</label>
                                        <div className="relative">
                                            <input ref={quantityInputRef} type="number" step="0.01"
                                                className={`${inputCls} pr-12 text-center font-bold`}
                                                placeholder="0" value={form.quantity} onChange={e => handleQtyChange(e.target.value)} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                                                {form.unit || 'Unit'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Satuan</label>
                                        <input className={`${inputCls} text-center`} placeholder="pcs"
                                            value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 pt-5 mt-2 border-t border-slate-100">
                            <button type="button" onClick={onClose}
                                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-sm transition-colors">
                                Batal
                            </button>
                            <button type="submit"
                                className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-200 active:scale-95">
                                <Save size={15} /> Simpan Produk
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showCamera && (
                <CameraScanner onScanSuccess={processBarcodeRestock} onClose={() => setShowCamera(false)} />
            )}
        </>
    );
}
