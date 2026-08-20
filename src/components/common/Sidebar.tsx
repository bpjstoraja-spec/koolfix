import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Boxes, 
  Coins, 
  MapPin, 
  TrendingUp, 
  Users, 
  Star, 
  AirVent, 
  PlusCircle, 
  Receipt, 
  UserCog, 
  Building2, 
  CalendarCheck, 
  Shield, 
  Sliders, 
  Lock, 
  Package, 
  X 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBookingModal?: () => void;
  onOpenCompanyProfile?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenBookingModal, 
  onOpenCompanyProfile,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { currentUser, hasPermission, serviceOrders, inventory, companyProfile } = useApp();

  const role = currentUser.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isTechnician = role === 'TEKNISI';
  const isCustomer = role.startsWith('PELANGGAN');

  const pendingOrders = serviceOrders.filter(o => o.status === 'MENUNGGU_KONFIRMASI').length;
  const techAssignedOrders = serviceOrders.filter(o => o.technicianId === currentUser.id && o.status !== 'SELESAI' && o.status !== 'DIBATALKAN').length;
  const lowStockCount = inventory.filter(i => i.stock <= i.minStockThreshold).length;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Permission checks
  const canViewDashboard = hasPermission('dashboard_view');
  const canViewServices = hasPermission('services_view');
  const canViewProducts = hasPermission('products_view') || isSuperAdmin;
  const canViewInventory = hasPermission('inventory_view');
  const canViewAttendance = hasPermission('attendance_view') || hasPermission('attendance_clockin');
  const canViewEarnings = hasPermission('technician_earnings_view');
  const canViewPayroll = hasPermission('payroll_manage');
  const canViewFinance = hasPermission('finance_reports');
  const canViewAccounts = hasPermission('accounts_view');
  const canManageFeatureControl = hasPermission('feature_control_manage');

  const sidebarContent = (
    <div className="flex flex-col h-full text-white select-none">
      {/* Brand header */}
      <div className="mb-5 pb-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {companyProfile.logoUrl ? (
            <img 
              src={companyProfile.logoUrl} 
              alt={companyProfile.name} 
              className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md">
              KF
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black tracking-tight leading-tight truncate text-white">
              {companyProfile.name}
            </h1>
            <p className="text-[9px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="truncate">{companyProfile.tagline || 'Sistem AC Pro'}</span>
              {isSuperAdmin && (
                <span className="text-purple-400 font-black uppercase bg-purple-500/20 px-1 py-0.2 rounded border border-purple-500/30 text-[7px] shrink-0">
                  Root
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        
        {/* SUPER ADMIN SECURITY & COMPANY PROFILE CONTROL */}
        {isSuperAdmin && (
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-2.5 space-y-1.5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-purple-300 font-bold px-2 py-0.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-purple-400" />
              <span>Super Admin Control</span>
            </p>

            {/* Company Profile Settings Button */}
            {onOpenCompanyProfile && (
              <button
                id="sidebar-nav-company-profile"
                onClick={() => {
                  onOpenCompanyProfile();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-xs font-bold text-purple-200 hover:text-white hover:bg-purple-900/50 border border-purple-500/20"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>Profil Perusahaan</span>
                </div>
                <span className="text-[8px] uppercase font-black px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200">
                  Logo/Kop
                </span>
              </button>
            )}

            {canManageFeatureControl && (
              <button
                id="sidebar-nav-feature-control"
                onClick={() => handleNavClick('feature_control')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-xs font-bold ${
                  activeTab === 'feature_control'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-purple-200 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Hak Akses & Fitur</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  17 Modul
                </span>
              </button>
            )}
          </div>
        )}

        {/* OPERATIONAL SECTION */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2.5 font-bold">
            Operasional
          </p>
          <ul className="space-y-1 font-bold text-xs">
            {canViewDashboard && (
              <li>
                <button
                  id="sidebar-nav-dashboard"
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard & Monitoring</span>
                  </div>
                </button>
              </li>
            )}

            {canViewServices && (
              <li>
                <button
                  id="sidebar-nav-services"
                  onClick={() => handleNavClick('services')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    activeTab === 'services'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarClock className="w-4 h-4" />
                    <span>{isTechnician ? 'Tugas Servis Saya' : 'Jadwal & Order Servis'}</span>
                  </div>
                  {isTechnician ? (
                    techAssignedOrders > 0 && (
                      <span className="text-[10px] font-black bg-emerald-500 text-black px-1.5 py-0.2 rounded-full animate-pulse">
                        {techAssignedOrders} Aktif
                      </span>
                    )
                  ) : (
                    pendingOrders > 0 && (
                      <span className="text-[10px] font-black bg-amber-500 text-black px-1.5 py-0.2 rounded-full animate-pulse">
                        {pendingOrders} Baru
                      </span>
                    )
                  )}
                </button>
              </li>
            )}

            {/* Quick Action Pesan Servis for Pelanggan */}
            {isCustomer && onOpenBookingModal && (
              <li>
                <button
                  id="sidebar-nav-quick-booking"
                  onClick={() => {
                    onOpenBookingModal();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 mt-1"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-cyan-400" />
                    <span>Pesan Servis Baru</span>
                  </div>
                  <span className="text-[9px] font-black bg-cyan-500 text-black px-1.5 py-0.2 rounded">
                    Booking
                  </span>
                </button>
              </li>
            )}

            {canViewProducts && (
              <li>
                <button
                  id="sidebar-nav-products"
                  onClick={() => handleNavClick('products')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>Produk Barang & Jasa</span>
                  </div>                  
                </button>
              </li>
            )}

            {canViewInventory && (
              <li>
                <button
                  id="sidebar-nav-inventory"
                  onClick={() => handleNavClick('inventory')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-4 h-4" />
                    <span>Inventaris Suku Cadang</span>
                  </div>
                  {lowStockCount > 0 && (
                    <span className="text-[9px] font-black bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded">
                      {lowStockCount} Menipis
                    </span>
                  )}
                </button>
              </li>
            )}

            {canViewAttendance && (
              <li>
                <button
                  id="sidebar-nav-attendance"
                  onClick={() => handleNavClick('attendance')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4" />
                    <span>Absensi & Presensi GPS</span>
                  </div>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* FINANCE & PAYROLL SECTION */}
        {(canViewEarnings || canViewPayroll || canViewFinance) && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2.5 font-bold">
              Keuangan & Gaji
            </p>
            <ul className="space-y-1 font-bold text-xs">
              {canViewEarnings && (
                <li>
                  <button
                    id="sidebar-nav-technician-earnings"
                    onClick={() => handleNavClick('technician_earnings')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                      activeTab === 'technician_earnings'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Coins className="w-4 h-4" />
                      <span>{isTechnician ? 'Pendapatan Komisi Saya' : 'Komisi Teknisi'}</span>
                    </div>
                  </button>
                </li>
              )}

              {canViewPayroll && (
                <li>
                  <button
                    id="sidebar-nav-payroll"
                    onClick={() => handleNavClick('payroll')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                      activeTab === 'payroll'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4" />
                      <span>Skema Gaji & Komisi</span>
                    </div>
                  </button>
                </li>
              )}

              {canViewFinance && (
                <li>
                  <button
                    id="sidebar-nav-finance"
                    onClick={() => handleNavClick('finance')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                      activeTab === 'finance'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>Arus Kas & Laba</span>
                    </div>
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* ACCOUNTS & MANAGEMENT */}
        {canViewAccounts && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2.5 font-bold">
              Pengguna
            </p>
            <ul className="space-y-1 font-bold text-xs">
              <li>
                <button
                  id="sidebar-nav-accounts"
                  onClick={() => handleNavClick('accounts')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    activeTab === 'accounts'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCog className="w-4 h-4" />
                    <span>Daftar Anggota & Akun</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* User profile info at bottom matching design */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md">
            {getInitials(currentUser.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-white/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="truncate">{currentUser.role.replace(/_/g, ' ')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0A0A0A] border-r border-white/10 flex-col shrink-0 min-h-[calc(100vh-4rem)] p-6">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer & Backdrop */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark Blurred Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Sliding Drawer Container */}
          <div className="relative w-80 max-w-[85vw] bg-[#0A0A0A] border-r border-white/15 h-full p-5 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
