import React, { useState, useEffect } from 'react';
import { Visit } from '../../types';
import { formatShortDate, formatTime } from '../../utils/dateUtils';

interface ApprovedVisitModalProps {
  visit: Visit | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (visitId: string, assignedResource: string) => void;
}

export const ApprovedVisitModal: React.FC<ApprovedVisitModalProps> = ({
  visit,
  isOpen,
  onClose,
  onCheckIn
}) => {
  const [assignedResource, setAssignedResource] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    if (!visit || !isOpen) return;

    // Cargar recurso asignado si existe
    setAssignedResource(visit.assignedResource || '');

    const updateElapsedTime = () => {
      // Calcular tiempo desde la aprobación (usando updatedAt como referencia)
      const start = new Date(visit.updatedAt || visit.scheduledDate);
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

  const formattedDate = formatShortDate(visit.scheduledDate);
  const formattedTime = formatTime(visit.scheduledDate);

  const handleCheckIn = () => {
    onCheckIn(visit._id, assignedResource);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Visitante aprobado</h2>
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
          <div className="flex justify-between items-start mb-6 px-4">
            {/* Foto Visitante */}
            <div className="text-center flex-1">
              <div className="w-20 h-20 rounded-full border-4 border-green-400 overflow-hidden bg-gray-100 flex items-center justify-center mx-auto mb-2">
                {visit.visitorPhoto ? (
                  <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <p className="font-semibold text-sm text-gray-800 truncate px-1">{visit.visitorName}</p>
              <p className="text-xs text-gray-500 truncate px-1">{visit.visitorCompany || 'Sin empresa'}</p>
            </div>

            {/* Ícono de aprobación */}
            <div className="flex items-center justify-center flex-shrink-0 mx-3 mt-2">
              <div className="bg-green-100 rounded-full p-2">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Foto Host */}
            <div className="text-center flex-1">
              <div className="w-20 h-20 rounded-full border-4 border-blue-400 overflow-hidden bg-gray-100 flex items-center justify-center mx-auto mb-2">
                {visit.host.profileImage ? (
                  <img src={visit.host.profileImage} alt={`${visit.host.firstName} ${visit.host.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <p className="font-semibold text-sm text-gray-800 truncate px-1">{visit.host.firstName} {visit.host.lastName}</p>
              <p className="text-xs text-gray-500 truncate px-1">SecurITI</p>
            </div>
          </div>

          {/* Recurso asignado */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recurso asignado
            </label>
            <input
              type="text"
              value={assignedResource}
              onChange={(e) => setAssignedResource(e.target.value)}
              placeholder="Ej. Tarjeta de Acceso #14"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Opcional: Asigna un recurso como tarjeta, gafete, etc.</p>
          </div>

          {/* Detalles de la visita */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Fecha y hora de llegada</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-cyan-600">{formattedDate}</p>
                <p className="text-sm font-semibold text-cyan-600">{formattedTime}</p>
              </div>
            </div>

            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Tiempo transcurrido</span>
              <span className="text-lg font-bold text-green-600">{elapsedTime}</span>
            </div>
          </div>

          {/* Botón de acción */}
          <button 
            type="button" 
            onClick={handleCheckIn}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Registrar entrada
          </button>
        </div>
      </div>
    </div>
  );
};
