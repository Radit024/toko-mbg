import React, { useState, useRef } from 'react';
import {
    X, PackagePlus, Camera, Calendar, Package, ChevronRight,
    Tag, DollarSign
} from 'lucide-react';
import CameraScanner from '../ui/CameraScanner';

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
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

                {/* Dialog */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mb-10 flex flex-col overflow-hidden animate-scale-in">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-200">
                                <PackagePlus size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Tambah / Restock Barang</h3>
                                <p className="text-[11px] text-slate-400">Input pembelian & stok masuk</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={submit} className="px-5 py-5 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">

                        {/* Mode toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs">
                            <button type="button"
                                onClick={() => { setMode('existing'); setForm(f => ({ ...f, existingId: null })); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                                  ${mode === 'existing' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>
                                Stok Lama
                            </button>
                            <button type="button"
                                onClick={() => { setMode('new'); setForm(f => ({ ...f, existingId: null })); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                                  ${mode === 'new' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>
                                Barang Baru
                            </button>
                        </div>

                        {/* Scan Barcode */}
                        <button type="button"
                            onClick={() => setShowCamera(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
                            <Camera size={15} /> Scan Barcode
                        </button>

                        {/* Date */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                <Calendar size={12} /> Tanggal Masuk
                            </label>
                            <input type="datetime-local" className="input-modern"
                                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                        </div>

                        {/* Item select or name */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                <Package size={12} /> {mode === 'existing' ? 'Pilih Barang dari Stok' : 'Nama Barang Baru'}
                            </label>
                            {mode === 'existing' ? (
                                <div className="relative">
                                    <select className="input-modern appearance-none pr-8"
                                        onChange={handleExistSelect} value={form.existingId || ''}>
                                        <option value="">-- Pilih Barang --</option>
                                        {inventory.map(i => (
                                            <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock} {i.unit})</option>
                                        ))}
                                    </select>
                                    <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                            ) : (
                                <input className="input-modern" placeholder="Nama barang baru"
                                    value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} />
                            )}
                        </div>

                        {/* Barcode + Category */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Barcode</label>
                                <input className="input-modern" placeholder="Scan/Ketik Barcode"
                                    value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kategori</label>
                                <select className="input-modern" value={form.category}
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
                            </div>
                        </div>

                        {/* Qty + Unit + Prices */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah</label>
                                <input ref={quantityInputRef} type="number" step="0.01"
                                    className="input-modern text-center font-bold"
                                    placeholder="0" value={form.quantity} onChange={e => handleQtyChange(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Satuan</label>
                                <input className="input-modern text-center" placeholder="pcs"
                                    value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                                    <Tag size={11} /> Harga Satuan
                                </label>
                                <input type="number" className="input-modern" placeholder="Rp"
                                    value={form.pricePerUnit} onChange={e => handleUnitPriceChange(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-blue-500 mb-1.5 flex items-center gap-1">
                                    <DollarSign size={11} /> Total Beli
                                </label>
                                <input type="number"
                                    className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="Rp 0" value={form.totalPrice} onChange={e => handleTotalPriceChange(e.target.value)} />
                            </div>
                        </div>

                        {/* Sell Price */}
                        <div>
                            <label className="text-xs font-semibold text-pink-500 mb-1.5 flex items-center gap-1">
                                <DollarSign size={11} /> Harga Jual (Rencana)
                            </label>
                            <input type="number"
                                className="w-full px-3 py-3 bg-pink-50 border border-pink-200 rounded-xl outline-none text-sm font-bold text-pink-700 focus:ring-2 focus:ring-pink-100 transition-all"
                                placeholder="Rp 0 (tampil di kasir)" value={form.sellPrice}
                                onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} />
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Supplier</label>
                            <input className="input-modern" placeholder="Nama Toko / Supplier"
                                value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
                        </div>

                        {/* Footer buttons inside form scroll area */}
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-colors">
                                Batal
                            </button>
                            <button type="submit"
                                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200 active:scale-95">
                                <PackagePlus size={16} /> Simpan Stok
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
