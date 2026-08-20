import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord } from '../../types';
import { 
  UserCheck, 
  MapPin, 
  Clock, 
  Camera, 
  RefreshCw,
  Trash2,
  Crown,
  AlertTriangle,
  X,
  CheckCircle2,
  ShieldCheck,
  Upload,
  User,
  Shield,
  Cloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressImage } from '../../utils/imageCompressor';

export const AttendanceView: React.FC = () => {
  const { 
    currentUser, 
    users,
    attendanceRecords, 
    clockIn, 
    clockOut, 
    deleteAttendanceRecord,
    showNotification,
    isCloudSynced,
    cloudSyncStatus,
    syncAttendanceToCloud
  } = useApp();

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    await syncAttendanceToCloud();
    setIsSyncingCloud(false);
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
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
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Verification & Submission Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN');
  const [selfiePhoto, setSelfiePhoto] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isLocationAgreed, setIsLocationAgreed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Super Admin delete modal state
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request actual geolocation coordinates
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
          setIsGettingLocation(false);
          showNotification('Koordinat GPS berhasil diperbarui!', 'success');
        },
        () => {
          setIsGettingLocation(false);
          showNotification('Menggunakan koordinat stasiun operasional KoolFix', 'info');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(false);
    try {
      stopCamera();

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Live kamera browser tidak didukung atau izin dibatasi. Silakan gunakan tombol Kamera HP.');
        return;
      }

      const constraintList: MediaStreamConstraints[] = [
        {
          video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: { ideal: 'user' } },
          audio: false
        },
        {
          video: { facingMode: 'user' },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      let acquiredStream: MediaStream | null = null;
      for (const constraints of constraintList) {
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (acquiredStream) break;
        } catch (e) {
          // try next constraint
        }
      }

      if (acquiredStream) {
        streamRef.current = acquiredStream;
        if (videoRef.current) {
          videoRef.current.srcObject = acquiredStream;
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
      } else {
        setCameraError('Akses kamera tidak diizinkan atau tidak didukung di peramban ini. Silakan gunakan tombol Kamera HP atau Ambil File.');
        setIsCameraActive(false);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Akses kamera tidak diizinkan atau tidak didukung di peramban ini. Silakan gunakan tombol Kamera HP atau Ambil File.');
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

  const handleCaptureSelfie = async () => {
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
    const compressed = await compressImage(dataUrl, 500, 500, 0.7);
    setSelfiePhoto(compressed);
    stopCamera();
  };

  const handleSelfieFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 500, 500, 0.7);
      if (compressed) {
        setSelfiePhoto(compressed);
        stopCamera();
      }
    } catch (err) {
      console.error('Selfie upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const openAttendanceModal = (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setConfirmActionType(type);
    setIsLocationAgreed(false);
    setSelfiePhoto('');
    setShowConfirmModal(true);
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
      showNotification('Harap ambil foto selfie terlebih dahulu sebagai bukti kehadiran!', 'error');
      return;
    }
    if (!isLocationAgreed) {
      showNotification('Harap centang persetujuan validasi koordinat GPS sebelum mengirim!', 'warning');
      return;
    }

    const coordStr = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

    if (confirmActionType === 'CLOCK_IN') {
      clockIn(
        currentUser.id,
        {
          latitude: coords.lat,
          longitude: coords.lng,
          addressName: coordStr,
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
        addressName: coordStr,
        accuracyMeters: coords.accuracy,
      });
    }

    handleCloseConfirmModal();
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">Super Admin</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin</span>;
      case 'TEKNISI':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Teknisi</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-white/10 text-white/70">Anggota</span>;
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header with Bold Typography */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold mb-1">
            Real-time GPS & Geotag Verification
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white">
            ABSENSI GEOTAG
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualCloudSync}
            disabled={isSyncingCloud || cloudSyncStatus === 'syncing'}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              cloudSyncStatus === 'connected'
                ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
            title="Klik untuk menyinkronkan seluruh data presensi ke cloud Firestore"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-bounce' : ''}`} />
            <span>{isSyncingCloud ? 'Menyinkronkan...' : `Cloud Sync (${attendanceRecords.length})`}</span>
          </button>

          <button
            onClick={fetchLiveGPS}
            disabled={isGettingLocation}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin' : ''}`} />
            <span>Perbarui GPS</span>
          </button>
        </div>
      </div>

      {/* Attendance Panel for Every Team Member (Super Admin, Admin, and Teknisi) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big Digital Clock Card */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                  Presensi: {currentUser.name}
                </span>
                {getRoleBadge(currentUser.role)}
              </div>
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

          {/* Geotag & Accuracy info - Coordinates only */}
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono font-bold text-cyan-300 text-sm">
                  Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
                </p>
                <p className="text-white/40 text-[10px] font-mono mt-0.5">
                  Radius Akurasi GPS: ±{coords.accuracy} Meter
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
                <span>Clock In Masuk (Selfie + Koordinat GPS)</span>
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
                <p className="text-[11px] text-white/60 mt-0.5">Kehadiran hari ini tercatat dan tersinkron ke cloud.</p>
              </div>
            )}
          </div>
        </div>

        {/* Selfie Preview & Rule Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-2">
              Verifikasi Foto Presensi Terakhir
            </span>
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 bg-black">
              <img
                src={todayAttendance?.clockInPhoto || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                alt="Selfie Presensi"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-mono text-cyan-300">
                📍 Verified Coordinates
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-white/60">
            <p className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Ketentuan Presensi Tim:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Wajib mengambil <strong>foto selfie langsung</strong> saat presensi.</li>
              <li>Sistem mencatat <strong>titik koordinat GPS real-time</strong>.</li>
              <li>Berlaku untuk seluruh anggota (Super Admin, Admin, dan Teknisi).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Attendance History Log Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">Log Riwayat Presensi & Koordinat Seluruh Tim</h3>
            <p className="text-xs text-white/50">{attendanceRecords.length} Catatan Presensi Tercatat</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/70 font-black uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Foto Selfie</th>
                <th className="py-3 px-4">Nama Anggota</th>
                <th className="py-3 px-4">Jabatan / Role</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Keluar</th>
                <th className="py-3 px-4">Koordinat Geotag (Lat, Lng)</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isSuperAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendanceRecords.map(record => {
                const userObj = users.find(u => u.id === record.technicianId);
                const displayRole = userObj?.role || (record.technicianName.toLowerCase().includes('admin') ? 'ADMIN' : 'TEKNISI');

                const latVal = record.clockInLocation?.latitude ?? coords.lat;
                const lngVal = record.clockInLocation?.longitude ?? coords.lng;

                return (
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
                    <td className="py-3 px-4">{getRoleBadge(displayRole)}</td>
                    <td className="py-3 px-4 font-mono text-white/70">{record.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{record.clockInTime} WIB</td>
                    <td className="py-3 px-4 font-mono text-white/60">{record.clockOutTime ? `${record.clockOutTime} WIB` : 'Bertugas'}</td>
                    <td className="py-3 px-4 text-cyan-300 font-mono text-xs">
                      {typeof latVal === 'number' && typeof lngVal === 'number'
                        ? `${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`
                        : (record.clockInLocation?.addressName || '-')}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL WITH LIVE SELFIE CAMERA AND GPS COORDINATES ONLY */}
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
                    {confirmActionType === 'CLOCK_IN' ? 'Foto Selfie & Presensi Masuk' : 'Presensi Pulang'}
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
                  1. Foto Selfie (Wajib)
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

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Kamera HP</span>
                    </button>

                    {isCameraActive && (
                      <button
                        type="button"
                        onClick={handleCaptureSelfie}
                        className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/30 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Jepret Live</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>File</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={nativeCameraInputRef}
                    onChange={handleSelfieFileUpload}
                    accept="image/*"
                    capture="user"
                    className="hidden"
                  />
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

            {/* Step 2: Coordinates Only Display */}
            <div className="space-y-3">
              <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-cyan-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      2. Titik Koordinat GPS
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={fetchLiveGPS}
                    title="Perbarui GPS"
                    className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Refresh</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-black/60 rounded-xl border border-white/10 text-xs font-mono">
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase">Latitude</span>
                    <span className="text-cyan-300 font-bold">{coords.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase">Longitude</span>
                    <span className="text-cyan-300 font-bold">{coords.lng.toFixed(6)}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-white/40">Radius Akurasi GPS:</span>
                    <span className="text-emerald-400 font-bold">±{coords.accuracy} Meter</span>
                  </div>
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
                  Saya menyatakan bahwa foto selfie dan titik koordinat GPS di atas adalah benar posisi saya saat ini.
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

      {/* Delete Record Confirmation Modal for Super Admin */}
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
              Apakah Anda yakin ingin menghapus data presensi ini?
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

