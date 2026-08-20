import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, TechnicalReport, SparePartUsed } from '../../types';
import { SignaturePad } from '../common/SignaturePad';
import { CameraPhotoCaptureModal } from '../common/CameraPhotoCaptureModal';
import { compressImage } from '../../utils/imageCompressor';
import { 
  X, 
  Wrench, 
  Gauge, 
  Camera, 
  CheckCircle2, 
  Boxes, 
  Plus, 
  Trash2, 
  Zap, 
  FileCheck, 
  Coins, 
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TechnicianJobExecutionModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const TechnicianJobExecutionModal: React.FC<TechnicianJobExecutionModalProps> = ({ order, onClose }) => {
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

  // Photos (Before & After) with default realistic sample photos & custom file upload
  const [beforePhotos, setBeforePhotos] = useState<string[]>(
    order.technicalReport?.beforePhotos && order.technicalReport.beforePhotos.length > 0
      ? order.technicalReport.beforePhotos
      : ['https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=500&auto=format&fit=crop&q=80']
  );
  const [afterPhotos, setAfterPhotos] = useState<string[]>(
    order.technicalReport?.afterPhotos && order.technicalReport.afterPhotos.length > 0
      ? order.technicalReport.afterPhotos
      : ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80']
  );

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

  // Handle direct camera capture
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
    showNotification('Foto dari kamera berhasil disimpan!', 'success');
  };

  // Handle photo upload from file picker (with automatic compression)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'paymentProof') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      if (type === 'before') {
        setBeforePhotos(prev => [...prev, compressed]);
      } else if (type === 'after') {
        setAfterPhotos(prev => [...prev, compressed]);
      } else if (type === 'paymentProof') {
        setPaymentProofPhoto(compressed);
      }
      showNotification('Foto berhasil diunggah & dikompres', 'success');
    } catch (err) {
      console.error('Upload error:', err);
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

  const handleSubmitCompletion = () => {
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
      beforePhotos,
      afterPhotos,
      notes: technicianNotes,
      customerSignature: customerSignature || undefined,
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    completeTechnicianJob(order.id, report, selectedParts, {
      paymentMethod,
      paymentAmountReceived: paymentMethod === 'TEMPO_KANTOR' ? 0 : paymentAmountReceived,
      paymentProofPhoto: paymentProofPhoto || undefined,
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
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

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs text-white/80">
          {/* Technical Diagnostics */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="font-black text-xs uppercase tracking-wider text-white">1. Parameter Pengukuran Teknis AC</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Tekanan Freon Awal (PSI)</label>
                <input
                  type="number"
                  value={initialPsi}
                  onChange={e => setInitialPsi(Number(e.target.value))}
                  className="w-full p-2 bg-black border border-white/20 rounded-xl text-white font-black"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Tekanan Freon Akhir (PSI)</label>
                <input
                  type="number"
                  value={finalPsi}
                  onChange={e => setFinalPsi(Number(e.target.value))}
                  className="w-full p-2 bg-black border border-white/20 rounded-xl text-emerald-400 font-black"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Arus Listrik (Ampere)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ampere}
                  onChange={e => setAmpere(Number(e.target.value))}
                  className="w-full p-2 bg-black border border-white/20 rounded-xl text-amber-400 font-black"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Suhu Udara Dingin (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={finalTemp}
                  onChange={e => setFinalTemp(Number(e.target.value))}
                  className="w-full p-2 bg-black border border-white/20 rounded-xl text-blue-400 font-black"
                />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="font-black text-xs uppercase tracking-wider text-white">2. Checklist SOP Standar KoolFix</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input type="checkbox" checked={cleanIndoor} onChange={e => setCleanIndoor(e.target.checked)} className="rounded" />
                <span>Pencucian Indoor & Filter Evaporator</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input type="checkbox" checked={cleanOutdoor} onChange={e => setCleanOutdoor(e.target.checked)} className="rounded" />
                <span>Pembersihan Condenser Outdoor Unit</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input type="checkbox" checked={drainageChecked} onChange={e => setDrainageChecked(e.target.checked)} className="rounded" />
                <span>Uji Kelancaran Selang Drainase</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/5 cursor-pointer">
                <input type="checkbox" checked={electricalChecked} onChange={e => setElectricalChecked(e.target.checked)} className="rounded" />
                <span>Pengecekan Terminal Listrik & Sensor</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Catatan Teknis Pengerjaan</label>
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
            <div className="flex items-center justify-between">
              <p className="font-black text-xs uppercase tracking-wider text-white">3. Bukti Foto Pengerjaan (Kamera Langsung / File)</p>
              <span className="text-[10px] text-blue-400 font-bold">Mendukung Kamera Langsung & Kompresi Otomatis</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BEFORE PHOTOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-white/60">Foto Kondisi SEBELUM (Before)</label>
                  <span className="text-[10px] text-white/40">{beforePhotos.length} Foto</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {beforePhotos.map((url, idx) => (
                    <div key={idx} className="relative group h-24 rounded-xl overflow-hidden border border-white/10">
                      <img src={url} alt="Before" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('before', idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md text-[10px] opacity-80 group-hover:opacity-100 transition shadow"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Direct Camera Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenLiveCamera('before')}
                    className="h-24 border-2 border-dashed border-blue-500/40 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition"
                  >
                    <Camera className="w-5 h-5 mb-1 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Kamera Langsung</span>
                  </button>

                  {/* File Upload Button */}
                  <label className="h-24 border border-dashed border-white/20 hover:border-white/40 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-black/40 text-white/40 hover:text-white transition">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Pilih Galeri</span>
                    <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'before')} className="hidden" />
                  </label>
                </div>
              </div>

              {/* AFTER PHOTOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-white/60">Foto Kondisi SESUDAH (After)</label>
                  <span className="text-[10px] text-white/40">{afterPhotos.length} Foto</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {afterPhotos.map((url, idx) => (
                    <div key={idx} className="relative group h-24 rounded-xl overflow-hidden border border-white/10">
                      <img src={url} alt="After" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('after', idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md text-[10px] opacity-80 group-hover:opacity-100 transition shadow"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Direct Camera Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenLiveCamera('after')}
                    className="h-24 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition"
                  >
                    <Camera className="w-5 h-5 mb-1 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Kamera Langsung</span>
                  </button>

                  {/* File Upload Button */}
                  <label className="h-24 border border-dashed border-white/20 hover:border-white/40 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-black/40 text-white/40 hover:text-white transition">
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
                className="flex-1 p-2 bg-black border border-white/20 rounded-xl text-white font-bold"
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
                className="w-16 p-2 bg-black border border-white/20 rounded-xl text-center font-bold text-white"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase text-xs"
              >
                + Tambah
              </button>
            </div>

            {selectedParts.length > 0 && (
              <div className="divide-y divide-white/5 pt-2">
                {selectedParts.map(p => (
                  <div key={p.inventoryItemId} className="py-1.5 flex justify-between items-center text-xs">
                    <span className="text-white">{p.name} x{p.quantity} {p.unit}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-emerald-400">Rp {p.totalPrice.toLocaleString('id-ID')}</span>
                      <button onClick={() => handleRemovePart(p.inventoryItemId)} className="text-red-400">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method & Proof of Payment from Technician */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-xs uppercase tracking-wider text-white">5. Metode Pembayaran & Bukti Setoran</p>
                <p className="text-[11px] text-white/50">Pilih metode pembayaran yang diterima langsung dari pelanggan di lokasi</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Verifikasi Admin
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'TUNAI', label: 'Tunai (Cash)', icon: '💵' },
                { key: 'TRANSFER_BANK', label: 'Transfer Bank', icon: '🏦' },
                { key: 'QRIS', label: 'Scan QRIS', icon: '📱' },
                { key: 'TEMPO_KANTOR', label: 'Tempo Kantor', icon: '🏢' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPaymentMethod(opt.key as any)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    paymentMethod === opt.key 
                      ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl mb-1">{opt.icon}</span>
                  <span className="text-xs font-black">{opt.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod !== 'TEMPO_KANTOR' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                    Nominal Pembayaran Diterima (Rp)
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
                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenLiveCamera('paymentProof')}
                      className="h-16 px-4 border-2 border-dashed border-blue-500/40 hover:border-blue-500 rounded-xl flex items-center gap-2 cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition"
                    >
                      <Camera className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Kamera Langsung</span>
                    </button>

                    {/* File / Gallery Upload */}
                    <label className="h-16 px-4 border border-dashed border-white/20 hover:border-white/40 rounded-xl flex items-center gap-2 cursor-pointer bg-black/40 text-white/50 hover:text-white transition">
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
                  ℹ️ Admin kantor akan memverifikasi status 'LUNAS' berdasarkan bukti foto & metode pembayaran ini.
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
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase text-xs"
          >
            Batal
          </button>

          <button
            onClick={handleSubmitCompletion}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Konfirmasi Pengerjaan Selesai
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
