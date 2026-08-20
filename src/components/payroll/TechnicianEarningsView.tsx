import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Coins, 
  Calendar, 
  TrendingUp, 
  Award, 
  Receipt,
  Printer,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const TechnicianEarningsView: React.FC = () => {
  const { 
    currentUser, 
    users,
    globalSalaryConfig,
    getTechnicianDailyEarnings, 
    getTechnicianMonthlyEarnings 
  } = useApp();

  const technicians = users.filter(u => u.role === 'TEKNISI');
  
  // If current user is a technician, use their ID; otherwise default to the first technician in the list
  const [selectedTechId, setSelectedTechId] = useState<string>(() => {
    if (currentUser.role === 'TEKNISI') return currentUser.id;
    return technicians[0]?.id || currentUser.id;
  });

  const activeTech = users.find(u => u.id === selectedTechId) || currentUser;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.slice(0, 7);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [viewMode, setViewMode] = useState<'DAILY' | 'MONTHLY'>('DAILY');

  const dailyData = getTechnicianDailyEarnings(activeTech.id, selectedDate);
  const monthlyData = getTechnicianMonthlyEarnings(activeTech.id, selectedMonth);

  const config = activeTech.technicianSalaryConfig || globalSalaryConfig;

  return (
    <div className="space-y-8 text-white">
      {/* Header with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">
            Daily & Monthly Income Transparency
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            PENGHASILAN TEKNISI
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* If admin, allow switching technician */}
          {currentUser.role !== 'TEKNISI' && technicians.length > 0 && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-white/60 font-bold">Pilih Teknisi:</span>
              <select
                value={selectedTechId}
                onChange={e => setSelectedTechId(e.target.value)}
                className="bg-black text-white text-xs font-bold px-2.5 py-1 rounded-xl border border-white/20 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setViewMode('DAILY')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                viewMode === 'DAILY' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              Rincian Harian
            </button>
            <button
              onClick={() => setViewMode('MONTHLY')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                viewMode === 'MONTHLY' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              Akumulasi Bulanan
            </button>
          </div>
        </div>
      </div>

      {/* Active Salary Scheme Badge - Electric Blue Highlight Card */}
      <div className="bg-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/20">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={activeTech.avatar} 
              alt={activeTech.name} 
              className="w-10 h-10 rounded-xl object-cover border border-white/30"
            />
            <div>
              <span className="px-2.5 py-0.5 bg-black/25 text-white rounded-full text-[10px] font-black uppercase tracking-wider block w-fit mb-0.5">
                Skema Penggajian Terpasang
              </span>
              <p className="text-sm font-black text-white">{activeTech.name} {activeTech.phone && `(${activeTech.phone})`}</p>
            </div>
          </div>
          
          <span className="text-xs text-white/80 font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
            {activeTech.technicianSalaryConfig ? '⚙️ Skema Khusus Individu' : '🌐 Skema Standar Global'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
            <span className="text-blue-100 block text-[10px] uppercase font-bold mb-1">1. Gaji Pokok</span>
            <span className="text-base font-black text-white">
              {config?.enableBaseSalary 
                ? `Rp ${(config.baseSalaryAmount || 0).toLocaleString('id-ID')} / ${config.baseSalaryPeriod?.toLowerCase() || 'bulan'}`
                : 'Tidak Aktif (Mitra Komisi)'}
            </span>
          </div>

          <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
            <span className="text-blue-100 block text-[10px] uppercase font-bold mb-1">2. Uang Kehadiran GPS</span>
            <span className="text-base font-black text-white">
              {config?.enableAttendanceAllowance 
                ? `Rp ${(config.attendanceAllowancePerDay || 0).toLocaleString('id-ID')} / hari hadir`
                : 'Tidak Aktif'}
            </span>
          </div>

          <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
            <span className="text-blue-100 block text-[10px] uppercase font-bold mb-1">3. Komisi Pengerjaan</span>
            <span className="text-base font-black text-amber-300">
              {config?.enableCommission
                ? config.commissionType === 'PERCENTAGE_OF_ORDER'
                  ? `${config.defaultCommissionPercentage}% Nilai Jasa Servis`
                  : 'Nominal Tetap per Kategori Unit'
                : 'Tidak Aktif'}
            </span>
          </div>
        </div>
      </div>

      {/* DAILY VIEW */}
      {viewMode === 'DAILY' && (
        <div className="space-y-6">
          {/* Date Selector & Total Earnings Today */}
          <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white/70">Pilih Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-black border border-white/20 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-right">
              <span className="text-[10px] text-white/40 uppercase font-bold block">Total Pendapatan Tanggal Ini:</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                Rp {(dailyData?.totalEarningsToday || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Daily Component KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Uang Kehadiran</p>
              <h3 className="text-xl font-black text-white mt-1 tabular-nums">
                Rp {(dailyData?.attendanceAllowance || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-white/50 block mt-0.5">
                {(dailyData?.attendanceAllowance || 0) > 0 ? '✓ Presensi GPS Tercatat' : 'Belum Absen Masuk'}
              </span>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Gaji Pokok Harian</p>
              <h3 className="text-xl font-black text-white mt-1 tabular-nums">
                Rp {(dailyData?.dailyBaseSalaryPortion || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-white/50 block mt-0.5">Porsi hari kerja</span>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Unit Servis Selesai</p>
              <h3 className="text-xl font-black text-blue-400 mt-1 tabular-nums">
                {dailyData?.jobsCompletedCount || 0} Unit
              </h3>
              <span className="text-[10px] text-white/50 block mt-0.5">Tuntas tanggal ini</span>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Komisi Servis</p>
              <h3 className="text-xl font-black text-amber-400 mt-1 tabular-nums">
                Rp {(dailyData?.totalJobCommissions || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-white/50 block mt-0.5">Cair langsung</span>
            </div>
          </div>

          {/* Daily Jobs Breakdown Table */}
          <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-xs text-white uppercase tracking-wider">
                Rincian Komisi Per Pekerjaan ({selectedDate})
              </h3>
              <span className="text-xs text-white/50">
                {dailyData?.jobBreakdown?.length || 0} pengerjaan tuntas
              </span>
            </div>

            {(!dailyData?.jobBreakdown || dailyData.jobBreakdown.length === 0) ? (
              <div className="p-8 text-center text-white/40 text-xs">
                Tidak ada pengerjaan servis yang diselesaikan pada tanggal {selectedDate}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-white/70 font-black uppercase tracking-wider text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">No. Order</th>
                      <th className="py-3 px-4">Nama Pelanggan</th>
                      <th className="py-3 px-4">Layanan</th>
                      <th className="py-3 px-4 text-right">Nilai Total Servis</th>
                      <th className="py-3 px-4 text-right">Komisi Teknisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dailyData.jobBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-mono font-black text-blue-400">{item.orderNumber}</td>
                        <td className="py-3 px-4 font-bold text-white">{item.customerName}</td>
                        <td className="py-3 px-4 text-white/70">{item.serviceNames}</td>
                        <td className="py-3 px-4 text-right font-medium text-white/60 tabular-nums">
                          Rp {(item.orderAmount || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-400 tabular-nums">
                          Rp {(item.commissionEarned || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/5 font-black border-t border-white/10">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right text-white">
                        Total Komisi Pekerjaan Hari Ini:
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-black text-base tabular-nums">
                        Rp {(dailyData.totalJobCommissions || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MONTHLY VIEW */}
      {viewMode === 'MONTHLY' && (
        <div className="space-y-6">
          <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white/70">Pilih Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-black border border-white/20 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-right">
              <span className="text-[10px] text-white/40 uppercase font-bold block">Total Take Home Pay ({selectedMonth}):</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                Rp {(monthlyData?.totalMonthlyEarnings || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Gaji Pokok</p>
              <h3 className="text-xl font-black text-white mt-1 tabular-nums">
                Rp {(monthlyData?.baseSalary || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-white/50 block mt-0.5">Kompensasi bulanan</span>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Total Uang Kehadiran GPS</p>
              <h3 className="text-xl font-black text-white mt-1 tabular-nums">
                Rp {(monthlyData?.totalAttendanceAllowance || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-white/50 block mt-0.5">{monthlyData?.attendanceDays || 0} Hari Hadir Terverifikasi</span>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Total Komisi Servis</p>
              <h3 className="text-xl font-black text-amber-400 mt-1 tabular-nums">
                Rp {(monthlyData?.totalCommissions || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-white/50 block mt-0.5">{monthlyData?.completedJobsCount || 0} Pekerjaan Selesai</span>
            </div>
          </div>

          {/* Daily Logs Table in this Month */}
          <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-xs text-white uppercase tracking-wider">
                Log Harian Pendapatan Bulan {selectedMonth}
              </h3>
              <span className="text-xs text-white/50">
                {monthlyData?.dailyLogs?.filter(d => (d.totalEarningsToday || 0) > 0).length || 0} hari kerja aktif
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-white/70 font-black uppercase tracking-wider text-[10px] border-b border-white/10 sticky top-0 bg-[#121212]">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-center">Presensi Hadir</th>
                    <th className="py-3 px-4 text-center">Unit Servis</th>
                    <th className="py-3 px-4 text-right">Uang Hadir</th>
                    <th className="py-3 px-4 text-right">Komisi Servis</th>
                    <th className="py-3 px-4 text-right">Gaji Pokok Porsi</th>
                    <th className="py-3 px-4 text-right">Total Hari Ini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(monthlyData?.dailyLogs || [])
                    .filter(d => (d.totalEarningsToday || 0) > 0 || (d.jobsCompletedCount || 0) > 0)
                    .map((log, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white">{log.date}</td>
                        <td className="py-3 px-4 text-center">
                          {(log.attendanceAllowance || 0) > 0 ? (
                            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">HADIR</span>
                          ) : (
                            <span className="text-[10px] text-white/40">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-blue-400">
                          {(log.jobsCompletedCount || 0) > 0 ? `${log.jobsCompletedCount} Unit` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-white/80">
                          Rp {(log.attendanceAllowance || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-amber-400">
                          Rp {(log.totalJobCommissions || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-white/60">
                          Rp {(log.dailyBaseSalaryPortion || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-black text-emerald-400">
                          Rp {(log.totalEarningsToday || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
