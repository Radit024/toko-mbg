import React, { useState, useEffect } from 'react';
import { Truck, Wallet, Trash2, Plus, Receipt, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Expenses({ orders, generalExpenses, handleUpdateOrderExpenses, handleGeneralExpense }) {
    const [tab, setTab] = useState('nota');
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [tempExpenses, setTempExpenses] = useState([{ name: '', amount: '' }]);
    const [genDate, setGenDate] = useState(new Date().toISOString().slice(0, 10));
    const [genTitle, setGenTitle] = useState('');
    const [genAmount, setGenAmount] = useState('');

    const recentOrders = orders.slice(0, 50);
    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    useEffect(() => {
        if (selectedOrder && selectedOrder.expenses) {
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
        if (!selectedOrderId) return;
        const cleanExpenses = tempExpenses.filter(e => e.name && e.amount);
        await handleUpdateOrderExpenses(selectedOrderId, cleanExpenses);
    };

    const submitGenExp = () => {
        if (!genTitle || !genAmount) return;
        handleGeneralExpense({ date: genDate, title: genTitle, amount: parseFloat(genAmount) });
        setGenTitle(''); setGenAmount('');
    };

    const totalGenExp = generalExpenses.reduce((s, e) => s + (e.amount || 0), 0);

    return (
        <div className="pb-24 md:pb-6 landscape:pb-6 animate-fade-in space-y-4">

            {/* Header + Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <h2 className="text-xl font-black text-slate-800">Pusat Biaya & Operasional</h2>
                    <p className="text-sm text-slate-400">Kelola pengeluaran nota dan biaya umum toko</p>
                </div>
                <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setTab('nota')}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all
                          ${tab === 'nota' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Biaya per Nota
                    </button>
                    <button onClick={() => setTab('umum')}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all
                          ${tab === 'umum' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Biaya Umum
                    </button>
                </div>
            </div>

            {/* Biaya per Nota */}
            {tab === 'nota' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl"><Truck size={20} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800">Input Biaya Nota</h3>
                                <p className="text-xs text-slate-400">Tambahkan biaya ops ke setiap transaksi</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1.5">
                                    <Receipt size={12} /> Pilih Nota Transaksi
                                </label>
                                <select className="input-modern" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                                    <option value="">-- Pilih Nota --</option>
                                    {recentOrders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {formatDate(o.date)} — {o.customerName || 'Umum'} — {formatCurrency(o.financials.revenue)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedOrder && (
                                <div className="grid grid-cols-2 gap-2 animate-scale-in">
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Laba Kotor</p>
                                        <p className="font-black text-slate-800">{formatCurrency(selectedOrder.financials.grossProfit)}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Net Profit</p>
                                        <p className="font-black text-emerald-600">{formatCurrency(selectedOrder.financials.netProfit)}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Daftar Biaya</label>
                                <div className="space-y-2">
                                    {tempExpenses.map((exp, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                className="input-modern flex-[2] text-sm"
                                                placeholder="Nama Biaya (Bensin, Parkir...)"
                                                value={exp.name}
                                                onChange={e => handleExpChange(idx, 'name', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                className="input-modern flex-1 text-sm"
                                                placeholder="Rp"
                                                value={exp.amount}
                                                onChange={e => handleExpChange(idx, 'amount', e.target.value)}
                                            />
                                            <button onClick={() => removeExpRow(idx)}
                                                className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addExpRow}
                                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-pink-500 hover:text-pink-700 transition-colors">
                                    <Plus size={14} /> Tambah Baris
                                </button>
                            </div>

                            <button onClick={saveBulkExpenses} disabled={!selectedOrderId}
                                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold
                                  hover:opacity-90 transition-all shadow-lg shadow-pink-200 disabled:opacity-40 disabled:shadow-none">
                                Simpan Semua Biaya
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Biaya Umum */}
            {tab === 'umum' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
                    {/* Form */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-fit">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl"><Wallet size={20} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800">Input Biaya Umum</h3>
                                <p className="text-xs text-slate-400">Listrik, gaji, sewa, dll.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                    <Calendar size={12} /> Tanggal
                                </label>
                                <input type="date" className="input-modern" value={genDate} onChange={e => setGenDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Keperluan</label>
                                <input className="input-modern" placeholder="Contoh: Listrik Bulanan, Gaji Karyawan" value={genTitle} onChange={e => setGenTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                    <DollarSign size={12} /> Nominal
                                </label>
                                <input type="number" className="input-modern" placeholder="Rp 0" value={genAmount} onChange={e => setGenAmount(e.target.value)} />
                            </div>
                            <button onClick={submitGenExp} disabled={!genTitle || !genAmount}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg shadow-slate-200 disabled:opacity-40 disabled:shadow-none">
                                Simpan Pengeluaran
                            </button>
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-800">Riwayat Pengeluaran</h3>
                            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                                <p className="text-[10px] text-red-400 font-bold uppercase">Total</p>
                                <p className="font-black text-red-600 text-sm">{formatCurrency(totalGenExp)}</p>
                            </div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                            {generalExpenses.map(ge => (
                                <div key={ge.id}
                                    className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all card-hover">
                                    <div>
                                        <p className="font-semibold text-slate-700 text-sm">{ge.title}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            <Calendar size={10} /> {formatDate(ge.date)}
                                        </p>
                                    </div>
                                    <span className="font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg text-sm border border-red-100">
                                        -{formatCurrency(ge.amount)}
                                    </span>
                                </div>
                            ))}
                            {generalExpenses.length === 0 && (
                                <div className="py-8 text-center">
                                    <Wallet size={28} className="text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">Belum ada data</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
