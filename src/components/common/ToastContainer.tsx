import React, { useEffect, useState } from 'react';
import { NotificationItem } from '../../types';
import { notificationService } from '../../services/NotificationService';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, ShieldAlert, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToToasts((toast) => {
      setToasts((prev) => [toast, ...prev.slice(0, 4)]);
      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'reward':
        return <Award className="w-5 h-5 text-yellow-400 shrink-0" />;
      case 'admin':
        return <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-950/80';
      case 'error':
        return 'border-red-500/50 bg-red-950/85';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/80';
      case 'reward':
        return 'border-yellow-500/50 bg-yellow-950/85';
      case 'admin':
        return 'border-purple-500/50 bg-purple-950/85';
      default:
        return 'border-cyan-500/40 bg-slate-900/90';
    }
  };

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl ${getBorderColor(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-100">{toast.title}</h4>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
