import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, TechnicalReport, SparePartUsed } from '../../types';
import { CameraPhotoCaptureModal } from '../common/CameraPhotoCaptureModal';
import { 
  X, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  Camera, 
  Gauge, 
  Thermometer, 
  CheckSquare, 
  Plus, 
  Package, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Building2,
  Smartphone,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SignaturePad } from '../common/SignaturePad';
import { compressImage, compressImageList } from '../../utils/imageCompressor';

interface TechnicianJobExecutionModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const TechnicianJobExecutionModal: React.FC<TechnicianJobExecutionModalProps> = ({
  order,
  onClose,
}) => {
  const { inventory, completeTechnicianJob, showNotification } = useApp();

  // Technical readings
  const [initialPsi, setInitialPsi] = useState<number>(order.technicalReport?.initialFreonPressurePsi || 90);
  const [finalPsi, setFinalPsi] = useState<number>(order.technicalReport?.finalFreonPressurePsi || 140);
  const [ampere, setAmpere] = useState<number>(order.technicalReport?.ampereReading || 3.2);
  const [initialTemp, setInitialTemp] = useState<number>(order.technicalReport?.initialTempCelsius || 25);
  const [finalTemp, setFinalTemp] = useState<number>(order.technicalReport?.finalTempCelsius || 16.5);

  // Checklists
  const [cleanIndoor, setCleanIndoor] = useState<boolean>(true);
  const [cleanOutdoor, setCleanOutdoor] = useState<boolean>(true);
  const [drainageChecked, setDrainageChecked] = useState<boolean>(true);
  const [electricalChecked, setElectricalChecked] = useState<boolean>(true);
  const [technicianNotes, setTechnicianNotes] = useState<string>(
    order.technicalReport?.notes || 'Pembersihan evaporator dan condensor tuntas. Jalur pembuangan air lancar, parameter tekanan freon dan ampere stabil normal.'
  );

  // Photos (Before & After)
  const [beforePhotos, setBeforePhotos] = useState<string[]>(
    order.technicalReport?.beforePhotos || []
  );
  const [afterPhotos, setAfterPhotos] = useState<string[]>(
    order.technicalReport?.afterPhotos || []
  );

  // Native Camera and File Input Refs
  const nativeCameraBeforeRef = useRef<HTMLInputElement>(null);
  const nativeCameraAfterRef = useRef<HTMLInputElement>(null);
  const nativeCameraPaymentRef = useRef<HTMLInputElement>(null);

  // Camera Modal State
  const [cameraModalConfig, setCameraModalConfig] = useState<{
    isOpen: boolean;
    target: 'before' | 'after' | 'paymentProof';
    title: string;
    description: string;
  }>({
    isOpen: false,
    target: 'before',
    title: '',
    description: '',
  });

  // Spare parts used from inventory
  const [selectedParts, setSelectedParts] = useState<SparePartUsed[]>(order.sparePartsUsed || []);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(inventory[0]?.id || '');
  const [partQty, setPartQty] = useState<number>(1);

  // Customer signature
  const [customerSignature, setCustomerSignature] = useState<string>(order.technicalReport?.customerSignature || '');

  // Payment Details from Technician
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'TEMPO_KANTOR'>(order.paymentMethod || 'TUNAI');
  const totalPartsPrice = selectedParts.reduce((sum, p) => sum + p.totalPrice, 0);
  const estimatedGrandTotal = Math.max(0, order.totalServicePrice + totalPartsPrice - order.discountAmount);
  const [paymentAmountReceived, setPaymentAmountReceived] = useState<number>(order.paymentAmountReceived ?? estimatedGrandTotal);
  const [paymentProofPhoto, setPaymentProofPhoto] = useState<string>(order.paymentProofPhoto || '');
  const [paymentNotes, setPaymentNotes] = useState<string>(order.paymentNotes || '');

  // Is Submitting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle direct camera capture modal
  const handleOpenLiveCamera = (target: 'before' | 'after' | 'paymentProof') => {
    let title = 'Ambil Foto Kondisi Sebelum Servis';
    let description = 'Arahkan kamera ke unit AC sebelum dibongkar atau dibersihkan.';

    if (target === 'after') {
      title = 'Ambil Foto Kondisi Sesudah Servis';
      description = 'Arahkan kamera ke unit AC yang telah bersih dan selesai dirapikan.';
    } else if (target === 'paymentProof') {
      title = 'Ambil Foto Bukti Pembayaran / Struk / Kuitansi';
      description = 'Arahkan kamera ke struk transfer bank, bukti bayar tunai, atau nota fisik.';
    }

    setCameraModalConfig({
      isOpen: true,
      target,
      title,
      description,
    });
  };

  const handleCaptureFromModal = (compressedDataUrl: string) => {
    if (cameraModalConfig.target === 'before') {
      setBeforePhotos(prev => [...prev, compressedDataUrl]);
    } else if (cameraModalConfig.target === 'after') {
      setAfterPhotos(prev => [...prev, compressedDataUrl]);
    } else if (cameraModalConfig.target === 'paymentProof') {
      setPaymentProofPhoto(compressedDataUrl);
    }
    showNotification('Foto berhasil ditangkap dan dikompres untuk sinkronisasi cloud!', 'success');
  };

  // Handle photo upload from file picker / native camera
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'paymentProof') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    try {
      const compressed = await compressImage(file, 720, 720, 0.65);
      if (type === 'before') {
        setBeforePhotos(prev => [...prev, compressed]);
      } else if (type === 'after') {
        setAfterPhotos(prev => [...prev, compressed]);
      } else if (type === 'paymentProof') {
        setPaymentProofPhoto(compressed);
      }
      showNotification('Foto berhasil diproses & dikompres (~30KB)', 'success');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setBeforePhotos(prev => prev.filter((_, idx) => idx !== index));
    } else {
      setAfterPhotos(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleAddPart = () => {
    const item = inventory.find(i => i.id === selectedInventoryId);
    if (!item) return;

    if (item.stock < partQty) {
      showNotification(`Stok ${item.name} tidak mencukupi (sisa: ${item.stock})`, 'warning');
      return;
    }

    const existingIdx = selectedParts.findIndex(p => p.inventoryItemId === item.id);
    if (existingIdx >= 0) {
      setSelectedParts(prev => prev.map((p, idx) => {
        if (idx === existingIdx) {
          const newQty = p.quantity + partQty;
          return {
            ...p,
            quantity: newQty,
            totalPrice: newQty * p.unitPrice,
          };
        }
        return p;
      }));
    } else {
      setSelectedParts(prev => [
        ...prev,
        {
          inventoryItemId: item.id,
          name: item.name,
          code: item.code,
          quantity: partQty,
          unit: item.unit,
          unitPrice: item.sellingPrice,
          totalPrice: partQty * item.sellingPrice,
        }
      ]);
    }
  };

  const handleRemovePart = (id: string) => {
    setSelectedParts(prev => prev.filter(p => p.inventoryItemId !== id));
  };

  const handleSubmitCompletion = async () => {
    setIsSubmitting(true);

    try {
      // Compress all photos to ensure strict Firestore limit (<1MB) compliance
      const cleanBeforePhotos = await compressImageList(beforePhotos);
      const cleanAfterPhotos = await compressImageList(afterPhotos);
      const cleanPaymentProof = paymentProofPhoto ? await compressImage(paymentProofPhoto, 720, 720, 0.65) : undefined;

      const report: TechnicalReport = {
        initialFreonPressurePsi: Number(initialPsi) || 0,
        finalFreonPressurePsi: Number(finalPsi) || 0,
        ampereReading: Number(ampere) || 0,
        initialTempCelsius: Number(initialTemp) || 0,
        finalTempCelsius: Number(finalTemp) || 0,
        cleaningDoneIndoor: cleanIndoor,
        cleaningDoneOutdoor: cleanOutdoor,
        drainageChecked: drainageChecked,
        electricalChecked: electricalChecked,
        beforePhotos: cleanBeforePhotos,
        afterPhotos: cleanAfterPhotos,
        notes: technicianNotes,
        customerSignature: customerSignature || undefined,
        completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      completeTechnicianJob(order.id, report, selectedParts, {
        paymentMethod,
        paymentAmountReceived: paymentMethod === 'TEMPO_KANTOR' ? 0 : paymentAmountReceived,
        paymentProofPhoto: cleanPaymentProof,
        paymentNotes: paymentNotes || undefined,
      });

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // safe
      }

      onClose();
    } catch (err) {
      console.error('Failed to submit completion:', err);
      showNotification('Terjadi kendala saat menyimpan laporan. Silakan coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Hidden Native Camera & File Pickers */}
      <input
        type="file"
        ref={nativeCameraBeforeRef}
        accept="image/*"
        capture="environment"
        onChange={e => handlePhotoUpload(e, 'before')}
        className="hidden"
      />
      <input
        type="file"
        ref={nativeCameraAfterRef}
        accept="image/*"
        capture="environment"
        onChange={e => handlePhotoUpload(e, 'after')}
        className="hidden"
      />
      <input
        type="file"
        ref={nativeCameraPaymentRef}
        accept="image/*"
        capture="environment"
        onChange={e => handlePhotoUpload(e, 'paymentProof')}
        className="hidden"
      />

      <div className="relative w-full max-w-3xl bg-[#0F0F0F] rounded-3xl shadow-2xl overflow-hidden my-6 border border-white/15 text-white">
        {/* Header with Bold Typography */}
        <div className="flex items-center justify-between px-6 py-5 bg-white/5 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500 font-bold mb-0.5">
              Field Execution & Quality Assurance
            </p>
            <h3 className="font-black text-2xl tracking-tight text-white leading-tight">
              LEMBAR KERJA & BUKTI FOTO SERVIS
            </h3>
            <p className="text-xs text-white/50">{order.orderNumber} • {order.customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Order Snapshot */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/40">Unit AC Pelanggan</span>
              <p className="font-bold text-white text-sm">{order.serviceItemName}</p>
              <p className="text-xs text-white/60">{order.customerAddress}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-white/40">Nilai Jasa Servis</span>
              <p className="text-base font-black text-blue-400">
                Rp {order.totalServicePrice.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Technical Diagnostics */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Gauge className="w-4 h-4" />
              <p className="font-black text-xs uppercase tracking-wider text-white">1. Parameter Pengukuran Teknis</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Tekanan Awal (PSI)</label>
                <input
                  type="number"
                  value={initialPsi}
                  onChange={e => setInitialPsi(Number(e.target.value))}
                  className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Tekanan Akhir (PSI)</label>
                <input
                  type="number"
                  value={finalPsi}
                  onChange={e => setFinalPsi(Number(e.target.value))}
                  className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Arus Kompresor (Ampere)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ampere}
                  onChange={e => setAmpere(Number(e.target.value))}
                  className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Suhu Udara Dingin (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={finalTemp}
                  onChange={e => setFinalTemp(Number(e.target.value))}
                  className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckSquare className="w-4 h-4" />
              <p className="font-black text-xs uppercase tracking-wider text-white">2. Standar Pengerjaan (SOP)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanIndoor}
                  onChange={e => setCleanIndoor(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span>Cuci Evaporator, Filter & Casing Indoor</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanOutdoor}
                  onChange={e => setCleanOutdoor(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span>Cuci Kondensor & Kipas Outdoor</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={drainageChecked}
                  onChange={e => setDrainageChecked(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span>Cek Jalur Drainase & Bebas Sumbatan</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={electricalChecked}
                  onChange={e => setElectricalChecked(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span>Cek Kelistrikan & Kapasitor Kompresor</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Catatan Diagnosa & Pekerjaan</label>
              <textarea
                rows={2}
                value={technicianNotes}
                onChange={e => setTechnicianNotes(e.target.value)}
                className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-white text-xs"
                placeholder="Catatan kondisi unit atau temuan penting..."
              />
            </div>
          </div>

          {/* Photos Upload & Direct Camera (Before & After) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black text-xs uppercase tracking-wider text-white">
                  3. Bukti Foto Pengerjaan (Before & After)
                </p>
                <p className="text-[11px] text-white/50">Foto otomatis dikompres ke cloud database tanpa hambatan.</p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-Sync Cloud
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BEFORE PHOTOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-amber-300">
                    Foto SEBELUM Servis (Before)
                  </label>
                  <span className="text-[10px] text-white/40">{beforePhotos.length} Foto</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {beforePhotos.map((url, idx) => (
                    <div key={idx} className="relative group h-24 rounded-xl overflow-hidden border border-white/10 bg-black">
                      <img src={url} alt="Before" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('before', idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md text-[10px] opacity-80 group-hover:opacity-100 transition shadow cursor-pointer"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* 1. Native Camera HP Shutter Button */}
                  <button
                    type="button"
                    onClick={() => nativeCameraBeforeRef.current?.click()}
                    className="h-24 border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition text-center p-2"
                  >
                    <Smartphone className="w-5 h-5 mb-1 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Kamera HP</span>
                    <span className="text-[8px] text-white/40">Buka Kamera</span>
                  </button>

                  {/* 2. WebRTC Live Camera Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenLiveCamera('before')}
                    className="h-24 border border-dashed border-blue-500/30 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition text-center p-2"
                  >
                    <Camera className="w-5 h-5 mb-1 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Live Web</span>
                    <span className="text-[8px] text-white/40">Viewfinder</span>
                  </button>

                  {/* 3. File Upload Button */}
                  <label className="h-24 border border-dashed border-white/20 hover:border-white/40 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-black/40 text-white/40 hover:text-white transition text-center p-2">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Pilih Galeri</span>
                    <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'before')} className="hidden" />
                  </label>
                </div>
              </div>

              {/* AFTER PHOTOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-emerald-300">
                    Foto SESUDAH Servis (After)
                  </label>
                  <span className="text-[10px] text-white/40">{afterPhotos.length} Foto</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {afterPhotos.map((url, idx) => (
                    <div key={idx} className="relative group h-24 rounded-xl overflow-hidden border border-white/10 bg-black">
                      <img src={url} alt="After" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('after', idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md text-[10px] opacity-80 group-hover:opacity-100 transition shadow cursor-pointer"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* 1. Native Camera HP Shutter Button */}
                  <button
                    type="button"
                    onClick={() => nativeCameraAfterRef.current?.click()}
                    className="h-24 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition text-center p-2"
                  >
                    <Smartphone className="w-5 h-5 mb-1 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Kamera HP</span>
                    <span className="text-[8px] text-white/40">Buka Kamera</span>
                  </button>

                  {/* 2. WebRTC Live Camera Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenLiveCamera('after')}
                    className="h-24 border border-dashed border-blue-500/30 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition text-center p-2"
                  >
                    <Camera className="w-5 h-5 mb-1 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Live Web</span>
                    <span className="text-[8px] text-white/40">Viewfinder</span>
                  </button>

                  {/* 3. File Upload Button */}
                  <label className="h-24 border border-dashed border-white/20 hover:border-white/40 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-black/40 text-white/40 hover:text-white transition text-center p-2">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Pilih Galeri</span>
                    <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'after')} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Spare Parts Integration */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="font-black text-xs uppercase tracking-wider text-white">4. Pemakaian Suku Cadang dari Gudang (Jika Ada)</p>
            <div className="flex gap-2">
              <select
                value={selectedInventoryId}
                onChange={e => setSelectedInventoryId(e.target.value)}
                className="flex-1 p-2 bg-black border border-white/20 rounded-xl text-white font-bold text-xs"
              >
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Stok: {item.stock} {item.unit}) - Rp {item.sellingPrice.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={partQty}
                onChange={e => setPartQty(Number(e.target.value))}
                className="w-16 p-2 bg-black border border-white/20 rounded-xl text-center font-bold text-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            {selectedParts.length > 0 && (
              <div className="space-y-2 mt-2">
                {selectedParts.map(p => (
                  <div key={p.inventoryItemId} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-white/50 ml-2">x{p.quantity} {p.unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-bold">
                        Rp {p.totalPrice.toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(p.inventoryItemId)}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right text-xs pt-1">
                  <span className="text-white/50">Total Suku Cadang: </span>
                  <span className="font-black text-emerald-400 font-mono">
                    Rp {totalPartsPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method & Proof of Payment from Field */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-black text-xs uppercase tracking-wider text-white">
                5. Pembayaran dari Pelanggan di Lapangan
              </p>
              <span className="text-xs font-black text-emerald-400">
                Grand Total: Rp {estimatedGrandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('TUNAI')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'TUNAI'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Banknote className="w-5 h-5 mb-2 text-emerald-400" />
                <div>
                  <span className="text-xs font-black block">Tunai (Cash)</span>
                  <span className="text-[9px] text-white/50">Diterima langsung</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER_BANK')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'TRANSFER_BANK'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-2 text-blue-400" />
                <div>
                  <span className="text-xs font-black block">Transfer Bank</span>
                  <span className="text-[9px] text-white/50">BCA/Mandiri/BRI</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'QRIS'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <QrCode className="w-5 h-5 mb-2 text-purple-400" />
                <div>
                  <span className="text-xs font-black block">QRIS Dinamis</span>
                  <span className="text-[9px] text-white/50">Scan barcode</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TEMPO_KANTOR')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'TEMPO_KANTOR'
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-md'
                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Building2 className="w-5 h-5 mb-2 text-amber-400" />
                <div>
                  <span className="text-xs font-black block">Tempo Kantor</span>
                  <span className="text-[9px] text-white/50">Invoice B2B</span>
                </div>
              </button>
            </div>

            {/* Nominal Received and Notes */}
            {paymentMethod !== 'TEMPO_KANTOR' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                    Nominal Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={paymentAmountReceived}
                    onChange={e => setPaymentAmountReceived(Number(e.target.value))}
                    className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-emerald-400 font-black text-sm"
                  />
                  <p className="text-[10px] text-white/40 mt-1">
                    Estimasi Total Servis: Rp {estimatedGrandTotal.toLocaleString('id-ID')}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                    Catatan Pembayaran Teknisi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Diterima tunai pas oleh Pak Rian"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full p-2.5 bg-black border border-white/20 rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* Proof of Payment Photo Upload & Direct Camera */}
            <div className="pt-2">
              <label className="block text-[10px] uppercase font-bold text-white/60 mb-2">
                Foto Bukti Pembayaran / Struk Transfer / Kuitansi Fisik
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {paymentProofPhoto ? (
                  <div className="relative group">
                    <img
                      src={paymentProofPhoto}
                      alt="Bukti Bayar"
                      className="h-20 w-28 object-cover rounded-xl border-2 border-emerald-500/40 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentProofPhoto('')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs cursor-pointer shadow"
                      title="Hapus foto bukti bayar"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Native Camera HP */}
                    <button
                      type="button"
                      onClick={() => nativeCameraPaymentRef.current?.click()}
                      className="h-14 px-4 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl flex items-center gap-2 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Kamera HP</span>
                    </button>

                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenLiveCamera('paymentProof')}
                      className="h-14 px-4 border border-dashed border-blue-500/30 hover:border-blue-500 rounded-xl flex items-center gap-2 cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition"
                    >
                      <Camera className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Live Web</span>
                    </button>

                    {/* File / Gallery Upload */}
                    <label className="h-14 px-4 border border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center gap-2 cursor-pointer bg-black/40 text-white/50 hover:text-white transition">
                      <Upload className="w-4 h-4 text-white/70" />
                      <span className="text-[11px] font-bold">Pilih Galeri</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handlePhotoUpload(e, 'paymentProof')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                <div className="text-[10px] text-white/40 max-w-xs">
                  ℹ️ Foto bukti pembayaran langsung terunggah dan diverifikasi admin kantor.
                </div>
              </div>
            </div>
          </div>

          {/* Customer Signature Pad */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="font-black text-xs uppercase tracking-wider text-white">6. Tanda Tangan Digital Pelanggan (Serah Terima)</p>
            <SignaturePad onSave={setCustomerSignature} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase text-xs cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={handleSubmitCompletion}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Menyimpan & Sinkron Cloud...' : 'Konfirmasi Pengerjaan Selesai'}
          </button>
        </div>
      </div>

      {/* Reusable Camera Capture Modal */}
      <CameraPhotoCaptureModal
        isOpen={cameraModalConfig.isOpen}
        onClose={() => setCameraModalConfig(prev => ({ ...prev, isOpen: false }))}
        onCapture={handleCaptureFromModal}
        title={cameraModalConfig.title}
        description={cameraModalConfig.description}
      />
    </div>
  );
};
