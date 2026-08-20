import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  Boxes, 
  Menu, 
  MapPin, 
  Coins, 
  PlusCircle, 
  History,
  AirVent,
  Sliders,
  TrendingUp
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu: () => void;
  onOpenBookingModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  onOpenBookingModal
}) => {
  const { currentUser, hasPermission, serviceOrders, inventory } = useApp();
  const role = currentUser.role;

  const pendingOrders = serviceOrders.filter(o => o.status === 'MENUNGGU_KONFIRMASI').length;
  const techActiveOrders = serviceOrders.filter(
    o => (o.technicianId === currentUser.id || o.assignedTechnicians?.some(t => t.technicianId === currentUser.id)) && 
    o.status !== 'SELESAI' && o.status !== 'DIBATALKAN'
  ).length;
  const lowStockCount = inventory.filter(i => i.stock <= i.minStockThreshold).length;

  // Build role-specific mobile tabs
  const getNavItems = () => {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return [
        {
          id: 'dashboard',
          label: 'Beranda',
          icon: LayoutDashboard,
          badge: 0,
        },
        {
          id: 'services',
          label: 'SPK Servis',
          icon: Wrench,
          badge: pendingOrders,
        },
        {
          id: 'products',
          label: 'Produk',
          icon: Package,
          badge: 0,
        },
        {
          id: 'inventory',
          label: 'Gudang',
          icon: Boxes,
          badge: lowStockCount,
        },
        {
          id: 'menu_drawer',
          label: 'Menu',
          icon: Menu,
          isAction: true,
          badge: 0,
        },
      ];
    }

    if (role === 'TEKNISI') {
      return [
        {
          id: 'services',
          label: 'Tugas SPK',
          icon: Wrench,
          badge: techActiveOrders,
        },
        {
          id: 'attendance',
          label: 'Presensi GPS',
          icon: MapPin,
          badge: 0,
        },
        {
          id: 'technician_earnings',
          label: 'Komisi',
          icon: Coins,
          badge: 0,
        },
        {
          id: 'inventory',
          label: 'Stok Part',
          icon: Boxes,
          badge: 0,
        },
        {
          id: 'menu_drawer',
          label: 'Menu',
          icon: Menu,
          isAction: true,
          badge: 0,
        },
      ];
    }

    // Pelanggan (Umum & B2B Kantor)
    return [
      {
        id: 'dashboard',
        label: 'Beranda',
        icon: LayoutDashboard,
        badge: 0,
      },
      {
        id: 'booking_action',
        label: 'Pesan',
        icon: PlusCircle,
        isAction: true,
        highlight: true,
        badge: 0,
      },
      {
        id: 'services',
        label: 'Riwayat',
        icon: History,
        badge: pendingOrders,
      },
      {
        id: 'products',
        label: 'Katalog',
        icon: Package,
        badge: 0,
      },
      {
        id: 'menu_drawer',
        label: 'Menu',
        icon: Menu,
        isAction: true,
        badge: 0,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onOpenBookingModal) onOpenBookingModal();
                }}
                className="flex flex-col items-center justify-center -mt-4 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/40 group-active:scale-95 transition border-2 border-[#0A0A0A]">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-cyan-400 mt-1 uppercase tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'menu_drawer') {
                  onOpenMobileMenu();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer relative min-h-[46px] ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-white/50 hover:text-white/80 active:bg-white/5'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#0A0A0A] animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 font-bold truncate max-w-[64px] ${
                isActive ? 'text-cyan-300 font-black' : 'text-white/60'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-4 h-0.5 bg-cyan-400 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
