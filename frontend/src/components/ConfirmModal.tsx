import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning',
  isLoading = false,
}) => {
  const config = {
    danger: { icon: AlertCircle, iconClass: 'bg-error/10 text-error', buttonClass: 'bg-error text-on-error' },
    warning: { icon: AlertTriangle, iconClass: 'bg-tertiary/10 text-tertiary', buttonClass: 'bg-tertiary text-on-tertiary' },
    info: { icon: Info, iconClass: 'bg-primary/10 text-primary', buttonClass: 'bg-primary text-on-primary' },
  }[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-sans">
          <motion.button type="button" aria-label="Đóng hộp thoại" className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="relative w-full max-w-md rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest p-6 text-center shadow-2xl" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}>
            <button type="button" onClick={onClose} disabled={isLoading} title="Đóng" className="absolute right-4 top-4 rounded-lg p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"><X className="h-4 w-4" /></button>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconClass}`}><Icon className="h-7 w-7" /></div>
            <h2 id="confirm-modal-title" className="mt-5 text-xl font-black text-on-surface">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{message}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={onClose} disabled={isLoading} className="rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm font-black text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-50">{cancelText}</button>
              <button type="button" onClick={() => { onConfirm(); onClose(); }} disabled={isLoading} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${config.buttonClass} disabled:opacity-50`}>{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}{confirmText}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
