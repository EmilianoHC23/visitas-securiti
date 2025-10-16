import React, { useState, useEffect } from 'react';
import { Visit } from '../../types';

interface PendingVisitModalProps {
  visit: Visit | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (visitId: string) => void;
  onReject: (visitId: string) => void;
}

export const PendingVisitModal: React.FC<PendingVisitModalProps> = ({
  visit,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    if (!visit || !isOpen) return;

    const updateElapsedTime = () => {
      const start = new Date(visit.scheduledDate);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setElapsedTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} mins`);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [visit, isOpen]);

  if (!isOpen || !visit) return null;

  const formattedDate = new Date(visit.scheduledDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = new Date(visit.scheduledDate).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Visitante en espera</h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Fotos de Visitante y Host */}
          <div className="flex justify-center items-center gap-8 mb-6">
            {/* Foto Visitante */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                {visit.visitorPhoto ? (
                  <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <p className="font-semibold text-gray-800">{visit.visitorName}</p>
              <p className="text-sm text-gray-500">{visit.visitorCompany || 'Sin empresa'}</p>
            </div>

            {/* Ícono de espera */}
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-8 h-8 text-yellow-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Foto Host */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-4 border-blue-400 overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                {visit.host.profileImage ? (
                  <img src={visit.host.profileImage} alt={`${visit.host.firstName} ${visit.host.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <p className="font-semibold text-gray-800">{visit.host.firstName} {visit.host.lastName}</p>
              <p className="text-sm text-gray-500">SecurITI</p>
            </div>
          </div>

          {/* Tiempo de espera destacado */}
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-orange-800">Tiempo de espera:</span>
              <span className="text-2xl font-bold text-orange-600">{elapsedTime}</span>
            </div>
          </div>

          {/* Detalles de la visita */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Fecha y hora registro</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-cyan-600">{formattedDate}</p>
                <p className="text-sm font-semibold text-cyan-600">{formattedTime}</p>
              </div>
            </div>

            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Motivo de visita</span>
              <span className="text-sm font-semibold text-cyan-600 text-right max-w-xs">{visit.reason}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => {
                onReject(visit._id);
                onClose();
              }}
              className="flex-1 py-3 bg-white border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rechazar
            </button>
            <button 
              type="button" 
              onClick={() => {
                onApprove(visit._id);
                onClose();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
