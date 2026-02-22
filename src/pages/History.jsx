import React, { useState, useMemo } from 'react';
import { Search, List, UserCheck, Edit, Trash2, Printer, CheckCircle2, ChevronDown, ChevronUp, Receipt, DollarSign, Clock, Tag } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function History({ orders, setEditingOrder, handleDeleteOrder, handlePrint, handleQuickPay }) {
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('orders');
    const [expandedCustomer, setExpandedCustomer] = useState(null);
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
    const toggleCustomerExpand = (name) => setExpandedCustomer(expandedCustomer === name ? null : name);

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
            end.setHours(23, 59, 59);
            dateMatch = oDate >= start && oDate <= end;
        }
        return (idMatch || customerMatch || noteMatch) && dateMatch;
    });

    const customerGroups = useMemo(() => {
        const groups = {};
        filteredOrders.forEach(order => {
            const name = order.customerName || 'No Name';
            if (!groups[name]) groups[name] = { name, orders: [], totalRevenue: 0, totalNetProfit: 0 };
            groups[name].orders.push(order);
            groups[name].totalRevenue += (order.financials?.revenue || 0);
            groups[name].totalNetProfit += (order.financials?.netProfit || 0);
        });
        return Object.values(groups).sort((a, b) => b.totalNetProfit - a.totalNetProfit);
    }, [filteredOrders]);

    const getSequentialID = (orderId) => {
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return '???';
        return `#${String(orders.length - index).padStart(5, '0')}`;
    };

    return (
        <div className="pb-24 md:pb-8 animate-fade-in space-y-5">

            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Riwayat Transaksi</h2>
                        <p className="text-sm text-slate-400">{filteredOrders.length} dari {orders.length} transaksi</p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('orders')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                              ${viewMode === 'orders' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <List size={16} /> Per Nota
                        </button>
                        <button onClick={() => setViewMode('customers')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                              ${viewMode === 'customers' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <UserCheck size={16} /> Per Customer
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <input
                            className="input-modern pl-9 w-full"
                            placeholder="Cari nota, nama customer, catatan..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <input type="date" className="text-xs outline-none text-slate-600 bg-transparent" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                        <span className="text-slate-300">—</span>
                        <input type="date" className="text-xs outline-none text-slate-600 bg-transparent" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Orders View */}
            {viewMode === 'orders' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
                    {filteredOrders.map((order, idx) => {
                        const isExpanded = expandedId === order.id;
                        return (
                            <div key={order.id}
                                className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer
                                  card-hover animate-fade-in stagger-${(idx % 4) + 1}
                                  ${isExpanded ? 'border-pink-200 shadow-pink-100' : 'border-slate-100'}
                                  ${order.paymentStatus !== 'Lunas' ? 'border-l-4 border-l-red-300' : ''}`}
                                onClick={() => toggleExpand(order.id)}>

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="badge-pink font-mono text-[10px]">{getSequentialID(order.id)}</span>
                                                <span className={order.paymentStatus === 'Lunas' ? 'badge-green' : 'badge-red'}>
                                                    {order.paymentStatus || 'Lunas'}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800">{order.customerName || 'Pelanggan Umum'}</h4>
                                            <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.date)}</p>
                                            {order.cashierName && (
                                                <p className="text-[11px] text-slate-400 mt-0.5">Kasir: {order.cashierName.split('@')[0]}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-800">{formatCurrency(order.financials.revenue)}</p>
                                            <p className="text-xs text-emerald-500 font-semibold">+{formatCurrency(order.financials.netProfit)}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{order.items.length} item</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="badge-gray">{order.paymentMethod || 'Cash'}</span>
                                        {isExpanded
                                            ? <ChevronUp size={16} className="text-slate-400" />
                                            : <ChevronDown size={16} className="text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <div className="p-4 bg-slate-50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rincian Barang</p>
                                            <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto custom-scrollbar">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-xs">
                                                        <span className="text-slate-600">
                                                            {item.name}
                                                            <span className="text-slate-400 ml-1">({item.qty}× {formatCurrency(item.price)})</span>
                                                        </span>
                                                        <span className="font-semibold text-slate-700">{formatCurrency(item.subtotal)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                                <div className="bg-white rounded-lg p-2 border border-slate-100">
                                                    <p className="text-slate-400">Modal (HPP)</p>
                                                    <p className="font-bold text-slate-700">{formatCurrency(order.financials.cogs)}</p>
                                                </div>
                                                <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                                                    <p className="text-slate-400">Laba Bersih</p>
                                                    <p className="font-bold text-emerald-600">{formatCurrency(order.financials.netProfit)}</p>
                                                </div>
                                            </div>

                                            {order.expenses && order.expenses.length > 0 && (
                                                <div className="bg-orange-50 rounded-lg p-2 border border-orange-100 mb-3 text-xs">
                                                    <p className="font-semibold text-orange-700 mb-1">Biaya Operasional:</p>
                                                    {order.expenses.map((e, i) => (
                                                        <div key={i} className="flex justify-between text-orange-600">
                                                            <span>{e.name}</span>
                                                            <span>-{formatCurrency(e.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {order.notes && (
                                                <p className="text-xs text-slate-400 bg-white rounded-lg p-2 border border-slate-100 mb-3">
                                                    📝 {order.notes}
                                                </p>
                                            )}

                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingOrder(order)}
                                                    className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors" title="Edit">
                                                    <Edit size={15} />
                                                </button>
                                                <button onClick={() => handleDeleteOrder(order)}
                                                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Hapus">
                                                    <Trash2 size={15} />
                                                </button>
                                                <button onClick={() => handlePrint(order, getSequentialID(order.id))}
                                                    className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all shadow-sm shadow-pink-200">
                                                    <Printer size={14} /> Cetak Nota
                                                </button>
                                                {order.paymentStatus === 'Belum Lunas' && (
                                                    <button onClick={() => handleQuickPay(order.id)}
                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors" title="Tandai Lunas">
                                                        <CheckCircle2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredOrders.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <Receipt size={40} className="text-slate-200 mx-auto mb-3" />
                            <p className="font-semibold text-slate-400">Tidak ada transaksi ditemukan</p>
                            <p className="text-xs text-slate-300 mt-1">Coba ubah filter pencarian</p>
                        </div>
                    )}
                </div>
            )}

            {/* Customer View */}
            {viewMode === 'customers' && (
                <div className="space-y-3 max-w-3xl mx-auto animate-fade-in">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3 text-sm text-blue-700">
                        <UserCheck size={18} className="shrink-0" />
                        <span>Menampilkan total dari <b>{filteredOrders.length}</b> transaksi, dikelompokkan per customer.</span>
                    </div>

                    {customerGroups.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleCustomerExpand(group.name)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center font-black text-pink-500">
                                        {group.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{group.name}</h3>
                                        <p className="text-xs text-slate-400">{group.orders.length} transaksi • {formatCurrency(group.totalRevenue)} omzet</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Laba</p>
                                        <p className="font-black text-emerald-600">{formatCurrency(group.totalNetProfit)}</p>
                                    </div>
                                    {expandedCustomer === group.name ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                </div>
                            </div>

                            {expandedCustomer === group.name && (
                                <div className="border-t border-slate-50 bg-slate-50 p-3 animate-fade-in">
                                    <div className="overflow-x-auto rounded-xl bg-white border border-slate-100">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                                                    <th className="px-3 py-2 text-left">Tanggal</th>
                                                    <th className="px-3 py-2 text-left">ID</th>
                                                    <th className="px-3 py-2 text-right">Omzet</th>
                                                    <th className="px-3 py-2 text-right">Laba</th>
                                                    <th className="px-3 py-2 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {group.orders.map(order => (
                                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-3 py-2.5 text-slate-500">{formatDate(order.date)}</td>
                                                        <td className="px-3 py-2.5 font-bold text-pink-500">{getSequentialID(order.id)}</td>
                                                        <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{formatCurrency(order.financials.revenue)}</td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{formatCurrency(order.financials.netProfit)}</td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className={order.paymentStatus === 'Lunas' ? 'badge-green' : 'badge-red'}>
                                                                {order.paymentStatus || 'Lunas'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
