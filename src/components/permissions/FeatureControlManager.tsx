import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, AppFeatureId, UserAccountStatus, User } from '../../types';
import { 
  Shield, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Sliders, 
  Key, 
  RotateCcw, 
  Sparkles, 
  Search, 
  UserCheck, 
  UserX, 
  AlertOctagon, 
  ShieldAlert, 
  Check, 
  Info,
  Layers,
  Wrench,
  DollarSign,
  Cpu,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  HelpCircle
} from 'lucide-react';

export const FeatureControlManager: React.FC = () => {
  const { 
    currentUser,
    users, 
    systemFeatureDefinitions, 
    roleDefaultPermissions, 
    updateRoleDefaultPermissions, 
    updateUserPermissions,
    setUserAccountStatus,
    resetUserPassword,
    lockAllUserSessions,
    resetPermissionsToDefaults,
    hasPermission,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ROLE_MATRIX' | 'USER_OVERRIDES' | 'ACCOUNT_SECURITY'>('ROLE_MATRIX');
  
  // Tab 2: User Overrides state
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    const nonSuper = users.find(u => u.role !== 'SUPER_ADMIN');
    return nonSuper ? nonSuper.id : users[0].id;
  });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Tab 3: Account Security state
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newCustomPassword, setNewCustomPassword] = useState('');
  const [generatedTempPass, setGeneratedTempPass] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const selectedUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || users[0];
  }, [users, selectedUserId]);

  const rolesList: { id: UserRole; label: string; badgeColor: string; description: string }[] = [
    { id: 'SUPER_ADMIN', label: 'Super Admin', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40', description: 'Pengendali sistem tertinggi dengan hak akses mutlak.' },
    { id: 'ADMIN', label: 'Admin Ops', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40', description: 'Manajemen order servis, disposisi teknisi, & stok sparepart.' },
    { id: 'TEKNISI', label: 'Teknisi', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', description: 'Pengerjaan lapangan, absensi geotag, & laporan teknis unit.' },
    { id: 'PELANGGAN_KANTOR', label: 'Pelanggan Kantor', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', description: 'Klien korporat B2B dengan multi-unit AC & nota tempo.' },
    { id: 'PELANGGAN_UMUM', label: 'Pelanggan Umum', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', description: 'Klien perorangan / rumah tinggal untuk servis residensial.' },
  ];

  // Category grouping for features
  const categories = [
    { id: 'OPERASIONAL', label: 'Operasional & Booking', icon: Layers, color: 'text-cyan-400' },
    { id: 'TEKNIK', label: 'Pekerjaan Teknis & Lapangan', icon: Wrench, color: 'text-emerald-400' },
    { id: 'FINANSIAL', label: 'Keuangan & Payroll Gaji', icon: DollarSign, color: 'text-amber-400' },
    { id: 'SISTEM', label: 'Manajemen Sistem & Pengguna', icon: Cpu, color: 'text-purple-400' },
  ];

  // Toggle single cell in Role Matrix
  const handleToggleRolePermission = (role: UserRole, featureId: AppFeatureId) => {
    // Prevent Super Admin from locking themselves out of feature control
    if (role === 'SUPER_ADMIN' && featureId === 'feature_control_manage') {
      showNotification('Fitur Kontrol Akses tidak dapat dinonaktifkan untuk Super Admin.', 'warning');
      return;
    }

    const currentPerms = roleDefaultPermissions[role] || ({} as Record<AppFeatureId, boolean>);
    const newValue = !currentPerms[featureId];
    
    updateRoleDefaultPermissions(role, {
      ...currentPerms,
      [featureId]: newValue,
    });
  };

  // Toggle user specific override
  const handleToggleUserPermission = (featureId: AppFeatureId) => {
    if (!selectedUser) return;
    
    // Determine current effective value
    const currentCustom = selectedUser.customPermissions?.[featureId];
    const defaultVal = roleDefaultPermissions[selectedUser.role]?.[featureId] ?? false;
    const currentEffective = currentCustom !== undefined ? currentCustom : defaultVal;
    
    const newOverrideValue = !currentEffective;

    updateUserPermissions(selectedUser.id, {
      ...(selectedUser.customPermissions || {}),
      [featureId]: newOverrideValue,
    });
  };

  // Reset selected user's overrides back to role default
  const handleResetUserToDefault = (userId: string) => {
    updateUserPermissions(userId, {});
    showNotification('Hak akses pengguna dikembalikan persis mengikuti default peran.', 'info');
  };

  // Preset bulk permissions for Role Matrix
  const handleApplyPreset = (presetType: 'DEFAULT' | 'STRICT' | 'OPEN') => {
    if (presetType === 'DEFAULT') {
      resetPermissionsToDefaults();
      return;
    }

    if (presetType === 'STRICT') {
      // Strict lockdown: only super admin has full, others minimal
      const newPerms = { ...roleDefaultPermissions };
      (['ADMIN', 'TEKNISI', 'PELANGGAN_KANTOR', 'PELANGGAN_UMUM'] as UserRole[]).forEach(r => {
        newPerms[r] = {
          dashboard_view: true,
          services_view: true,
          services_booking: r.startsWith('PELANGGAN'),
          services_dispatch: false,
          services_status_update: r === 'TEKNISI',
          services_technical_report: r === 'TEKNISI',
          services_payment_invoice: false,
          inventory_view: r === 'ADMIN' || r === 'TEKNISI',
          inventory_manage: false,
          attendance_view: false,
          attendance_clockin: r === 'TEKNISI',
          technician_earnings_view: r === 'TEKNISI',
          payroll_manage: false,
          finance_reports: false,
          accounts_view: false,
          accounts_manage: false,
          feature_control_manage: false,
        };
      });
      (['ADMIN', 'TEKNISI', 'PELANGGAN_KANTOR', 'PELANGGAN_UMUM'] as UserRole[]).forEach(r => {
        updateRoleDefaultPermissions(r, newPerms[r]);
      });
      showNotification('Preset "Keamanan Ketat (Strict Lockdown)" berhasil diterapkan!', 'warning');
    }
  };

  // Handle password reset submit
  const handleExecutePasswordReset = () => {
    if (!passwordModalUser) return;
    const res = resetUserPassword(passwordModalUser.id, newCustomPassword || undefined);
    if (res.temporaryPassword) {
      setGeneratedTempPass(res.temporaryPassword);
    }
    setNewCustomPassword('');
  };

  // Filtered users for Tab 2
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.phone.includes(userSearchQuery);
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // Filtered users for Tab 3
  const securityFilteredUsers = users.filter(u => {
    return u.name.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(accountSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Super Admin Executive Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-500/30 p-6 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  KONTROL OTORISASI SUPER ADMIN
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> RBAC Enforced
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Kontrol Pembatasan Fitur & Keamanan Akun
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-1">
                Atur pembatasan akses untuk 17 fitur sistem ke seluruh anggota, admin, teknisi, dan pelanggan. Perubahan berlaku secara instan dan real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => handleApplyPreset('DEFAULT')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Standar Pabrik</span>
            </button>
            <button
              onClick={() => handleApplyPreset('STRICT')}
              className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-500/40"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Lockdown Ketat</span>
            </button>
          </div>
        </div>

        {/* Quick System Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Fitur Terdaftar</span>
            <span className="text-base font-bold text-white">{systemFeatureDefinitions.length} Fitur Operasional</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Peran Pengguna (Roles)</span>
            <span className="text-base font-bold text-purple-400">5 Golongan Role</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Pengguna Terdaftar</span>
            <span className="text-base font-bold text-cyan-400">{users.length} Akun Member</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Status Proteksi Sesi</span>
            <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif Terenkripsi
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-2xl gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          id="tab-role-matrix-btn"
          onClick={() => setActiveTab('ROLE_MATRIX')}
          className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 text-nowrap ${
            activeTab === 'ROLE_MATRIX'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matrix Per Role ({rolesList.length})</span>
        </button>
        <button
          id="tab-user-overrides-btn"
          onClick={() => setActiveTab('USER_OVERRIDES')}
          className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 text-nowrap ${
            activeTab === 'USER_OVERRIDES'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Override Per Anggota</span>
        </button>
        <button
          id="tab-account-security-btn"
          onClick={() => setActiveTab('ACCOUNT_SECURITY')}
          className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 text-nowrap ${
            activeTab === 'ACCOUNT_SECURITY'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Keamanan & Sandi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MATRIX HAK AKSES PER ROLE */}
      {/* ========================================================================= */}
      {activeTab === 'ROLE_MATRIX' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  Matrix Pembatasan Fitur Global Berdasarkan Peran
                </h3>
                <p className="text-xs text-slate-400">
                  Klik saklar toggle (ON/OFF) untuk mengaktifkan atau membatasi fitur bagi seluruh anggota dalam role tersebut.
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hijau = Diizinkan, Abu-abu = Dibatasi</span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800">
                    <th className="p-3.5 font-bold text-slate-200 min-w-[280px]">
                      Modul / Fitur Sistem
                    </th>
                    {rolesList.map(r => (
                      <th key={r.id} className="p-3.5 font-bold text-center min-w-[130px]">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${r.badgeColor}`}>
                          {r.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {categories.map(cat => {
                    const catFeatures = systemFeatureDefinitions.filter(f => f.category === cat.id);
                    if (catFeatures.length === 0) return null;

                    return (
                      <React.Fragment key={cat.id}>
                        {/* Category Header Row */}
                        <tr className="bg-slate-950/80">
                          <td colSpan={rolesList.length + 1} className="py-2 px-3.5 font-bold text-slate-300">
                            <div className="flex items-center gap-2">
                              <cat.icon className={`w-4 h-4 ${cat.color}`} />
                              <span className="uppercase tracking-wider text-[11px]">{cat.label}</span>
                              <span className="text-[10px] text-slate-500 font-normal">({catFeatures.length} fitur)</span>
                            </div>
                          </td>
                        </tr>

                        {/* Feature Rows */}
                        {catFeatures.map(feat => (
                          <tr key={feat.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5 pl-6">
                              <div className="font-semibold text-slate-100">{feat.name}</div>
                              <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{feat.description}</div>
                              <code className="text-[9px] text-slate-500 mt-1 block">{feat.id}</code>
                            </td>

                            {rolesList.map(role => {
                              const isEnabled = roleDefaultPermissions[role.id]?.[feat.id] ?? false;
                              const isSuperAdminLocked = role.id === 'SUPER_ADMIN' && feat.id === 'feature_control_manage';

                              return (
                                <td key={role.id} className="p-3.5 text-center align-middle">
                                  <button
                                    id={`toggle-${role.id}-${feat.id}`}
                                    type="button"
                                    disabled={isSuperAdminLocked}
                                    onClick={() => handleToggleRolePermission(role.id, feat.id)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                                    } ${isSuperAdminLocked ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                  <span className="block text-[9px] mt-1 font-semibold text-slate-400">
                                    {isEnabled ? (
                                      <span className="text-emerald-400">Diizinkan</span>
                                    ) : (
                                      <span className="text-slate-500">Dibatasi</span>
                                    )}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Role summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3">
              {rolesList.map(role => {
                const totalEnabled = systemFeatureDefinitions.filter(f => roleDefaultPermissions[role.id]?.[f.id]).length;
                const percentage = Math.round((totalEnabled / systemFeatureDefinitions.length) * 100);

                return (
                  <div key={role.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{role.label}</span>
                      <span className="text-xs font-semibold text-cyan-400">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {totalEnabled} dari {systemFeatureDefinitions.length} fitur terbuka
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONTROL AKSES PER ANGGOTA (INDIVIDUAL OVERRIDES) */}
      {/* ========================================================================= */}
      {activeTab === 'USER_OVERRIDES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Member Selector List */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 h-fit">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Pilih Anggota / Pengguna
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih akun untuk memberikan pengecualian izin khusus di luar role standarnya.
              </p>
            </div>

            {/* Search and Role Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, no HP..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">Semua Peran ({users.length})</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin Operasional</option>
                <option value="TEKNISI">Teknisi</option>
                <option value="PELANGGAN_KANTOR">Pelanggan Kantor</option>
                <option value="PELANGGAN_UMUM">Pelanggan Umum</option>
              </select>
            </div>

            {/* User List Items */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredUsers.map(user => {
                const isSelected = user.id === selectedUserId;
                const hasCustom = user.customPermissions && Object.keys(user.customPermissions).length > 0;

                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-700" />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {hasCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px]">
                              Kustom
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{user.role} • {user.email}</div>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      user.status === 'AKTIF' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {user.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Individual Permission Matrix */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            
            {/* Selected User Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3.5">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedUser.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedUser.email} • WhatsApp: {selectedUser.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResetUserToDefault(selectedUser.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Samakan dengan Role {selectedUser.role}</span>
                </button>
              </div>
            </div>

            {/* Feature Custom Overrides List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Daftar 17 Fitur Sistem</span>
                <span>Status Izin Khusus</span>
              </div>

              <div className="space-y-2">
                {systemFeatureDefinitions.map(feat => {
                  const hasCustom = selectedUser.customPermissions?.[feat.id] !== undefined;
                  const customVal = selectedUser.customPermissions?.[feat.id];
                  const roleDefaultVal = roleDefaultPermissions[selectedUser.role]?.[feat.id] ?? false;
                  const effectiveVal = hasCustom ? customVal! : roleDefaultVal;

                  return (
                    <div 
                      key={feat.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                        hasCustom
                          ? 'bg-purple-950/20 border-purple-500/40'
                          : 'bg-slate-950/70 border-slate-800/80'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{feat.name}</span>
                          {hasCustom ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                              Override Super Admin
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              (Mengikuti default {selectedUser.role}: {roleDefaultVal ? 'Aktif' : 'Nonaktif'})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{feat.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          id={`toggle-user-feat-${feat.id}`}
                          type="button"
                          onClick={() => handleToggleUserPermission(feat.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            effectiveVal ? 'bg-emerald-500' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              effectiveVal ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold min-w-[65px] text-right ${
                          effectiveVal ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {effectiveVal ? 'DIBUKA' : 'DIKUNCI'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KONTROL AKUN, STATUS, DAN RESET KATA SANDI */}
      {/* ========================================================================= */}
      {activeTab === 'ACCOUNT_SECURITY' && (
        <div className="space-y-5">
          
          {/* Action Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Manajemen Akun, Status Keamanan, & Reset Sandi
                </h3>
                <p className="text-xs text-slate-400">
                  Super Admin dapat menangguhkan akun yang mencurigakan, mengunci akses, dan mereset kata sandi seluruh anggota.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmergencyModal(true)}
                  className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-500/40"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Tangguhkan Sesi Seluruh Anggota</span>
                </button>
              </div>
            </div>

            {/* Filter Input */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                placeholder="Cari nama anggota, email, atau role..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Accounts Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-300">
                    <th className="p-3.5 font-bold">Profil Pengguna</th>
                    <th className="p-3.5 font-bold">Peran (Role)</th>
                    <th className="p-3.5 font-bold">Login Terakhir</th>
                    <th className="p-3.5 font-bold text-center">Status Akun</th>
                    <th className="p-3.5 font-bold text-right">Tindakan Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {securityFilteredUsers.map(user => {
                    const isSelf = user.id === currentUser.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{user.email} • {user.phone}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            user.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                            user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                            user.role === 'TEKNISI' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                            user.role === 'PELANGGAN_KANTOR' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                            'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        <td className="p-3.5 text-[11px] text-slate-300">
                          <div>{user.lastLoginAt || 'Belum pernah'}</div>
                          <div className="text-[10px] text-slate-500">{user.lastLoginIp || '-'}</div>
                        </td>

                        <td className="p-3.5 text-center">
                          <select
                            value={user.status}
                            disabled={isSelf}
                            onChange={(e) => setUserAccountStatus(user.id, e.target.value as UserAccountStatus)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none ${
                              user.status === 'AKTIF'
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                                : user.status === 'DITANGGUHKAN'
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                                : 'bg-rose-950/40 border-rose-500/50 text-rose-400'
                            } ${isSelf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="AKTIF">🟢 AKTIF</option>
                            <option value="DITANGGUHKAN">🟡 DITANGGUHKAN</option>
                            <option value="TERKUNCI">🔴 TERKUNCI</option>
                          </select>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`btn-reset-pass-${user.id}`}
                              onClick={() => {
                                setPasswordModalUser(user);
                                setGeneratedTempPass('');
                                setNewCustomPassword('');
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Reset Sandi</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setActiveTab('USER_OVERRIDES');
                              }}
                              className="px-2.5 py-1.5 bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-purple-800"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Izin Fitur</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* Modal Reset Password */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Kata Sandi Pengguna</h3>
                <p className="text-xs text-slate-400">{passwordModalUser.name} ({passwordModalUser.role})</p>
              </div>
            </div>

            {generatedTempPass ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl space-y-2 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Kata Sandi Baru Berhasil Dibuat!</h4>
                <p className="text-xs text-slate-300">Berikan kata sandi sementara ini kepada pengguna:</p>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-base font-bold text-cyan-400 tracking-wider">
                  {generatedTempPass}
                </div>
                <p className="text-[10px] text-slate-400">Pengguna dapat langsung menggunakannya untuk login mandiri.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Masukkan kata sandi baru atau biarkan kosong untuk menghasilkan kata sandi acak otomatis.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kata Sandi Baru (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newCustomPassword}
                    onChange={(e) => setNewCustomPassword(e.target.value)}
                    placeholder="contoh: koolfix2026 atau kosongkan"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                {generatedTempPass ? 'Selesai' : 'Batal'}
              </button>
              {!generatedTempPass && (
                <button
                  type="button"
                  onClick={handleExecutePasswordReset}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/25"
                >
                  Eksekusi Reset Sandi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Emergency Suspend All */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Tangguhkan Sesi</h3>
                <p className="text-xs text-rose-300">Tindakan Keamanan Darurat</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              Apakah Anda yakin ingin menangguhkan status seluruh akun admin, teknisi, dan pengguna? Pengguna yang ditangguhkan tidak akan dapat mengakses fitur operasional apapun sampai diaktifkan kembali.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  lockAllUserSessions();
                  setShowEmergencyModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Ya, Tangguhkan Seluruhnya
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
