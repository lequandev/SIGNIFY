import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'warning',
}) => {
  const config = {
    danger: {
      iconBg: 'rgba(239,68,68,0.08)',
      iconBorder: 'rgba(239,68,68,0.18)',
      iconColor: '#dc2626',
      btnBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      btnShadow: '0 8px 24px rgba(220,38,38,0.35)',
      icon: <AlertCircle className="w-8 h-8" />,
    },
    warning: {
      iconBg: 'rgba(245,158,11,0.08)',
      iconBorder: 'rgba(245,158,11,0.18)',
      iconColor: '#d97706',
      btnBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      btnShadow: '0 8px 24px rgba(245,158,11,0.35)',
      icon: <AlertTriangle className="w-8 h-8" />,
    },
    info: {
      iconBg: 'rgba(37,99,235,0.08)',
      iconBorder: 'rgba(37,99,235,0.18)',
      iconColor: '#2563EB',
      btnBg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      btnShadow: '0 8px 24px rgba(37,99,235,0.35)',
      icon: <Info className="w-8 h-8" />,
    },
  };

  const c = config[type];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap');
        .modal-root { font-family: 'Open Sans', system-ui, sans-serif; }
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(30,58,138,0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .modal-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(37,99,235,0.10);
          border-radius: 24px;
          box-shadow: 0 32px 80px rgba(30,58,138,0.20);
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }
        .modal-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 32px; height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(37,99,235,0.06);
          border: none;
          cursor: pointer;
          color: #3b82f6;
          transition: background 180ms ease;
        }
        .modal-close-btn:hover { background: rgba(37,99,235,0.12); }
        .modal-icon-wrap {
          width: 72px; height: 72px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          border: 1px solid;
        }
        .modal-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .modal-message {
          font-size: 0.9rem;
          color: #1e40af;
          opacity: 0.75;
          line-height: 1.65;
          margin: 0;
          max-width: 320px;
        }
        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          width: 100%;
          margin-top: 0.75rem;
        }
        .modal-btn-cancel {
          padding: 0.875rem;
          background: rgba(37,99,235,0.06);
          border: 1px solid rgba(37,99,235,0.12);
          border-radius: 14px;
          font-family: 'Poppins', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e3a8a;
          cursor: pointer;
          transition: background 180ms ease, border-color 180ms ease;
        }
        .modal-btn-cancel:hover { background: rgba(37,99,235,0.10); border-color: rgba(37,99,235,0.22); }
        .modal-btn-confirm {
          padding: 0.875rem;
          border: none;
          border-radius: 14px;
          font-family: 'Poppins', sans-serif;
          font-size: 0.8125rem;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: filter 180ms ease, transform 180ms ease;
        }
        .modal-btn-confirm:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .modal-btn-confirm:active { transform: scale(0.98); }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <div className="modal-root modal-overlay">
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
                <X className="w-4 h-4" />
              </button>

              <div
                className="modal-icon-wrap"
                style={{
                  background: c.iconBg,
                  borderColor: c.iconBorder,
                  color: c.iconColor,
                }}
              >
                {c.icon}
              </div>

              <h2 className="modal-title">{title}</h2>
              <p className="modal-message">{message}</p>

              <div className="modal-actions">
                <button onClick={onClose} className="modal-btn-cancel">{cancelText}</button>
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="modal-btn-confirm"
                  style={{ background: c.btnBg, boxShadow: c.btnShadow }}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConfirmModal;
