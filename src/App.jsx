import React from 'react';

// Hooks
import { useAppData } from './hooks/useAppData';
import { useUIState } from './hooks/useUIState';

// Config
import { navItems } from './config/navItems';

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
import MobileTopBar from './components/layout/MobileTopBar';
import MobileBottomNav from './components/layout/MobileBottomNav';

// Modals
import EditOrderModal from './components/modals/EditOrderModal';
import EditRestockModal from './components/modals/EditRestockModal';
import ConnectStoreModal from './components/modals/ConnectStoreModal';
import UserProfileModal from './components/modals/UserProfileModal';
import WithdrawalModal from './components/modals/WithdrawalModal';



export default function App() {
    const ui = useUIState();
    const data = useAppData();

    if (data.authLoading) return (
        <div className="flex h-screen items-center justify-center text-pink-600 font-bold">
            Memuat data...
        </div>
    );
    if (!data.user) return <Login />;

    return (
        <div className="flex min-h-screen bg-[#FDF2F8] font-sans text-slate-800">

            <Sidebar
                isSidebarOpen={ui.isSidebarOpen}
                isSidebarMini={ui.isSidebarMini}
                setIsSidebarMini={ui.setIsSidebarMini}
                activeTab={ui.activeTab}
                setActiveTab={ui.setActiveTab}
                setIsSidebarOpenState={ui.setIsSidebarOpen}
                handleLogout={() => data.handleLogout(ui.setActiveTab)}
                navItems={navItems}
                user={data.user}
                storeProfile={data.storeProfile}
            />

            {ui.isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => ui.setIsSidebarOpen(false)}
                />
            )}

            <main className={`flex-1 transition-all duration-300 print:ml-0 print:w-full print:p-0 ${ui.isSidebarMini ? 'md:ml-20' : 'md:ml-64'}`}>

                <MobileTopBar onMenuClick={() => ui.setIsSidebarOpen(true)} />

                <div className="p-4 md:p-10 max-w-7xl mx-auto">
                    {ui.activeTab === 'dashboard' && (
                        <Dashboard
                            user={data.user}
                            storeProfile={data.storeProfile}
                            activeStoreId={data.activeStoreId}
                            stats={data.stats}
                            orders={data.orders}
                            inventory={data.inventory}
                            setShowStoreModal={data.setShowStoreModal}
                            setShowProfileEdit={data.setShowProfileEdit}
                            setShowWithdraw={data.setShowWithdraw}
                            setActiveTab={ui.setActiveTab}
                        />
                    )}
                    {ui.activeTab === 'sales' && (
                        <Sales
                            inventory={data.inventory}
                            handleSaveOrder={data.handleSaveOrder}
                        />
                    )}
                    {ui.activeTab === 'expenses' && (
                        <Expenses
                            orders={data.orders}
                            generalExpenses={data.generalExpenses}
                            handleUpdateOrderExpenses={data.handleUpdateOrderExpenses}
                            handleGeneralExpense={data.handleGeneralExpense}
                        />
                    )}
                    {ui.activeTab === 'history' && (
                        <History
                            orders={data.orders}
                            setEditingOrder={ui.setEditingOrder}
                            handleDeleteOrder={data.handleDeleteOrder}
                            handlePrint={ui.handlePrint}
                            handleQuickPay={data.handleQuickPay}
                        />
                    )}
                    {ui.activeTab === 'inventory' && (
                        <Inventory
                            inventory={data.inventory}
                            handleDeleteInventoryItem={data.handleDeleteInventoryItem}
                            handlePurchase={data.handlePurchase}
                            setActiveTab={ui.setActiveTab}
                        />
                    )}
                    {ui.activeTab === 'purchases' && (
                        <Purchases
                            inventory={data.inventory}
                            restockLogs={data.restockLogs}
                            handlePurchase={data.handlePurchase}
                            setEditingRestock={ui.setEditingRestock}
                            handleDeleteRestock={data.handleDeleteRestock}
                        />
                    )}
                    {ui.activeTab === 'reports' && (
                        <Reports
                            orders={data.orders}
                            inventory={data.inventory}
                        />
                    )}
                </div>

                {ui.printOrder && <ReceiptTemplate order={ui.printOrder} />}
            </main>

            <MobileBottomNav activeTab={ui.activeTab} setActiveTab={ui.setActiveTab} />

            {ui.editingOrder && (
                <EditOrderModal
                    editingOrder={ui.editingOrder}
                    setEditingOrder={ui.setEditingOrder}
                    inventory={data.inventory}
                    handleFullUpdateOrder={(orig, items, meta) =>
                        data.handleFullUpdateOrder(orig, items, meta, ui.setEditingOrder)
                    }
                />
            )}
            {ui.editingRestock && (
                <EditRestockModal
                    editingRestock={ui.editingRestock}
                    setEditingRestock={ui.setEditingRestock}
                    inventory={data.inventory}
                    handleUpdateRestock={(id, d) =>
                        data.handleUpdateRestock(id, d, ui.setEditingRestock)
                    }
                />
            )}
            {data.showStoreModal && (
                <ConnectStoreModal
                    setShowStoreModal={data.setShowStoreModal}
                    user={data.user}
                    activeStoreId={data.activeStoreId}
                    storeProfile={data.storeProfile}
                    handleConnectStore={data.handleConnectStore}
                    handleSaveStoreSettings={data.handleSaveStoreSettings}
                />
            )}
            {data.showProfileEdit && (
                <UserProfileModal
                    setShowProfileEdit={data.setShowProfileEdit}
                    user={data.user}
                    storeProfile={data.storeProfile}
                    activeStoreId={data.activeStoreId}
                    handleUpdateStoreProfile={data.handleUpdateStoreProfile}
                    handleUpdateUserProfile={data.handleUpdateUserProfile}
                    handleChangePassword={data.handleChangePassword}
                />
            )}
            {data.showWithdraw && (
                <WithdrawalModal
                    onClose={() => data.setShowWithdraw(false)}
                    handleWithdrawal={data.handleWithdrawal}
                    withdrawals={data.withdrawals}
                    handleDeleteWithdrawal={data.handleDeleteWithdrawal}
                    user={data.user}
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
