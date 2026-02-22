import React, { useState, useMemo } from 'react';
import {
    Search, Trash2, Package, AlertTriangle, Tag, TrendingUp,
    BarChart2, Pencil, Upload, Plus, ChevronLeft, ChevronRight,
    Image as ImageIcon, Layers
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const PAGE_SIZE = 5;

export default function Inventory({ inventory, handleDeleteInventoryItem, setActiveTab }) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const categories = useMemo(() =>
        [...new Set(inventory.map(i => i.category).filter(Boolean))].sort(),
        [inventory]
    );

    const getStatus = (item) => {
        if (item.stock <= 0) return { label: 'Habis', cls: 'badge-red', dot: 'bg-red-500' };
        if (item.stock <= (item.minStock || 5)) return { label: 'Stok Menipis', cls: 'badge-yellow', dot: 'bg-amber-400' };
        return { label: 'Tersedia', cls: 'badge-green', dot: 'bg-emerald-500' };
    };

    const filtered = useMemo(() => {
        return inventory
            .filter(i => {
                const q = search.toLowerCase();
                const matchSearch = !search ||
                    i.name.toLowerCase().includes(q) ||
                    (i.barcode && i.barcode.toLowerCase().includes(q)) ||
                    (i.category && i.category.toLowerCase().includes(q));
                const matchCategory = !categoryFilter || i.category === categoryFilter;
                const matchStatus = !statusFilter ||
                    (statusFilter === 'tersedia' && i.stock > (i.minStock || 5)) ||
                    (statusFilter === 'tipis' && i.stock > 0 && i.stock <= (i.minStock || 5)) ||
                    (statusFilter === 'habis' && i.stock <= 0);
                return matchSearch && matchCategory && matchStatus;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [inventory, search, categoryFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleSearch = (v) => { setSearch(v); setPage(1); };
    const handleCategory = (v) => { setCategoryFilter(v); setPage(1); };
    const handleStatus = (v) => { setStatusFilter(v); setPage(1); };

    const stats = useMemo(() => ({
        total: inventory.length,
        totalStock: inventory.reduce((s, i) => s + (i.stock || 0), 0),
        lowStock: inventory.filter(i => i.stock > 0 && i.stock <= (i.minStock || 5)).length,
        categories: categories.length,
    }), [inventory, categories]);

    const startItem = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(safePage * PAGE_SIZE, filtered.length);

    return (
        <div className="pb-24 md:pb-8 animate-fade-in space-y-5">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800">Manajemen Stok Barang</h2>
                    <p className="text-sm text-slate-400">Kelola stok produk, harga, dan kategori barang di tokomu.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:border-pink-300 hover:text-pink-600 transition-all shadow-sm">
                        <Upload size={15} /> Import / Export
                    </button>
                    <button
                        onClick={() => setActiveTab && setActiveTab('purchases')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-pink-200">
                        <Plus size={16} /> Tambah Produk
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Produk', value: stats.total.toLocaleString('id-ID'), icon: Package, color: 'text-blue-500 bg-blue-50' },
                    { label: 'Total Stok', value: stats.totalStock.toLocaleString('id-ID'), icon: Layers, color: 'text-emerald-500 bg-emerald-50' },
                    { label: 'Stok Menipis', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
                    { label: 'Kategori', value: stats.categories, icon: Tag, color: 'text-purple-500 bg-purple-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-slate-500 font-medium">{label}</p>
                            <div className={`p-2 rounded-xl ${color}`}><Icon size={16} /></div>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                    </div>
                ))}
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Filters */}
                <div className="flex flex-row items-center gap-3 p-4 border-b border-slate-100">
                    <div className="relative w-80 shrink-0">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="input-modern pl-9 w-full"
                            placeholder="Cari nama barang, SKU, atau barcode..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <select className="input-modern text-sm px-3 min-w-[155px]" value={categoryFilter} onChange={e => handleCategory(e.target.value)}>
                            <option value="">Semua Kategori</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="input-modern text-sm px-3 min-w-[130px]" value={statusFilter} onChange={e => handleStatus(e.target.value)}>
                            <option value="">Status Stok</option>
                            <option value="tersedia">Tersedia</option>
                            <option value="tipis">Stok Menipis</option>
                            <option value="habis">Habis</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-16">Image</th>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Produk</th>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Harga Satuan</th>
                                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stok</th>
                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginated.map(item => {
                                const status = getStatus(item);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                                {item.imageUrl
                                                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                                    : <ImageIcon size={16} className="text-slate-300" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800 leading-snug">{item.name}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">SKU: {item.barcode || item.id.slice(-10).toUpperCase()}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <CategoryBadge label={item.category || 'Umum'} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-700">{formatCurrency(item.sellPrice || item.avgCost)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold text-base ${item.stock <= 0 ? 'text-red-600' : item.stock <= (item.minStock || 5) ? 'text-amber-600' : 'text-slate-700'}`}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteInventoryItem(item)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Hapus">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-4 py-14 text-center">
                                        <Package size={36} className="text-slate-200 mx-auto mb-3" />
                                        <p className="font-semibold text-slate-400">Tidak ada produk ditemukan</p>
                                        <p className="text-xs text-slate-300 mt-1">Coba ubah filter atau kata kunci pencarian</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-50">
                    {paginated.map(item => {
                        const status = getStatus(item);
                        return (
                            <div key={item.id} className="p-4 flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                    {item.imageUrl
                                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                        : <ImageIcon size={16} className="text-slate-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm leading-snug">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">SKU: {item.barcode || item.id.slice(-10).toUpperCase()}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Pencil size={13} /></button>
                                            <button onClick={() => handleDeleteInventoryItem(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <CategoryBadge label={item.category || 'Umum'} />
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${status.cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-slate-500">{formatCurrency(item.sellPrice || item.avgCost)}</span>
                                        <span className={`text-sm font-bold ${item.stock <= 0 ? 'text-red-600' : item.stock <= (item.minStock || 5) ? 'text-amber-600' : 'text-slate-700'}`}>
                                            {item.stock} {item.unit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {paginated.length === 0 && (
                        <div className="py-14 text-center">
                            <Package size={32} className="text-slate-200 mx-auto mb-3" />
                            <p className="font-semibold text-slate-400 text-sm">Tidak ada produk ditemukan</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-50">
                        <p className="text-sm text-slate-500">
                            Menampilkan <span className="font-semibold text-slate-700">{startItem}</span> sampai{' '}
                            <span className="font-semibold text-slate-700">{endItem}</span> dari{' '}
                            <span className="font-semibold text-slate-700">{filtered.length}</span> hasil
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:border-pink-300 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft size={15} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let p;
                                if (totalPages <= 5) p = i + 1;
                                else if (safePage <= 3) p = i + 1;
                                else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
                                else p = safePage - 2 + i;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-all border
                                          ${safePage === p
                                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-md shadow-pink-200'
                                            : 'border-slate-200 text-slate-500 hover:border-pink-300 hover:text-pink-600'}`}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:border-pink-300 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-slate-300 pb-2"> 2024 Toko MBG. All rights reserved.</p>
        </div>
    );
}

const CATEGORY_COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-pink-100 text-pink-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700',
];
const categoryColorMap = {};
let colorIdx = 0;
function CategoryBadge({ label }) {
    if (!categoryColorMap[label]) {
        categoryColorMap[label] = CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length];
        colorIdx++;
    }
    return (
        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold ${categoryColorMap[label]}`}>
            {label}
        </span>
    );
}
