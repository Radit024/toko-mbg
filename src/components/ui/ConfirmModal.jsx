import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, HelpCircle, X } from 'lucide-react';

const TYPES = {
    delete: {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        Icon: AlertTriangle,
        confirmBg: 'bg-red-500 hover:bg-red-600 shadow-red-200',
        ConfirmIcon: Trash2,
        confirmLabel: 'Ya, Hapus',
    },
    warning: {
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
        Icon: AlertTriangle,
        confirmBg: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
        ConfirmIcon: AlertTriangle,
        confirmLabel: 'Ya, Lanjutkan',
    },
    confirm: {
        iconBg: 'bg-pink-100',
        iconColor: 'text-pink-500',
        Icon: HelpCircle,
        confirmBg: 'bg-pink-500 hover:bg-pink-600 shadow-pink-200',
        ConfirmIcon: null,
        confirmLabel: 'Ya',
    },
};

export default function ConfirmModal({ state, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (state) setTimeout(() => setVisible(true), 10);
        else setVisible(false);
    }, [state]);

    if (!state) return null;

    const type = state.type || 'delete';
    const cfg = TYPES[type] || TYPES.delete;

    const handleClose = (result) => {
        setVisible(false);
        setTimeout(() => onClose(result), 200);
    };

    return (
        <div
            className={`fixed inset-0 z-[150] flex items-center justify-center p-4 transition-all duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => handleClose(false)}
            />

            {/* Dialog */}
            <div className={`relative bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center transition-all duration-200 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Close X */}
                <button
                    onClick={() => handleClose(false)}
                    className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Icon */}
                <div className={`w-16 h-16 ${cfg.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <cfg.Icon size={28} className={cfg.iconColor} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{state.title || 'Konfirmasi'}</h3>

                {/* Message */}
                {state.message && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                        {state.itemName ? (
                            <>
                                {state.message.split(`"${state.itemName}"`)[0]}
                                <span className="font-semibold text-gray-700">&ldquo;{state.itemName}&rdquo;</span>
                                {state.message.split(`"${state.itemName}"`)[1]}
                            </>
                        ) : state.message}
                    </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => handleClose(false)}
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all text-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => handleClose(true)}
                        className={`flex-1 py-3 text-white font-semibold rounded-2xl transition-all text-sm shadow-lg flex items-center justify-center gap-2 ${cfg.confirmBg}`}
                    >
                        {cfg.ConfirmIcon && <cfg.ConfirmIcon size={15} />}
                        {state.confirmLabel || cfg.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
