import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppFeatureId } from '../../types';
import { ShieldAlert, Lock, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';

interface AccessDeniedNoticeProps {
  featureId: AppFeatureId;
  onGoBack?: () => void;
}

export const AccessDeniedNotice: React.FC<AccessDeniedNoticeProps> = ({ 
  featureId,
  onGoBack 
}) => {
  const { currentUser, systemFeatureDefinitions } = useApp();

  const featureDef = systemFeatureDefinitions.find(f => f.id === featureId);
  const featureName = featureDef?.name || featureId;
  const featureDesc = featureDef?.description || 'Fitur ini memiliki pembatasan hak akses.';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
        
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <Lock className="w-3.5 h-3.5" /> Akses Dibatasi oleh Kebijakan Super Admin
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Izin Akses Tidak Tersedia
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Akun Anda dengan peran <span className="font-semibold text-cyan-400">{currentUser.role}</span> tidak diizinkan membuka fitur:
          </p>
        </div>

        {/* Feature Detail Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left space-y-1.5">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{featureName}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {featureDesc}
          </p>
          <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
            <span>ID Kode: <code>{featureId}</code></span>
            <span>Pengguna: <strong>{currentUser.name}</strong></span>
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            Untuk mengaktifkan atau membuka kembali fitur ini, hubungi <strong>Super Admin</strong> agar status izin pada <em>Matrix Kontrol Hak Akses</em> diberikan untuk akun Anda.
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Utama
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
