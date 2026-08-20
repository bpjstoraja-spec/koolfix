import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceStatus } from '../../types';
import { InvoiceModal } from '../common/InvoiceModal';
import { QuickDispatchModal } from './QuickDispatchModal';
import { EditProjectModal } from './EditProjectModal';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Printer, 
  Wrench, 
  Gauge, 
  Boxes, 
  Camera, 
  CheckCircle2,
  AlertCircle,
  Users,
  Crown,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Image as ImageIcon,
  ZoomIn,
  DollarSign,
  FileText,
  CreditCard,
  Building,
  Check,
  Ban,
  Trash2,
  Edit3,
  Save,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ServiceOrderDetailModalProps {
  order: ServiceOrder;
  onClose: () => void;
  onOpenExecution?: () => void;
}

export const ServiceOrderDetailModal: React.FC<ServiceOrderDetailModalProps> = ({ 
  order, 
  onClose,
  onOpenExecution
}) => {
  const { 
    currentUser, 
    users, 
    attendanceRecords, 
    verifyOrderPayment,
    deleteServiceOrder,
    updateServiceOrder,
    updateTechnicalReport,
    deleteTechnicalReport
  } = useApp();

  const [showInvoice, setShowInvoice] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Super Admin Action Modals & Forms
  const [showDeleteOrderConfirm, setShowDeleteOrderConfirm] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showEditReportModal, setShowEditReportModal] = useState(false);
  const [showDeleteReportConfirm, setShowDeleteReportConfirm] = useState(false);

  // Edit Order Form State
  const [editCustomerName, setEditCustomerName] = useState(order.customerName);
  const [editCustomerPhone, setEditCustomerPhone] = useState(order.customerPhone);
  const [editCustomerAddress, setEditCustomerAddress] = useState(order.customerAddress);
  const [editCustomerType, setEditCustomerType] = useState(order.customerType);
  const [editScheduledDate, setEditScheduledDate] = useState(order.scheduledDate);
  const [editScheduledTimeSlot, setEditScheduledTimeSlot] = useState(order.scheduledTimeSlot);
  const [editStatus, setEditStatus] = useState<ServiceStatus>(order.status);
  const [editPaymentStatus, setEditPaymentStatus] = useState(order.paymentStatus);
  const [editGrandTotal, setEditGrandTotal] = useState(order.grandTotal);
  const [editCustomerNotes, setEditCustomerNotes] = useState(order.customerNotes || '');

  // Edit Technical Report Form State
  const [editInitialFreon, setEditInitialFreon] = useState(order.technicalReport?.initialFreonPressurePsi ?? 60);
  const [editFinalFreon, setEditFinalFreon] = useState(order.technicalReport?.finalFreonPressurePsi ?? 140);
  const [editAmpere, setEditAmpere] = useState(order.technicalReport?.ampereReading ?? 3.8);
  const [editTemp, setEditTemp] = useState(order.technicalReport?.finalTempCelsius ?? 18);
  const [editIndoorClean, setEditIndoorClean] = useState(order.technicalReport?.cleaningDoneIndoor ?? true);
  const [editOutdoorClean, setEditOutdoorClean] = useState(order.technicalReport?.cleaningDoneOutdoor ?? true);
  const [editDrainCheck, setEditDrainCheck] = useState(order.technicalReport?.drainageChecked ?? true);
  const [editElecCheck, setEditElecCheck] = useState(order.technicalReport?.electricalChecked ?? true);
  const [editReportNotes, setEditReportNotes] = useState(order.technicalReport?.notes || '');
  const [editRecommendations, setEditRecommendations] = useState(order.technicalReport?.recommendations || '');

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isAssignedTech = order.technicianId === currentUser.id || 
    order.assignedTechnicians?.some(t => t.technicianId === currentUser.id);

  // Active technicians on this order
  const assignedList = order.assignedTechnicians && order.assignedTechnicians.length > 0
    ? order.assignedTechnicians
    : (order.technicianId ? [{
        technicianId: order.technicianId,
        technicianName: order.technicianName || 'Teknisi Utama',
        technicianPhone: order.technicianPhone || '',
        roleInJob: 'LEAD' as const,
        commissionSharePercent: 100,
        commissionEarned: order.technicianCommissionEarned || 0,
      }] : []);

  // Find attendance records & authentic photos for technicians assigned on this job
  const todayStr = new Date().toISOString().split('T')[0];
  const technicianAttendances = assignedList.map(tech => {
    const userObj = users.find(
      u => u.id === tech.technicianId || 
           (u.name && tech.technicianName && u.name.trim().toLowerCase() === tech.technicianName.trim().toLowerCase())
    );

    // Search attendance records for this technician
    const techRecords = attendanceRecords.filter(a =>
      a.technicianId === tech.technicianId ||
      (userObj && a.technicianId === userObj.id) ||
      (a.technicianName && tech.technicianName && a.technicianName.trim().toLowerCase() === tech.technicianName.trim().toLowerCase())
    );

    // Prioritize attendance matching scheduled job date with photo, or today with photo, or any record with photo
    const matchAttendance = 
      techRecords.find(a => (a.date === order.scheduledDate || a.date === order.createdAt?.split(' ')[0]) && !!a.clockInPhoto) ||
      techRecords.find(a => a.date === todayStr && !!a.clockInPhoto) ||
      techRecords.find(a => !!a.clockInPhoto) ||
      techRecords.find(a => a.date === order.scheduledDate || a.date === order.createdAt?.split(' ')[0]) ||
      techRecords.find(a => a.date === todayStr) ||
      techRecords[0];

    // Determine appropriate technician avatar photo
    let bestAvatar = userObj?.avatar || tech.avatar;
    if (!bestAvatar || bestAvatar.includes('photo-1534528741775-53994a69daeb')) {
      bestAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    }

    return {
      tech,
      userObj,
      attendance: matchAttendance,
      bestAvatar,
      selfiePhoto: matchAttendance?.clockInPhoto || null,
    };
  });

  const handleVerify = (status: 'LUNAS' | 'DITOLAK' | 'BELUM_BAYAR') => {
    verifyOrderPayment(order.id, status, adminNoteInput);
    if (status === 'LUNAS') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // safe
      }
    }
    setShowRejectForm(false);
  };

  const handleSaveOrderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateServiceOrder(order.id, {
      customerName: editCustomerName,
      customerPhone: editCustomerPhone,
      customerAddress: editCustomerAddress,
      customerType: editCustomerType,
      scheduledDate: editScheduledDate,
      scheduledTimeSlot: editScheduledTimeSlot,
      status: editStatus,
      paymentStatus: editPaymentStatus,
      grandTotal: Number(editGrandTotal),
      customerNotes: editCustomerNotes,
    });
    setShowEditOrderModal(false);
  };

  const handleSaveReportEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTechnicalReport(order.id, {
      initialFreonPressurePsi: Number(editInitialFreon),
      finalFreonPressurePsi: Number(editFinalFreon),
      ampereReading: Number(editAmpere),
      finalTempCelsius: Number(editTemp),
      cleaningDoneIndoor: editIndoorClean,
      cleaningDoneOutdoor: editOutdoorClean,
      drainageChecked: editDrainCheck,
      electricalChecked: editElecCheck,
      notes: editReportNotes,
      recommendations: editRecommendations,
    });
    setShowEditReportModal(false);
  };

  const handleDeleteOrder = () => {
    deleteServiceOrder(order.id);
    setShowDeleteOrderConfirm(false);
    onClose();
  };

  const handleDeleteReport = () => {
    deleteTechnicalReport(order.id);
    setShowDeleteReportConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-4xl bg-[#0F0F0F] rounded-3xl shadow-2xl overflow-hidden my-6 border border-white/15 text-white">
          {/* Header with Bold Typography */}
          <div className="flex items-center justify-between px-6 py-5 bg-white/5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-blue-400">{order.orderNumber}</span>
                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded ${
                  order.status === 'SELESAI' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : order.status === 'SEDANG_DIKERJAKAN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded ${
                  order.paymentStatus === 'LUNAS'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : order.paymentStatus === 'MENUNGGU_VERIFIKASI'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : order.paymentStatus === 'DITOLAK'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-white/10 text-white/60 border border-white/20'
                }`}>
                  {order.paymentStatus === 'MENUNGGU_VERIFIKASI' ? '⏳ VERIFIKASI ADMIN' : order.paymentStatus}
                </span>
              </div>
              <h3 className="font-black text-2xl tracking-tight text-white mt-1">DETAIL ORDER & KONTROL ADMIN</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-open-invoice-detail"
                onClick={() => setShowInvoice(true)}
                title="Buka Faktur Resmi, Cetak Printer, Unduh PDF, dan Share ke WhatsApp"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Faktur & Share PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs text-white/80">
            
            {/* 1. Admin Verification Card (Prominent Header) */}
            {order.paymentStatus === 'MENUNGGU_VERIFIKASI' && (
              <div className="p-5 bg-gradient-to-r from-amber-950/40 to-yellow-950/30 border-2 border-amber-500/50 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                          PERLU VERIFIKASI ADMIN KANTOR
                        </span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      </div>
                      <h4 className="font-black text-white text-base">
                        Pengerjaan Selesai • Konfirmasi Pembayaran Teknisi
                      </h4>
                      <p className="text-white/60 text-xs">
                        Teknisi telah menyelesaikan pengerjaan dan melaporkan pembayaran pelanggan. Silakan verifikasi untuk mengubah status menjadi LUNAS.
                      </p>
                    </div>
                  </div>

                  {isSuperOrAdmin && (
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => handleVerify('LUNAS')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui Lunas</span>
                      </button>
                      <button
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        Tolak / Revisi
                      </button>
                    </div>
                  )}
                </div>

                {/* Details of Reported Payment */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-500/20 text-xs">
                  <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Metode Dipilih Teknisi</span>
                    <span className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      {order.paymentMethod || 'TUNAI'}
                    </span>
                  </div>

                  <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Nominal Yang Diterima</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block tabular-nums">
                      Rp {(order.paymentAmountReceived ?? order.grandTotal ?? 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Catatan Pembayaran</span>
                    <p className="text-white/80 italic mt-0.5 truncate">
                      {order.paymentNotes || 'Tidak ada catatan tambahan'}
                    </p>
                  </div>
                </div>

                {/* Proof Photo thumbnail */}
                {order.paymentProofPhoto && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] font-bold text-white/50 uppercase">Bukti Bayar / Struk:</span>
                    <div 
                      onClick={() => setPreviewImage({ url: order.paymentProofPhoto!, title: `Bukti Pembayaran - ${order.orderNumber}`, subtitle: `Metode: ${order.paymentMethod} • Rp ${(order.paymentAmountReceived || order.grandTotal).toLocaleString('id-ID')}` })}
                      className="relative group cursor-pointer"
                    >
                      <img 
                        src={order.paymentProofPhoto} 
                        alt="Bukti Bayar" 
                        className="h-12 w-16 object-cover rounded-lg border border-amber-500/40 group-hover:opacity-80 transition"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg transition">
                        <ZoomIn className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <span className="text-[10px] text-white/40">(Klik foto untuk memperbesar)</span>
                  </div>
                )}

                {/* Reject Form */}
                {showRejectForm && (
                  <div className="p-3 bg-black/60 rounded-xl border border-red-500/30 space-y-2 mt-2">
                    <p className="text-[11px] font-bold text-red-400">Alasan Penolakan / Permintaan Revisi Pembayaran:</p>
                    <input
                      type="text"
                      placeholder="Misal: Bukti transfer buram / nominal kurang Rp 50.000"
                      value={adminNoteInput}
                      onChange={e => setAdminNoteInput(e.target.value)}
                      className="w-full p-2 bg-black border border-white/20 rounded-lg text-white text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleVerify('DITOLAK')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs"
                      >
                        Konfirmasi Tolak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If Payment Already Verified LUNAS */}
            {order.paymentStatus === 'LUNAS' && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">Pembayaran Terverifikasi LUNAS</h4>
                    <p className="text-[11px] text-white/60">
                      Metode: <strong className="text-white">{order.paymentMethod || 'TUNAI'}</strong> • Total: <strong className="text-emerald-400">Rp {(order.grandTotal || 0).toLocaleString('id-ID')}</strong>
                      {order.paymentVerifiedBy && ` • Diverifikasi oleh: ${order.paymentVerifiedBy}`}
                      {order.paymentVerifiedAt && ` (${order.paymentVerifiedAt})`}
                    </p>
                  </div>
                </div>

                {order.paymentProofPhoto && (
                  <button
                    onClick={() => setPreviewImage({ url: order.paymentProofPhoto!, title: `Bukti Pembayaran - ${order.orderNumber}` })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold cursor-pointer self-start sm:self-auto"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Lihat Bukti Bayar</span>
                  </button>
                )}
              </div>
            )}

            {/* Customer & Schedule Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Data Pelanggan</p>
                <h4 className="font-black text-white text-base">{order.customerName}</h4>
                {order.companyName && <p className="text-blue-400 font-bold">{order.companyName}</p>}
                <p className="text-white/60">{order.customerAddress}</p>
                <p className="font-mono text-white/50">Telp/WA: {order.customerPhone}</p>
              </div>

              {/* Schedule Box */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Jadwal & Pembayaran</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">{order.scheduledDate}</span>
                  <span className="text-white/50">({order.scheduledTimeSlot} WIB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50">Status:</span>
                  <span className="text-emerald-400 font-bold">{order.paymentStatus}</span>
                  {order.paymentMethod && <span className="text-white/40">({order.paymentMethod})</span>}
                </div>
                {order.customerNotes && (
                  <p className="text-white/70 italic text-[11px] bg-black/40 p-2 rounded-lg border border-white/5">
                    "{order.customerNotes}"
                  </p>
                )}
              </div>
            </div>

            {/* 2. Bukti Foto Pengerjaan: BEFORE & AFTER Quality Assurance */}
            {order.technicalReport && (
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-400" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-white">
                      Dokumentasi Foto Pengerjaan (Before & After)
                    </p>
                  </div>
                  <span className="text-[10px] text-white/40">
                    Selesai pada: {order.technicalReport.completedAt || order.updatedAt}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Photos */}
                  <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Kondisi SEBELUM (Before)
                      </span>
                      <span className="text-[10px] text-white/40">
                        {order.technicalReport.beforePhotos?.length || 0} Foto
                      </span>
                    </div>

                    {order.technicalReport.beforePhotos && order.technicalReport.beforePhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {order.technicalReport.beforePhotos.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage({ 
                              url, 
                              title: `Foto Kondisi SEBELUM (Before) - Unit #${idx + 1}`,
                              subtitle: `Order: ${order.orderNumber} • ${order.customerName}`
                            })}
                            className="relative group cursor-pointer rounded-xl overflow-hidden aspect-video border border-white/10 bg-black"
                          >
                            <img src={url} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-white/40 italic py-4 text-center">Tidak ada foto before</p>
                    )}
                  </div>

                  {/* After Photos */}
                  <div className="p-3 bg-black/40 rounded-xl border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Kondisi SESUDAH (After)
                      </span>
                      <span className="text-[10px] text-white/40">
                        {order.technicalReport.afterPhotos?.length || 0} Foto
                      </span>
                    </div>

                    {order.technicalReport.afterPhotos && order.technicalReport.afterPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {order.technicalReport.afterPhotos.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage({ 
                              url, 
                              title: `Foto Kondisi SESUDAH (After) - Unit #${idx + 1}`,
                              subtitle: `Order: ${order.orderNumber} • Selesai Bersih & Standar KoolFix`
                            })}
                            className="relative group cursor-pointer rounded-xl overflow-hidden aspect-video border border-white/10 bg-black"
                          >
                            <img src={url} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-white/40 italic py-4 text-center">Tidak ada foto after</p>
                    )}
                  </div>
                </div>

                {/* Customer Signature */}
                {order.technicalReport.customerSignature && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                        Tanda Tangan Digital Pelanggan (Serah Terima)
                      </span>
                      <p className="text-[11px] text-white/60">Disetujui oleh {order.customerName}</p>
                    </div>
                    <div 
                      onClick={() => setPreviewImage({ url: order.technicalReport!.customerSignature!, title: `Tanda Tangan Pelanggan - ${order.customerName}` })}
                      className="bg-white p-2 rounded-xl border border-white/20 h-12 w-28 flex items-center justify-center cursor-pointer hover:opacity-90"
                    >
                      <img src={order.technicalReport.customerSignature} alt="Signature" className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Foto & Verifikasi Absensi Lapangan Teknisi */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-white">
                    {currentUser.role.startsWith('PELANGGAN')
                      ? 'Profil & Verifikasi Teknisi Lapangan Bertugas'
                      : 'Foto & Status Absensi Presensi Teknisi Bertugas'}
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Geotag GPS & Akun Terverifikasi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {technicianAttendances.map(({ tech, userObj, attendance, bestAvatar, selfiePhoto }, idx) => {
                  const isViewerPrivileged = isSuperOrAdmin || (currentUser.role === 'TEKNISI' && (currentUser.id === tech.technicianId || currentUser.name === tech.technicianName));
                  const phoneContact = tech.technicianPhone || userObj?.phone;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-black/50 border border-white/10 rounded-2xl flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Photo Display: Selfie GPS or Verified Profile Avatar */}
                        <div className="relative shrink-0">
                          {selfiePhoto ? (
                            <div
                              onClick={() => setPreviewImage({
                                url: selfiePhoto,
                                title: `Foto Selfie Presensi GPS - ${tech.technicianName}`,
                                subtitle: `Jam Masuk: ${attendance?.clockInTime || '-'} WIB • ${attendance?.clockInLocation?.addressName || 'Lokasi Depo Operasional'}`
                              })}
                              className="relative group cursor-pointer"
                              title="Klik untuk memperbesar foto selfie GPS"
                            >
                              <img
                                src={selfiePhoto}
                                alt={`Presensi ${tech.technicianName}`}
                                className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/50 group-hover:opacity-80 transition"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                              <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-600 rounded-full text-white border border-black" title="Presensi GPS Terverifikasi">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          ) : (
                            <div className="relative">
                              <img
                                src={bestAvatar}
                                alt={tech.technicianName}
                                className="w-14 h-14 rounded-xl object-cover border border-white/20"
                              />
                              <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 rounded-full text-white border border-black" title="Teknisi Resmi">
                                <ShieldCheck className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-black text-white text-xs truncate">{tech.technicianName}</h5>
                            {tech.roleInJob === 'LEAD' ? (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                LEAD
                              </span>
                            ) : (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                ASISTEN
                              </span>
                            )}
                            {userObj?.rating && (
                              <span className="text-[8px] font-bold bg-amber-500/10 text-amber-400 px-1 rounded">
                                ★ {userObj.rating}
                              </span>
                            )}
                          </div>

                          {attendance ? (
                            <div className="mt-1 space-y-0.5">
                              <p className="text-[10px] text-emerald-400 font-mono font-bold">
                                ✓ Presensi: {attendance.clockInTime} WIB
                              </p>
                              <p className="text-[9px] text-white/50 line-clamp-1">
                                📍 {attendance.clockInLocation?.addressName || 'Lokasi Depo Operasional'}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-1 space-y-0.5">
                              <p className="text-[10px] text-blue-400 font-bold">
                                🛡️ Teknisi Resmi KoolFix
                              </p>
                              <p className="text-[9px] text-white/50">
                                {phoneContact || 'Siap Bertugas'}
                              </p>
                            </div>
                          )}

                          {selfiePhoto && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({
                                url: selfiePhoto,
                                title: `Foto Selfie Presensi GPS - ${tech.technicianName}`,
                                subtitle: `Jam Masuk: ${attendance?.clockInTime || '-'} WIB • ${attendance?.clockInLocation?.addressName || 'Lokasi Depo Operasional'}`
                              })}
                              className="text-[9px] text-emerald-400 hover:text-emerald-300 underline font-bold mt-0.5 flex items-center gap-1 cursor-pointer"
                            >
                              <ZoomIn className="w-2.5 h-2.5" />
                              Foto Selfie GPS
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Commission for Admin/Authorized Technician ONLY. Non-admin tracking sees contact / verified status */}
                      {isViewerPrivileged ? (
                        <div className="text-right shrink-0">
                          <span className="text-[9px] text-white/40 block font-bold uppercase">Komisi</span>
                          <span className="text-[11px] font-black text-emerald-400 tabular-nums">
                            Rp {(tech.commissionEarned || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ) : (
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Terverifikasi
                          </span>
                          {phoneContact && (
                            <a
                              href={`https://wa.me/${phoneContact.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              Hubungi WA
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Services & Parts Table */}
            <div className="bg-black/40 rounded-2xl border border-white/10 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Rincian Pekerjaan & Biaya</p>
              <div className="divide-y divide-white/5 text-xs">
                {order.serviceItems.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between">
                    <div>
                      <span className="font-bold text-white">{item.categoryName}</span>
                      <span className="text-white/40 ml-2">x{item.unitCount} unit</span>
                    </div>
                    <span className="font-black text-white tabular-nums">Rp {(item.totalPrice || 0).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {order.sparePartsUsed && order.sparePartsUsed.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Suku Cadang Terpakai:</p>
                  <div className="divide-y divide-white/5">
                    {order.sparePartsUsed.map((part, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between text-white/70">
                        <span>{part.name} ({part.quantity}x {part.unit})</span>
                        <span className="font-bold tabular-nums">Rp {(part.totalPrice || 0).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm font-black text-white">
                <span>Total Tagihan:</span>
                <span className="text-xl text-emerald-400 tabular-nums">
                  Rp {(order.grandTotal || order.totalServicePrice || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Super Admin Full Control Actions Toolbar */}
            {isSuperAdmin && (
              <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-blue-950/40 border border-red-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Akses Kontrol Super Admin (CRUD Proyek & Laporan)
                    </span>
                  </div>
                  <span className="text-[10px] text-red-300 font-bold">Wewenang Penuh Administrator Tertinggi</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditCustomerName(order.customerName);
                      setEditCustomerPhone(order.customerPhone);
                      setEditCustomerAddress(order.customerAddress);
                      setEditCustomerType(order.customerType);
                      setEditScheduledDate(order.scheduledDate);
                      setEditScheduledTimeSlot(order.scheduledTimeSlot);
                      setEditStatus(order.status);
                      setEditPaymentStatus(order.paymentStatus);
                      setEditGrandTotal(order.grandTotal);
                      setEditCustomerNotes(order.customerNotes || '');
                      setShowEditOrderModal(true);
                    }}
                    className="px-3.5 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Proyek / Order</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditInitialFreon(order.technicalReport?.initialFreonPressurePsi ?? 60);
                      setEditFinalFreon(order.technicalReport?.finalFreonPressurePsi ?? 140);
                      setEditAmpere(order.technicalReport?.ampereReading ?? 3.8);
                      setEditTemp(order.technicalReport?.finalTempCelsius ?? 18);
                      setEditIndoorClean(order.technicalReport?.cleaningDoneIndoor ?? true);
                      setEditOutdoorClean(order.technicalReport?.cleaningDoneOutdoor ?? true);
                      setEditDrainCheck(order.technicalReport?.drainageChecked ?? true);
                      setEditElecCheck(order.technicalReport?.electricalChecked ?? true);
                      setEditReportNotes(order.technicalReport?.notes || '');
                      setEditRecommendations(order.technicalReport?.recommendations || '');
                      setShowEditReportModal(true);
                    }}
                    className="px-3.5 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{order.technicalReport ? 'Edit Laporan Teknis' : '+ Buat Laporan Teknis'}</span>
                  </button>

                  {order.technicalReport && (
                    <button
                      onClick={() => setShowDeleteReportConfirm(true)}
                      className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Laporan Teknis</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowDeleteOrderConfirm(true)}
                    className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Proyek Ini</span>
                  </button>
                </div>
              </div>
            )}

            {/* Technical Diagnostics */}
            {order.technicalReport && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Parameter Teknis & Pengukuran</p>
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setEditInitialFreon(order.technicalReport?.initialFreonPressurePsi ?? 60);
                        setEditFinalFreon(order.technicalReport?.finalFreonPressurePsi ?? 140);
                        setEditAmpere(order.technicalReport?.ampereReading ?? 3.8);
                        setEditTemp(order.technicalReport?.finalTempCelsius ?? 18);
                        setEditIndoorClean(order.technicalReport?.cleaningDoneIndoor ?? true);
                        setEditOutdoorClean(order.technicalReport?.cleaningDoneOutdoor ?? true);
                        setEditDrainCheck(order.technicalReport?.drainageChecked ?? true);
                        setEditElecCheck(order.technicalReport?.electricalChecked ?? true);
                        setEditReportNotes(order.technicalReport?.notes || '');
                        setEditRecommendations(order.technicalReport?.recommendations || '');
                        setShowEditReportModal(true);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit Laporan
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-black/40 rounded-xl">
                    <span className="text-white/40 block text-[9px]">Tekanan Freon</span>
                    <span className="font-black text-white">{order.technicalReport.initialFreonPressurePsi} → {order.technicalReport.finalFreonPressurePsi} PSI</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-xl">
                    <span className="text-white/40 block text-[9px]">Arus Listrik</span>
                    <span className="font-black text-white">{order.technicalReport.ampereReading} A</span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-xl">
                    <span className="text-white/40 block text-[9px]">Suhu Suplai</span>
                    <span className="font-black text-emerald-400">{order.technicalReport.finalTempCelsius}°C</span>
                  </div>
                  {isSuperOrAdmin || currentUser.role === 'TEKNISI' ? (
                    <div className="p-2.5 bg-black/40 rounded-xl">
                      <span className="text-white/40 block text-[9px]">{currentUser.role === 'TEKNISI' ? 'Komisi Anda' : 'Total Komisi Tim'}</span>
                      <span className="font-black text-amber-400">Rp {(order.technicianCommissionEarned || 0).toLocaleString('id-ID')}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-black/40 rounded-xl">
                      <span className="text-white/40 block text-[9px]">Garansi Servis</span>
                      <span className="font-black text-emerald-400">30 Hari Garansi Resmi</span>
                    </div>
                  )}
                </div>
                {order.technicalReport.notes && (
                  <p className="text-white/70 italic text-[11px] mt-2">"{order.technicalReport.notes}"</p>
                )}
                {order.technicalReport.recommendations && (
                  <p className="text-cyan-300/80 text-[11px] mt-1 font-mono">💡 Rekomendasi: {order.technicalReport.recommendations}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer with actions */}
          <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase text-xs cursor-pointer"
            >
              Tutup
            </button>

            <div className="flex items-center gap-2">
              {isSuperOrAdmin && order.paymentStatus === 'MENUNGGU_VERIFIKASI' && (
                <button
                  onClick={() => handleVerify('LUNAS')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Verifikasi Lunas
                </button>
              )}

              {(isSuperOrAdmin || isAssignedTech) && order.status !== 'SELESAI' && onOpenExecution && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenExecution();
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Buka Lembar Eksekusi Servis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal for any Photo (Before, After, Payment Proof, Attendance) */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-[#141414] border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div>
                <h4 className="font-black text-white text-base">{previewImage.title}</h4>
                {previewImage.subtitle && (
                  <p className="text-xs text-white/60">{previewImage.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black/80 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
              <span>Resolusi HD Kualitas Penuh</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase text-[11px]"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />
      )}

      {/* Quick Dispatch Modal (Edit / Assign Multi-Technicians) */}
      {showDispatchModal && (
        <QuickDispatchModal
          order={order}
          onClose={() => setShowDispatchModal(false)}
        />
      )}

      {/* Super Admin: Edit Order / Project Modal */}
      {showEditOrderModal && (
        <EditProjectModal
          order={order}
          onClose={() => setShowEditOrderModal(false)}
        />
      )}

      {/* Super Admin: Edit Technical Report Modal */}
      {showEditReportModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-[#141414] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="flex items-center justify-between px-6 py-4 bg-purple-950/40 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-base text-white">Super Admin - Edit Laporan Teknis Servis</h3>
              </div>
              <button
                onClick={() => setShowEditReportModal(false)}
                className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReportEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <p className="text-[11px] text-purple-300 font-medium">
                Sebagai Super Admin, Anda memiliki hak istimewa untuk mengoreksi data pengukuran teknis, ceklis pekerjaan, dan catatan pengerjaan lapangan.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <label className="block text-[9px] font-black uppercase text-white/50 mb-1">Freon Awal (PSI)</label>
                  <input
                    type="number"
                    value={editInitialFreon}
                    onChange={e => setEditInitialFreon(Number(e.target.value))}
                    className="w-full p-2 bg-black/50 border border-white/10 rounded-lg text-white font-black"
                  />
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <label className="block text-[9px] font-black uppercase text-white/50 mb-1">Freon Akhir (PSI)</label>
                  <input
                    type="number"
                    value={editFinalFreon}
                    onChange={e => setEditFinalFreon(Number(e.target.value))}
                    className="w-full p-2 bg-black/50 border border-white/10 rounded-lg text-emerald-400 font-black"
                  />
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <label className="block text-[9px] font-black uppercase text-white/50 mb-1">Arus Listrik (Ampere)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editAmpere}
                    onChange={e => setEditAmpere(Number(e.target.value))}
                    className="w-full p-2 bg-black/50 border border-white/10 rounded-lg text-white font-black"
                  />
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <label className="block text-[9px] font-black uppercase text-white/50 mb-1">Suhu Akhir (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editTemp}
                    onChange={e => setEditTemp(Number(e.target.value))}
                    className="w-full p-2 bg-black/50 border border-white/10 rounded-lg text-cyan-400 font-black"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-white/50 block">Verifikasi Item Pengerjaan</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIndoorClean}
                      onChange={e => setEditIndoorClean(e.target.checked)}
                      className="rounded accent-purple-500 w-4 h-4"
                    />
                    <span>Cuci Unit Indoor Selesai</span>
                  </label>
                  <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editOutdoorClean}
                      onChange={e => setEditOutdoorClean(e.target.checked)}
                      className="rounded accent-purple-500 w-4 h-4"
                    />
                    <span>Cuci Unit Outdoor Selesai</span>
                  </label>
                  <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDrainCheck}
                      onChange={e => setEditDrainCheck(e.target.checked)}
                      className="rounded accent-purple-500 w-4 h-4"
                    />
                    <span>Drainase & Pembuangan Air Lancar</span>
                  </label>
                  <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editElecCheck}
                      onChange={e => setEditElecCheck(e.target.checked)}
                      className="rounded accent-purple-500 w-4 h-4"
                    />
                    <span>Kelistrikan & Kompresor Normal</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Catatan Diagnosa Lapangan</label>
                <textarea
                  rows={2}
                  value={editReportNotes}
                  onChange={e => setEditReportNotes(e.target.value)}
                  placeholder="Kondisi filter sebelumnya sangat kotor, kapasitor normal..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-white/50 mb-1">Rekomendasi untuk Pelanggan</label>
                <input
                  type="text"
                  value={editRecommendations}
                  onChange={e => setEditRecommendations(e.target.value)}
                  placeholder="Disarankan servis berkala tiap 3 bulan..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditReportModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {showDeleteOrderConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#181818] border border-red-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Hapus Proyek / Pesanan?</h3>
                <p className="text-xs text-white/60 font-mono">#{order.orderNumber} - {order.customerName}</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Apakah Anda yakin ingin menghapus proyek ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteOrderConfirm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteOrder}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Technical Report Confirmation Modal */}
      {showDeleteReportConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#181818] border border-amber-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Hapus Laporan Teknis?</h3>
                <p className="text-xs text-white/60 font-mono">Pesanan #{order.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Laporan diagnosa teknis, parameter freon & ampere, serta foto dokumentasi akan dihapus dan di-reset.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteReportConfirm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteReport}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
