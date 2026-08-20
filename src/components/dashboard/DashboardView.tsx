import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wrench, 
  Clock, 
  MapPin, 
  Boxes, 
  Coins, 
  TrendingUp, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  Home
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenBookingModal: () => void;
  onOpenJobDetail: (orderId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenBookingModal,
  onOpenJobDetail,
}) => {
  const { 
    currentUser, 
    serviceOrders, 
    inventory, 
    financialTransactions, 
    attendanceRecords,
    getTechnicianDailyEarnings,
  } = useApp();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  // Date formatting for bold typography header
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const formattedDay = `${today.getDate()} ${monthNames[today.getMonth()]}`;
  const formattedSubtitle = `${dayNames[today.getDay()]}, ${today.getFullYear()}`;

  // Role checks
  const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isTechnician = currentUser.role === 'TEKNISI';
  const isCustomer = currentUser.role.startsWith('PELANGGAN');

  // Stats
  const activeOrders = serviceOrders.filter(o => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN');
  const completedOrders = serviceOrders.filter(o => o.status === 'SELESAI');
  const lowStockItems = inventory.filter(i => i.stock <= i.minStockThreshold);
  const onlineTechnicians = attendanceRecords.filter(a => a.date === todayStr && !a.clockOutTime);

  // Monthly Revenue & Expense
  const monthlyRevenue = financialTransactions
    .filter(t => t.type === 'PEMASUKAN' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = financialTransactions
    .filter(t => t.type === 'PENGELUARAN' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = monthlyRevenue - monthlyExpense;

  // Technician Specific data
  const techTodayEarnings = getTechnicianDailyEarnings(currentUser.id, todayStr);
  const techAssignedOrders = serviceOrders.filter(
    o => (o.technicianId === currentUser.id || o.assignedTechnicians?.some(t => t.technicianId === currentUser.id)) && 
    o.status !== 'SELESAI' && 
    o.status !== 'DIBATALKAN'
  );

  // Customer Specific data
  const customerOrders = serviceOrders.filter(
    o => o.customerId === currentUser.id || (currentUser.companyName && o.companyName === currentUser.companyName)
  );
  const customerActiveOrder = customerOrders.find(o => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN');

  return (
    <div className="space-y-8 text-white">
      {/* Header matching Bold Typography Theme */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">
            {isSuperOrAdmin ? 'Overview Harian & Operasional' : isTechnician ? 'Tugas & Kinerja Lapangan' : 'Portal Layanan Servis'}
          </p>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none text-white">
            {isSuperOrAdmin ? 'OPERASIONAL' : isTechnician ? 'PENUGASAN' : 'LAYANAN AC'}
          </h2>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-white">{formattedDay}</p>
          <p className="text-xs text-white/40 font-medium tracking-wide">{formattedSubtitle}</p>
        </div>
      </header>

      {/* ================= SUPER ADMIN & ADMIN DASHBOARD ================= */}
      {isSuperOrAdmin && (
        <>
          {/* Top 3 Stat Cards in Frosted Dark Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                  Pesanan Servis Aktif
                </p>
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2 tabular-nums">
                  {String(activeOrders.length).padStart(2, '0')}
                </h3>
              </div>
              <div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (activeOrders.length / (serviceOrders.length || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/60 flex items-center justify-between">
                  <span>{completedOrders.length} servis tuntas</span>
                  <span className="text-blue-400 font-bold">Bulan Ini</span>
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                  Teknisi On-Duty (GPS)
                </p>
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2 tabular-nums">
                  {String(onlineTechnicians.length).padStart(2, '0')}
                </h3>
              </div>
              <div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${onlineTechnicians.length > 0 ? 85 : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/60 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Presensi Geotag Aktif
                  </span>
                  <span className="text-emerald-400 font-bold">Terverifikasi</span>
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                  Arus Kas Bersih (Bulan Ini)
                </p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 tabular-nums">
                  Rp {netProfit.toLocaleString('id-ID')}
                </h3>
              </div>
              <div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                  <div className="bg-blue-500 h-full rounded-full w-3/4" />
                </div>
                <p className="text-[11px] text-white/60 flex items-center justify-between">
                  <span>Masuk: Rp {monthlyRevenue.toLocaleString('id-ID')}</span>
                  <span className="text-blue-400 font-bold">Real-time</span>
                </p>
              </div>
            </div>
          </div>

          {/* Core Content Grid: High-Contrast Stark White Card & Highlight Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* High-Impact Stark White Card for Active Schedule */}
            <div className="lg:col-span-2 bg-white text-black p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.25em] text-black/50 font-bold block mb-0.5">
                      Operational Schedule
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-black">
                      JADWAL PENGERJAAN
                    </h3>
                  </div>
                  <span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-black tracking-wider uppercase">
                    {activeOrders.length} AKTIF
                  </span>
                </div>

                {/* List Items */}
                <div className="divide-y divide-black/10">
                  {serviceOrders.slice(0, 4).map(order => {
                    const isPending = order.status === 'MENUNGGU_KONFIRMASI';
                    const isProgress = order.status === 'DALAM_PENGERJAAN' || order.status === 'MENUJU_LOKASI';
                    const isDone = order.status === 'SELESAI';

                    return (
                      <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-600">{order.orderNumber}</span>
                            <span className="font-black text-sm text-black truncate">{order.customerName}</span>
                            <span className="text-[10px] font-bold bg-black/5 text-black px-2 py-0.5 rounded">
                              {order.customerType === 'KANTOR' ? '🏢 B2B' : '🏠 Rumah'}
                            </span>
                          </div>
                          <p className="text-xs text-black/60 font-medium">
                            {order.scheduledDate} • {order.scheduledTimeSlot} WIB • Teknisi: <span className="font-bold text-black">{order.technicianName || 'Belum Ditugaskan'}</span>
                          </p>
                          <p className="text-[11px] text-black/40 truncate max-w-md">{order.customerAddress}</p>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                          <span className="font-black text-xs text-black tabular-nums">
                            Rp {order.grandTotal.toLocaleString('id-ID')}
                          </span>
                          {isPending && (
                            <span className="text-[9px] font-black border-2 border-black px-2.5 py-1 uppercase tracking-wider">
                              MENUNGGU
                            </span>
                          )}
                          {isProgress && (
                            <span className="text-[9px] font-black bg-blue-600 text-white px-2.5 py-1 uppercase tracking-wider">
                              ON SITE
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-2.5 py-1 uppercase tracking-wider">
                              SELESAI
                            </span>
                          )}
                          <button
                            onClick={() => onOpenJobDetail(order.id)}
                            className="px-3 py-1 bg-black text-white hover:bg-black/80 rounded-lg text-xs font-black transition cursor-pointer"
                          >
                            DETAIL
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/10 flex justify-between items-center">
                <span className="text-xs font-bold text-black/60">Semua pesanan tersinkronisasi otomatis</span>
                <button
                  onClick={() => onNavigateTab('services')}
                  className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                >
                  Buka Seluruh Jadwal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Side: Electric Blue Highlight & Geotag Status Cards */}
            <div className="flex flex-col gap-6">
              {/* Electric Blue Highlight Card: Quick Payroll & Commission Engine */}
              <div className="bg-blue-600 p-6 rounded-3xl text-white flex flex-col justify-between shadow-xl shadow-blue-600/20">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-black tracking-widest uppercase text-blue-100">
                      KOMISI & PENGGAJIAN
                    </h4>
                    <Coins className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="text-3xl font-black tracking-tight mb-1 tabular-nums">
                    Rp {monthlyExpense.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-blue-100 font-medium">
                    Total alokasi gaji pokok, komisi pengerjaan, dan kehadiran teknisi bulan ini.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('payroll')}
                  className="mt-6 w-full py-2.5 bg-black hover:bg-black/80 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Kelola Skema Gaji
                </button>
              </div>

              {/* Frosted Geotag & Suku Cadang Alert Card */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black tracking-widest text-white/40 uppercase">
                      INVENTARIS & SUKU CADANG
                    </h4>
                    {lowStockItems.length > 0 ? (
                      <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        {lowStockItems.length} RESTOCK
                      </span>
                    ) : (
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        STOK AMAN
                      </span>
                    )}
                  </div>

                  {lowStockItems.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {lowStockItems.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                          <span className="font-bold text-white/80 truncate">{item.name}</span>
                          <span className="font-black text-red-400 tabular-nums">Sisa {item.stock} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/60 leading-relaxed mb-4">
                      Seluruh 5 kategori suku cadang (Freon, Kapasitor, Pipa Tembaga, Modul PCB) berada di atas batas minimum.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => onNavigateTab('inventory')}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition text-center cursor-pointer"
                  >
                    Inventaris
                  </button>
                  <button
                    onClick={() => onNavigateTab('attendance')}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition text-center cursor-pointer"
                  >
                    Presensi GPS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= TECHNICIAN DASHBOARD ================= */}
      {isTechnician && (
        <div className="space-y-6">
          {/* Daily Earnings Card - Electric Blue Highlight */}
          <div className="bg-blue-600 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-600/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/20">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                  Estimasi Penghasilan Hari Ini ({todayStr})
                </span>
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1 tabular-nums">
                  Rp {techTodayEarnings.totalEarningsToday.toLocaleString('id-ID')}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('technician_earnings')}
                className="px-5 py-2.5 bg-black hover:bg-black/80 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer self-start sm:self-auto"
              >
                Rincian & Slip Gaji
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
              <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                <span className="text-white/70 block text-[10px] uppercase tracking-wider font-bold mb-1">
                  Uang Kehadiran GPS
                </span>
                <span className="text-xl font-black text-white tabular-nums">
                  Rp {techTodayEarnings.attendanceAllowance.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                <span className="text-white/70 block text-[10px] uppercase tracking-wider font-bold mb-1">
                  Komisi Servis Selesai
                </span>
                <span className="text-xl font-black text-amber-300 tabular-nums">
                  Rp {techTodayEarnings.totalJobCommissions.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                <span className="text-white/70 block text-[10px] uppercase tracking-wider font-bold mb-1">
                  Total AC Dituntaskan
                </span>
                <span className="text-xl font-black text-white tabular-nums">
                  {techTodayEarnings.jobsCompletedCount} Unit
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Tasks in High-Impact Stark White Card */}
          <div className="bg-white text-black p-6 sm:p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-black/50 font-bold block mb-0.5">
                  Field Assignment
                </span>
                <h3 className="text-xl font-black tracking-tight text-black">
                  TUGAS SERVIS AC ANDA
                </h3>
              </div>
              <span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-black">
                {techAssignedOrders.length} TUGAS
              </span>
            </div>

            {techAssignedOrders.length === 0 ? (
              <div className="p-8 text-center bg-black/5 rounded-2xl text-xs text-black/60 font-medium">
                Tidak ada tugas servis aktif saat ini. Anda dapat melakukan presensi kehadiran atau menunggu tugas baru.
              </div>
            ) : (
              <div className="space-y-3">
                {techAssignedOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border-2 border-black/10 hover:border-black transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-600 text-xs">{order.orderNumber}</span>
                        <span className="font-black text-black text-sm">{order.customerName}</span>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-black/70 font-medium">
                        <Clock className="w-3.5 h-3.5 text-black/50" />
                        {order.scheduledDate} ({order.scheduledTimeSlot} WIB)
                      </p>
                      <p className="flex items-start gap-1.5 text-[11px] text-black/50">
                        <MapPin className="w-3.5 h-3.5 text-black/50 shrink-0 mt-0.5" />
                        {order.customerAddress}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenJobDetail(order.id)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
                    >
                      Buka & Update Pengerjaan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CUSTOMER DASHBOARD ================= */}
      {isCustomer && (
        <div className="space-y-6">
          {/* Active Job Tracking */}
          {customerActiveOrder ? (
            <div className="bg-white text-black p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-3 py-1 rounded-full">
                  Status Servis Aktif Anda
                </span>
                <span className="font-mono text-xs font-black text-black/60">
                  {customerActiveOrder.orderNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs py-4 border-y border-black/10">
                <div>
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Jadwal Kedatangan</span>
                  <p className="font-black text-black text-sm mt-0.5">
                    {customerActiveOrder.scheduledDate} ({customerActiveOrder.scheduledTimeSlot} WIB)
                  </p>
                </div>
                <div>
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Teknisi Bertugas</span>
                  <p className="font-black text-black text-sm mt-0.5">
                    {customerActiveOrder.technicianName || 'Sedang Dipersiapkan Admin'}
                  </p>
                </div>
                <div>
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Status Pengerjaan</span>
                  <p className="font-black text-blue-600 text-sm mt-0.5 uppercase">
                    {customerActiveOrder.status.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => onOpenJobDetail(customerActiveOrder.id)}
                  className="px-5 py-2.5 bg-black hover:bg-black/80 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Detail & Lacak Teknisi
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-4">
              <h3 className="text-2xl font-black text-white">Butuh Servis atau Perbaikan AC Hari Ini?</h3>
              <p className="text-xs text-white/60 max-w-lg mx-auto leading-relaxed">
                Teknisi profesional kami siap melayani cuci AC, tambah freon R32/R410/R22, perbaikan kompresor, dan kontrak perawatan berkala kantor.
              </p>
              <button
                onClick={onOpenBookingModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Pesan Servis AC Sekarang
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
