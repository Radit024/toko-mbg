import React, { useState } from 'react';
import { useAppData } from './hooks/useAppData';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import History from './pages/History';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';

// Layout & UI
import Sidebar from './components/layout/Sidebar';
import ReceiptTemplate from './components/ui/ReceiptTemplate';

// Modals
import WithdrawalModal from './components/modals/WithdrawalModal';
import EditRestockModal from './components/modals/EditRestockModal';
import EditOrderModal from './components/modals/EditOrderModal';
import UserProfileModal from './components/modals/UserProfileModal';
import ConnectStoreModal from './components/modals/ConnectStoreModal';

// Icons
import { LayoutDashboard, ShoppingCart, PackagePlus, Package, Wallet, FileText, History as HistoryIcon, Menu, Plus, ShoppingBasket } from 'lucide-react';

// Firebase (hanya untuk ConnectStoreModal)
import { db, appId } from './config/firebase';

export default function App() {
    // --- UI STATE (layout & navigasi) ---
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarMini, setIsSidebarMini] = useState(false);
    const [printOrder, setPrintOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editingRestock, setEditingRestock] = useState(null);

    // --- DATA & BUSINESS LOGIC (dari custom hook) ---
    const {
        user, authLoading, activeStoreId, storeProfile,
        showStoreModal, setShowStoreModal,
        showProfileEdit, setShowProfileEdit,
        showWithdraw, setShowWithdraw,
        inventory, orders, generalExpenses, restockLogs, withdrawals,
        stats,
        handleLogout,
        handleConnectStore,
        handleUpdateStoreProfile,
        handleUpdateUserProfile,
        handleChangePassword,
        handlePurchase,
        handleUpdateRestock,
        handleDeleteRestock,
        handleDeleteInventoryItem,
        handleSaveOrder,
        handleFullUpdateOrder,
        handleQuickPay,
        handleUpdateOrderExpenses,
        handleDeleteOrder,
        handleGeneralExpense,
        handleWithdrawal,
        handleDeleteWithdrawal,
    } = useAppData();

    // --- PRINT HANDLER ---
    const handlePrint = (order, sequentialNumber) => {
        setPrintOrder({ ...order, sequentialNumber });
        setTimeout(() => { window.print(); }, 500);
    };

    // --- NAV CONFIG ---
    const navItems = {
        main: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'sales', label: 'Kasir (Jual)', icon: ShoppingCart },
            { id: 'expenses', label: 'Biaya & Ops', icon: Wallet },
            { id: 'history', label: 'Riwayat Nota', icon: HistoryIcon },
        ],
        inventory: [
            { id: 'inventory', label: 'Stok Barang', icon: Package },
            { id: 'purchases', label: 'Restock (Beli)', icon: PackagePlus },
            { id: 'reports', label: 'Laporan', icon: FileText },
        ]
    };

    // --- RENDER GUARDS ---
    if (authLoading) return (
        <div className="flex h-screen items-center justify-center text-pink-600 font-bold">
            Memuat data...
        </div>
    );
    if (!user) return <Login />;

    return (
        <div className="flex min-h-screen bg-[#FDF2F8] font-sans text-slate-800">

            {/* SIDEBAR */}
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                isSidebarMini={isSidebarMini}
                setIsSidebarMini={setIsSidebarMini}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setIsSidebarOpenState={setIsSidebarOpen}
                handleLogout={() => handleLogout(setActiveTab)}
                navItems={navItems}
                user={user}
                storeProfile={storeProfile}
            />

            {/* SIDEBAR OVERLAY (mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* MAIN CONTENT */}
            <main className={`flex-1 transition-all duration-300 print:ml-0 print:w-full print:p-0 ${isSidebarMini ? 'md:ml-20' : 'md:ml-80'}`}>

                {/* MOBILE TOP BAR */}
                <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-50 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
                    <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <ShoppingBasket className="text-pink-600" /> Mutiara Store
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                        <Menu />
                    </button>
                </div>

                {/* PAGE CONTENT */}
                <div className="p-4 md:p-10 max-w-7xl mx-auto">
                    {activeTab === 'dashboard' && (
                        <Dashboard
                            user={user} storeProfile={storeProfile} activeStoreId={activeStoreId}
                            stats={stats} orders={orders} inventory={inventory}
                            setShowStoreModal={setShowStoreModal}
                            setShowProfileEdit={setShowProfileEdit}
                            setShowWithdraw={setShowWithdraw}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === 'sales' && (
                        <Sales
                            inventory={inventory}
                            handleSaveOrder={handleSaveOrder}
                        />
                    )}
                    {activeTab === 'expenses' && (
                        <Expenses
                            orders={orders}
                            generalExpenses={generalExpenses}
                            handleUpdateOrderExpenses={handleUpdateOrderExpenses}
                            handleGeneralExpense={handleGeneralExpense}
                        />
                    )}
                    {activeTab === 'history' && (
                        <History
                            orders={orders}
                            setEditingOrder={setEditingOrder}
                            handleDeleteOrder={handleDeleteOrder}
                            handlePrint={handlePrint}
                            handleQuickPay={handleQuickPay}
                        />
                    )}
                    {activeTab === 'inventory' && (
                        <Inventory
                            inventory={inventory}
                            handleDeleteInventoryItem={handleDeleteInventoryItem}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === 'purchases' && (
                        <Purchases
                            inventory={inventory}
                            restockLogs={restockLogs}
                            handlePurchase={handlePurchase}
                            setEditingRestock={setEditingRestock}
                            handleDeleteRestock={handleDeleteRestock}
                        />
                    )}
                    {activeTab === 'reports' && (
                        <Reports
                            orders={orders}
                            inventory={inventory}
                        />
                    )}
                </div>

                {printOrder && <ReceiptTemplate order={printOrder} />}
            </main>

            {/* MOBILE BOTTOM NAVIGATION */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex justify-around z-40 pb-safe print:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
                <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}>
                    <LayoutDashboard size={24} />
                </button>
                <button onClick={() => setActiveTab('sales')} className={`p-3 rounded-2xl transition-all ${activeTab === 'sales' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 -translate-y-2' : 'text-gray-400'}`}>
                    <Plus size={28} />
                </button>
                <button onClick={() => setActiveTab('history')} className={`p-3 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}>
                    <HistoryIcon size={24} />
                </button>
            </div>

            {/* MODALS */}
            {editingOrder && (
                <EditOrderModal
                    editingOrder={editingOrder}
                    setEditingOrder={setEditingOrder}
                    inventory={inventory}
                    handleFullUpdateOrder={(orig, items, meta) => handleFullUpdateOrder(orig, items, meta, setEditingOrder)}
                />
            )}
            {editingRestock && (
                <EditRestockModal
                    editingRestock={editingRestock}
                    setEditingRestock={setEditingRestock}
                    inventory={inventory}
                    handleUpdateRestock={(id, data) => handleUpdateRestock(id, data, setEditingRestock)}
                />
            )}
            {showStoreModal && (
                <ConnectStoreModal
                    setShowStoreModal={setShowStoreModal}
                    user={user} activeStoreId={activeStoreId}
                    storeProfile={storeProfile}
                    handleConnectStore={handleConnectStore}
                    db={db} appId={appId}
                />
            )}
            {showProfileEdit && (
                <UserProfileModal
                    setShowProfileEdit={setShowProfileEdit}
                    user={user} storeProfile={storeProfile} activeStoreId={activeStoreId}
                    handleUpdateStoreProfile={handleUpdateStoreProfile}
                    handleUpdateUserProfile={handleUpdateUserProfile}
                    handleChangePassword={handleChangePassword}
                />
            )}
            {showWithdraw && (
                <WithdrawalModal
                    onClose={() => setShowWithdraw(false)}
                    handleWithdrawal={handleWithdrawal}
                    withdrawals={withdrawals}
                    handleDeleteWithdrawal={handleDeleteWithdrawal}
                    user={user}
                />
            )}

            <style>{`
                @media print {
                    aside, .md\\:hidden, button, .print\\:hidden, nav, header { display: none !important; }
                    body { background: white; margin: 0; padding: 0; }
                    main { margin: 0; padding: 0; width: 100%; visibility: hidden; }
                    #print-area { display: block !important; visibility: visible; position: absolute; top: 0; left: 0; width: 58mm; margin: 0; }
                    @page { size: auto; margin: 0mm; }
                }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #fce7f3; border-radius: 20px; }
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                .animate-bounce-slow { animation: bounce 3s infinite; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
