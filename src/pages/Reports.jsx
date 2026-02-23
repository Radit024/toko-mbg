import React, { useState } from 'react';
import { FileText, Printer, Download, Package, TrendingUp, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Reports({ orders, inventory }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [isAllData, setIsAllData] = useState(false);

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const getFilteredOrders = () => {
        if (isAllData) return orders;
        return orders.filter(o => {
            const d = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
            return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === parseInt(selectedYear);
        });
    };

    const monthlyOrders = orders.filter(o => {
        const d = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
        return d.getMonth() === currentMonth;
    });

    const filteredForDownload = getFilteredOrders();
    const totalAssetValue = inventory.reduce((s, i) => s + (i.stock * i.avgCost), 0);

    const reportStats = {
        revenue: filteredForDownload.reduce((s, o) => s + (o.financials.revenue || 0), 0),
        netProfit: filteredForDownload.reduce((s, o) => s + (o.financials.netProfit || 0), 0),
        transactions: filteredForDownload.length,
        avgOrder: filteredForDownload.length > 0
            ? filteredForDownload.reduce((s, o) => s + (o.financials.revenue || 0), 0) / filteredForDownload.length
            : 0,
    };

    const downloadTxCSV = () => {
        const headers = ['Order_ID', 'Tanggal', 'Jam', 'Customer', 'Kasir', 'Nama_Barang', 'Qty', 'Satuan', 'Harga_Jual', 'Modal', 'Subtotal_Jual', 'Subtotal_Modal', 'Total_Nota', 'Laba_Nota', 'Metode', 'Status', 'Catatan'];
        const rows = [];
        filteredForDownload.forEach(o => {
            const oDate = o.date ? (o.date.toDate ? o.date.toDate() : new Date(o.date)) : new Date();
            const dateStr = oDate.toLocaleDateString('id-ID');
            const timeStr = oDate.toLocaleTimeString('id-ID');
            const orderId = `"${o.id}"`;
            const customer = `"${o.customerName || '-'}"`;
            const cashier = `"${o.cashierName ? o.cashierName.split('@')[0] : '-'}"`;
            const paymentMethod = `"${o.paymentMethod || 'Cash'}"`;
            const paymentStatus = `"${o.paymentStatus || 'Lunas'}"`;
            const notes = `"${o.notes || ''}"`;
            if (o.items && o.items.length > 0) {
                o.items.forEach(item => {
                    const modalSatuan = item.costBasis || 0;
                    rows.push([orderId, `"${dateStr}"`, `"${timeStr}"`, customer, cashier, `"${item.name}"`, item.qty, `"${item.unit}"`, item.price, modalSatuan, item.subtotal, modalSatuan * item.qty, o.financials.revenue, o.financials.netProfit, paymentMethod, paymentStatus, notes]);
                });
            } else {
                rows.push([orderId, `"${dateStr}"`, `"${timeStr}"`, customer, cashier, '-', 0, '-', 0, 0, 0, 0, o.financials.revenue, o.financials.netProfit, paymentMethod, paymentStatus, notes]);
            }
        });
        const csvContent = 'sep=;\n' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', isAllData ? 'Laporan_Detail_SemuaData.csv' : `Laporan_${months[selectedMonth]}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const downloadStockCSV = () => {
        const headers = ['Nama Barang', 'Stok', 'Satuan', 'Harga Beli Avg', 'Total Aset', 'Harga Jual', 'Supplier Terakhir'];
        const rows = inventory.map(i => [`"${i.name}"`, i.stock, `"${i.unit}"`, i.avgCost, i.stock * i.avgCost, i.sellPrice || 0, `"${i.lastSupplier || '-'}"`]);
        const csvContent = 'sep=;\n' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Laporan_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="pb-24 md:pb-8 landscape:pb-8 animate-fade-in space-y-6">
            <div>
                <h2 className="text-xl font-black text-slate-800">Pusat Laporan</h2>
                <p className="text-sm text-slate-400">Download dan cetak laporan keuangan toko</p>
            </div>

            {/* Report Stats */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                            {isAllData ? 'Semua Data' : `${months[selectedMonth]} ${selectedYear}`}
                        </p>
                        <p className="font-black text-lg mt-0.5">Ringkasan Periode</p>
                    </div>
                    <BarChart3 size={24} className="text-slate-600" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Omzet', value: formatCurrency(reportStats.revenue), icon: TrendingUp, color: 'text-pink-300' },
                        { label: 'Laba Bersih', value: formatCurrency(reportStats.netProfit), icon: DollarSign, color: 'text-emerald-300' },
                        { label: 'Transaksi', value: reportStats.transactions, icon: FileText, color: 'text-blue-300' },
                        { label: 'Rata-rata Nota', value: formatCurrency(reportStats.avgOrder), icon: BarChart3, color: 'text-amber-300' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Icon size={12} className={color} />
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">{label}</p>
                            </div>
                            <p className="font-black text-white text-sm">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">

                {/* Transaksi */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 card-hover">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileText size={22} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Laporan Transaksi</h3>
                            <p className="text-xs text-slate-400">Rekap penjualan detail per nota</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-5">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Calendar size={10} /> Bulan</label>
                                <select className="input-modern text-sm" disabled={isAllData} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tahun</label>
                                <select className="input-modern text-sm" disabled={isAllData} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <div className={`w-9 h-5 rounded-full transition-all ${isAllData ? 'bg-pink-500' : 'bg-slate-200'} relative`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isAllData ? 'left-4' : 'left-0.5'}`} />
                            </div>
                            <input type="checkbox" hidden checked={isAllData} onChange={e => setIsAllData(e.target.checked)} />
                            <span className="text-sm text-slate-600 font-medium">Semua Data (Tanpa Filter)</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => window.print()}
                            className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all">
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={downloadTxCSV}
                            className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-200">
                            <Download size={16} /> CSV/Excel
                        </button>
                    </div>
                </div>

                {/* Stok */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 card-hover">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Package size={22} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Laporan Stok & Aset</h3>
                            <p className="text-xs text-slate-400">Nilai inventaris saat ini</p>
                        </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Nilai Aset Gudang</p>
                        <p className="text-xl md:text-2xl font-black text-emerald-700">{formatCurrency(totalAssetValue)}</p>
                        <p className="text-xs text-emerald-400 mt-1">{inventory.length} produk aktif di gudang</p>
                    </div>

                    <button onClick={downloadStockCSV}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-200">
                        <Download size={16} /> Download Laporan Stok
                    </button>
                </div>
            </div>

            {/* Preview Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Preview Laporan (Bulan Ini)</h3>
                    <span className="badge-gray">{monthlyOrders.length} transaksi</span>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap text-left">Tanggal</th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">Nota</th>
                                <th className="px-4 py-3 whitespace-nowrap text-left">Customer</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Omzet</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Modal (HPP)</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Biaya Ops</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Laba Bersih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {monthlyOrders.slice(0, 10).map(o => (
                                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(o.date)}</td>
                                    <td className="px-4 py-3 font-bold text-pink-500 whitespace-nowrap font-mono">#{o.id.slice(-4).toUpperCase()}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{o.customerName || '-'}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(o.financials.revenue)}</td>
                                    <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">{formatCurrency(o.financials.cogs)}</td>
                                    <td className="px-4 py-3 text-right text-red-400 whitespace-nowrap">-{formatCurrency(o.financials.expenseTotal)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(o.financials.netProfit)}</td>
                                </tr>
                            ))}
                            {monthlyOrders.length === 0 && (
                                <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-400">Belum ada data bulan ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-3">
                    {monthlyOrders.slice(0, 10).map(o => (
                        <div key={o.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-pink-500 text-sm">#{o.id.slice(-4).toUpperCase()}</span>
                                    <span className="text-[10px] text-slate-400">{formatDate(o.date)}</span>
                                </div>
                                <span className={o.paymentStatus === 'Lunas' ? 'badge-green' : 'badge-red'}>{o.paymentStatus}</span>
                            </div>
                            <p className="font-semibold text-slate-700 text-sm mb-2">{o.customerName || 'Umum'}</p>
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Omzet</p>
                                    <p className="font-bold text-blue-600 text-sm">{formatCurrency(o.financials.revenue)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Laba</p>
                                    <p className="font-bold text-emerald-600 text-sm">{formatCurrency(o.financials.netProfit)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {monthlyOrders.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-sm">Belum ada data bulan ini.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
