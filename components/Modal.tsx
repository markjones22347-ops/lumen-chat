import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="w-full text-left text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          </div>
        </div>
        <div className="p-6 text-neutral-900">{children}</div>
      </div>
    </div>
  );
}
