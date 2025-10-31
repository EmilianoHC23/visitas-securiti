import React, { useState, useEffect, useRef } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { Visit } from '../../types';
import { formatShortDate, formatTime } from '../../utils/dateUtils';

interface CheckedInVisitModalProps {
  visit: Visit | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (visitId: string) => void;
}

export const CheckedInVisitModal: React.FC<CheckedInVisitModalProps> = ({
  visit,
  isOpen,
  onClose,
  onCheckout
}) => {
  const [elapsedTime, setElapsedTime] = useState('');
  const checkInTimeRef = useRef<string | null>(null);
  const createdAtRef = useRef<string | null>(null);

  // Guardar checkInTime y createdAt cuando el modal se abre
  useEffect(() => {
    if (visit && isOpen) {
      if (visit.checkInTime) {
        checkInTimeRef.current = visit.checkInTime;
      }
      if (visit.createdAt) {
        createdAtRef.current = visit.createdAt;
      }
    }
  }, [visit?._id, isOpen]); // Solo cambiar cuando cambia el ID de la visita o se abre el modal

  useEffect(() => {
    if (!isOpen || !checkInTimeRef.current) return;

    const updateElapsedTime = () => {
      const start = new Date(checkInTimeRef.current!);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setElapsedTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} mins`);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [isOpen]); // Solo depende de isOpen, no de visit

  if (!isOpen || !visit) return null;

  // Usar createdAt para "Fecha y hora de llegada" (cuando se registró)
  const registrationDate = createdAtRef.current ? new Date(createdAtRef.current) : null;
  const formattedDate = registrationDate ? formatShortDate(registrationDate) : '-';
  const formattedTime = registrationDate ? formatTime(registrationDate) : '-';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
  <div className="bg-gradient-to-r from-gray-900 via-cyan-600 to-cyan-500 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <svg className="w-6 h-6 text-cyan-300" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Registrar salida de visitante</h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-700 rounded-full p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Foto del visitante */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-full border-4 border-cyan-400 overflow-hidden bg-gray-100 flex items-center justify-center mb-3 flex-shrink-0">
              {visit.visitorPhoto ? (
                <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover object-center" />
              ) : (
                <FaRegUser className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <p className="font-bold text-xl text-gray-800">{visit.visitorName}</p>
            <p className="text-sm text-gray-500">{visit.visitorCompany || 'Sin empresa'}</p>
          </div>

          {/* Detalles de la visita */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">A quién visitas</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-cyan-600">{visit.host.firstName} {visit.host.lastName}</p>
                <p className="text-xs text-gray-500">SecurITI</p>
              </div>
            </div>

            {visit.assignedResource && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Recurso asignado</span>
                <span className="text-sm font-semibold text-cyan-600">{visit.assignedResource}</span>
              </div>
            )}

            {!visit.assignedResource && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Recurso asignado</span>
                <span className="text-sm text-gray-400">N/A</span>
              </div>
            )}

            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Fecha y hora de llegada</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-cyan-600">{formattedDate}</p>
                <p className="text-sm font-semibold text-cyan-600">{formattedTime}</p>
              </div>
            </div>

            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Tiempo transcurrido</span>
              <span className="text-lg font-bold text-cyan-600">{elapsedTime}</span>
            </div>
          </div>

          {/* Botón de registrar salida */}
          <button 
            type="button" 
            onClick={() => {
              onCheckout(visit._id);
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-200"
          >
            <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Registrar salida
          </button>
        </div>
      </div>
    </div>
  );
};
