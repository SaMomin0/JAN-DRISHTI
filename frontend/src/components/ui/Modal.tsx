'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`bg-white border border-black/10 rounded-3xl w-full ${maxWidthClass} overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.18)] space-y-4 p-6 md:p-8 transition-all transform scale-100 text-[rgb(26,26,26)] animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex justify-between items-center border-b border-black/5 pb-4">
          <h3 className="text-base font-bold text-[rgb(26,26,26)] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#6e6e73] hover:text-black p-1.5 rounded-full bg-[#f0f0f3] hover:bg-[#e4e4e7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
