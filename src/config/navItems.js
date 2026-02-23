import { LayoutDashboard, ShoppingCart, Wallet, History as HistoryIcon, Package, FileText } from 'lucide-react';

export const navItems = {
    main: [
        { id: 'dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
        { id: 'sales',      label: 'Kasir (Jual)',    icon: ShoppingCart },
        { id: 'expenses',   label: 'Biaya & Ops',     icon: Wallet },
        { id: 'history',    label: 'Riwayat Nota',    icon: HistoryIcon },
    ],
    inventory: [
        { id: 'inventory',  label: 'Stok Barang',     icon: Package },
        { id: 'reports',    label: 'Laporan',         icon: FileText },
    ],
};
