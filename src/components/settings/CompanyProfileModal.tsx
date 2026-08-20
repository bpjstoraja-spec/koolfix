import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanyProfile } from '../../types';
import { 
  Building2, 
  X, 
  Upload, 
  Trash2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  UserCheck, 
  CreditCard, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  RotateCcw,
  Eye,
  Award,
  Image as ImageIcon
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({ isOpen, onClose }) => {
  const { companyProfile, updateCompanyProfile, resetCompanyProfile, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CompanyProfile>({ ...companyProfile });
  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'preview'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync state whenever modal opens or companyProfile changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...companyProfile });
      setSaveSuccess(false);
      setShowResetConfirm(false);
    }
  }, [isOpen, companyProfile]);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64 for reliable display and storage
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setFormData(prev => ({ ...prev, logoUrl: event.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    updateCompanyProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    resetCompanyProfile();
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111113] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-8 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-slate-900 to-black shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">Pengaturan Profil Perusahaan</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-black uppercase text-purple-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-white/50">
                Kelola identitas resmi, logo, penanggung jawab, kontak, dan kop faktur kwitansi KoolFix
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-white/10 bg-black/40 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Identitas & Penanggung Jawab</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'contact'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Alamat, Kontak & Rekening</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview Kop Faktur & Surat</span>
          </button>
        </div>

        {/* Main Content Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-sm">Profil Berhasil Disimpan!</p>
                <p className="text-emerald-200/80">Kop faktur, laporan teknisi, dan header sistem telah otomatis diperbarui.</p>
              </div>
            </div>
          )}

          {/* TAB 1: IDENTITAS & PENANGGUNG JAWAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Logo Section */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      Logo Resmi Perusahaan
                    </h4>
                    <p className="text-xs text-white/50">
                      Format PNG, JPG, atau SVG (Rekomendasi rasio persegi / transparan, maks 2MB)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                  {/* Logo Preview Box */}
                  <div className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center p-2 shrink-0 group overflow-hidden">
                    {formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo Perusahaan" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <Building2 className="w-8 h-8 text-white/30 mb-1" />
                        <span className="text-[10px] text-white/40 font-bold">Logo Standar</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="flex-1 space-y-3 w-full">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLogoUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload File Logo</span>
                      </button>

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Hapus Logo</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-white/40">
                      Logo ini akan otomatis dicetak pada Kop Surat Faktur Pelanggan, Kwitansi Pembayaran, dan Laporan Servis Teknisi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                    Nama Perusahaan / Bisnis <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. KoolFix Aircon Solution"
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-sm font-bold focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                    Slogan / Tagline Layanan
                  </label>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={formData.tagline || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="e.g. Layanan Profesional Servis, Cuci & Reparasi AC Bergaransi"
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Penanggung Jawab Section */}
              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-black text-purple-200">Penanggung Jawab Resmi & Otoritas</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/70">
                      Nama Penanggung Jawab <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.personInCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, personInCharge: e.target.value }))}
                      placeholder="e.g. Ir. Hendra Gunawan, M.T."
                      className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs font-bold focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/70">
                      Jabatan / Gelar
                    </label>
                    <input
                      type="text"
                      value={formData.personInChargeTitle || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, personInChargeTitle: e.target.value }))}
                      placeholder="e.g. Direktur Operasional / Kepala Teknisi"
                      className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-white/70">
                      NPWP / Nomor Pokok Wajib Pajak Perusahaan (Opsional)
                    </label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={formData.taxIdentificationNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxIdentificationNumber: e.target.value }))}
                        placeholder="e.g. 01.234.567.8-012.000"
                        className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs font-mono focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ALAMAT, KONTAK & REKENING */}
          {activeTab === 'contact' && (
            <div className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                  Alamat Kantor & Workshop <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Jl. Surya Utama No. 45, Kebon Jeruk, Jakarta Barat 11530"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                    No. Telepon / WhatsApp Resmi <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 0812-8899-7766 / (021) 5890-1234"
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-xs font-bold focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                    Email Resmi Perusahaan <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. official@koolfix.co.id"
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                    Website Resmi (Opsional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={formData.website || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="e.g. www.koolfix.co.id"
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white text-xs font-mono focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Account Details */}
              <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-black text-cyan-200">Rekening Pembayaran Resmi (Dicetak pada Faktur)</h4>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/70">
                    Instruksi Rekening & Bank Tujuan Transfer
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountDetails || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccountDetails: e.target.value }))}
                    placeholder="e.g. Bank BCA: 8820-192-881 a/n PT KoolFix Solusi Mandiri"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs font-medium focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition"
                  />
                  <p className="text-[11px] text-white/40">
                    Info ini akan tampil otomatis di footer lembar faktur resmi dan kwitansi pelanggan.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LIVE PREVIEW KOP FAKTUR */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60">
                  Berikut adalah simulasi tampilan Kop Faktur & Kwitansi Resmi sesuai data yang dimasukkan:
                </p>
              </div>

              {/* Clean White Invoice Mockup Container */}
              <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">
                
                {/* Kop Surat Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
                  <div className="flex items-center gap-4">
                    {formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo" 
                        className="w-14 h-14 object-contain"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                        KF
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        {formData.name || 'NAMA PERUSAHAAN'}
                      </h2>
                      <p className="text-xs font-bold text-cyan-700">
                        {formData.tagline || 'Layanan Servis & Reparasi AC Bergaransi'}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 max-w-md">
                        {formData.address || 'Alamat Perusahaan Lengkap'}
                      </p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mt-1">
                        <span>Telp: <strong>{formData.phone || '-'}</strong></span>
                        <span>Email: <strong>{formData.email || '-'}</strong></span>
                        {formData.website && <span>Web: <strong>{formData.website}</strong></span>}
                        {formData.taxIdentificationNumber && <span>NPWP: <strong>{formData.taxIdentificationNumber}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">FAKTUR RESMI</span>
                    <p className="text-lg font-black text-slate-900 font-mono">INV-2026-08001</p>
                    <p className="text-xs text-slate-500 font-medium">Tanggal: 18 Agustus 2026</p>
                  </div>
                </div>

                {/* Dummy Body Preview */}
                <div className="space-y-3 py-2">
                  <div className="flex justify-between text-xs text-slate-600 font-bold border-b border-slate-200 pb-1">
                    <span>DESKRIPSI PEKERJAAN</span>
                    <span>TOTAL BIAYA</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-800">
                    <span>Cuci AC Split Wall Inverter (2 Unit)</span>
                    <span className="font-mono font-bold">Rp 150.000</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-800">
                    <span>Tambah Freon R32 Original (2 Unit)</span>
                    <span className="font-mono font-bold">Rp 250.000</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2">
                    <span>TOTAL PEMBAYARAN:</span>
                    <span className="text-emerald-600 font-mono">Rp 400.000</span>
                  </div>
                </div>

                {/* Payment & Signatures Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                  <div>
                    <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Rekening Pembayaran:</p>
                    <p className="font-bold text-slate-800 mt-0.5">{formData.bankAccountDetails || 'Bank BCA: 8820-192-881 a/n PT KoolFix'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Harap sertakan nomor faktur pada berita transfer.</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Penanggung Jawab Resmi,</p>
                    <div className="h-10 my-1 flex items-end sm:justify-end">
                      <span className="text-xs font-serif italic text-slate-400">[Tanda Tangan & Cap Digital]</span>
                    </div>
                    <p className="font-bold text-slate-900">{formData.personInCharge || 'Nama Penanggung Jawab'}</p>
                    <p className="text-[10px] text-slate-500">{formData.personInChargeTitle || 'Direktur Operasional'}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Standar</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={!isSuperAdmin}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>

        </form>

        {/* Reset Confirmation Overlay */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-[#18181b] border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white text-base">Reset Profil Perusahaan?</h4>
                <p className="text-xs text-white/60 mt-1">Data nama usaha, logo, rekening, dan format dokumen akan dikembalikan ke setelan pabrik KoolFix.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-wider rounded-xl text-xs transition cursor-pointer"
                >
                  Ya, Reset
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
