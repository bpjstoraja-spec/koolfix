import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceStatus } from '../../types';
import { ServiceOrderDetailModal } from './ServiceOrderDetailModal';
import { TechnicianJobExecutionModal } from './TechnicianJobExecutionModal';
import { InvoiceModal } from '../common/InvoiceModal';
import { QuickDispatchModal } from './QuickDispatchModal';
import { EditProjectModal } from './EditProjectModal';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Printer, 
  Star, 
  Wrench, 
  ChevronRight,
  PlusCircle,
  Building2,
  Home,
  UserCheck,
  Sparkles,
  AlertCircle,
  Trash2,
  Crown,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ServiceOrdersListProps {
  onOpenBookingModal: () => void;
}

export const ServiceOrdersList: React.FC<ServiceOrdersListProps> = ({ onOpenBookingModal }) => {
  const { currentUser, serviceOrders, submitCustomerReview, deleteServiceOrder } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<ServiceOrder | null>(null);
  const [selectedOrderForExecution, setSelectedOrderForExecution] = useState<ServiceOrder | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<ServiceOrder | null>(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<ServiceOrder | null>(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<ServiceOrder | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<ServiceOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);

  // Review form state
  const [rating, setRating] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [politeness, setPoliteness] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Unassigned incoming orders count
  const unassignedOrders = serviceOrders.filter(
    o => (o.status === 'MENUNGGU_KONFIRMASI' || !o.technicianId) && o.status !== 'DIBATALKAN'
  );

  // Role based filtering
  let filteredOrders = [...serviceOrders];

  if (currentUser.role === 'TEKNISI') {
    filteredOrders = filteredOrders.filter(o => 
      o.technicianId === currentUser.id || 
      o.assignedTechnicians?.some(t => t.technicianId === currentUser.id)
    );
  } else if (currentUser.role.startsWith('PELANGGAN')) {
    filteredOrders = filteredOrders.filter(o => o.customerId === currentUser.id || (currentUser.companyName && o.companyName === currentUser.companyName));
  }

  if (statusFilter !== 'ALL') {
    filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
  }

  if (typeFilter !== 'ALL') {
    filteredOrders = filteredOrders.filter(o => o.customerType === typeFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerAddress.toLowerCase().includes(q) ||
      (o.technicianName && o.technicianName.toLowerCase().includes(q)) ||
      (o.assignedTechnicians && o.assignedTechnicians.some(t => t.technicianName.toLowerCase().includes(q)))
    );
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;

    submitCustomerReview(selectedOrderForReview.id, {
      customerId: currentUser.id,
      customerName: currentUser.name,
      technicianId: selectedOrderForReview.technicianId || 'usr-tek-1',
      rating,
      cleanlinessRating: cleanliness,
      punctualityRating: punctuality,
      politenessRating: politeness,
      comment: reviewComment || 'Pekerjaan servis AC sangat memuaskan, dingin kembali dan teknisi ramah.',
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // safe
    }

    setSelectedOrderForReview(null);
    setReviewComment('');
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'MENUNGGU_KONFIRMASI':
        return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-black text-[10px] uppercase tracking-wider">Menunggu</span>;
      case 'DITUGASKAN':
        return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full font-black text-[10px] uppercase tracking-wider">Ditugaskan</span>;
      case 'DALAM_PERJALANAN':
        return <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full font-black text-[10px] uppercase tracking-wider">OTW Lokasi</span>;
      case 'SEDANG_DIKERJAKAN':
        return <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full font-black text-[10px] uppercase tracking-wider animate-pulse">On Site</span>;
      case 'SELESAI':
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-black text-[10px] uppercase tracking-wider">Selesai</span>;
      case 'DIBATALKAN':
        return <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-black text-[10px] uppercase tracking-wider">Batal</span>;
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header section with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold mb-1">
            {currentUser.role === 'TEKNISI' 
              ? 'Tugas Lapangan' 
              : currentUser.role.startsWith('PELANGGAN')
              ? 'Riwayat & Faktur'
              : 'Manajemen Servis'}
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            {currentUser.role === 'TEKNISI' 
              ? 'DAFTAR TUGAS' 
              : currentUser.role.startsWith('PELANGGAN')
              ? 'RIWAYAT SERVIS'
              : 'JADWAL & SERVIS'}
          </h2>
        </div>

        <button
          onClick={onOpenBookingModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          {currentUser.role.startsWith('PELANGGAN') ? 'Pesan Servis' : 'Order Baru'}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari no order, nama pelanggan, alamat, atau nama teknisi..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL" className="bg-[#121212]">Semua Kategori</option>
              <option value="UMUM" className="bg-[#121212]">Pelanggan Rumah (Umum)</option>
              <option value="KANTOR" className="bg-[#121212]">Perusahaan / Kantor</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pt-1 border-t border-white/5 pb-1">
          {[
            { id: 'ALL', label: 'SEMUA STATUS' },
            ...(isSuperOrAdmin ? [{ id: 'MENUNGGU_KONFIRMASI', label: `PERLU PENUGASAN ${unassignedOrders.length > 0 ? `(${unassignedOrders.length})` : ''}` }] : [{ id: 'MENUNGGU_KONFIRMASI', label: 'MENUNGGU' }]),
            { id: 'DITUGASKAN', label: 'DITUGASKAN' },
            { id: 'SEDANG_DIKERJAKAN', label: 'SEDANG DIKERJAKAN' },
            { id: 'SELESAI', label: 'SELESAI' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer shrink-0 text-nowrap ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Attention Banner for Incoming Unassigned Orders */}
      {isSuperOrAdmin && unassignedOrders.length > 0 && statusFilter !== 'MENUNGGU_KONFIRMASI' && (
        <div className="bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-transparent border border-blue-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-white text-xs">
                Ada {unassignedOrders.length} Pesanan Masuk Menunggu Penugasan Teknisi
              </p>
              <p className="text-[11px] text-white/60">
                Pilih teknisi yang tersedia berdasarkan spesifikasi unit, jarak, dan beban kerja hari ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setStatusFilter('MENUNGGU_KONFIRMASI')}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Lihat Semua
            </button>
            <button
              onClick={() => setSelectedOrderForDispatch(unassignedOrders[0])}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tugaskan Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/10">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3 text-2xl font-black">
            ❄
          </div>
          <h3 className="font-black text-white text-base">Tidak Ada Pesanan Ditemukan</h3>
          <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
            Tidak ada riwayat servis yang sesuai dengan filter atau kata kunci pencarian saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map(order => {
            const isAssignedToCurrentTech = currentUser.id === order.technicianId || 
              order.assignedTechnicians?.some(t => t.technicianId === currentUser.id);
            const canReview = currentUser.role.startsWith('PELANGGAN') && order.status === 'SELESAI' && !order.review;

            const myCommission = currentUser.role === 'TEKNISI' 
              ? (order.assignedTechnicians?.find(t => t.technicianId === currentUser.id)?.commissionEarned ?? order.technicianCommissionEarned)
              : undefined;

            return (
              <div
                key={order.id}
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition space-y-4"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${order.customerType === 'KANTOR' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                      {order.customerType === 'KANTOR' ? <Building2 className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base tracking-tight">{order.orderNumber}</span>
                        {order.companyName && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                            {order.companyName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 mt-0.5">
                        Pemesan: <span className="font-bold text-white">{order.customerName}</span> • Telp: {order.customerPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {getStatusBadge(order.status)}
                    <span className="text-sm font-black text-white bg-white/10 px-3 py-1 rounded-xl border border-white/10 tabular-nums">
                      Rp {(order.grandTotal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/70">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Jadwal Servis</p>
                    <p className="flex items-center gap-1.5 text-white font-bold">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {order.scheduledDate} ({order.scheduledTimeSlot} WIB)
                    </p>
                    <p className="flex items-start gap-1.5 text-white/60 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.customerAddress}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Item Layanan</p>
                    <div className="space-y-0.5">
                      {order.serviceItems.map((item, idx) => (
                        <p key={idx} className="font-bold text-white">
                          • {item.categoryName} <span className="text-white/50 font-normal">({item.unitCount} unit)</span>
                        </p>
                      ))}
                      {order.sparePartsUsed && order.sparePartsUsed.length > 0 && (
                        <p className="text-amber-400 font-bold">
                          + {order.sparePartsUsed.length} suku cadang terpasang
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Teknisi Bertugas {order.assignedTechnicians && order.assignedTechnicians.length > 1 ? `(${order.assignedTechnicians.length} Orang)` : ''}
                    </p>
                    {order.assignedTechnicians && order.assignedTechnicians.length > 0 ? (
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {order.assignedTechnicians.map((at, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                at.roleInJob === 'LEAD'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {at.technicianName} ({at.roleInJob === 'LEAD' ? 'Lead' : 'Asisten'})
                            </span>
                          ))}
                        </div>
                        {currentUser.role === 'TEKNISI' && myCommission !== undefined && (
                          <p className="text-emerald-400 font-black text-[11px] mt-1">
                            Porsi Komisi Anda: Rp {myCommission.toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    ) : order.technicianName ? (
                      <div>
                        <p className="font-bold text-white">{order.technicianName}</p>
                        <p className="text-white/50">{order.technicianPhone}</p>
                        {currentUser.role === 'TEKNISI' && order.technicianCommissionEarned !== undefined && (
                          <p className="text-emerald-400 font-black mt-0.5">
                            Komisi Anda: Rp {(order.technicianCommissionEarned || 0).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-amber-400 font-medium italic">Belum ada teknisi yang ditugaskan</p>
                    )}
                  </div>
                </div>

                {/* Review summary if already reviewed */}
                {order.review && (
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-black">{'★'.repeat(order.review.rating)}</span>
                      <span className="text-white/80 italic">"{order.review.comment}"</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Ulasan Pelanggan</span>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setSelectedOrderForDetail(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Lihat Rincian & Laporan
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Admin Direct Dispatch or Change Technician Button */}
                    {isSuperOrAdmin && order.status !== 'SELESAI' && order.status !== 'DIBATALKAN' && (
                      <button
                        onClick={() => setSelectedOrderForDispatch(order)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                          !order.technicianId || order.status === 'MENUNGGU_KONFIRMASI'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-300" />
                        {!order.technicianId || order.status === 'MENUNGGU_KONFIRMASI'
                          ? 'Pilih & Tugaskan Teknisi'
                          : 'Kelola Tim Teknisi'}
                      </button>
                    )}

                    {/* Invoice button */}
                    <button
                      id={`btn-invoice-${order.id}`}
                      onClick={() => setSelectedOrderForInvoice(order)}
                      title="Buka Faktur, Cetak, Unduh PDF & Share WhatsApp"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Faktur & PDF</span>
                    </button>

                    {/* Customer Review Button */}
                    {canReview && (
                      <button
                        onClick={() => setSelectedOrderForReview(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" />
                        Beri Ulasan
                      </button>
                    )}

                    {/* Technician Execution Button */}
                    {isAssignedToCurrentTech && order.status !== 'SELESAI' && (
                      <button
                        onClick={() => setSelectedOrderForExecution(order)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-600/30"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Update Selesai
                      </button>
                    )}
                    {/* Super Admin / Admin Edit Project Button */}
                    {isSuperOrAdmin && (
                      <button
                        id={`btn-edit-order-${order.id}`}
                        onClick={() => setSelectedOrderForEdit(order)}
                        title="Edit Data Proyek / Order (Super Admin)"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Proyek</span>
                      </button>
                    )}

                    {/* Super Admin Quick Delete Button */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => setOrderToDelete(order)}
                        title="Hapus Proyek / Pesanan (Super Admin)"
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Order Confirmation Dialog for Super Admin */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#181818] border border-red-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Hapus Proyek / Pesanan?</h3>
                <p className="text-xs text-white/60 font-mono">#{orderToDelete.orderNumber} - {orderToDelete.customerName}</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Sebagai Super Admin, Anda dapat menghapus proyek ini secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteServiceOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedOrderForDetail && (
        <ServiceOrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          onOpenExecution={() => {
            setSelectedOrderForExecution(selectedOrderForDetail);
            setSelectedOrderForDetail(null);
          }}
        />
      )}

      {selectedOrderForExecution && (
        <TechnicianJobExecutionModal
          order={selectedOrderForExecution}
          onClose={() => setSelectedOrderForExecution(null)}
        />
      )}

      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {selectedOrderForDispatch && (
        <QuickDispatchModal
          order={selectedOrderForDispatch}
          onClose={() => setSelectedOrderForDispatch(null)}
        />
      )}

      {/* Customer Review Modal */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] rounded-3xl p-6 max-w-md w-full border border-white/15 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Ulasan & Rating Teknisi</h3>
                  <p className="text-[11px] text-white/50">Teknisi: {selectedOrderForReview.technicianName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForReview(null)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Overall Star Rating */}
              <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/10">
                <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-2">
                  Penilaian Kepuasan
                </label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-3xl hover:scale-125 transition transform cursor-pointer"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub parameters */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Kerapian & Kebersihan:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setCleanliness(s)}
                        className={`w-7 h-7 rounded-lg font-black text-xs ${s <= cleanliness ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/70">Ketepatan Waktu:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setPunctuality(s)}
                        className={`w-7 h-7 rounded-lg font-black text-xs ${s <= punctuality ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/70">Keramahan & Komunikasi:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setPoliteness(s)}
                        className={`w-7 h-7 rounded-lg font-black text-xs ${s <= politeness ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1">
                  Komentar & Catatan Ulasan
                </label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Ceritakan pengalaman servis Anda..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForReview(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Kirim Ulasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Edit Project Modal */}
      {selectedOrderForEdit && (
        <EditProjectModal
          order={selectedOrderForEdit}
          onClose={() => setSelectedOrderForEdit(null)}
        />
      )}
    </div>
  );
};
