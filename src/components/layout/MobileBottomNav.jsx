import React from 'react';

export default function MobileBottomNav({ activeTab, setActiveTab, navItems }) {
    const allItems = [...(navItems?.main || []), ...(navItems?.inventory || [])];

    return (
        <div className="md:hidden landscape:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 print:hidden"
            style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
            <div className="flex items-end justify-around px-1 py-1 pb-safe">
                {allItems.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all duration-200
                              ${isActive ? 'text-pink-600' : 'text-slate-400'}`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className={`text-[9px] font-semibold leading-none ${isActive ? 'text-pink-600' : 'text-slate-400'}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
