import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'primary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: 'text-red-400 border-red-500/20 bg-red-500/10',
    warning: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    info: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    primary: 'text-brand-400 border-brand-500/20 bg-brand-500/10'
  };

  const btnStyles = {
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-100 border-red-500/30',
    warning: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border-amber-500/30',
    info: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border-blue-500/30',
    primary: 'bg-brand-500/20 hover:bg-brand-500/30 text-brand-100 border-brand-500/30'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel-dark w-full max-w-sm overflow-hidden shadow-2xl border-white/10 flex flex-col scale-in-center">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${typeStyles[type]}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white tracking-tight">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 bg-white/5 border-t border-white/5">
          <button 
            onClick={onCancel}
            className="flex-1 btn-secondary text-sm !py-2"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 font-bold rounded-lg border px-4 py-2 text-sm transition-all duration-150 ${btnStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
