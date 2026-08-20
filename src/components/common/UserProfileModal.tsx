import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User as UserType } from '../../types';
import { ProfileImageUploader } from './ProfileImageUploader';
import { 
  User as UserIcon, 
  X, 
  Save, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Lock, 
  CheckCircle2,
  Building2
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, showNotification } = useApp();

  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [companyName, setCompanyName] = useState(currentUser.companyName || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const updates: Partial<UserType> = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      avatar: avatar.trim() || currentUser.avatar,
    };

    if (currentUser.role === 'PELANGGAN_KANTOR') {
      updates.companyName = companyName.trim() || undefined;
    }

    if (newPassword.trim()) {
      updates.password = newPassword.trim();
      updates.isPasswordTemporary = false;
    }

    updateUser(currentUser.id, updates);
    setIsSaving(false);
    showNotification('Profil & foto Anda berhasil diperbarui!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Edit Profil & Foto Akun</h3>
              <p className="text-xs text-white/50">{currentUser.email} • {currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Avatar Uploader Component */}
          <ProfileImageUploader
            currentAvatar={avatar}
            onAvatarChange={(newUrl) => setAvatar(newUrl)}
            title="Upload atau Ambil Foto Profil"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-black uppercase tracking-wider text-white/60 mb-1">No. WhatsApp *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {currentUser.role === 'PELANGGAN_KANTOR' && (
            <div>
              <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Perusahaan / Gedung</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="PT. Inovasi Gemilang"
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Alamat Domisili / Lokasi Kantor</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Jl. Thamrin No. 20, Jakarta"
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <label className="block font-black uppercase tracking-wider text-white/70">
              Ganti Kata Sandi (Opsional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah sandi..."
              className="w-full p-2.5 bg-black/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
