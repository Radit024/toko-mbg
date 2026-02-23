import React from 'react';
import { LayoutDashboard, Plus, History as HistoryIcon } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab }) {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex justify-around z-40 pb-safe print:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
            <button
                onClick={() => setActiveTab('dashboard')}
                className={`p-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}
            >
                <LayoutDashboard size={24} />
            </button>
            <button
                onClick={() => setActiveTab('sales')}
                className={`p-3 rounded-2xl transition-all ${activeTab === 'sales' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 -translate-y-2' : 'text-gray-400'}`}
            >
                <Plus size={28} />
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`p-3 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}
            >
                <HistoryIcon size={24} />
            </button>
        </div>
    );
}
