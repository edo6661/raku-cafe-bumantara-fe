import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  description?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '2xl',
  description = 'Detail informasi tersimpan di sistem'
}: ModalProps) => {

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const maxWidthClass = {
    'sm': 'sm:max-w-sm',
    'md': 'sm:max-w-md',
    'lg': 'sm:max-w-lg',
    'xl': 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl',
    'full': 'sm:max-w-[95vw]',
  }[maxWidth];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // items-end untuk mobile (bottom sheet), sm:items-center untuk desktop
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-all"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative bg-white w-full ${maxWidthClass} max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl ring-1 ring-slate-900/5 overflow-hidden rounded-t-[24px] sm:rounded-[24px]`}
          >
            <div className="flex justify-between items-start sm:items-center px-6 py-5 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
                {description && <p className="text-[12px] text-slate-500 font-medium mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer bg-slate-50 shrink-0"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar bg-slate-50/30 flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;