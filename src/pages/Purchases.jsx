import React, { useState, useMemo, useRef } from 'react';
import { Camera, Calendar, Package, ChevronRight, Tag, DollarSign, PackagePlus, Clock, Search, ArrowDownUp, Filter, RefreshCcw, Edit, Trash2, Barcode } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import CameraScanner from '../components/ui/CameraScanner';

export default function Purchases({ inventory, restockLogs, handlePurchase, setEditingRestock, handleDeleteRestock }) {
    const [form, setForm] = useState({
        itemName: '', quantity: '', pricePerUnit: '', totalPrice: '',
        unit: 'pcs', supplier: '', date: new Date().toISOString().slice(0, 16),
        barcode: '', category: 'Umum', sellPrice: ''
    });
    const [mode, setMode] = useState('existing');
    const [showCamera, setShowCamera] = useState(false);
    const quantityInputRef = useRef(null);

    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [visibleLimit, setVisibleLimit] = useState(10);
    const [searchSupplier, setSearchSupplier] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const handleQtyChange = (val) => {
        const unitPrice = parseFloat(form.pricePerUnit) || 0;
        const newTotal = val && unitPrice ? (parseFloat(val) * unitPrice).toString() : form.totalPrice;
        setForm({ ...form, quantity: val, totalPrice: newTotal });
    };
    const handleUnitPriceChange = (val) => {
        const qty = parseFloat(form.quantity) || 0;
        const newTotal = qty && val ? (qty * parseFloat(val)).toString() : '';
        setForm({ ...form, pricePerUnit: val, totalPrice: newTotal });
    };
    const handleTotalPriceChange = (val) => {
        const qty = parseFloat(form.quantity) || 0;
        const newUnitPrice = qty > 0 && val ? (parseFloat(val) / qty).toString() : '';
        setForm({ ...form, totalPrice: val, pricePerUnit: newUnitPrice });
    };

    const handleExistSelect = (e) => {
        const i = inventory.find(x => x.id === e.target.value);
        if (i) {
            setForm({ ...form, itemName: i.name, unit: i.unit, category: i.category || 'Umum', barcode: i.barcode || '', existingId: i.id, sellPrice: i.sellPrice || i.lastPrice || '' });
            if (quantityInputRef.current) quantityInputRef.current.focus();
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        const success = await handlePurchase(form);
        if (success) setForm({ ...form, quantity: '', pricePerUnit: '', totalPrice: '', barcode: '', existingId: null, sellPrice: '' });
    };

    const processBarcodeRestock = (scannedBarcode) => {
        setForm(prev => ({ ...prev, barcode: scannedBarcode }));
        const exists = inventory.find(i => i.barcode === scannedBarcode);
        if (exists) {
            setMode('existing');
            setForm(prev => ({ ...prev, barcode: scannedBarcode, itemName: exists.name, unit: exists.unit, category: exists.category || 'Umum', existingId: exists.id, sellPrice: exists.sellPrice || '' }));
        } else {
            setMode('new');
            setForm(prev => ({ ...prev, barcode: scannedBarcode, itemName: '', existingId: null }));
        }
    };

    const filteredLogs = useMemo(() => {
        let logs = [...restockLogs];
        if (filterStartDate || filterEndDate) {
            const start = filterStartDate ? new Date(filterStartDate) : new Date(0);
            const end = filterEndDate ? new Date(filterEndDate) : new Date(8640000000000000);
            end.setHours(23, 59, 59, 999);
            logs = logs.filter(log => {
                const d = log.inputDate ? new Date(log.inputDate) : new Date();
                return d >= start && d <= end;
            });
        }
        if (searchSupplier) {
            const q = searchSupplier.toLowerCase();
            logs = logs.filter(log => (log.supplier || '').toLowerCase().includes(q));
        }
        logs.sort((a, b) => {
            const dA = new Date(a.inputDate || 0), dB = new Date(b.inputDate || 0);
            if (sortBy === 'oldest') return dA - dB;
            if (sortBy === 'highest') return (b.totalCost || 0) - (a.totalCost || 0);
            if (sortBy === 'lowest') return (a.totalCost || 0) - (b.totalCost || 0);
            return dB - dA;
        });
        return logs;
    }, [restockLogs, filterStartDate, filterEndDate, searchSupplier, sortBy]);

    const visibleLogs = filteredLogs.slice(0, visibleLimit);

    return (
        <div className="pb-24 md:pb-8 animate-fade-in space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800">Restock Gudang</h2>
                    <p className="text-sm text-slate-400">Input pembelian & tambah stok barang</p>
                </div>
                <button onClick={() => setShowCamera(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Camera size={16} /> Scan Barcode
                </button>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
                {/* Mode Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-5 max-w-xs">
                    <button onClick={() => { setMode('existing'); setForm({ ...form, existingId: null }); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                          ${mode === 'existing' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>
                        Stok Lama
                    </button>
                    <button onClick={() => { setMode('new'); setForm({ ...form, existingId: null }); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                          ${mode === 'new' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>
                        Barang Baru
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {/* Date */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                            <Calendar size={12} /> Tanggal Masuk
                        </label>
                        <input type="datetime-local" className="input-modern" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>

                    {/* Item */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                            <Package size={12} /> {mode === 'existing' ? 'Pilih Barang dari Stok' : 'Nama Barang Baru'}
                        </label>
                        {mode === 'existing' ? (
                            <div className="relative">
                                <select className="input-modern appearance-none pr-8" onChange={handleExistSelect} value={form.existingId || ''}>
                                    <option value="">-- Pilih Barang --</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock} {i.unit})</option>)}
                                </select>
                                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        ) : (
                            <input className="input-modern" placeholder="Nama barang baru" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} />
                        )}
                    </div>

                    {/* Barcode + Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">Barcode</label>
                            <input className="input-modern" placeholder="Scan/Ketik Barcode" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kategori</label>
                            <input className="input-modern" placeholder="Makanan, Minuman..." value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="categories" />
                            <datalist id="categories">
                                <option value="Makanan" /><option value="Minuman" /><option value="Sembako" /><option value="Rokok" />
                            </datalist>
                        </div>
                    </div>

                    {/* Qty + Unit + Prices */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah</label>
                            <input ref={quantityInputRef} type="number" step="0.01" className="input-modern text-center font-bold"
                                placeholder="0" value={form.quantity} onChange={e => handleQtyChange(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Satuan</label>
                            <input className="input-modern text-center" placeholder="pcs" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Tag size={11} /> Harga Satuan</label>
                            <input type="number" className="input-modern" placeholder="Rp"
                                value={form.pricePerUnit} onChange={e => handleUnitPriceChange(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-blue-500 mb-1.5 flex items-center gap-1"><DollarSign size={11} /> Total Beli</label>
                            <input type="number" className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-100 transition-all"
                                placeholder="Rp 0" value={form.totalPrice} onChange={e => handleTotalPriceChange(e.target.value)} />
                        </div>
                    </div>

                    {/* Sell Price */}
                    <div>
                        <label className="text-xs font-semibold text-pink-500 mb-1.5 flex items-center gap-1"><DollarSign size={11} /> Harga Jual (Rencana)</label>
                        <input type="number" className="w-full px-3 py-3 bg-pink-50 border border-pink-200 rounded-xl outline-none text-sm font-bold text-pink-700 focus:ring-2 focus:ring-pink-100 transition-all"
                            placeholder="Rp 0 (tampil di kasir)" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} />
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Supplier</label>
                        <input className="input-modern" placeholder="Nama Toko / Supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                    </div>

                    <button type="submit"
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200 active:scale-95">
                        <PackagePlus size={20} /> Simpan Stok
                    </button>
                </form>
            </div>

            {/* Logs Table */}
            <div className="space-y-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={18} className="text-pink-500" />
                        Riwayat Masuk ({filteredLogs.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                            <input className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200 shadow-sm"
                                placeholder="Cari Supplier..." value={searchSupplier} onChange={e => setSearchSupplier(e.target.value)} />
                        </div>
                        <select className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none cursor-pointer font-semibold text-slate-600 shadow-sm"
                            value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                            <option value="highest">Termahal</option>
                            <option value="lowest">Termurah</option>
                        </select>
                        <div className="flex items-center gap-1.5 flex-wrap bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                            <Filter size={12} className="text-slate-400 shrink-0" />
                            <input type="date" className="text-xs outline-none bg-transparent text-slate-600 min-w-0 flex-1" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                            <span className="text-slate-300">—</span>
                            <input type="date" className="text-xs outline-none bg-transparent text-slate-600 min-w-0 flex-1" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                        </div>
                        {(filterStartDate || filterEndDate || searchSupplier || sortBy !== 'newest') && (
                            <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setSearchSupplier(''); setSortBy('newest'); }}
                                className="p-2 bg-red-50 text-red-500 rounded-xl text-xs hover:bg-red-100 transition-colors">
                                <RefreshCcw size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Tanggal</th>
                                    <th className="px-4 py-3 text-left">Barang</th>
                                    <th className="px-4 py-3 text-center">Jumlah</th>
                                    <th className="px-4 py-3 text-right">Harga Beli</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3">Supplier</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {visibleLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(log.inputDate)}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-700">{log.itemName}</td>
                                        <td className="px-4 py-3 text-center text-slate-600">{log.qty} <span className="text-xs text-slate-400">{log.unit}</span></td>
                                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(log.pricePerUnit)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(log.totalCost)}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{log.supplier || '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1.5">
                                                <button onClick={() => setEditingRestock(log)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                                                <button onClick={() => handleDeleteRestock(log)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {visibleLogs.length === 0 && (
                                    <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-400 text-sm">Tidak ada riwayat ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {visibleLogs.map(log => (
                        <div key={log.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="badge-pink text-[10px] mb-1">{formatDate(log.inputDate)}</span>
                                    <h4 className="font-bold text-slate-800">{log.itemName}</h4>
                                    <p className="text-xs text-slate-400">{log.supplier || 'Tanpa Supplier'}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => setEditingRestock(log)} className="p-2 text-blue-400 bg-blue-50 rounded-xl transition-colors"><Edit size={15} /></button>
                                    <button onClick={() => handleDeleteRestock(log)} className="p-2 text-red-400 bg-red-50 rounded-xl transition-colors"><Trash2 size={15} /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3">
                                <div className="border-r border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Jumlah</p>
                                    <p className="font-bold text-slate-800">{log.qty} <span className="text-xs font-normal">{log.unit}</span></p>
                                </div>
                                <div className="pl-2">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Beli</p>
                                    <p className="font-bold text-slate-800">{formatCurrency(log.totalCost)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {visibleLogs.length === 0 && (
                        <div className="py-10 text-center text-slate-400 text-sm">Tidak ada riwayat ditemukan.</div>
                    )}
                </div>

                {visibleLogs.length < filteredLogs.length && (
                    <button onClick={() => setVisibleLimit(v => v + 10)}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-500 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm shadow-sm">
                        Muat {filteredLogs.length - visibleLogs.length} data lagi...
                    </button>
                )}
            </div>

            {showCamera && <CameraScanner onScanSuccess={processBarcodeRestock} onClose={() => setShowCamera(false)} />}
        </div>
    );
}
