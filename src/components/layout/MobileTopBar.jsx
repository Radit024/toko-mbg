import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Store } from 'lucide-react';

export default function MobileTopBar({ user, storeProfile, handleLogout }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const ownerName = storeProfile?.ownerName || user?.displayName || user?.email?.split('@')[0] || 'User';
    const storeName = storeProfile?.storeName || 'Mutiara Store';
    const photoURL = storeProfile?.photoURL || user?.photoURL;
    const initials = ownerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="md:hidden landscape:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex justify-between items-center print:hidden shadow-sm">
            {/* Store name */}
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center shrink-0">
                    <Store size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="font-black text-slate-800 text-sm truncate max-w-[140px]">{storeName}</span>
            </div>

            {/* Profile button */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setOpen(v => !v)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                        {photoURL
                            ? <img src={photoURL} alt="profile" className="w-full h-full object-cover" />
                            : <span className="text-xs font-black text-slate-600">{initials}</span>}
                    </div>
                    <div className="text-left hidden xs:block">
                        <p className="text-xs font-bold text-slate-700 leading-none">{ownerName}</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-scale-in">
                        {/* Profile info */}
                        <div className="px-4 py-3 border-b border-slate-50 bg-slate-50">
                            <p className="font-bold text-slate-800 text-sm truncate">{ownerName}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                        </div>
                        {/* Logout */}
                        <button
                            onClick={() => { setOpen(false); handleLogout(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
