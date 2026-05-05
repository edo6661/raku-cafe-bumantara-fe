import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-all"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-[24px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl ring-1 ring-zinc-900/5 overflow-hidden"
          >
            <div className="flex justify-between items-center px-8 py-6 border-b border-zinc-100 bg-white shrink-0">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h3>
                <p className="text-[12px] text-zinc-400 font-medium mt-1">Detail informasi tersimpan di sistem</p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer bg-zinc-50"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar bg-zinc-50/30">
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