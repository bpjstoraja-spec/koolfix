import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  ChevronDown, 
  PlusCircle, 
  Bell, 
  ShieldCheck, 
  Check,
  UserCheck,
  Building2,
  Home,
  Wrench,
  Sparkles,
  Layers,
  LogOut,
  Shield,
  Sliders,
  Menu,
  Cloud,
  CloudOff,
  RefreshCw,
  User,
  Camera
} from 'lucide-react';

interface HeaderProps {
  onOpenBookingModal: () => void;
  onOpenQuickAction?: () => void;
  onNavigateToPermissions?: () => void;
  onOpenCompanyProfile?: () => void;
  onOpenUserProfile?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenBookingModal,
  onNavigateToPermissions,
  onOpenCompanyProfile,
  onOpenUserProfile,
  onToggleMobileMenu
}) => {
  const { 
    currentUser, 
    logout, 
    hasPermission,
    serviceOrders, 
    inventory,
    companyProfile,
    isCloudSynced,
    cloudSyncStatus,
    syncAllDataToCloudNow
  } = useApp();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isHeaderSyncing, setIsHeaderSyncing] = useState(false);

  const handleHeaderCloudSync = async () => {
    setIsHeaderSyncing(true);
    await syncAllDataToCloudNow();
    setIsHeaderSyncing(false);
  };

  // Compute pending counts
  const pendingOrders = serviceOrders.filter(o => o.status === 'MENUNGGU_KONFIRMASI').length;
  const lowStockCount = inventory.filter(i => i.stock <= i.minStockThreshold).length;

  const roleLabels: Record<UserRole, { title: string; color: string; icon: React.ReactNode }> = {
    SUPER_ADMIN: {
      title: 'SUPER ADMIN',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,
    },
    ADMIN: {
      title: 'ADMIN OPS',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />,
    },
    TEKNISI: {
      title: 'TEKNISI',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <Wrench className="w-3.5 h-3.5 text-emerald-400" />,
    },
    PELANGGAN_UMUM: {
      title: 'PELANGGAN UMUM',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Home className="w-3.5 h-3.5 text-amber-300" />,
    },
    PELANGGAN_KANTOR: {
      title: 'PELANGGAN B2B',
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: <Building2 className="w-3.5 h-3.5 text-indigo-400" />,
    },
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            {/* Mobile Drawer Trigger Button */}
            {onToggleMobileMenu && (
              <button
                id="header-mobile-menu-btn"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 -ml-1 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                aria-label="Buka Menu Navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {companyProfile.logoUrl ? (
              <img 
                src={companyProfile.logoUrl} 
                alt={companyProfile.name} 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xs sm:text-sm text-white shadow-md shrink-0">
                KF
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <h1 className="text-base sm:text-2xl font-black tracking-tighter leading-none flex items-center gap-1.5 truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs">
                <span>{companyProfile.name}</span>
              </h1>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-white/50 font-bold truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs mt-0.5">
                {companyProfile.tagline || 'Sistem Servis AC & RBAC'}
              </p>
            </div>

            <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-white/10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {currentUser.role === 'SUPER_ADMIN' ? 'SUPER ADMIN AKTIF' : 'RBAC CONTROLLED'}
              </span>

              {cloudSyncStatus === 'connected' && (
                <button 
                  onClick={handleHeaderCloudSync}
                  disabled={isHeaderSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md transition cursor-pointer" 
                  title="Database Firestore Cloud Terhubung. Klik untuk menyinkronkan seluruh data ke cloud."
                >
                  <Cloud className={`w-3 h-3 text-emerald-400 ${isHeaderSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isHeaderSyncing ? 'Menyinkronkan...' : 'Cloud Sinkron'}</span>
                </button>
              )}
              {cloudSyncStatus === 'syncing' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-md">
                  <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>Menyinkron...</span>
                </span>
              )}
              {cloudSyncStatus === 'offline' && (
                <button 
                  onClick={handleHeaderCloudSync}
                  disabled={isHeaderSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md transition cursor-pointer" 
                  title="Mode Offline Cache. Klik untuk mencoba menghubungkan & sinkronisasi data ke Cloud Firestore."
                >
                  <CloudOff className="w-3 h-3 text-rose-300" />
                  <span>{isHeaderSyncing ? 'Menyinkronkan...' : 'Offline (Klik Sinkron)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Actions & Multi-Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Super Admin Direct Profile Settings Button */}
            {currentUser.role === 'SUPER_ADMIN' && onOpenCompanyProfile && (
              <button
                id="header-btn-company-profile"
                onClick={onOpenCompanyProfile}
                title="Kelola Profil Perusahaan, Logo, Penanggung Jawab, & Kontak"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Profil Perusahaan</span>
              </button>
            )}

            {/* Super Admin Direct Permission Shortcut */}
            {currentUser.role === 'SUPER_ADMIN' && onNavigateToPermissions && (
              <button
                id="header-shortcut-permissions"
                onClick={onNavigateToPermissions}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/15 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Hak Akses</span>
              </button>
            )}

            {/* Quick Booking Button */}
            {hasPermission('services_booking') && (
              <button
                id="header-btn-quick-booking"
                onClick={onOpenBookingModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{currentUser.role.startsWith('PELANGGAN') ? 'Pesan Servis' : 'Order Baru'}</span>
              </button>
            )}

            {/* Notification Badge */}
            <div className="relative">
              <div className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition cursor-pointer">
                <Bell className="w-4 h-4" />
                {(pendingOrders > 0 || lowStockCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0A0A0A] animate-pulse" />
                )}
              </div>
            </div>

            {/* Role Switcher & User Profile Menu */}
            <div className="relative">
              <button
                id="header-user-menu-btn"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-white/20 bg-black"
                />
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-white truncate max-w-36">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${roleLabels[currentUser.role]?.color || ''}`}>
                      {roleLabels[currentUser.role]?.title}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </button>

              {/* Dropdown Menu */}
              {showRoleDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowRoleDropdown(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-[#121212] rounded-2xl shadow-2xl border border-white/15 z-50 p-2 divide-y divide-white/10 text-white animate-fadeIn">
                    
                    {/* User profile card */}
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-2">
                      <div className="flex items-center gap-2.5">
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-xl object-cover border border-white/20 bg-black" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${roleLabels[currentUser.role]?.color || ''}`}>
                              {currentUser.role}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktif
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Profile & Photo button */}
                    {onOpenUserProfile && (
                      <div className="pt-2 pb-1">
                        <button
                          id="dropdown-btn-user-profile"
                          onClick={() => {
                            setShowRoleDropdown(false);
                            onOpenUserProfile();
                          }}
                          className="w-full py-2 px-3 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Ganti Foto & Edit Profil</span>
                        </button>
                      </div>
                    )}

                    {/* Super Admin Company Profile shortcut in dropdown */}
                    {currentUser.role === 'SUPER_ADMIN' && onOpenCompanyProfile && (
                      <div className="pt-2">
                        <button
                          id="dropdown-btn-company-profile"
                          onClick={() => {
                            setShowRoleDropdown(false);
                            onOpenCompanyProfile();
                          }}
                          className="w-full py-2 px-3 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Kelola Profil Perusahaan</span>
                        </button>
                      </div>
                    )}

                    {/* Logout Button */}
                    <div className="pt-2">
                      <button
                        id="header-btn-logout"
                        onClick={() => {
                          setShowRoleDropdown(false);
                          logout();
                        }}
                        className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar / Logout Sesi</span>
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>

            {/* Direct Logout Icon Button on Desktop */}
            <button
              id="header-btn-direct-logout"
              title="Keluar / Logout"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl border border-white/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
