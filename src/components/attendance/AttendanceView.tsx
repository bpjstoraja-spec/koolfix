import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord } from '../../types';
import { 
  UserCheck, 
  MapPin, 
  Clock, 
  Camera, 
  Calendar, 
  Compass, 
  RefreshCw,
  Sparkles,
  Plus,
  Trash2,
  Crown,
  AlertTriangle,
  X,
  Save,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Upload,
  Info,
  Navigation
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AttendanceView: React.FC = () => {
  const { 
    currentUser, 
    users,
    attendanceRecords, 
    clockIn, 
    clockOut, 
    addAttendanceRecord,
    deleteAttendanceRecord,
    showNotification 
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isTechnician = currentUser.role === 'TEKNISI';
  const todayStr = new Date().toISOString().split('T')[0];

  const todayAttendance = attendanceRecords.find(
    a => a.technicianId === currentUser.id && a.date === todayStr
  );

  const [currentTime, setCurrentTime] = useState(new Date());
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number }>({
    lat: -6.2088,
    lng: 106.8456,
    accuracy: 8,
  });
  const [address, setAddress] = useState('Jl. Jend. Sudirman No. 45, Jakarta Selatan');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Verification & Submission Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN');
  const [selfiePhoto, setSelfiePhoto] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isLocationAgreed, setIsLocationAgreed] = useState(false);
  const [customStreetName, setCustomStreetName] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Super Admin states
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  // Manual Add Form States
  const [selectedTechId, setSelectedTechId] = useState(users.find(u => u.role === 'TEKNISI')?.id || '');
  const [manualDate, setManualDate] = useState(todayStr);
  const [manualClockIn, setManualClockIn] = useState('08:00');
  const [manualClockOut, setManualClockOut] = useState('17:00');
  const [manualAddress, setManualAddress] = useState('Kantor Pusat Operasional KoolFix');
  const [manualAllowance, setManualAllowance] = useState(50000);

  const techniciansList = users.filter(u => u.role === 'TEKNISI');

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request actual geolocation if supported
  const fetchLiveGPS = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = Math.round(position.coords.accuracy);
          setCoords({
            lat,
            lng,
            accuracy: acc,
          });
          const detectedAddress = `Jl. Koordinat Presensi (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
          setAddress(detectedAddress);
          setCustomStreetName(detectedAddress);
          setIsGettingLocation(false);
          showNotification('Lokasi GPS & Geotag berhasil diperbarui!', 'success');
        },
        () => {
          setIsGettingLocation(false);
          setCustomStreetName(address);
          showNotification('Menggunakan koordinat stasiun operasional KoolFix', 'info');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((err: any) => {
              if (err.name !== 'AbortError') {
                console.warn('Attendance camera play issue:', err);
              }
            });
          }
        } catch (playErr) {
          // Ignore synchronous aborts
        }
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Akses kamera tidak diizinkan atau tidak didukung di peramban ini. Silakan gunakan opsi Ambil File Gambar / Foto.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vid = videoRef.current;
    const size = Math.min(vid.videoWidth, vid.videoHeight);
    const startX = (vid.videoWidth - size) / 2;
    const startY = (vid.videoHeight - size) / 2;
    ctx.drawImage(vid, startX, startY, size, size, 0, 0, 480, 480);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setSelfiePhoto(dataUrl);
    stopCamera();
  };

  const handleSelfieFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSelfiePhoto(result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const openAttendanceModal = (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setConfirmActionType(type);
    setCustomStreetName(address);
    setIsLocationAgreed(false);
    // Use technician avatar as initial fallback photo or empty so they must take a selfie
    setSelfiePhoto('');
    setShowConfirmModal(true);
    // Auto trigger GPS refresh and camera start
    fetchLiveGPS();
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  const handleCloseConfirmModal = () => {
    stopCamera();
    setShowConfirmModal(false);
  };

  const handleSubmitAttendanceRecord = () => {
    if (!selfiePhoto) {
      showNotification('Harap ambil foto selfie terlebih dahulu sebagai bukti kehadiran lapangan!', 'error');
      return;
    }
    if (!isLocationAgreed) {
      showNotification('Harap centang persetujuan validasi lokasi & koordinat sebelum mengirim!', 'warning');
      return;
    }

    const finalAddress = customStreetName.trim() || address;

    if (confirmActionType === 'CLOCK_IN') {
      clockIn(
        currentUser.id,
        {
          latitude: coords.lat,
          longitude: coords.lng,
          addressName: finalAddress,
          accuracyMeters: coords.accuracy,
        },
        selfiePhoto
      );

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // safe
      }
    } else {
      clockOut(currentUser.id, {
        latitude: coords.lat,
        longitude: coords.lng,
        addressName: finalAddress,
        accuracyMeters: coords.accuracy,
      });
    }

    handleCloseConfirmModal();
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold mb-1">
            Real-time GPS & Field Verification
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            ABSENSI GEOTAG
          </h2>
        </div>

        <button
          onClick={fetchLiveGPS}
          disabled={isGettingLocation}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin' : ''}`} />
          <span>Perbarui GPS</span>
        </button>
      </div>

      {/* Technician Clock In / Out Panel */}
      {isTechnician && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Big Digital Clock Card */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                  Waktu Presensi Server
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  GPS Live Active
                </span>
              </div>

              <div className="text-5xl sm:text-7xl font-black tracking-tighter tabular-nums text-white my-4">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                <span className="text-xl sm:text-2xl font-bold text-white/40 ml-2">WIB</span>
              </div>

              <p className="text-xs text-white/60 font-bold">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Geotag & Accuracy info */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">{address}</p>
                  <p className="text-white/40 text-[10px] font-mono">
                    Koordinat: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} (Radius Akurasi: ±{coords.accuracy}m)
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {!todayAttendance ? (
                <button
                  onClick={() => openAttendanceModal('CLOCK_IN')}
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Clock In Masuk (Selfie + Validasi GPS)</span>
                </button>
              ) : !todayAttendance.clockOutTime ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase">Jam Masuk Hari Ini</span>
                      <span className="text-lg font-black text-white">{todayAttendance.clockInTime} WIB</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                      AKTIF BERTUGAS
                    </span>
                  </div>

                  <button
                    onClick={() => openAttendanceModal('CLOCK_OUT')}
                    className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Clock Out Pulang</span>
                  </button>
                </div>
              ) : (
                <div className="w-full p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    ✓ Presensi Selesai ({todayAttendance.clockInTime} - {todayAttendance.clockOutTime} WIB)
                  </p>
                  <p className="text-[11px] text-white/60 mt-0.5">Uang kehadiran hari ini otomatis masuk ke slip gaji & komisi.</p>
                </div>
              )}
            </div>
          </div>

          {/* Selfie Preview & Rule Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-2">
                Verifikasi Foto Lapangan Terakhir
              </span>
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 bg-black">
                <img
                  src={todayAttendance?.clockInPhoto || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                  alt="Selfie Presensi"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-mono text-cyan-300">
                  📍 Verified Geotag
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-white/60">
              <p className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Ketentuan Wajib Presensi:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Wajib mengambil <strong>foto selfie langsung</strong> di lokasi tugas.</li>
                <li>Koordinat dan nama jalan akan ditampilkan untuk konfirmasi sebelum pengiriman.</li>
                <li>Uang kehadiran otomatis dihitung ke slip gaji bulanan teknisi.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Log Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">Log Riwayat Presensi & Geotag Seluruh Tim</h3>
            <p className="text-xs text-white/50">{attendanceRecords.length} Catatan Presensi Tercatat</p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setShowAddManualModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Presensi Manual</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/70 font-black uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Foto Selfie</th>
                <th className="py-3 px-4">Nama Teknisi</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Keluar</th>
                <th className="py-3 px-4">Lokasi Geotag / Alamat</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isSuperAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendanceRecords.map(record => (
                <tr key={record.id} className="hover:bg-white/5">
                  <td className="py-2.5 px-4">
                    {record.clockInPhoto ? (
                      <div className="relative group w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                        <img
                          src={record.clockInPhoto}
                          alt={record.technicianName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/30 italic">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{record.technicianName}</td>
                  <td className="py-3 px-4 font-mono text-white/70">{record.date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{record.clockInTime} WIB</td>
                  <td className="py-3 px-4 font-mono text-white/60">{record.clockOutTime ? `${record.clockOutTime} WIB` : 'Bertugas'}</td>
                  <td className="py-3 px-4 text-white/60 max-w-xs truncate font-mono text-[11px]">{record.clockInLocation?.addressName || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      TERVALIDASI
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setRecordToDelete(record)}
                        title="Hapus Presensi (Super Admin)"
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL WITH LIVE SELFIE CAMERA AND GPS LOCATION WARNING */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3 text-cyan-400">
                <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {confirmActionType === 'CLOCK_IN' ? 'Foto Selfie & Validasi Presensi Masuk' : 'Validasi Presensi Pulang'}
                  </h3>
                  <p className="text-xs text-white/50">{currentUser.name} • {todayStr}</p>
                </div>
              </div>
              <button
                onClick={handleCloseConfirmModal}
                className="p-1.5 text-white/40 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Selfie Camera Capture */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  1. Foto Selfie Lapangan (Wajib)
                </label>
                {selfiePhoto && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Foto Terambil
                  </span>
                )}
              </div>

              {selfiePhoto ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video border-2 border-emerald-500/50 bg-black group">
                  <img
                    src={selfiePhoto}
                    alt="Hasil Selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition">
                    <button
                      type="button"
                      onClick={() => {
                        setSelfiePhoto('');
                        startCamera();
                      }}
                      className="px-3 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Ambil Ulang</span>
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2.5 py-0.5 bg-black/80 rounded-lg text-[9px] font-mono text-emerald-400">
                    ✓ Selfie Valid
                  </div>
                </div>
              ) : (
                <div className="space-y-2 bg-black/60 p-3 rounded-2xl border border-white/10">
                  {cameraError ? (
                    <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-center space-y-2">
                      <p className="text-xs text-red-300">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold"
                      >
                        Pilih File Foto
                      </button>
                    </div>
                  ) : (
                    <div className="relative aspect-video max-h-52 bg-black rounded-xl overflow-hidden border border-white/20 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 rounded-full w-32 h-32 m-auto pointer-events-none" />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[9px] font-mono text-cyan-300">
                        ● Live Camera
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureSelfie}
                      className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Ambil Selfie Sekarang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSelfieFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Step 2: Warning with Coordinates and Street Name */}
            <div className="space-y-3">
              <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    2. Peringatan Validasi Lokasi & Geotag
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-amber-200/70 mb-1">
                      Nama Jalan / Lokasi Presensi:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customStreetName}
                        onChange={e => setCustomStreetName(e.target.value)}
                        placeholder="Nama jalan atau lokasi pengerjaan..."
                        className="flex-1 p-2 bg-black/60 border border-amber-500/30 rounded-xl text-xs text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={fetchLiveGPS}
                        title="Deteksi Ulang GPS"
                        className="p-2 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-black/40 rounded-xl border border-white/5 text-[11px] font-mono">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Koordinat GPS</span>
                      <span className="text-cyan-400 font-bold">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Radius Akurasi</span>
                      <span className="text-emerald-400 font-bold">±{coords.accuracy} Meter</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-amber-200/80 leading-relaxed bg-amber-950/50 p-2.5 rounded-xl border border-amber-500/20">
                  ⚠️ <strong>PENTING:</strong> Data koordinat, nama jalan, dan foto selfie Anda akan dikirim ke server dan dicocokkan dengan riwayat tugas servis lapangan.
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-white/5 border border-white/10 rounded-2xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isLocationAgreed}
                  onChange={e => setIsLocationAgreed(e.target.checked)}
                  className="mt-0.5 rounded bg-black border-white/20 text-cyan-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs text-white/80 leading-snug">
                  Saya menyatakan bahwa foto selfie dan koordinat lokasi di atas adalah benar posisi saya saat ini di lapangan.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!selfiePhoto || !isLocationAgreed}
                onClick={handleSubmitAttendanceRecord}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg ${
                  selfiePhoto && isLocationAgreed
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kirim Absensi Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Add Manual Modal */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-amber-500/40 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-white">Tambah Presensi Manual (Super Admin)</h3>
              </div>
              <button onClick={() => setShowAddManualModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const tech = users.find(u => u.id === selectedTechId);
                if (!tech) return;

                addAttendanceRecord({
                  technicianId: tech.id,
                  technicianName: tech.name,
                  date: manualDate,
                  clockInTime: manualClockIn,
                  clockOutTime: manualClockOut,
                  clockInLocation: {
                    latitude: -6.2088,
                    longitude: 106.8456,
                    addressName: manualAddress
                  },
                  clockInPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
                  dailyAllowanceEarned: manualAllowance,
                  isVerified: true
                });

                showNotification(`Presensi manual untuk ${tech.name} berhasil ditambahkan.`);
                setShowAddManualModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Pilih Teknisi</label>
                <select
                  value={selectedTechId}
                  onChange={e => setSelectedTechId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                >
                  {techniciansList.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#121212]">{t.name} ({t.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Jam Masuk</label>
                  <input
                    type="time"
                    value={manualClockIn}
                    onChange={e => setManualClockIn(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Jam Keluar</label>
                  <input
                    type="time"
                    value={manualClockOut}
                    onChange={e => setManualClockOut(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Lokasi / Alamat Tugas</label>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-white/60 mb-1">Uang Kehadiran Harian (Rp)</label>
                <input
                  type="number"
                  value={manualAllowance}
                  onChange={e => setManualAllowance(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#181818] border border-red-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Hapus Data Presensi?</h3>
                <p className="text-xs text-white/60">{recordToDelete.technicianName} ({recordToDelete.date})</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Apakah Anda yakin ingin menghapus data presensi ini? Data yang terhapus akan memengaruhi rekapan uang kehadiran teknisi.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteAttendanceRecord(recordToDelete.id);
                  setRecordToDelete(null);
                  showNotification('Data presensi berhasil dihapus.');
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Presensi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
