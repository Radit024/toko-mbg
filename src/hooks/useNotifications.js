import { useState, useCallback } from 'react';

export function useNotifications() {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);

    // --- TOAST ---
    const toast = useCallback((message, type = 'success', options = {}) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration: 4000, ...options }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Convenience shorthands
    const toastSuccess = useCallback((message, options) => toast(message, 'success', options), [toast]);
    const toastError   = useCallback((message, options) => toast(message, 'error',   options), [toast]);
    const toastInfo    = useCallback((message, options) => toast(message, 'info',    options), [toast]);

    // --- CONFIRM (Promise-based, replaces window.confirm) ---
    const confirm = useCallback((title, message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmState({ title, message, resolve, ...options });
        });
    }, []);

    const handleConfirmClose = useCallback((result) => {
        if (confirmState?.resolve) confirmState.resolve(result);
        setConfirmState(null);
    }, [confirmState]);

    return {
        // toast state
        toasts,
        removeToast,
        // confirm state
        confirmState,
        handleConfirmClose,
        // functions to use in handlers
        toast,
        toastSuccess,
        toastError,
        toastInfo,
        confirm,
    };
}
