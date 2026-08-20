import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SalaryConfig, User } from '../../types';
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
  X
} from 'lucide-react';

export const PayrollManager: React.FC = () => {
  const { 
    users, 
    serviceCategories, 
    globalSalaryConfig, 
    updateGlobalSalaryConfig, 
    updateTechnicianSalaryConfig, 
    getTechnicianMonthlyEarnings 
  } = useApp();

  const technicians = users.filter(u => u.role === 'TEKNISI');

  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CONFIG' | 'TECHNICIANS'>('SUMMARY');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Config tab state
  const [selectedTechId, setSelectedTechId] = useState<string>('GLOBAL');
  const [editingConfig, setEditingConfig] = useState<SalaryConfig>(() => {
    return JSON.parse(JSON.stringify(globalSalaryConfig));
  });

  // Payslip modal state
  const [selectedTechForSlip, setSelectedTechForSlip] = useState<User | null>(null);

  // Sync editing config when technician selector changes
  const handleSelectTech = (id: string) => {
    setSelectedTechId(id);
    if (id === 'GLOBAL') {
      setEditingConfig(JSON.parse(JSON.stringify(globalSalaryConfig)));
    } else {
      const tech = technicians.find(t => t.id === id);
      const cfg = tech?.technicianSalaryConfig || globalSalaryConfig;
      setEditingConfig(JSON.parse(JSON.stringify(cfg)));
    }
  };

  const handleSaveConfig = () => {
    if (selectedTechId === 'GLOBAL') {
      updateGlobalSalaryConfig(editingConfig);
    } else {
      updateTechnicianSalaryConfig(selectedTechId, editingConfig);
    }
  };

  // Helper to update service category commission in array
  const handleServiceCommissionChange = (catId: string, catName: string, amount: number) => {
    const currentList = editingConfig.serviceCommissions || [];
    const index = currentList.findIndex(sc => sc.serviceCategoryId === catId);
    let updatedList = [...currentList];

    if (index >= 0) {
      updatedList[index] = {
        ...updatedList[index],
        commissionAmount: amount,
      };
    } else {
      updatedList.push({
        serviceCategoryId: catId,
        serviceCategoryName: catName,
        commissionAmount: amount,
      });
    }

    setEditingConfig({
      ...editingConfig,
      serviceCommissions: updatedList,
    });
  };

  const getServiceCommissionAmount = (catId: string, defaultAmount: number): number => {
    const found = editingConfig.serviceCommissions?.find(sc => sc.serviceCategoryId === catId);
    return found ? found.commissionAmount : defaultAmount;
  };

  // Calculate totals for summary cards
  const monthlyStats = technicians.reduce((acc, tech) => {
    const earnings = getTechnicianMonthlyEarnings(tech.id, selectedMonth);
    return {
      totalPayroll: acc.totalPayroll + earnings.totalMonthlyEarnings,
      totalCommissions: acc.totalCommissions + earnings.totalCommissions,
      totalAllowance: acc.totalAllowance + earnings.totalAttendanceAllowance,
      totalBaseSalary: acc.totalBaseSalary + earnings.baseSalary,
      totalJobs: acc.totalJobs + earnings.completedJobsCount,
    };
  }, { totalPayroll: 0, totalCommissions: 0, totalAllowance: 0, totalBaseSalary: 0, totalJobs: 0 });

  return (
    <div className="space-y-8 text-white">
      {/* Header with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">
            Compensation, Allowance & Commission Engine
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            SKEMA GAJI & KOMISI
          </h2>
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
            Atur Skema & Komisi
          </button>
          <button
            onClick={() => setActiveTab('TECHNICIANS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'TECHNICIANS' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Tim Teknisi ({technicians.length})
          </button>
        </div>
      </div>

      {/* SUMMARY TAB */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* Top KPI Summary & Month Selector */}
          <div className="bg-white/5 p-4 sm:p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" />
                <span>Periode Laporan Penggajian</span>
              </div>
              <p className="text-white/60 text-xs">
                Total beban gaji dan komisi teknisi untuk periode terpilih.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/70">Pilih Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-black border border-white/20 rounded-xl text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Untuk {technicians.length} Teknisi Aktif
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                Total Komisi Servis
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1 tabular-nums">
                Rp {(monthlyStats.totalCommissions || 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-white/50 block mt-1">
                {monthlyStats.totalJobs} Unit AC Tuntas
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                Total Uang Kehadiran GPS
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
                Rp {(monthlyStats.totalAllowance || 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-white/50 block mt-1">
                Presensi Geotag Terverifikasi
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                Total Gaji Pokok
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
                Rp {(monthlyStats.totalBaseSalary || 0).toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-white/50 block mt-1">
                Porsi Pokok Bulanan
              </span>
            </div>
          </div>

          {/* Technicians Payroll List */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/60">
              Rincian Penghasilan Per Teknisi ({selectedMonth})
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {technicians.map(tech => {
                const earnings = getTechnicianMonthlyEarnings(tech.id, selectedMonth);

                return (
                  <div
                    key={tech.id}
                    className="bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={tech.avatar}
                        alt={tech.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-white">{tech.name}</h3>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                            {tech.rating ? `★ ${tech.rating}` : '★ 5.0'}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          {tech.phone} • {earnings.completedJobsCount} Servis Tuntas • {earnings.attendanceDays} Hari Hadir
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
                        <span className="text-white/40 block text-[9px] uppercase font-bold">Uang Hadir ({earnings.attendanceDays}x)</span>
                        <span className="font-black text-white tabular-nums">
                          Rp {(earnings.totalAttendanceAllowance || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <span className="text-white/40 block text-[9px] uppercase font-bold">Komisi Servis ({earnings.completedJobsCount}x)</span>
                        <span className="font-black text-amber-400 tabular-nums">
                          Rp {(earnings.totalCommissions || 0).toLocaleString('id-ID')}
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
                        onClick={() => setSelectedTechForSlip(tech)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Slip Gaji
                      </button>
                      <button
                        onClick={() => {
                          handleSelectTech(tech.id);
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
              <h3 className="text-lg font-black text-white">Konfigurasi Skema Komisi Fleksibel</h3>
              <p className="text-xs text-white/50">
                Pilih kombinasi komponen penghasilan: Gaji Pokok, Uang Kehadiran GPS, Komisi Jasa Servis, atau Ketiganya.
              </p>
            </div>

            {/* Select Target: Global or Specific Tech */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60 font-bold">Target Skema:</span>
              <select
                value={selectedTechId}
                onChange={e => handleSelectTech(e.target.value)}
                className="px-4 py-2 bg-black border border-white/20 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="GLOBAL">🌐 Standar Global (Semua Teknisi)</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>👤 Khusus: {t.name}</option>
                ))}
              </select>
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
                      className="px-2 py-1 bg-black border border-white/20 rounded-lg text-xs font-bold text-white"
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
                <p className="text-xs text-white/40 italic mt-3">Skema gaji pokok dinonaktifkan (Mitra Komisi Penuh).</p>
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
                  <span className="text-[10px] text-white/40 block">Tercatat saat teknisi Clock-in dengan GPS.</span>
                </div>
              ) : (
                <p className="text-xs text-white/40 italic mt-3">Tidak ada tunjangan kehadiran harian.</p>
              )}
            </div>

            {/* Pillar 3: Commission */}
            <div className={`p-5 rounded-2xl border transition ${editingConfig.enableCommission ? 'bg-blue-600/10 border-blue-500/40' : 'bg-black/30 border-white/5'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-black text-sm text-white block">3. Komisi Pengerjaan Servis</span>
                  <span className="text-[10px] text-white/50">Insentif per unit AC yang tuntas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingConfig({ ...editingConfig, enableCommission: !editingConfig.enableCommission })}
                  className="text-2xl cursor-pointer"
                >
                  {editingConfig.enableCommission ? <ToggleRight className="w-6 h-6 text-blue-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                </button>
              </div>

              {editingConfig.enableCommission ? (
                <div className="space-y-2 mt-3">
                  <span className="text-[10px] text-white/50 block">Metode Perhitungan:</span>
                  <select
                    value={editingConfig.commissionType}
                    onChange={e => setEditingConfig({ ...editingConfig, commissionType: e.target.value as any })}
                    className="w-full p-2 bg-black border border-white/20 rounded-lg text-xs font-bold text-white"
                  >
                    <option value="NOMINAL_PER_SERVICE">Nominal Tetap Per Jenis Servis</option>
                    <option value="PERCENTAGE_OF_ORDER">Persentase Total Jasa Servis (%)</option>
                  </select>

                  {editingConfig.commissionType === 'PERCENTAGE_OF_ORDER' && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-white/60">Persen:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editingConfig.defaultCommissionPercentage}
                        onChange={e => setEditingConfig({ ...editingConfig, defaultCommissionPercentage: Number(e.target.value) })}
                        className="w-20 p-1.5 bg-black border border-white/20 rounded-lg text-xs font-black text-white text-center"
                      />
                      <span className="text-xs font-bold text-white">% dari total jasa</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-white/40 italic mt-3">Komisi servis dinonaktifkan.</p>
              )}
            </div>
          </div>

          {/* Commission Per Service Category Table */}
          {editingConfig.enableCommission && editingConfig.commissionType === 'NOMINAL_PER_SERVICE' && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-white">Tarif Komisi Nominal Per Kategori Pekerjaan</h4>
                  <p className="text-xs text-white/50">
                    Besaran komisi yang langsung diterima teknisi saat pengerjaan servis unit AC selesai.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {serviceCategories.map(cat => {
                  const amount = getServiceCommissionAmount(cat.id, cat.defaultCommission);

                  return (
                    <div key={cat.id} className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-black text-white">{cat.name}</p>
                        <p className="text-white/40 text-[11px]">Harga Standar: Rp {cat.basePrice.toLocaleString('id-ID')}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/60">Komisi: Rp</span>
                        <input
                          type="number"
                          step="5000"
                          value={amount}
                          onChange={e => handleServiceCommissionChange(cat.id, cat.name, Number(e.target.value))}
                          className="w-28 p-2 bg-black border border-white/20 rounded-xl text-xs font-black text-amber-400 text-right tabular-nums focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-white/50">
              Pengaturan skema {selectedTechId === 'GLOBAL' ? 'Standar Global' : `Khusus Teknisi`} akan langsung diterapkan.
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

      {/* TECHNICIANS TAB */}
      {activeTab === 'TECHNICIANS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map(tech => {
              const cfg = tech.technicianSalaryConfig || globalSalaryConfig;
              const earnings = getTechnicianMonthlyEarnings(tech.id, selectedMonth);

              return (
                <div key={tech.id} className="bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={tech.avatar} alt={tech.name} className="w-12 h-12 rounded-2xl object-cover border border-white/20" />
                      <div>
                        <h4 className="font-black text-white text-base">{tech.name}</h4>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                          {tech.specialization?.join(', ') || 'Semua Tipe AC'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/50">Skema Gaji:</span>
                        <span className="font-bold text-white">
                          {tech.technicianSalaryConfig ? 'Khusus (Custom)' : 'Standar Global'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Gaji Pokok:</span>
                        <span className="font-bold text-white">
                          {cfg.enableBaseSalary ? `Rp ${(cfg.baseSalaryAmount || 0).toLocaleString('id-ID')}` : 'Tidak Ada'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Uang Hadir GPS:</span>
                        <span className="font-bold text-white">
                          {cfg.enableAttendanceAllowance ? `Rp ${(cfg.attendanceAllowancePerDay || 0).toLocaleString('id-ID')}/hr` : 'Tidak Ada'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Komisi Servis:</span>
                        <span className="font-bold text-amber-400">
                          {cfg.enableCommission ? (cfg.commissionType === 'PERCENTAGE_OF_ORDER' ? `${cfg.defaultCommissionPercentage}% Jasa` : 'Nominal/Unit') : 'Tidak Ada'}
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
                        handleSelectTech(tech.id);
                        setActiveTab('CONFIG');
                      }}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Ubah Skema
                    </button>
                    <button
                      onClick={() => setSelectedTechForSlip(tech)}
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
      {selectedTechForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/15 shadow-2xl space-y-6 text-white">
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">SLIP GAJI & KOMISI TEKNISI</h3>
                <p className="text-xs text-white/50">KoolFix HVAC Operation Management System</p>
              </div>
              <button 
                onClick={() => setSelectedTechForSlip(null)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between pb-3 border-b border-white/10">
                <div>
                  <p className="font-bold text-white text-sm">{selectedTechForSlip.name}</p>
                  <p className="text-white/40">{selectedTechForSlip.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-white/60">Periode: {selectedMonth}</p>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    STATUS: SIAP DICAIRKAN
                  </span>
                </div>
              </div>

              {(() => {
                const earnings = getTechnicianMonthlyEarnings(selectedTechForSlip.id, selectedMonth);
                return (
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Gaji Pokok:</span>
                      <span className="font-bold text-white tabular-nums">
                        Rp {(earnings.baseSalary || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Uang Kehadiran GPS ({earnings.attendanceDays} hari hadir):</span>
                      <span className="font-bold text-white tabular-nums">
                        Rp {(earnings.totalAttendanceAllowance || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Total Komisi Pekerjaan ({earnings.completedJobsCount} unit AC):</span>
                      <span className="font-bold text-amber-400 tabular-nums">
                        Rp {(earnings.totalCommissions || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

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
