import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceStatus, ServiceItemSelection, SparePartUsed, AssignedTechnician } from '../../types';
import { 
  X, 
  Save, 
  Wrench, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  DollarSign, 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  Sparkles,
  Percent
} from 'lucide-react';

interface EditProjectModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ order, onClose }) => {
  const { 
    currentUser, 
    users, 
    serviceCategories, 
    inventory, 
    updateServiceOrder, 
    showNotification 
  } = useApp();

  const technicians = users.filter(u => u.role === 'TEKNISI');

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SERVICES_PARTS' | 'TECHNICIANS' | 'PAYMENT' | 'TECHNICAL'>('GENERAL');

  // Form State
  const [orderNumber, setOrderNumber] = useState(order.orderNumber);
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [customerAddress, setCustomerAddress] = useState(order.customerAddress);
  const [customerType, setCustomerType] = useState<'UMUM' | 'KANTOR'>(order.customerType || 'UMUM');
  const [companyName, setCompanyName] = useState(order.companyName || '');
  const [customerNotes, setCustomerNotes] = useState(order.customerNotes || '');
  
  const [status, setStatus] = useState<ServiceStatus>(order.status);
  const [scheduledDate, setScheduledDate] = useState(order.scheduledDate);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState(order.scheduledTimeSlot);

  // Service Items
  const [serviceItems, setServiceItems] = useState<ServiceItemSelection[]>(
    order.serviceItems ? [...order.serviceItems] : []
  );

  // Spare Parts Used
  const [sparePartsUsed, setSparePartsUsed] = useState<SparePartUsed[]>(
    order.sparePartsUsed ? [...order.sparePartsUsed] : []
  );

  // Assigned Technicians
  const [assignedTechnicians, setAssignedTechnicians] = useState<AssignedTechnician[]>(() => {
    if (order.assignedTechnicians && order.assignedTechnicians.length > 0) {
      return [...order.assignedTechnicians];
    }
    if (order.technicianId) {
      const tech = users.find(u => u.id === order.technicianId);
      return [{
        technicianId: order.technicianId,
        technicianName: order.technicianName || tech?.name || 'Teknisi',
        technicianPhone: order.technicianPhone || tech?.phone,
        roleInJob: 'LEAD',
        commissionSharePercent: 100,
        commissionEarned: order.technicianCommissionEarned || 0,
      }];
    }
    return [];
  });

