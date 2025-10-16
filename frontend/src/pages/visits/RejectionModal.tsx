import React, { useState } from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  visitorName: string;
}

const REJECTION_REASONS = [
  'Anfitrión no disponible',
  'Visita no agendada',
  'Cancelación por emergencia',
  'Otro'
];

export const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  visitorName
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Otro' ? customReason : selectedReason;
    
    if (!finalReason.trim()) {
      alert('Por favor, especifica la razón del rechazo');
      return;
    }

    onConfirm(finalReason);
    // Reset
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Especifica la razón</h2>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Especifica la razón del rechazo para <span className="font-semibold text-gray-900">{visitorName}</span>
          </p>

          {/* Dropdown de razones */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una opción <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-700"
            >
              <option value="">Seleccionar</option>
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de texto personalizado si selecciona "Otro" */}
          {selectedReason === 'Otro' && (
            <div className="mb-4 animate-fadeIn">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Razón? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Escribe la razón del rechazo..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
              />
            </div>
          )}

          {/* Botón de confirmar */}
          <button 
            type="button" 
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'Otro' && !customReason.trim())}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-400 disabled:hover:to-cyan-500"
          >
            Registrar salida
          </button>
        </div>
      </div>
    </div>
  );
};
