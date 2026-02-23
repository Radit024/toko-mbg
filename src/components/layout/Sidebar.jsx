import React from 'react';
import { Store, LogOut, Menu, PanelLeftClose } from 'lucide-react';

const NavButton = ({ id, label, icon: Icon, activeTab, setActiveTab, setIsSidebarOpen, isSidebarMini }) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
            title={isSidebarMini ? label : ''}
            className={`w-full flex items-center gap-3 transition-all duration-200 rounded-xl relative group
              ${isSidebarMini ? 'justify-center p-3' : 'px-4 py-2.5'}
              ${isActive
                ? 'bg-pink-50 text-pink-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
        >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
            {!isSidebarMini && (
                <span className={`font-semibold text-sm tracking-wide truncate ${isActive ? 'text-pink-600' : ''}`}>
                    {label}
                </span>
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
    const storeName = storeProfile?.storeName || 'Mutiara Store';
    const photoURL = storeProfile?.photoURL || user?.photoURL;
    const initials = ownerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const allNavItems = [...(navItems.main || []), ...(navItems.inventory || [])];

    return (
        <>
            {/* Backdrop mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden landscape:hidden"
                    onClick={() => setIsSidebarOpenState(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 transform transition-all duration-300 md:translate-x-0 landscape:translate-x-0
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              ${isSidebarMini ? 'w-[72px]' : 'w-64'}
              print:hidden flex flex-col h-full`}>

                {/* Logo */}
                <div className={`flex items-center shrink-0 border-b border-slate-100 ${isSidebarMini ? 'p-3 justify-center' : 'px-4 py-4 gap-3'}`}>
                    {isSidebarMini ? (
                        /* Mini: logo is the toggle button */
                        <button
                            onClick={() => setIsSidebarMini(false)}
                            title="Buka Sidebar"
                            className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-200 hover:opacity-90 transition-opacity"
                        >
                            <Store size={18} strokeWidth={2.5} />
                        </button>
                    ) : (
                        /* Full: logo + name + collapse button */
                        <>
                            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-200 shrink-0">
                                <Store size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="font-black text-base text-slate-800 leading-tight truncate">{storeName}</h1>
                            </div>
                            <button
                                onClick={() => setIsSidebarMini(true)}
                                title="Tutup Sidebar"
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shrink-0"
                            >
                                <PanelLeftClose size={18} />
                            </button>
                        </>
                    )}
                </div>


                {/* Navigation  flat list, no section labels */}
                <nav className={`flex-1 overflow-y-auto custom-scrollbar space-y-0.5 pt-2 pb-4 ${isSidebarMini ? 'px-2' : 'px-3'}`}>
                    {allNavItems.map(item => (
                        <NavButton
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            icon={item.icon}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            setIsSidebarOpen={setIsSidebarOpenState}
                            isSidebarMini={isSidebarMini}
                        />
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div className={`border-t border-slate-100 shrink-0 ${isSidebarMini ? 'p-3' : 'p-4'}`}>
                    {isSidebarMini ? (
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                        >
                            <LogOut size={18} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {photoURL
                                    ? <img src={photoURL} alt="profile" className="w-full h-full object-cover" />
                                    : <span className="text-xs font-black text-slate-600">{initials}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-700 truncate leading-tight">{ownerName}</p>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
