import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification, clearNotification } = useApp();

  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
  };

  const bgs = {
    success: 'bg-[#121212] border-emerald-500/40 text-emerald-300',
    info: 'bg-[#121212] border-blue-500/40 text-blue-300',
    warning: 'bg-[#121212] border-amber-500/40 text-amber-300',
    error: 'bg-[#121212] border-red-500/40 text-red-300',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-start gap-3 p-4 rounded-2xl border shadow-2xl shadow-black/80 backdrop-blur-xl ${bgs[notification.type]}`}>
        {icons[notification.type]}
        <div className="flex-1 text-xs font-bold pr-2 text-white">
          {notification.message}
        </div>
        <button
          onClick={clearNotification}
          className="text-white/40 hover:text-white transition p-0.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
