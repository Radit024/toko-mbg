import { useState } from 'react';

export function useUIState() {
    // Navigation
    const [activeTab, setActiveTab] = useState('dashboard');

    // Sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarMini, setIsSidebarMini] = useState(false);

    // Editing modals
    const [editingOrder, setEditingOrder] = useState(null);
    const [editingRestock, setEditingRestock] = useState(null);

    // Print
    const [printOrder, setPrintOrder] = useState(null);
    const handlePrint = (order, sequentialNumber) => {
        setPrintOrder({ ...order, sequentialNumber });
        setTimeout(() => { window.print(); }, 500);
    };

    return {
        activeTab, setActiveTab,
        isSidebarOpen, setIsSidebarOpen,
        isSidebarMini, setIsSidebarMini,
        editingOrder, setEditingOrder,
        editingRestock, setEditingRestock,
        printOrder, handlePrint,
    };
}