  // Financial & Pricing
  const [discountAmount, setDiscountAmount] = useState<number>(order.discountAmount || 0);
  const [paymentStatus, setPaymentStatus] = useState<'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'LUNAS' | 'DITOLAK'>(
    order.paymentStatus || 'BELUM_BAYAR'
  );
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'TEMPO_KANTOR' | undefined>(
    order.paymentMethod
  );
  const [paymentAmountReceived, setPaymentAmountReceived] = useState<number>(
    order.paymentAmountReceived || 0
  );
  const [paymentNotes, setPaymentNotes] = useState<string>(order.paymentNotes || '');

  // Technical Report
  const [cleaningIndoor, setCleaningIndoor] = useState<boolean>(
    order.technicalReport?.cleaningDoneIndoor || false
  );
  const [cleaningOutdoor, setCleaningOutdoor] = useState<boolean>(
    order.technicalReport?.cleaningDoneOutdoor || false
  );
  const [drainageChecked, setDrainageChecked] = useState<boolean>(
    order.technicalReport?.drainageChecked || false
  );
  const [electricalChecked, setElectricalChecked] = useState<boolean>(
    order.technicalReport?.electricalChecked || false
  );
  const [initialFreonPressure, setInitialFreonPressure] = useState<string>(
    order.technicalReport?.initialFreonPressurePsi !== undefined ? String(order.technicalReport.initialFreonPressurePsi) : ''
  );
  const [finalFreonPressure, setFinalFreonPressure] = useState<string>(
    order.technicalReport?.finalFreonPressurePsi !== undefined ? String(order.technicalReport.finalFreonPressurePsi) : ''
  );
  const [operatingCurrentAmperes, setOperatingCurrentAmperes] = useState<string>(
    order.technicalReport?.operatingCurrentAmperes !== undefined ? String(order.technicalReport.operatingCurrentAmperes) : ''
  );
  const [technicalNotes, setTechnicalNotes] = useState<string>(
    order.technicalReport?.notes || ''
  );

  // Helper calculations
  const totalServicePrice = serviceItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalSparePartsPrice = sparePartsUsed.reduce((sum, part) => sum + (part.totalPrice || 0), 0);
  const calculatedGrandTotal = Math.max(0, totalServicePrice + totalSparePartsPrice - discountAmount);

  // Handle adding a service item
  const handleAddServiceItem = (categoryId: string) => {
    const cat = serviceCategories.find(c => c.id === categoryId);
    if (!cat) return;
    const existingIndex = serviceItems.findIndex(i => i.categoryId === categoryId);
    if (existingIndex >= 0) {
      const updated = [...serviceItems];
      const newCount = updated[existingIndex].unitCount + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        unitCount: newCount,
        totalPrice: newCount * updated[existingIndex].unitPrice,
      };
      setServiceItems(updated);
    } else {
      setServiceItems([
        ...serviceItems,
        {
          categoryId: cat.id,
          categoryName: cat.name,
          unitCount: 1,
          unitPrice: cat.basePrice,
          totalPrice: cat.basePrice,
        }
      ]);
    }
  };

  const handleUpdateServiceItem = (index: number, count: number, price: number) => {
    const updated = [...serviceItems];
    if (count <= 0) {
      setServiceItems(updated.filter((_, i) => i !== index));
    } else {
      updated[index] = {
        ...updated[index],
        unitCount: count,
        unitPrice: price,
        totalPrice: count * price,
      };
      setServiceItems(updated);
    }
  };

  const handleRemoveServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  // Handle adding spare parts
  const handleAddSparePart = (inventoryItemId: string) => {
    const item = inventory.find(i => i.id === inventoryItemId);
    if (!item) return;
    const existingIndex = sparePartsUsed.findIndex(p => p.inventoryItemId === inventoryItemId);
    if (existingIndex >= 0) {
      const updated = [...sparePartsUsed];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        totalPrice: newQty * updated[existingIndex].unitPrice,
      };
      setSparePartsUsed(updated);
    } else {
      setSparePartsUsed([
        ...sparePartsUsed,
        {
          inventoryItemId: item.id,
          name: item.name,
          code: item.code,
          quantity: 1,
          unit: item.unit,
          unitPrice: item.sellingPrice,
          totalPrice: item.sellingPrice,
        }
      ]);
    }
  };

  const handleUpdateSparePart = (index: number, qty: number, price: number) => {
    const updated = [...sparePartsUsed];
    if (qty <= 0) {
      setSparePartsUsed(updated.filter((_, i) => i !== index));
    } else {
      updated[index] = {
        ...updated[index],
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price,
      };
      setSparePartsUsed(updated);
    }
  };

  const handleRemoveSparePart = (index: number) => {
    setSparePartsUsed(sparePartsUsed.filter((_, i) => i !== index));
  };

  // Technician assignments
  const handleAddTechnician = (techId: string) => {
    if (assignedTechnicians.some(t => t.technicianId === techId)) return;
    const tech = users.find(u => u.id === techId);
    if (!tech) return;

    const isFirst = assignedTechnicians.length === 0;
    const newAssigned: AssignedTechnician = {
      technicianId: tech.id,
      technicianName: tech.name,
      technicianPhone: tech.phone,
      avatar: tech.avatar,
      roleInJob: isFirst ? 'LEAD' : 'ASSISTANT',
      commissionSharePercent: isFirst ? 100 : 50,
      commissionEarned: 0,
    };
    setAssignedTechnicians([...assignedTechnicians, newAssigned]);
  };

  const handleRemoveTechnician = (techId: string) => {
    setAssignedTechnicians(assignedTechnicians.filter(t => t.technicianId !== techId));
  };

  const handleUpdateTechRole = (techId: string, role: 'LEAD' | 'ASSISTANT' | 'MEMBER', percent: number) => {
    setAssignedTechnicians(prev => prev.map(t => {
      if (t.technicianId === techId) {
        return {
          ...t,
          roleInJob: role,
          commissionSharePercent: percent,
        };
      }
      return t;
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showNotification('Nama pelanggan wajib diisi!', 'error');
      return;
    }

    if (!customerPhone.trim()) {
      showNotification('Nomor telepon pelanggan wajib diisi!', 'error');
      return;
    }

    const leadTech = assignedTechnicians.find(t => t.roleInJob === 'LEAD') || assignedTechnicians[0];

    // Calculate technician commissions
    const totalTechCommission = assignedTechnicians.reduce((sum, t) => {
      const techCommission = Math.round((totalServicePrice * (t.commissionSharePercent || 0)) / 100 * 0.3); // standard estimated
      return sum + (t.commissionEarned || techCommission);
    }, 0);

    const updatedTechs = assignedTechnicians.map(t => {
      const defaultComm = Math.round((totalServicePrice * (t.commissionSharePercent || 100)) / 100 * 0.3);
      return {
        ...t,
        commissionEarned: t.commissionEarned !== undefined ? t.commissionEarned : defaultComm,
      };
    });

    const updatedOrder: Partial<ServiceOrder> = {
      orderNumber,
      customerName,
      customerPhone,
      customerAddress,
      customerType,
      companyName: customerType === 'KANTOR' ? companyName : undefined,
      customerNotes,
      status,
      scheduledDate,
      scheduledTimeSlot,
      serviceItems,
      totalServicePrice,
      sparePartsUsed,
      totalSparePartsPrice,
      discountAmount,
      grandTotal: calculatedGrandTotal,
      technicianId: leadTech?.technicianId,
      technicianName: leadTech?.technicianName,
      technicianPhone: leadTech?.technicianPhone,
      assignedTechnicians: updatedTechs,
      technicianCommissionEarned: totalTechCommission,
      paymentStatus,
      paymentMethod,
      paymentAmountReceived: paymentStatus === 'LUNAS' && !paymentAmountReceived ? calculatedGrandTotal : paymentAmountReceived,
      paymentNotes,
      technicalReport: {
        ...(order.technicalReport || {}),
        cleaningDoneIndoor: cleaningIndoor,
        cleaningDoneOutdoor: cleaningOutdoor,
        drainageChecked: drainageChecked,
        electricalChecked: electricalChecked,
        initialFreonPressurePsi: initialFreonPressure ? parseFloat(initialFreonPressure) : undefined,
        finalFreonPressurePsi: finalFreonPressure ? parseFloat(finalFreonPressure) : undefined,
        operatingCurrentAmperes: operatingCurrentAmperes ? parseFloat(operatingCurrentAmperes) : undefined,
        notes: technicalNotes,
      }
    };

    updateServiceOrder(order.id, updatedOrder);
    showNotification(`Perubahan pada Proyek / SPK #${orderNumber} berhasil disimpan oleh Super Admin!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">Edit Proyek / SPK Servis</h2>
                <span className="hidden xs:inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/60 truncate">
                Ubah parameter proyek #{order.orderNumber} ({order.customerName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 sm:px-6 py-2.5 border-b border-white/10 bg-slate-900/50 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 text-nowrap ${
              activeTab === 'GENERAL'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Informasi & Pelanggan
          </button>

          <button
            onClick={() => setActiveTab('SERVICES_PARTS')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 text-nowrap ${
              activeTab === 'SERVICES_PARTS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Jasa & Suku Cadang ({serviceItems.length + sparePartsUsed.length})
          </button>

          <button
            onClick={() => setActiveTab('TECHNICIANS')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 text-nowrap ${
              activeTab === 'TECHNICIANS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Tim Teknisi ({assignedTechnicians.length})
          </button>

          <button
            onClick={() => setActiveTab('PAYMENT')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 text-nowrap ${
              activeTab === 'PAYMENT'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Finansial & Tagihan
          </button>

          <button
            onClick={() => setActiveTab('TECHNICAL')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 text-nowrap ${
              activeTab === 'TECHNICAL'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Laporan Teknis
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: GENERAL & CUSTOMER */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Nomor SPK / Order
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Status Pengerjaan Proyek
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="MENUNGGU_KONFIRMASI">MENUNGGU KONFIRMASI</option>
                    <option value="DITUGASKAN">DITUGASKAN (DISPATCHED)</option>
                    <option value="DALAM_PERJALANAN">DALAM PERJALANAN (OTW)</option>
                    <option value="SEDANG_DIKERJAKAN">SEDANG DIKERJAKAN</option>
                    <option value="SELESAI">SELESAI (COMPLETED)</option>
                    <option value="DIBATALKAN">DIBATALKAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Tipe Pelanggan
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as 'UMUM' | 'KANTOR')}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="UMUM">Pelanggan Rumah / Residensial</option>
                    <option value="KANTOR">B2B Kantor / Perusahaan</option>
                  </select>
                </div>
              </div>

              {customerType === 'KANTOR' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Nama Perusahaan / Instansi B2B
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Contoh: PT Surya Kencana Abadi"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Nama Pemesan / PIC
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    No. Handphone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                  Alamat Lengkap Lokasi Proyek
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Alamat lengkap, patokan, nomor rumah/gedung..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Tanggal Jadwal Servis
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Slot Waktu Kunjungan
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={scheduledTimeSlot}
                      onChange={(e) => setScheduledTimeSlot(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="08:00 - 10:00">Pagi (08:00 - 10:00 WIB)</option>
                      <option value="09:00 - 11:00">Pagi (09:00 - 11:00 WIB)</option>
                      <option value="10:00 - 12:00">Siang (10:00 - 12:00 WIB)</option>
                      <option value="13:00 - 15:00">Siang (13:00 - 15:00 WIB)</option>
                      <option value="15:00 - 17:00">Sore (15:00 - 17:00 WIB)</option>
                      <option value="18:30 - 20:30">Malam (18:30 - 20:30 WIB)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                  Catatan / Keluhan Awal Pelanggan
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Catatan kendala AC, posisi unit, instruksi parkir..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES & SPARE PARTS */}
          {activeTab === 'SERVICES_PARTS' && (
            <div className="space-y-6">
              {/* Service Items Section */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-black text-white">Item Jasa & Layanan</h3>
                  </div>
                  <span className="text-xs text-white/50">
                    Subtotal Jasa: <strong className="text-white">Rp {totalServicePrice.toLocaleString('id-ID')}</strong>
                  </span>
                </div>

                {/* Add Service Dropdown */}
                <div className="flex gap-2">
                  <select
                    id="select-add-service"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddServiceItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>+ Tambah Layanan Jasa dari Katalog...</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} — Rp {cat.basePrice.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Table / List of Services */}
                {serviceItems.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-3 italic">Belum ada item jasa yang dipilih</p>
                ) : (
                  <div className="space-y-2">
                    {serviceItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-white">{item.categoryName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            <span className="text-[10px] text-white/50">Unit:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.unitCount}
                              onChange={(e) => handleUpdateServiceItem(idx, parseInt(e.target.value) || 1, item.unitPrice)}
                              className="w-12 bg-transparent text-center font-bold text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            <span className="text-[10px] text-white/50">Rp:</span>
                            <input
                              type="number"
                              min="0"
                              step="5000"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateServiceItem(idx, item.unitCount, parseInt(e.target.value) || 0)}
                              className="w-24 bg-transparent text-right font-bold text-xs text-white focus:outline-none"
                            />
                          </div>
                          <span className="text-xs font-black text-blue-400 min-w-[90px] text-right">
                            Rp {(item.totalPrice || 0).toLocaleString('id-ID')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceItem(idx)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Spare Parts Section */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-white">Suku Cadang & Material Terpakai</h3>
                  </div>
                  <span className="text-xs text-white/50">
                    Subtotal Sparepart: <strong className="text-amber-400">Rp {totalSparePartsPrice.toLocaleString('id-ID')}</strong>
                  </span>
                </div>

                {/* Add Sparepart Dropdown */}
                <div className="flex gap-2">
                  <select
                    id="select-add-sparepart"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSparePart(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>+ Tambah Suku Cadang dari Inventaris...</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.code}) — Rp {item.sellingPrice.toLocaleString('id-ID')} / {item.unit} [Stok: {item.stock}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Table / List of Spareparts */}
                {sparePartsUsed.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-3 italic">Belum ada suku cadang terpasang</p>
                ) : (
                  <div className="space-y-2">
                    {sparePartsUsed.map((part, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-white">{part.name}</p>
                          <p className="text-[10px] text-white/50">{part.code} ({part.unit})</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            <span className="text-[10px] text-white/50">Qty:</span>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={part.quantity}
                              onChange={(e) => handleUpdateSparePart(idx, parseFloat(e.target.value) || 1, part.unitPrice)}
                              className="w-12 bg-transparent text-center font-bold text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            <span className="text-[10px] text-white/50">Harga:</span>
                            <input
                              type="number"
                              min="0"
                              step="5000"
                              value={part.unitPrice}
                              onChange={(e) => handleUpdateSparePart(idx, part.quantity, parseInt(e.target.value) || 0)}
                              className="w-24 bg-transparent text-right font-bold text-xs text-white focus:outline-none"
                            />
                          </div>
                          <span className="text-xs font-black text-amber-400 min-w-[90px] text-right">
                            Rp {(part.totalPrice || 0).toLocaleString('id-ID')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSparePart(idx)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICIANS & COMMISSION */}
          {activeTab === 'TECHNICIANS' && (
            <div className="space-y-5">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Penugasan Tim Teknisi Lapangan
                    </h3>
                    <p className="text-xs text-white/60">
                      Tugaskan Lead Teknisi dan Asisten untuk proyek ini
                    </p>
                  </div>
                </div>

                {/* Add Technician Select */}
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddTechnician(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>+ Pilih & Tambahkan Teknisi...</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} — Telp: {tech.phone}
                    </option>
                  ))}
                </select>

                {/* List of assigned techs */}
                {assignedTechnicians.length === 0 ? (
                  <p className="text-xs text-amber-400/80 text-center py-4 italic bg-amber-500/10 rounded-xl border border-amber-500/20">
                    Belum ada teknisi yang ditugaskan ke proyek ini
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assignedTechnicians.map((tech) => (
                      <div key={tech.technicianId} className="p-3 bg-slate-900/60 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center text-sm border border-blue-500/30">
                            {tech.technicianName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{tech.technicianName}</p>
                            <p className="text-[10px] text-white/50">{tech.technicianPhone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={tech.roleInJob || 'LEAD'}
                            onChange={(e) => handleUpdateTechRole(tech.technicianId, e.target.value as any, tech.commissionSharePercent || 100)}
                            className="bg-slate-800 text-xs text-white font-bold rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none"
                          >
                            <option value="LEAD">👑 Lead Teknisi (Penanggung Jawab)</option>
                            <option value="ASSISTANT">🔧 Asisten Teknisi</option>
                            <option value="MEMBER">👤 Anggota Regu</option>
                          </select>

                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            <span className="text-[10px] text-white/50">% Komisi:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={tech.commissionSharePercent ?? 100}
                              onChange={(e) => handleUpdateTechRole(tech.technicianId, tech.roleInJob || 'LEAD', parseInt(e.target.value) || 0)}
                              className="w-12 bg-transparent text-center font-bold text-xs text-emerald-400 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTechnician(tech.technicianId)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL & PAYMENT */}
          {activeTab === 'PAYMENT' && (
            <div className="space-y-5">
              {/* Financial Calculation Summary Card */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-blue-950/40 rounded-2xl border border-white/10 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white/60">
                  Ringkasan Kalkulasi Finansial Proyek
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-white/80">
                    <span>Total Layanan Jasa ({serviceItems.length} item):</span>
                    <span className="font-mono font-bold text-white">Rp {totalServicePrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Total Suku Cadang ({sparePartsUsed.length} item):</span>
                    <span className="font-mono font-bold text-amber-400">Rp {totalSparePartsPrice.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-red-400 font-bold">Potongan Diskon Khusus:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 0)}
                        className="w-28 bg-white/5 border border-red-500/30 rounded-lg px-2 py-1 text-right font-mono font-bold text-xs text-red-400 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
                    <span className="font-black text-white">Total Tagihan Bersih (Grand Total):</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      Rp {calculatedGrandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Status Pembayaran
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="BELUM_BAYAR">BELUM BAYAR (UNPAID)</option>
                    <option value="MENUNGGU_VERIFIKASI">MENUNGGU VERIFIKASI ADMIN</option>
                    <option value="LUNAS">LUNAS (PAID)</option>
                    <option value="DITOLAK">DITOLAK (REJECTED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod || 'TUNAI'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="TUNAI">💵 Tunai / Cash di Tempat</option>
                    <option value="TRANSFER_BANK">🏦 Transfer Bank Perusahaan</option>
                    <option value="QRIS">📱 QRIS Statis / Dinamis</option>
                    <option value="TEMPO_KANTOR">🏢 Tempo / Tagihan Korporat (B2B)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                  Nominal Diterima Kasir / Teknisi (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={paymentAmountReceived}
                  onChange={(e) => setPaymentAmountReceived(parseInt(e.target.value) || 0)}
                  placeholder={`Contoh: ${calculatedGrandTotal}`}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                  Catatan Finansial / Referensi Bukti Transfer
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Nomor referensi BCA / Bukti QRIS / Catatan jatuh tempo invoice kantor..."
                />
              </div>
            </div>
          )}

          {/* TAB 5: TECHNICAL REPORT */}
          {activeTab === 'TECHNICAL' && (
            <div className="space-y-5">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-white/60">
                  Daftar Pemeriksaan Standar Teknis (Checklist)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={cleaningIndoor}
                      onChange={(e) => setCleaningIndoor(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded bg-white/10 border-white/20 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">Pembersihan Unit Indoor & Filter</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={cleaningOutdoor}
                      onChange={(e) => setCleaningOutdoor(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded bg-white/10 border-white/20 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">Pembersihan Unit Outdoor & Kondensor</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={drainageChecked}
                      onChange={(e) => setDrainageChecked(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded bg-white/10 border-white/20 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">Flushing & Pengecekan Drainase Air</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={electricalChecked}
                      onChange={(e) => setElectricalChecked(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded bg-white/10 border-white/20 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">Inspeksi Kelistrikan & Arus Kompresor</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Tekanan Freon Awal (PSI)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={initialFreonPressure}
                    onChange={(e) => setInitialFreonPressure(e.target.value)}
                    placeholder="Contoh: 75"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Tekanan Freon Akhir (PSI)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={finalFreonPressure}
                    onChange={(e) => setFinalFreonPressure(e.target.value)}
                    placeholder="Contoh: 140"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                    Arus Listrik Running (Ampere)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={operatingCurrentAmperes}
                    onChange={(e) => setOperatingCurrentAmperes(e.target.value)}
                    placeholder="Contoh: 3.8"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/60 mb-1.5">
                  Catatan Analisa Teknis & Rekomendasi
                </label>
                <textarea
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Catatan kondisi kompresor, fan bearing, rekomendasi penggantian part di masa depan..."
                />
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan Proyek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
