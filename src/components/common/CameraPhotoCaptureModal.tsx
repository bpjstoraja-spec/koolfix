import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon, FlipHorizontal, AlertCircle, Smartphone } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface CameraPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
  description?: string;
}

export const CameraPhotoCaptureModal: React.FC<CameraPhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Ambil Foto dengan Kamera',
  description = 'Arahkan kamera ke unit AC atau bukti pembayaran, lalu tekan tombol ambil foto.',
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedPhoto]);

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
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Fitur live kamera browser tidak didukung atau dibatasi. Silakan gunakan tombol "Kamera Bawaan HP" di bawah.');
      return;
    }

    // Try progressive constraints
    const constraintList: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: facingMode,
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
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
                console.warn('Camera video play warning:', err);
              }
            });
          }
        } catch (e) {
          // ignore
        }
      }
      setIsCameraActive(true);
    } else {
      setCameraError('Izin akses kamera belum diizinkan atau kamera sedang digunakan aplikasi lain. Gunakan tombol "Kamera Bawaan HP" untuk membuka kamera langsung.');
      setIsCameraActive(false);
    }
  };

  const handleTakeSnapshot = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 800;
      canvas.height = video.videoHeight || 600;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawData = canvas.toDataURL('image/jpeg', 0.85);
        const compressed = await compressImage(rawData, 720, 720, 0.65);
        setCapturedPhoto(compressed);
        stopCamera();
      }
    } catch (err) {
      console.error('Snapshot failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      setCapturedPhoto(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  // Handles both Native Camera capture and Gallery file uploads
  const handleProcessFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file, 720, 720, 0.65);
      setCapturedPhoto(compressed);
      stopCamera();
    } catch (err) {
      console.error('File compression failed:', err);
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141414] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col">
        {/* Hidden inputs for native camera and gallery */}
        <input
          type="file"
          ref={nativeCameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleProcessFile}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleProcessFile}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-white/50">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCapturedPhoto(null);
              onClose();
            }}
            className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[380px] overflow-hidden">
          {capturedPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedPhoto}
                alt="Captured Snapshot"
                className="max-h-[340px] w-full object-contain rounded-xl"
              />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Foto Siap Disinkronkan ke Cloud
              </div>
            </div>
          ) : isCameraActive ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[340px] object-cover"
              />
              {/* Overlay Crosshair */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/30 rounded-2xl border-dashed" />
              </div>

              {/* Camera Switch button */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                title="Putar Kamera (Depan / Belakang)"
                className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 transition cursor-pointer shadow-lg"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 text-center space-y-4 max-w-sm mx-auto">
              {cameraError ? (
                <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="font-semibold">{cameraError}</p>
                </div>
              ) : (
                <div className="text-white/60 text-xs flex flex-col items-center gap-2 py-4">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                  <span>Menghubungkan ke kamera...</span>
                </div>
              )}

              {/* Direct Native Camera Trigger */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  Buka Kamera HP Langsung
                </button>
                <p className="text-[10px] text-white/40">
                  Membuka aplikasi kamera bawaan smartphone dengan kualitas penuh.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-5 bg-white/5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Gunakan Foto Ini
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {/* 1. Native Camera HP Shutter Button */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Jepret langsung menggunakan aplikasi kamera HP"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Kamera HP
                </button>

                {/* 2. File picker gallery */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  Pilih Galeri
                </button>
              </div>

              {isCameraActive && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleTakeSnapshot}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-blue-600/40 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {isProcessing ? 'Memproses...' : 'Jepret Live'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
