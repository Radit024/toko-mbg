import React from 'react';
import { ShoppingBasket, ChevronRight, ChevronLeft, LogOut, Settings, HelpCircle, User } from 'lucide-react';

const NavButton = ({ id, label, icon: Icon, activeTab, setActiveTab, setIsSidebarOpen, isSidebarMini }) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
            title={isSidebarMini ? label : ''}
            className={`w-full flex items-center gap-3 transition-all duration-200 rounded-xl relative group
              ${isSidebarMini ? 'justify-center p-3' : 'px-4 py-3'}
              ${isActive
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200'
                : 'text-slate-500 hover:bg-white hover:text-pink-600 hover:shadow-sm'
              }`}
        >
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/40 rounded-r-full" />
            )}
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
            {!isSidebarMini && (
                <span className="font-semibold text-sm tracking-wide truncate">{label}</span>
            )}
            {isSidebarMini && (
                <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl
                  opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {label}
                </span>
            )}
        </button>
    );
};

export default function Sidebar({ isSidebarOpen, isSidebarMini, setIsSidebarMini, activeTab, setActiveTab, setIsSidebarOpenState, handleLogout, navItems, user, storeProfile }) {
    const ownerName = storeProfile?.ownerName || user?.displayName || user?.email?.split('@')[0] || 'User';
    const storeName = storeProfile?.storeName || 'Toko Saya';
    const photoURL = storeProfile?.photoURL || user?.photoURL;
    const initials = ownerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <>
            {/* Backdrop mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpenState(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-50 border-r border-slate-200/70 transform transition-all duration-300 md:translate-x-0
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              ${isSidebarMini ? 'w-[72px]' : 'w-72'}
              print:hidden flex flex-col h-full shadow-xl shadow-slate-200/50`}>

                {/* Logo */}
                <div className={`flex items-center gap-3 shrink-0 border-b border-slate-200/70 ${isSidebarMini ? 'p-4 justify-center' : 'px-5 py-4'}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-300 shrink-0">
                        <ShoppingBasket size={20} strokeWidth={2.5} />
                    </div>
                    {!isSidebarMini && (
                        <div className="min-w-0">
                            <h1 className="font-black text-base text-slate-800 leading-tight truncate">{storeName}</h1>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Admin Panel</span>
                        </div>
                    )}
                </div>

                {/* Mini toggle */}
                <div className="hidden md:flex justify-end px-3 pt-3 shrink-0">
                    <button
                        onClick={() => setIsSidebarMini(!isSidebarMini)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-pink-50 transition-all"
                    >
                        {isSidebarMini ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 overflow-y-auto custom-scrollbar space-y-1 pt-2 pb-4 ${isSidebarMini ? 'px-2' : 'px-4'}`}>
                    {/* Main Menu */}
                    {!isSidebarMini && (
                        <p className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Utama</p>
                    )}
                    {navItems.main.map(item => (
                        <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon}
                            activeTab={activeTab} setActiveTab={setActiveTab}
                            setIsSidebarOpen={setIsSidebarOpenState} isSidebarMini={isSidebarMini} />
                    ))}

                    {/* Inventory section */}
                    {!isSidebarMini && (
                        <p className="px-3 pt-5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gudang & Laporan</p>
                    )}
                    {isSidebarMini && <div className="my-3 border-t border-slate-200" />}
                    {navItems.inventory.map(item => (
                        <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon}
                            activeTab={activeTab} setActiveTab={setActiveTab}
                            setIsSidebarOpen={setIsSidebarOpenState} isSidebarMini={isSidebarMini} />
                    ))}

                    {/* System section */}
                    {!isSidebarMini && (
                        <p className="px-3 pt-5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System</p>
                    )}
                    {isSidebarMini && <div className="my-3 border-t border-slate-200" />}
                    <button
                        title={isSidebarMini ? 'Pengaturan' : ''}
                        onClick={() => alert('Pengaturan akan segera hadir!')}
                        className={`w-full flex items-center gap-3 transition-all duration-200 rounded-xl group text-slate-500 hover:bg-white hover:text-pink-600 hover:shadow-sm
                          ${isSidebarMini ? 'justify-center p-3' : 'px-4 py-3'}`}>
                        <Settings size={20} strokeWidth={1.8} className="shrink-0" />
                        {!isSidebarMini && <span className="font-semibold text-sm tracking-wide">Pengaturan</span>}
                        {isSidebarMini && (
                            <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Pengaturan
                            </span>
                        )}
                    </button>
                    <button
                        title={isSidebarMini ? 'Bantuan' : ''}
                        onClick={() => alert('Halaman bantuan akan segera hadir!')}
                        className={`w-full flex items-center gap-3 transition-all duration-200 rounded-xl group text-slate-500 hover:bg-white hover:text-pink-600 hover:shadow-sm
                          ${isSidebarMini ? 'justify-center p-3' : 'px-4 py-3'}`}>
                        <HelpCircle size={20} strokeWidth={1.8} className="shrink-0" />
                        {!isSidebarMini && <span className="font-semibold text-sm tracking-wide">Bantuan</span>}
                        {isSidebarMini && (
                            <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Bantuan
                            </span>
                        )}
                    </button>
                </nav>

                {/* User Profile Footer */}
                <div className={`border-t border-slate-200/70 shrink-0 ${isSidebarMini ? 'p-3' : 'p-4'}`}>
                    {isSidebarMini ? (
                        <button onClick={handleLogout} title="Keluar"
                            className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                            <LogOut size={18} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-pink-200 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
                                {photoURL
                                    ? <img src={photoURL} alt="profile" className="w-full h-full object-cover" />
                                    : <span className="text-xs font-black text-pink-500">{initials}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-700 truncate leading-tight">{ownerName}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Owner</p>
                            </div>
                            <button onClick={handleLogout} title="Keluar"
                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
