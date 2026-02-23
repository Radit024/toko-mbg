import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
    success: { Icon: CheckCircle, color: 'text-emerald-500', border: 'border-l-emerald-500', bg: 'bg-emerald-50' },
    error:   { Icon: XCircle,     color: 'text-red-500',     border: 'border-l-red-500',     bg: 'bg-red-50'     },
    warning: { Icon: AlertCircle, color: 'text-amber-500',   border: 'border-l-amber-500',   bg: 'bg-amber-50'   },
    info:    { Icon: Info,         color: 'text-blue-500',    border: 'border-l-blue-500',    bg: 'bg-blue-50'    },
};

const TITLES = {
    success: 'Perubahan Disimpan',
    error:   'Terjadi Kesalahan',
    warning: 'Perhatian',
    info:    'Informasi',
};

function ToastItem({ toast, onRemove }) {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const cfg = ICONS[toast.type] || ICONS.success;

    useEffect(() => {
        // Slide in
        const t1 = setTimeout(() => setVisible(true), 10);
        // Progress bar
        const startAt = Date.now();
        const duration = toast.duration || 4000;
        const tick = setInterval(() => {
            const elapsed = Date.now() - startAt;
            setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
        }, 50);
        // Auto-dismiss
        const t2 = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
        }, duration);
        return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(tick); };
    }, [toast.id, toast.duration, onRemove]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
    };

    return (
        <div
            className={`
                relative w-80 bg-white rounded-2xl shadow-xl border border-gray-100
                border-l-4 ${cfg.border} overflow-hidden
                transition-all duration-300 ease-out
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
            `}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center`}>
                    <cfg.Icon size={16} className={cfg.color} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{toast.title || TITLES[toast.type] || TITLES.success}</p>
                    {toast.message && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {toast.highlight ? (
                                <>
                                    {toast.message.split(toast.highlight)[0]}
                                    <span className={`font-semibold ${cfg.color}`}>{toast.highlight}</span>
                                    {toast.message.split(toast.highlight)[1]}
                                </>
                            ) : toast.message}
                        </p>
                    )}
                </div>

                {/* Close */}
                <button onClick={handleClose} className="shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors rounded-lg hover:bg-gray-100">
                    <X size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-gray-100">
                <div
                    className={`h-full transition-none ${cfg.color.replace('text-', 'bg-')}`}
                    style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
                />
            </div>
        </div>
    );
}

export default function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onRemove={onRemove} />
                </div>
            ))}
        </div>
    );
}
