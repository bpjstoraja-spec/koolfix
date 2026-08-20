import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceItemSelection, ACUnit } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  Building2, 
  Home, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  Trash2,
  AirVent
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerBookingModalProps {
  onClose: () => void;
  initialAcUnit?: ACUnit;
}

export const CustomerBookingModal: React.FC<CustomerBookingModalProps> = ({ onClose, initialAcUnit }) => {
  const { currentUser, users, serviceCategories, acUnits, addACUnit, createServiceOrder } = useApp();

  const isCorporate = currentUser.role === 'PELANGGAN_KANTOR';
  const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const technicians = users.filter(u => u.role === 'TEKNISI');

  const [step, setStep] = useState<number>(1);
  const [customerName, setCustomerName] = useState(currentUser.name);
  const [customerPhone, setCustomerPhone] = useState(currentUser.phone);
  const [customerAddress, setCustomerAddress] = useState(currentUser.address || '');
  const [companyName, setCompanyName] = useState(currentUser.companyName || '');
  const [customerType, setCustomerType] = useState<'UMUM' | 'KANTOR'>(isCorporate ? 'KANTOR' : 'UMUM');

  // Technician assignment by admin (optional upon booking)
  const [selectedTechId, setSelectedTechId] = useState<string>('');

  // AC Unit Selection
  const userAcUnits = acUnits.filter(u => u.customerId === currentUser.id);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(
    initialAcUnit ? [initialAcUnit.id] : (userAcUnits.length > 0 ? [userAcUnits[0].id] : [])
  );

  // New AC Unit quick-add modal state
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [newUnitLocation, setNewUnitLocation] = useState('');
  const [newUnitBrand, setNewUnitBrand] = useState('Daikin');
  const [newUnitPK, setNewUnitPK] = useState<any>('1 PK');
  const [newUnitFreon, setNewUnitFreon] = useState<any>('R32');
  const [newUnitType, setNewUnitType] = useState<any>('SPLIT_WALL');

  // Selected Services
  const [selectedServices, setSelectedServices] = useState<{ [categoryId: string]: number }>({
    'srv-1': 1,
  });

  // Schedule & Notes
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState(defaultDateStr);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('09:00 - 11:00');
  const [customerNotes, setCustomerNotes] = useState('');

  const timeSlots = [
    '08:30 - 10:30',
    '10:30 - 12:30',
    '13:30 - 15:30',
    '15:30 - 17:30',
  ];

  const handleToggleService = (catId: string) => {
    setSelectedServices(prev => {
      const current = prev[catId] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[catId];
        return copy;
      } else {
        return { ...prev, [catId]: 1 };
      }
    });
  };

  const handleUpdateServiceCount = (catId: string, count: number) => {
    if (count <= 0) {
      setSelectedServices(prev => {
        const copy = { ...prev };
        delete copy[catId];
        return copy;
      });
    } else {
      setSelectedServices(prev => ({ ...prev, [catId]: count }));
    }
  };

  const handleAddNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitLocation) return;

    const created = addACUnit({
      customerId: currentUser.id,
      locationName: newUnitLocation,
      brand: newUnitBrand,
      capacityPK: newUnitPK,
      freonType: newUnitFreon,
      type: newUnitType,
    });

    setSelectedUnitIds(prev => [...prev, created.id]);
    setShowAddUnitForm(false);
    setNewUnitLocation('');
  };

  // Calculate pricing
  const serviceItems: ServiceItemSelection[] = Object.entries(selectedServices).map(([catId, count]) => {
    const cat = serviceCategories.find(c => c.id === catId);
    const unitPrice = cat?.basePrice || 0;
    const numCount = Number(count);
    return {
      categoryId: catId,
      categoryName: cat?.name || 'Servis AC',
      unitCount: numCount,
      unitPrice,
      totalPrice: unitPrice * numCount,
    };
  });

  const totalServicePrice = serviceItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmitOrder = () => {
    const selectedUnitsInfo = acUnits
      .filter(u => selectedUnitIds.includes(u.id))
      .map(u => ({
        acUnitId: u.id,
        location: u.locationName,
        brand: `${u.brand} ${u.capacityPK}`,
        capacity: u.capacityPK,
      }));

    const assignedTech = technicians.find(t => t.id === selectedTechId);

    createServiceOrder({
      customerId: currentUser.id,
      customerName,
      customerPhone,
      customerAddress,
      customerType,
      companyName: customerType === 'KANTOR' ? companyName : undefined,
      technicianId: assignedTech?.id,
      technicianName: assignedTech?.name,
      technicianPhone: assignedTech?.phone,
      scheduledDate,
      scheduledTimeSlot,
      serviceItems,
      acUnitsDetails: selectedUnitsInfo,
      customerNotes,
      status: assignedTech ? 'DITUGASKAN' : 'MENUNGGU_KONFIRMASI',
      paymentStatus: 'BELUM_BAYAR',
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // safe
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0F0F0F] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col border border-white/15 text-white">
        {/* Header with Bold Typography */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-white/5 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500 font-bold mb-0.5">
              Online Booking Service
            </p>
            <h3 className="font-black text-xl sm:text-2xl tracking-tight text-white leading-tight">PESAN SERVIS AC</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper indicator */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-black/40 border-b border-white/10 flex items-center justify-between text-[11px] sm:text-xs font-black uppercase tracking-wider shrink-0 overflow-x-auto no-scrollbar gap-2">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 ${step === 1 ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'}`}>1</span>
            Data & Alamat
          </button>
          <ChevronRight className="w-4 h-4 text-white/20" />
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 ${step === 2 ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'}`}>2</span>
            Unit & Layanan
          </button>
          <ChevronRight className="w-4 h-4 text-white/20" />
          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-2 ${step === 3 ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'}`}>3</span>
            Jadwal & Estimasi
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setCustomerType('UMUM')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black uppercase tracking-wider transition cursor-pointer ${
                    customerType === 'UMUM' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Rumah / Umum
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('KANTOR')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black uppercase tracking-wider transition cursor-pointer ${
                    customerType === 'KANTOR' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Kantor / B2B
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Pemesan</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {customerType === 'KANTOR' && (
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Nama Perusahaan / Gedung</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="PT. Maju Bersama Jaya"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Alamat Lengkap Kunjungan</label>
                <textarea
                  rows={3}
                  required
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Jl. Thamrin No. 10, RT 02/05, Jakarta Pusat"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Unit Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-black uppercase tracking-wider text-white/60">Pilih Unit AC yang Diservis</label>
                  <button
                    type="button"
                    onClick={() => setShowAddUnitForm(true)}
                    className="text-blue-400 hover:text-blue-300 font-black uppercase text-[10px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Unit AC Baru
                  </button>
                </div>

                {showAddUnitForm && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-3 space-y-3">
                    <p className="font-black text-xs text-white">Tambah Data Unit AC</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Lokasi Unit (e.g. Kamar Utama)"
                        value={newUnitLocation}
                        onChange={e => setNewUnitLocation(e.target.value)}
                        className="p-2 bg-black border border-white/20 rounded-xl text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Merk (Daikin, Panasonic...)"
                        value={newUnitBrand}
                        onChange={e => setNewUnitBrand(e.target.value)}
                        className="p-2 bg-black border border-white/20 rounded-xl text-white text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddUnitForm(false)}
                        className="px-3 py-1.5 bg-white/10 rounded-xl font-bold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewUnit}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase"
                      >
                        Simpan Unit
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userAcUnits.map(unit => {
                    const isSelected = selectedUnitIds.includes(unit.id);
                    return (
                      <div
                        key={unit.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedUnitIds(selectedUnitIds.filter(id => id !== unit.id));
                          } else {
                            setSelectedUnitIds([...selectedUnitIds, unit.id]);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/70'
                        }`}
                      >
                        <div>
                          <p className="font-black text-white">{unit.locationName}</p>
                          <p className="text-[11px] text-white/50">{unit.brand} • {unit.capacityPK} • {unit.freonType}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/20'
                        }`}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-2">Pilih Layanan</label>
                <div className="grid grid-cols-1 gap-2">
                  {serviceCategories.map(cat => {
                    const count = selectedServices[cat.id] || 0;
                    return (
                      <div
                        key={cat.id}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                          count > 0 ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        <div>
                          <p className="font-black text-white">{cat.name}</p>
                          <p className="text-emerald-400 font-bold tabular-nums text-xs">
                            Rp {cat.basePrice.toLocaleString('id-ID')} / unit
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {count > 0 ? (
                            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                              <button
                                type="button"
                                onClick={() => handleUpdateServiceCount(cat.id, count - 1)}
                                className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-black text-white">{count}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateServiceCount(cat.id, count + 1)}
                                className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleService(cat.id)}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition"
                            >
                              + Pilih
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Tanggal Kunjungan</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Slot Waktu</label>
                  <select
                    value={scheduledTimeSlot}
                    onChange={e => setScheduledTimeSlot(e.target.value)}
                    className="w-full p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-bold"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot} WIB</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct Technician Assignment for Admin */}
              {isSuperOrAdmin && (
                <div className="p-3.5 bg-blue-600/10 border border-blue-500/30 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-black uppercase tracking-wider text-blue-400 text-xs">
                      Pilih & Tugaskan Teknisi Langsung (Admin)
                    </label>
                    <span className="text-[10px] text-white/40">Opsional saat pembuatan order</span>
                  </div>
                  <select
                    value={selectedTechId}
                    onChange={e => setSelectedTechId(e.target.value)}
                    className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Biarkan Menunggu / Tugaskan Nanti --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (★ {t.rating || '5.0'} • {t.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Catatan Keluhan / Instruksi</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  placeholder="Contoh: AC kurang dingin, butuh tangga panjang..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              {/* Total Card */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <span className="text-white/40 uppercase font-black">Estimasi Total Biaya</span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                    Garansi 30 Hari
                  </span>
                </div>
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-white">Total Layanan:</span>
                  <span className="font-black text-2xl text-emerald-400 tabular-nums">
                    Rp {totalServicePrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-black/40 border-t border-white/10 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl font-bold uppercase text-xs"
            >
              Kembali
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
            >
              Lanjutkan
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={serviceItems.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              Konfirmasi Pemesanan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
