import React from 'react';

interface OperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorModal: React.FC<OperatorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <span className="font-label-md font-bold text-on-surface">Operador Asignado</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-4 flex flex-col items-center text-center gap-2">
          <div className="w-20 h-20 rounded-full p-1 bg-surface-container shadow-sm">
            <img
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH4g0v_YqXuqRvJDBzzTGxrYq9TmrLDCDT6WYGDxQ7MTuyeiDDXJMMruSp6prt2FS7uqWUF3-ZIwZrLz1Eq-_Q0et2iOhOgK62JYCS5GKiZ1L60_Sa3W-AnpzLVxoVtVaqLP3CpGLfnUbBs1uOueyKRKOj6fDoVhql3fl9Z1iQz2IaqkXsPeWXeEGyOJ65C3_Vywmnes1BB-nHvtRaJNeURrDNrLOOMsd8l8e0YxjZIxXmC7EN6uo"
            />
          </div>

          <h3 className="font-headline-sm font-bold text-on-surface text-lg">Javier Escobar</h3>
          <span className="text-xs text-secondary font-semibold bg-surface-container px-2.5 py-0.5 rounded-full">
            Auditor de Inventario Nivel II
          </span>

          <div className="w-full bg-surface-container-low rounded-xl p-3 border border-outline-variant/20 text-left text-xs space-y-1.5 mt-2">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">ID de Operador:</span>
              <span className="font-mono font-bold text-on-surface">OP-8821-CL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Terminal Zebra:</span>
              <span className="font-mono font-bold text-primary">TC27-SE4710 #04</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Ubicación / Bodega:</span>
              <span className="font-semibold text-on-surface">Bodega Central - Bahía 4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Turno:</span>
              <span className="font-semibold text-on-surface">Mañana (07:00 - 15:30)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/20 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-primary text-white font-label-md font-bold rounded-xl active:scale-95 transition-all text-center"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
