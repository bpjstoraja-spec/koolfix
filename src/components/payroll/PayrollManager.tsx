import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SalaryConfig, User, UserRole } from '../../types';
import { 
  Coins, 
  Settings, 
  UserCheck, 
  Printer, 
  Save, 
  ToggleLeft, 
  ToggleRight, 
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Percent,
  Calculator,
  User as UserIcon,
  CheckCircle2,
  X,
  Crown,
  ShieldCheck,
  Wrench,
  Info,
  Building
} from 'lucide-react';

export const PayrollManager: React.FC = () => {
  const { 
    users, 
    companyProfile,
    globalSalaryConfig, 
    updateGlobalSalaryConfig, 
    updateTechnicianSalaryConfig, 
    getTechnicianMonthlyEarnings 
  } = useApp();

  // All employees eligible for salary scheme: Super Admin (except hidden backdoor), Admin, and Teknisi
  const employees = users.filter(u => 
    !u.isPatentHidden && 
    u.username !== 'superadmin' && 
    u.id !== 'usr-superadmin' && 
    ['SUPER_ADMIN', 'ADMIN', 'TEKNISI'].includes(u.role)
  );

  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CONFIG' | 'STAFF'>('SUMMARY');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'TEKNISI'>('ALL');

  // Config tab state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('GLOBAL');
  const [editingConfig, setEditingConfig] = useState<SalaryConfig>(() => {
    return JSON.parse(JSON.stringify(globalSalaryConfig));
  });

  // Payslip modal state
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = useState<User | null>(null);

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    if (roleFilter === 'ALL') return true;
    return emp.role === roleFilter;
  });

  // Sync editing config when employee selector changes
  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    if (id === 'GLOBAL') {
      setEditingConfig(JSON.parse(JSON.stringify(globalSalaryConfig)));
    } else {
      const emp = employees.find(e => e.id === id);
      const cfg = emp?.technicianSalaryConfig || globalSalaryConfig;
      setEditingConfig(JSON.parse(JSON.stringify(cfg)));
    }
  };

  const handleSaveConfig = () => {
    if (selectedEmployeeId === 'GLOBAL') {
      updateGlobalSalaryConfig(editingConfig);
    } else {
      updateTechnicianSalaryConfig(selectedEmployeeId, editingConfig);
    }
  };

  // Calculate totals for summary cards across all employees
  const monthlyStats = filteredEmployees.reduce((acc, emp) => {
    const earnings = getTechnicianMonthlyEarnings(emp.id, selectedMonth);
    return {
      totalPayroll: acc.totalPayroll + earnings.totalMonthlyEarnings,
      totalCommissions: acc.totalCommissions + earnings.totalCommissions,
      totalAllowance: acc.totalAllowance + earnings.totalAttendanceAllowance,
      totalBaseSalary: acc.totalBaseSalary + earnings.baseSalary,
      totalPositionAllowance: acc.totalPositionAllowance + (earnings.positionAllowance || 0),
      totalJobs: acc.totalJobs + earnings.completedJobsCount,
    };
  }, { 
    totalPayroll: 0, 
    totalCommissions: 0, 
    totalAllowance: 0, 
    totalBaseSalary: 0, 
    totalPositionAllowance: 0,
    totalJobs: 0 
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
            <Crown className="w-2.5 h-2.5" />
            Super Admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <ShieldCheck className="w-2.5 h-2.5" />
            Admin Operasional
          </span>
        );
      case 'TEKNISI':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Wrench className="w-2.5 h-2.5" />
            Teknisi Lapangan
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">
            Payroll, Allowance & Compensation System
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            SKEMA GAJI KARYAWAN
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Penggajian terpadu untuk Super Admin, Admin Operasional, dan Teknisi Lapangan.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap bg-white/5 p-1 rounded-2xl border border-white/10 gap-1">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'SUMMARY' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Rekap Bulanan
          </button>
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'CONFIG' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Atur Skema Gaji
          </button>
          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'STAFF' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Daftar Karyawan ({employees.length})
          </button>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Filter Divisi:</span>
        <button
          onClick={() => setRoleFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            roleFilter === 'ALL' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          Semua Staff ({employees.length})
        </button>
        <button
          onClick={() => setRoleFilter('SUPER_ADMIN')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            roleFilter === 'SUPER_ADMIN' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          Super Admin ({employees.filter(e => e.role === 'SUPER_ADMIN').length})
        </button>
        <button
          onClick={() => setRoleFilter('ADMIN')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            roleFilter === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          Admin Operasional ({employees.filter(e => e.role === 'ADMIN').length})
        </button>
        <button
          onClick={() => setRoleFilter('TEKNISI')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
            roleFilter === 'TEKNISI' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          Teknisi ({employees.filter(e => e.role === 'TEKNISI').length})
        </button>
      </div>

      {/* SUMMARY TAB */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* Top KPI Summary & Month Selector */}
          <div className="bg-white/5 p-4 sm:p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" />
                <span>Periode Penggajian & Komisi</span>
              </div>
              <p className="text-white/60 text-xs">
                Total beban penggajian untuk {filteredEmployees.length} karyawan pada periode terpilih.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/70">Pilih Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-black border border-white/20 rounded-xl text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-600/20 border border-blue-500/30 p-5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">
                Total Beban Gaji & Komisi
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1 tabular-nums">
                Rp {(monthlyStats.totalPayroll || 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-white/50 block mt-1">
                {filteredEmployees.length} Karyawan Aktif
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                Total Gaji Pokok & Tunjangan
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
                Rp {((monthlyStats.totalBaseSalary || 0) + (monthlyStats.totalPositionAllowance || 0)).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-white/50 block mt-1">
                Gaji Pokok + Tunjangan Jabatan
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                Total Uang Kehadiran GPS
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                Rp {(monthlyStats.totalAllowance || 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-white/50 block mt-1">
                Presensi Geotag Terverifikasi
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                Total Komisi Penugasan
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1 tabular-nums">
                Rp {(monthlyStats.totalCommissions || 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-white/50 block mt-1">
                Dari {monthlyStats.totalJobs} Proyek Selesai
              </span>
            </div>
          </div>

          {/* Employees Payroll List */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/60">
              Rincian Penggajian Karyawan ({selectedMonth})
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {filteredEmployees.map(emp => {
                const earnings = getTechnicianMonthlyEarnings(emp.id, selectedMonth);

                return (
                  <div
                    key={emp.id}
                    className="bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={emp.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-white">{emp.name}</h3>
                          {getRoleBadge(emp.role)}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          {emp.phone || emp.email} • {earnings.attendanceDays} Hari Hadir {emp.role === 'TEKNISI' ? `• ${earnings.completedJobsCount} Proyek Selesai` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Financial metrics breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-white/40 block text-[9px] uppercase font-bold">Gaji Pokok</span>
                        <span className="font-black text-white tabular-nums">
                          Rp {(earnings.baseSalary || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-white/40 block text-[9px] uppercase font-bold">Tunj. Jabatan</span>
                        <span className="font-black text-blue-300 tabular-nums">
                          Rp {(earnings.positionAllowance || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-white/40 block text-[9px] uppercase font-bold">Uang Hadir ({earnings.attendanceDays}x)</span>
                        <span className="font-black text-emerald-400 tabular-nums">
                          Rp {(earnings.totalAttendanceAllowance || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
                        <span className="text-blue-300 block text-[9px] uppercase font-bold">Total Diterima</span>
                        <span className="font-black text-white text-sm tabular-nums">
                          Rp {(earnings.totalMonthlyEarnings || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
                      <button
                        onClick={() => setSelectedEmployeeForSlip(emp)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Slip Gaji
                      </button>

                      <button
                        onClick={() => {
                          handleSelectEmployee(emp.id);
                          setActiveTab('CONFIG');
                        }}
                        className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Skema
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONFIG TAB */}
      {activeTab === 'CONFIG' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-black text-white">Pengaturan Skema Gaji & Tunjangan Karyawan</h3>
              <p className="text-xs text-white/50">
                Tentukan Gaji Pokok, Uang Kehadiran GPS, dan Tunjangan Jabatan untuk staf dan teknisi.
              </p>
            </div>

            {/* Select Target: Global or Specific Employee */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60 font-bold">Target Skema:</span>
              <select
                value={selectedEmployeeId}
                onChange={e => handleSelectEmployee(e.target.value)}
                className="px-4 py-2 bg-black border border-white/20 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="GLOBAL">🌐 Standar Global (Semua Karyawan)</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    👤 {e.name} ({e.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Banner: Commission per project */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold mb-0.5">Ketentuan Komisi Penugasan Proyek:</strong>
              Komisi pengerjaan tidak diatur dalam skema gaji umum ini. Komisi langsung ditentukan pada setiap penugasan proyek servis AC (misal porsi Teknisi Lead 25%, Asisten 15% dari total nilai jasa).
            </div>
          </div>

          {/* Toggle Features 3 Main Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Base Salary */}
            <div className={`p-5 rounded-2xl border transition ${editingConfig.enableBaseSalary ? 'bg-blue-600/10 border-blue-500/40' : 'bg-black/30 border-white/5'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-black text-sm text-white block">1. Gaji Pokok</span>
                  <span className="text-[10px] text-white/50">Kompensasi tetap per periode</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingConfig({ ...editingConfig, enableBaseSalary: !editingConfig.enableBaseSalary })}
                  className="text-2xl cursor-pointer"
                >
                  {editingConfig.enableBaseSalary ? <ToggleRight className="w-6 h-6 text-blue-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                </button>
              </div>

              {editingConfig.enableBaseSalary ? (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">Periode:</span>
                    <select
                      value={editingConfig.baseSalaryPeriod}
                      onChange={e => setEditingConfig({ ...editingConfig, baseSalaryPeriod: e.target.value as any })}
                      className="px-2 py-1 bg-black border border-white/20 rounded-lg text-xs font-bold text-white cursor-pointer"
                    >
                      <option value="BULANAN">Bulanan</option>
                      <option value="HARIAN">Harian</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 block mb-1">Nominal (Rp):</span>
                    <input
                      type="number"
                      step="50000"
                      value={editingConfig.baseSalaryAmount}
                      onChange={e => setEditingConfig({ ...editingConfig, baseSalaryAmount: Number(e.target.value) })}
                      className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-xs font-black text-white tabular-nums"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/40 italic mt-3">Skema gaji pokok dinonaktifkan.</p>
              )}
            </div>

            {/* Pillar 2: Attendance Allowance */}
            <div className={`p-5 rounded-2xl border transition ${editingConfig.enableAttendanceAllowance ? 'bg-blue-600/10 border-blue-500/40' : 'bg-black/30 border-white/5'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-black text-sm text-white block">2. Uang Kehadiran GPS</span>
                  <span className="text-[10px] text-white/50">Cair otomatis via Presensi Geotag</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingConfig({ ...editingConfig, enableAttendanceAllowance: !editingConfig.enableAttendanceAllowance })}
                  className="text-2xl cursor-pointer"
                >
                  {editingConfig.enableAttendanceAllowance ? <ToggleRight className="w-6 h-6 text-blue-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                </button>
              </div>

              {editingConfig.enableAttendanceAllowance ? (
                <div className="space-y-2 mt-3">
                  <span className="text-[10px] text-white/50 block">Uang Kehadiran Per Hari Hadir (Rp):</span>
                  <input
                    type="number"
                    step="5000"
                    value={editingConfig.attendanceAllowancePerDay}
                    onChange={e => setEditingConfig({ ...editingConfig, attendanceAllowancePerDay: Number(e.target.value) })}
                    className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-xs font-black text-white tabular-nums"
                  />
                  <span className="text-[10px] text-white/40 block">Tercatat saat karyawan Clock-in selfie dengan GPS.</span>
                </div>
              ) : (
                <p className="text-xs text-white/40 italic mt-3">Tidak ada tunjangan kehadiran harian.</p>
              )}
            </div>

            {/* Pillar 3: Position Allowance (Tunjangan Jabatan / Fungsional) */}
            <div className={`p-5 rounded-2xl border transition ${editingConfig.enablePositionAllowance ? 'bg-blue-600/10 border-blue-500/40' : 'bg-black/30 border-white/5'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-black text-sm text-white block">3. Tunjangan Jabatan</span>
                  <span className="text-[10px] text-white/50">Khusus Super Admin, Admin & Lead</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingConfig({ ...editingConfig, enablePositionAllowance: !editingConfig.enablePositionAllowance })}
                  className="text-2xl cursor-pointer"
                >
                  {editingConfig.enablePositionAllowance ? <ToggleRight className="w-6 h-6 text-blue-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                </button>
              </div>

              {editingConfig.enablePositionAllowance ? (
                <div className="space-y-2 mt-3">
                  <span className="text-[10px] text-white/50 block">Nominal Tunjangan Per Bulan (Rp):</span>
                  <input
                    type="number"
                    step="50000"
                    value={editingConfig.positionAllowanceAmount || 0}
                    onChange={e => setEditingConfig({ ...editingConfig, positionAllowanceAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-xs font-black text-white tabular-nums"
                  />
                  <span className="text-[10px] text-white/40 block">Diberikan secara bulanan untuk tanggung jawab manajerial/operasional.</span>
                </div>
              ) : (
                <p className="text-xs text-white/40 italic mt-3">Tunjangan jabatan dinonaktifkan.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-white/50">
              Pengaturan skema {selectedEmployeeId === 'GLOBAL' ? 'Standar Global' : `Khusus Karyawan Terpilih`} akan langsung tersinkron ke cloud.
            </span>
            <button
              onClick={handleSaveConfig}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan Skema
            </button>
          </div>
        </div>
      )}

      {/* STAFF / EMPLOYEES TAB */}
      {activeTab === 'STAFF' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => {
              const cfg = emp.technicianSalaryConfig || globalSalaryConfig;
              const earnings = getTechnicianMonthlyEarnings(emp.id, selectedMonth);

              return (
                <div key={emp.id} className="bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                        alt={emp.name} 
                        className="w-12 h-12 rounded-2xl object-cover border border-white/20" 
                      />
                      <div>
                        <h4 className="font-black text-white text-base">{emp.name}</h4>
                        {getRoleBadge(emp.role)}
                      </div>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/50">Skema Terpasang:</span>
                        <span className="font-bold text-white">
                          {emp.technicianSalaryConfig ? 'Khusus (Custom)' : 'Standar Global'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Gaji Pokok:</span>
                        <span className="font-bold text-white">
                          {cfg.enableBaseSalary ? `Rp ${(cfg.baseSalaryAmount || 0).toLocaleString('id-ID')}` : 'Tidak Ada'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Tunj. Jabatan:</span>
                        <span className="font-bold text-blue-300">
                          {cfg.enablePositionAllowance ? `Rp ${(cfg.positionAllowanceAmount || 0).toLocaleString('id-ID')}` : 'Tidak Ada'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Uang Hadir GPS:</span>
                        <span className="font-bold text-emerald-400">
                          {cfg.enableAttendanceAllowance ? `Rp ${(cfg.attendanceAllowancePerDay || 0).toLocaleString('id-ID')}/hr` : 'Tidak Ada'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl flex justify-between items-center text-xs">
                      <span className="text-blue-300 font-bold">Penghasilan Bulan Ini:</span>
                      <span className="font-black text-white text-sm tabular-nums">
                        Rp {(earnings.totalMonthlyEarnings || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        handleSelectEmployee(emp.id);
                        setActiveTab('CONFIG');
                      }}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Ubah Skema
                    </button>
                    <button
                      onClick={() => setSelectedEmployeeForSlip(emp)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      title="Cetak Slip Gaji"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedEmployeeForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/15 shadow-2xl space-y-6 text-white">
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">SLIP GAJI KARYAWAN</h3>
                <p className="text-xs text-white/50">{companyProfile.name} • Operation Management</p>
              </div>
              <button 
                onClick={() => setSelectedEmployeeForSlip(null)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between pb-3 border-b border-white/10">
                <div>
                  <p className="font-bold text-white text-sm">{selectedEmployeeForSlip.name}</p>
                  <div className="mt-0.5">{getRoleBadge(selectedEmployeeForSlip.role)}</div>
                  <p className="text-white/40 mt-1">{selectedEmployeeForSlip.phone || selectedEmployeeForSlip.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-white/60">Periode: {selectedMonth}</p>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    STATUS: SIAP DICAIRKAN
                  </span>
                </div>
              </div>

              {(() => {
                const earnings = getTechnicianMonthlyEarnings(selectedEmployeeForSlip.id, selectedMonth);
                return (
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Gaji Pokok:</span>
                      <span className="font-bold text-white tabular-nums">
                        Rp {(earnings.baseSalary || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {(earnings.positionAllowance || 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Tunjangan Jabatan / Fungsional:</span>
                        <span className="font-bold text-blue-300 tabular-nums">
                          Rp {(earnings.positionAllowance || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Uang Kehadiran GPS ({earnings.attendanceDays} hari hadir):</span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        Rp {(earnings.totalAttendanceAllowance || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {earnings.totalCommissions > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Komisi Penugasan Proyek ({earnings.completedJobsCount} unit AC):</span>
                        <span className="font-bold text-amber-400 tabular-nums">
                          Rp {(earnings.totalCommissions || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-3 border-t-2 border-white/20 text-sm mt-4">
                      <span className="font-black text-white uppercase">Total Take Home Pay:</span>
                      <span className="font-black text-emerald-400 text-lg tabular-nums">
                        Rp {(earnings.totalMonthlyEarnings || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
