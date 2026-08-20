import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, User } from '../../types';
import { 
  X, 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Wrench,
  TrendingUp,
  ShieldCheck,
  Send,
  Users,
  Percent,
  Sliders,
  Crown,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickDispatchModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

interface TechAssignmentItem {
  technicianId: string;
  roleInJob: 'LEAD' | 'ASSISTANT' | 'MEMBER';
  commissionPercentageOfService: number;
}

export const QuickDispatchModal: React.FC<QuickDispatchModalProps> = ({ order, onClose }) => {
  const { 
    users, 
    serviceOrders, 
    attendanceRecords, 
    assignTechnicians, 
    updateServiceOrder
  } = useApp();

  const technicians = users.filter(u => u.role === 'TEKNISI');
  const todayStr = new Date().toISOString().split('T')[0];
  const totalServicePrice = order.totalServicePrice || order.grandTotal || 0;

  // Initialize selected technicians based on existing order assignments or single technicianId
  const getInitialAssignments = (): TechAssignmentItem[] => {
    if (order.assignedTechnicians && order.assignedTechnicians.length > 0) {
      return order.assignedTechnicians.map(at => ({
        technicianId: at.technicianId,
        roleInJob: at.roleInJob,
        commissionPercentageOfService: at.commissionPercentageOfService ?? at.commissionSharePercent ?? (at.roleInJob === 'LEAD' ? 25 : 15),
      }));
    }
    if (order.technicianId) {
      return [{
        technicianId: order.technicianId,
        roleInJob: 'LEAD',
        commissionPercentageOfService: 30, // 30% of service value for single technician
      }];
    }
    if (technicians.length > 0) {
      return [{
        technicianId: technicians[0].id,
        roleInJob: 'LEAD',
        commissionPercentageOfService: 30,
      }];
    }
    return [];
  };

  const [assignedTechs, setAssignedTechs] = useState<TechAssignmentItem[]>(getInitialAssignments);
  const [splitPreset, setSplitPreset] = useState<'STANDARD' | 'EQUAL' | 'LEAD_HEAVY' | 'CUSTOM'>('STANDARD');
  const [scheduledDate, setScheduledDate] = useState<string>(order.scheduledDate || todayStr);
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>(order.scheduledTimeSlot || '09:00 - 11:00');
  const [dispatcherNote, setDispatcherNote] = useState<string>('');

  const timeSlots = [
    '08:30 - 10:30',
    '10:30 - 12:30',
    '13:30 - 15:30',
    '15:30 - 17:30',
  ];

  // Auto calculate split percentages from totalServicePrice (Nilai Pengerjaan)
  const applySplitPreset = (techList: TechAssignmentItem[], preset: 'STANDARD' | 'EQUAL' | 'LEAD_HEAVY' | 'CUSTOM') => {
    if (techList.length === 0) return techList;
    if (techList.length === 1) {
      return [{ ...techList[0], roleInJob: 'LEAD' as const, commissionPercentageOfService: 30 }];
    }

    if (preset === 'STANDARD') {
      // Lead 25%, Assistant 15% (or 10% each for >2)
      return techList.map((t, idx) => ({
        ...t,
        roleInJob: idx === 0 ? ('LEAD' as const) : ('ASSISTANT' as const),
        commissionPercentageOfService: idx === 0 ? 25 : (techList.length === 2 ? 15 : 10),
      }));
    }

    if (preset === 'EQUAL') {
      const equalShare = techList.length <= 2 ? 20 : Math.round(40 / techList.length);
      return techList.map(t => ({
        ...t,
        commissionPercentageOfService: equalShare,
      }));
    }

    if (preset === 'LEAD_HEAVY') {
      return techList.map((t, idx) => ({
        ...t,
        roleInJob: idx === 0 ? ('LEAD' as const) : ('ASSISTANT' as const),
        commissionPercentageOfService: idx === 0 ? 30 : 10,
      }));
    }

    return techList;
  };

  // Toggle technician selection in assignment
  const handleToggleTech = (techId: string) => {
    setAssignedTechs(prev => {
      const exists = prev.some(t => t.technicianId === techId);
      let updated: TechAssignmentItem[];

      if (exists) {
        // Remove technician
        updated = prev.filter(t => t.technicianId !== techId);
        if (updated.length > 0 && !updated.some(t => t.roleInJob === 'LEAD')) {
          updated[0].roleInJob = 'LEAD';
        }
      } else {
        // Add technician
        const isFirst = prev.length === 0;
        updated = [
          ...prev,
          {
            technicianId: techId,
            roleInJob: isFirst ? 'LEAD' : 'ASSISTANT',
            commissionPercentageOfService: 15,
          }
        ];
      }

      return applySplitPreset(updated, splitPreset);
    });
  };

  // Change a technician's role (Make LEAD)
  const handleSetLead = (techId: string) => {
    setAssignedTechs(prev => {
      const updated = prev.map(t => {
        if (t.technicianId === techId) {
          return { ...t, roleInJob: 'LEAD' as const };
        }
        return { ...t, roleInJob: 'ASSISTANT' as const };
      });
      return applySplitPreset(updated, splitPreset);
    });
  };

  // Change individual percentage
  const handlePercentChange = (techId: string, value: number) => {
    setSplitPreset('CUSTOM');
    setAssignedTechs(prev => prev.map(t => {
      if (t.technicianId === techId) {
        return { ...t, commissionPercentageOfService: Math.max(0, Math.min(100, value)) };
      }
      return t;
    }));
  };

  // Switch preset
  const handlePresetChange = (preset: 'STANDARD' | 'EQUAL' | 'LEAD_HEAVY' | 'CUSTOM') => {
    setSplitPreset(preset);
    if (preset !== 'CUSTOM') {
      setAssignedTechs(prev => applySplitPreset(prev, preset));
    }
  };

  // Helper to check if technician is on duty today
  const isTechOnDuty = (techId: string) => {
    return attendanceRecords.some(a => a.technicianId === techId && a.date === todayStr && !a.clockOutTime);
  };

  // Helper to count active jobs assigned to tech on selected date
  const getTechWorkloadOnDate = (techId: string, date: string) => {
    return serviceOrders.filter(
      o => (o.technicianId === techId || o.assignedTechnicians?.some(t => t.technicianId === techId)) && 
      o.scheduledDate === date && 
      o.status !== 'SELESAI' && 
      o.status !== 'DIBATALKAN' &&
      o.id !== order.id
    ).length;
  };

  // Computations
  const totalCommissionNominal = assignedTechs.reduce((sum, t) => {
    return sum + Math.round((totalServicePrice * (t.commissionPercentageOfService || 0)) / 100);
  }, 0);
  const totalPercentageSum = assignedTechs.reduce((sum, t) => sum + (t.commissionPercentageOfService || 0), 0);
  const companyMarginNominal = Math.max(0, totalServicePrice - totalCommissionNominal);
  const companyMarginPercent = Math.max(0, 100 - totalPercentageSum);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignedTechs.length === 0) return;

    assignTechnicians(
      order.id, 
      assignedTechs.map(t => ({
        technicianId: t.technicianId,
        roleInJob: t.roleInJob,
        commissionPercentageOfService: t.commissionPercentageOfService,
        commissionSharePercent: t.commissionPercentageOfService,
      })), 
      scheduledDate, 
      scheduledTimeSlot
    );

    if (dispatcherNote.trim()) {
      const combinedNotes = order.customerNotes 
        ? `${order.customerNotes}\n[Instruksi Dispatcher]: ${dispatcherNote.trim()}`
        : `[Instruksi Dispatcher]: ${dispatcherNote.trim()}`;
      updateServiceOrder(order.id, { customerNotes: combinedNotes });
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // safe
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0F0F0F] rounded-3xl shadow-2xl overflow-hidden my-6 border border-white/15 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white/5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-blue-400">{order.orderNumber}</span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                DISPATCH MULTI-TEKNISI
              </span>
            </div>
            <h3 className="font-black text-2xl tracking-tight text-white mt-0.5">
              PENUGASAN TIM TEKNISI LAPANGAN
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleDispatch} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Order Snapshot Card */}
          <div className="p-4 bg-gradient-to-r from-blue-950/40 via-white/5 to-black border border-white/10 rounded-2xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Pelanggan</p>
                <p className="font-black text-white text-sm">{order.customerName}</p>
                {order.companyName && <p className="text-blue-400 font-bold">{order.companyName}</p>}
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Nilai Pengerjaan (Biaya Jasa Servis)</p>
                <p className="font-black text-cyan-300 text-base tabular-nums">
                  Rp {totalServicePrice.toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] text-white/50">
                  (Persentase komisi dihitung langsung dari nilai pengerjaan ini)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-white/60 pt-1 border-t border-white/5">
              <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
              <span>{order.customerAddress}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {order.serviceItems.map((item, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-black/40 border border-white/10 rounded text-[10px] font-bold text-white/80">
                  {item.categoryName} ({item.unitCount} unit) - Rp {(item.totalPrice || 0).toLocaleString('id-ID')}
                </span>
              ))}
            </div>
          </div>

          {/* Multi-Technician Selection List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-black uppercase tracking-wider text-white/90 block text-xs">
                  Pilih Teknisi Bertugas ({assignedTechs.length} Dipilih)
                </label>
                <p className="text-[10px] text-white/50">
                  Centang lebih dari 1 teknisi untuk tugas tim. Komisi dihitung dari nilai pengerjaan jasa.
                </p>
              </div>

              {assignedTechs.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/10">
                  <span className="text-[10px] font-bold text-white/60 px-1">Skema %:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('STANDARD')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer ${
                      splitPreset === 'STANDARD' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Lead 25% : Asisten 15%
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('LEAD_HEAVY')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer ${
                      splitPreset === 'LEAD_HEAVY' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Lead 30% : Asisten 10%
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('EQUAL')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer ${
                      splitPreset === 'EQUAL' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Bagi Rata (20% / org)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('CUSTOM')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer ${
                      splitPreset === 'CUSTOM' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Kustom %
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {technicians.map(tech => {
                const assignment = assignedTechs.find(t => t.technicianId === tech.id);
                const isSelected = !!assignment;
                const isLead = assignment?.roleInJob === 'LEAD';
                const onDuty = isTechOnDuty(tech.id);
                const workload = getTechWorkloadOnDate(tech.id, scheduledDate);
                
                // Calculated share of commission directly from totalServicePrice
                const techPercent = assignment ? assignment.commissionPercentageOfService : 0;
                const estimatedComm = Math.round((totalServicePrice * techPercent) / 100);

                return (
                  <div
                    key={tech.id}
                    className={`p-4 rounded-2xl border-2 transition flex flex-col gap-3 ${
                      isSelected 
                        ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10' 
                        : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Avatar & Info */}
                      <div 
                        onClick={() => handleToggleTech(tech.id)} 
                        className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                      >
                        <div className="relative shrink-0">
                          <img 
                            src={tech.avatar} 
                            alt={tech.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-white/20"
                          />
                          {onDuty && (
                            <span 
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-black rounded-full"
                              title="On-Duty (Presensi GPS Aktif)"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-white text-sm">{tech.name}</h4>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                              ★ {tech.rating || '5.0'}
                            </span>
                            {onDuty ? (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                🟢 On-Duty GPS
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-white/40">
                                ⚪ Belum Presensi
                              </span>
                            )}
                          </div>

                          <p className="text-white/50 text-[11px] mt-0.5">
                            {tech.phone} • {tech.totalJobsCompleted || 0} Servis Tuntas
                          </p>

                          {tech.specialization && tech.specialization.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tech.specialization.map((spec, i) => (
                                <span key={i} className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-medium">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Select Checkbox & Status */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-white/40 block">Beban Tanggal Ini:</span>
                          <span className={`font-black text-xs ${workload > 2 ? 'text-amber-400' : 'text-white'}`}>
                            {workload === 0 ? 'Tersedia (0 Job)' : `${workload} Job Terjadwal`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleTech(tech.id)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-400 text-white shadow-md' 
                              : 'border-white/30 text-transparent hover:border-white/60'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 fill-white text-blue-600" />
                        </button>
                      </div>
                    </div>

                    {/* Role & Commission Sharing Options when Selected */}
                    {isSelected && (
                      <div className="pt-3 mt-1 border-t border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-3 rounded-xl">
                        {/* Role selection */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white/60">Peran:</span>
                          <button
                            type="button"
                            onClick={() => handleSetLead(tech.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition cursor-pointer ${
                              isLead 
                                ? 'bg-amber-500 text-black shadow-md' 
                                : 'bg-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            Teknisi Utama (Lead)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAssignedTechs(prev => prev.map(t => t.technicianId === tech.id ? { ...t, roleInJob: 'ASSISTANT' as const } : t));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                              !isLead 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            Asisten
                          </button>
                        </div>

                        {/* Commission Percentage & Rp Value calculated from Nilai Pengerjaan */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-white/60">% dr Jasa:</span>
                            <div className="flex items-center bg-black border border-white/20 rounded-lg px-2 py-0.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={techPercent}
                                onChange={e => handlePercentChange(tech.id, parseInt(e.target.value) || 0)}
                                className="w-10 bg-transparent text-right font-black text-white text-xs outline-none"
                              />
                              <span className="text-white/60 font-bold ml-0.5">%</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] text-white/40 block">Komisi Didapat</span>
                            <span className="text-xs font-black text-emerald-400 tabular-nums">
                              Rp {estimatedComm.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary Box Breakdown */}
            {assignedTechs.length > 0 && (
              <div className="p-3.5 bg-black/60 border border-white/15 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40">
                  Ringkasan Bagi Hasil Nilai Pengerjaan Servis
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white/5 rounded-xl">
                    <span className="text-[10px] text-white/50 block">Nilai Pengerjaan</span>
                    <span className="font-black text-white">Rp {totalServicePrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="text-[10px] text-emerald-300 block">Total Komisi ({totalPercentageSum}%)</span>
                    <span className="font-black text-emerald-400">Rp {totalCommissionNominal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-blue-300 block">Margin Jasa Toko ({companyMarginPercent}%)</span>
                    <span className="font-black text-blue-400">Rp {companyMarginNominal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Adjustment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Tanggal Kunjungan Servis</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/15 rounded-xl text-white font-bold text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Slot Waktu Kedatangan</label>
              <select
                value={scheduledTimeSlot}
                onChange={e => setScheduledTimeSlot(e.target.value)}
                className="w-full p-2.5 bg-black border border-white/15 rounded-xl text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot} WIB</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dispatcher Notes */}
          <div>
            <label className="block font-black uppercase tracking-wider text-white/60 mb-1">
              Catatan Khusus / Instruksi Dispatcher (Opsional)
            </label>
            <input
              type="text"
              value={dispatcherNote}
              onChange={e => setDispatcherNote(e.target.value)}
              placeholder="Contoh: Bawa tangga lipat 3m, split tugas 1 teknisi cuci indoor, 1 teknisi cek outdoor & freon"
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/40 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={assignedTechs.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Tugaskan {assignedTechs.length} Teknisi Bertugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
