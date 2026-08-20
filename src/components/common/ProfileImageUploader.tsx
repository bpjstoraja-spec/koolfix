import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  RefreshCw, 
  X,
  UserCheck
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface ProfileImageUploaderProps {
  currentAvatar: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  title?: string;
  mode?: 'full' | 'upload-only';
}

const PRESET_AVATARS = [
  { id: 'av-1', label: 'Teknisi Pro 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-2', label: 'Teknisi Pro 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-3', label: 'Teknisi Pro 3', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-4', label: 'Admin Ops 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-5', label: 'Admin Ops 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-6', label: 'Super Admin', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-7', label: 'Pelanggan 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-8', label: 'Pelanggan 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
  { id: 'av-9', label: 'Pelanggan B2B', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80' },
];

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  currentAvatar,
  onAvatarChange,
  title = 'Foto Profil Akun',
  mode = 'full'
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'CAMERA' | 'PRESET' | 'URL'>('UPLOAD');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar || PRESET_AVATARS[0].url);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isUploadOnly = mode === 'upload-only';

  // Sync internal preview with prop if changed
  useEffect(() => {
    if (currentAvatar) {
      setPreviewUrl(currentAvatar);
    }
  }, [currentAvatar]);

  // Clean up camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(false);
    try {
      stopCamera();

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Kamera browser tidak didukung atau dibatasi. Silakan gunakan opsi Upload File.');
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
          // try next
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
                  console.warn('Camera video play issue:', err);
                }
              });
            }
          } catch (playErr) {
            // Ignore synchronous aborts
          }
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Kamera tidak dapat diakses atau izin belum diberikan. Silakan gunakan opsi Upload File.');
        setIsCameraActive(false);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan opsi Upload File.');
      setIsCameraActive(false);
    }
  };

  const handleCaptureCamera = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame squarely
    const vid = videoRef.current;
    const size = Math.min(vid.videoWidth, vid.videoHeight);
    const startX = (vid.videoWidth - size) / 2;
    const startY = (vid.videoHeight - size) / 2;
    ctx.drawImage(vid, startX, startY, size, size, 0, 0, 400, 400);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const compressed = await compressImage(dataUrl, 400, 400, 0.7);
    setPreviewUrl(compressed);
    onAvatarChange(compressed);
    stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400, 400, 0.7);
      if (compressed) {
        setPreviewUrl(compressed);
        onAvatarChange(compressed);
      }
    } catch (err) {
      console.error('Avatar file upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleSelectPreset = (url: string) => {
    setPreviewUrl(url);
    onAvatarChange(url);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setPreviewUrl(customUrl.trim());
    onAvatarChange(customUrl.trim());
  };

  return (
    <div className="space-y-4 text-white">
      {/* Header with current photo preview */}
      <div className="flex items-center gap-4 p-3.5 bg-white/5 border border-white/10 rounded-2xl">
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Preview Avatar"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-lg bg-black shrink-0"
          />
          <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <UserCheck className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 mb-0.5">
            {title}
          </h4>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Foto ini akan tampil di kartu identitas, laporan kerja, dan daftar akun.
          </p>
        </div>
      </div>

      {/* Tabs - Hidden in upload-only mode */}
      {!isUploadOnly && (
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => { stopCamera(); setActiveTab('UPLOAD'); }}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition ${
              activeTab === 'UPLOAD' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase">Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('CAMERA'); startCamera(); }}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition ${
              activeTab === 'CAMERA' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase">Kamera Selfie</span>
          </button>

          <button
            type="button"
            onClick={() => { stopCamera(); setActiveTab('PRESET'); }}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition ${
              activeTab === 'PRESET' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase">Pustaka</span>
          </button>

          <button
            type="button"
            onClick={() => { stopCamera(); setActiveTab('URL'); }}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition ${
              activeTab === 'URL' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase">URL Foto</span>
          </button>
        </div>
      )}

      {/* Tab 1: File Upload (Always active in upload-only mode) */}
      {(isUploadOnly || activeTab === 'UPLOAD') && (
        <div className="p-4 bg-white/5 border border-dashed border-white/20 hover:border-cyan-500/50 rounded-2xl text-center space-y-3 transition">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Pilih file gambar dari komputer atau HP</p>
            <p className="text-[10px] text-white/40 mt-0.5">Mendukung file JPG, PNG, atau WEBP (Maksimal 5MB)</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Jelajahi File Gambar
          </button>
        </div>
      )}

      {/* Tab 2: Camera Stream / Selfie */}
      {activeTab === 'CAMERA' && (
        <div className="space-y-3 p-3 bg-black/60 border border-white/10 rounded-2xl">
          {cameraError ? (
            <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-center space-y-2">
              <p className="text-xs text-red-300">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 bg-red-800 text-white rounded-lg text-xs font-bold"
              >
                Coba Akses Lagi
              </button>
            </div>
          ) : (
            <div className="relative aspect-video max-h-56 bg-black rounded-xl overflow-hidden border border-white/20 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 border-2 border-dashed border-cyan-400/40 rounded-full w-36 h-36 m-auto pointer-events-none" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[9px] font-mono text-cyan-300">
                ● Live Viewfinder
              </div>
            </div>
          )}

          {isCameraActive && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCaptureCamera}
                className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil Foto Sekarang</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold"
              >
                Matikan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Preset Library */}
      {activeTab === 'PRESET' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/50">Pilih dari koleksi avatar siap pakai:</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-1">
            {PRESET_AVATARS.map(avatar => {
              const isSelected = previewUrl === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleSelectPreset(avatar.url)}
                  className={`relative p-1 rounded-2xl border transition group flex flex-col items-center ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/20'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <span className="text-[9px] font-bold text-white/70 truncate w-full text-center mt-1">
                    {avatar.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Direct URL */}
      {activeTab === 'URL' && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/70">Tautan Gambar (Direct URL)</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              placeholder="https://example.com/foto-profil.jpg"
              className="flex-1 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
