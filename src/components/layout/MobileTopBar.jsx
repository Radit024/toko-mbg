import React from 'react';
import { Menu, ShoppingBasket } from 'lucide-react';

export default function MobileTopBar({ onMenuClick }) {
    return (
        <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-50 px-6 py-4 flex justify-between items-center print:hidden shadow-sm">
            <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ShoppingBasket className="text-pink-600" /> Mutiara Store
            </div>
            <button onClick={onMenuClick} className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                <Menu />
            </button>
        </div>
    );
}
