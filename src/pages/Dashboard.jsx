import React, { useMemo } from 'react';
import {
    TrendingUp, TrendingDown, ShoppingBag, FileText,
    AlertTriangle, Package, ArrowRight, ArrowUpRight,
    Wallet, HandCoins, Activity, ChevronDown, Star
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import SimpleChart from '../components/ui/SimpleChart';

export default function Dashboard({
    user, storeProfile, activeStoreId, stats, orders, inventory,
    setShowStoreModal, setShowProfileEdit, setShowWithdraw, setActiveTab
}) {
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 11) return 'Good Morning';
        if (h < 15) return 'Good Afternoon';
        if (h < 18) return 'Good Evening';
        return 'Good Evening';
    };

    const userName = storeProfile?.ownerName || user?.displayName || user?.email?.split('@')[0] || 'User';
    const firstName = userName.split(' ')[0];

    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Today vs yesterday stats
    const todayStats = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

        const getDate = (o) => {
            const ts = o.createdAt || o.date;
            return ts ? (ts.toDate ? ts.toDate() : new Date(ts)) : new Date();
        };

        const todayOrders = orders.filter(o => getDate(o) >= today);
        const yOrders = orders.filter(o => { const d = getDate(o); return d >= yesterday && d < today; });

        const todayRev = todayOrders.reduce((s, o) => s + (o.financials?.revenue || 0), 0);
        const yRev = yOrders.reduce((s, o) => s + (o.financials?.revenue || 0), 0);
        const revenueChange = yRev > 0 ? +((todayRev - yRev) / yRev * 100).toFixed(1) : null;

        const avgOrder = todayOrders.length > 0 ? todayRev / todayOrders.length : 0;
        const yAvg = yOrders.length > 0 ? yOrders.reduce((s, o) => s + (o.financials?.revenue || 0), 0) / yOrders.length : 0;
        const avgChange = yAvg > 0 ? +((avgOrder - yAvg) / yAvg * 100).toFixed(1) : null;

        const ordersChange = yOrders.length > 0 ? +((todayOrders.length - yOrders.length) / yOrders.length * 100).toFixed(1) : null;

        return { todayRev, revenueChange, count: todayOrders.length, ordersChange, avgOrder, avgChange };
    }, [orders]);

    // Low stock items
    const lowStockItems = useMemo(() =>
        (inventory || []).filter(i => i.stock <= (i.minStock || 5) || i.stock <= 0)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 4),
        [inventory]
    );

    // Recent activity (from orders)
    const recentActivity = orders.slice(0, 6);

    const TrendBadge = ({ change }) => {
        if (change === null || change === undefined) return <span className="text-xs text-slate-400">— no data</span>;
        const up = change >= 0;
        return (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {up ? '+' : ''}{change}% <span className="text-slate-400 font-normal">vs yesterday</span>
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">

            {/* Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 leading-tight">
                        {greeting()}, {firstName}! 👋
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">Here's what's happening with your store today.</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm">
                    <FileText size={14} className="text-slate-400" />
                    {dateStr}
                </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Today's Revenue */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-sm text-slate-500 font-medium">Today's Revenue</p>
                        <div className="p-2 bg-blue-50 rounded-xl"><Wallet size={16} className="text-blue-500" /></div>
                    </div>
                    <p className="text-2xl font-black text-slate-800 leading-tight mb-2">
                        {formatCurrency(todayStats.todayRev)}
                    </p>
                    <TrendBadge change={todayStats.revenueChange} />
                </div>

                {/* Total Orders */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-sm text-slate-500 font-medium">Total Orders</p>
                        <div className="p-2 bg-pink-50 rounded-xl"><ShoppingBag size={16} className="text-pink-500" /></div>
                    </div>
                    <p className="text-2xl font-black text-slate-800 leading-tight mb-2">{todayStats.count}</p>
                    <TrendBadge change={todayStats.ordersChange} />
                </div>

                {/* Avg Order Value */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-sm text-slate-500 font-medium">Avg. Order Value</p>
                        <div className="p-2 bg-amber-50 rounded-xl"><FileText size={16} className="text-amber-500" /></div>
                    </div>
                    <p className="text-2xl font-black text-slate-800 leading-tight mb-2">
                        {formatCurrency(todayStats.avgOrder)}
                    </p>
                    <TrendBadge change={todayStats.avgChange} />
                </div>

                {/* Low Stock Alert count */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-sm text-slate-500 font-medium">Low Stock Items</p>
                        <div className="p-2 bg-red-50 rounded-xl"><Package size={16} className="text-red-500" /></div>
                    </div>
                    <p className="text-2xl font-black text-slate-800 leading-tight mb-2">
                        {stats.outStock + stats.lowStock}
                    </p>
                    <span className="text-xs text-slate-400">
                        <span className="text-red-500 font-semibold">{stats.outStock}</span> habis ·{' '}
                        <span className="text-amber-500 font-semibold">{stats.lowStock}</span> menipis
                    </span>
                </div>
            </div>

            {/* Chart + Low Stock Alert */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Weekly Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <h3 className="font-bold text-slate-800">Weekly Revenue</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Comparing to last week</p>
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all">
                            Last 7 Days <ChevronDown size={13} />
                        </button>
                    </div>
                    <div className="mt-4">
                        <SimpleChart data={orders} />
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-500" />
                            <h3 className="font-bold text-slate-800">Low Stock Alert</h3>
                        </div>
                        <button onClick={() => setActiveTab('inventory')}
                            className="text-xs font-semibold text-pink-500 hover:text-pink-700 flex items-center gap-1">
                            View All <ArrowRight size={11} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {lowStockItems.length > 0 ? lowStockItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-700 text-sm truncate">{item.name}</p>
                                    <p className="text-[11px] text-slate-400">{item.category || item.unit || '—'}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className={`text-xs font-bold ${item.stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                        {item.stock} Left
                                    </span>
                                    <button onClick={() => setActiveTab('purchases')}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 rounded-lg px-2 py-1 transition-all whitespace-nowrap">
                                        Reorder
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="py-6 text-center">
                                <Package size={28} className="text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Stok aman semua!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity + Pro Tip */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                        <h3 className="font-bold text-slate-800">Recent Activity</h3>
                        <button onClick={() => setActiveTab('history')}
                            className="text-xs font-semibold text-pink-500 hover:text-pink-700 flex items-center gap-1">
                            Lihat Semua <ArrowRight size={11} />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentActivity.map((o, i) => {
                            const isNew = i === 0;
                            return (
                                <div key={o.id}
                                    className={`flex items-start justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
                                    <div className="flex items-start gap-3">
                                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isNew ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">
                                                Order #{o.id.slice(-4).toUpperCase()} {o.paymentStatus === 'Lunas' ? 'Completed' : 'Pending'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {o.cashierName ? `Processed by ${o.cashierName.split('@')[0]}` : `${o.items?.length || 0} item(s)`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="font-bold text-slate-800 text-sm">{formatCurrency(o.financials?.revenue || 0)}</p>
                                        <p className="text-[11px] text-slate-400">{formatDate(o.createdAt || o.date)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {recentActivity.length === 0 && (
                            <div className="py-12 text-center">
                                <Activity size={28} className="text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Belum ada aktivitas</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pro Tip */}
                <div className="flex flex-col gap-4">
                    {/* Cash on Hand widget */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kas Toko</p>
                            <Wallet size={14} className="text-pink-400" />
                        </div>
                        <p className="text-xl font-black text-slate-800">{formatCurrency(stats.cashOnHand)}</p>
                        <button onClick={() => setShowWithdraw(true)}
                            className="mt-3 w-full py-2 bg-slate-900 hover:bg-pink-600 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2">
                            <HandCoins size={13} /> Ambil / Setor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
