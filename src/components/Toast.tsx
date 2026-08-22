import React, { useEffect } from 'react';
import { CheckCircle2, ShoppingBag, Heart, X, Info } from 'lucide-react';
import { NotificationToast } from '../types';

interface ToastContainerProps {
  toasts: NotificationToast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: NotificationToast; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto bg-neutral-950/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-neutral-800 flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-1 rounded-lg bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
        {toast.type === 'cart' ? (
          <ShoppingBag className="w-4 h-4" />
        ) : toast.type === 'wishlist' ? (
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-bold text-white leading-tight">{toast.title}</h5>
        <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={onDismiss}
        className="text-neutral-500 hover:text-white p-1 rounded-md transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
