import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const VisitConfirmationPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const result = params.get('result');
  const action = params.get('action');
  const [countdown, setCountdown] = useState(10);

  const isApproved = result === 'approved' || action === 'approve';
  const isRejected = result === 'rejected' || action === 'reject';

  // Countdown para redirigir automáticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close(); // Intentar cerrar la ventana/pestaña
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header con color según resultado */}
        <div className={`${
          isApproved ? 'bg-gradient-to-r from-green-500 to-green-600' :
          isRejected ? 'bg-gradient-to-r from-red-500 to-red-600' :
          'bg-gradient-to-r from-blue-500 to-blue-600'
        } px-8 py-12 text-center`}>
          <div className="flex justify-center mb-6">
            {isApproved ? (
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            ) : isRejected ? (
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Clock className="w-16 h-16 text-blue-500" />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isApproved && '¡Visita Aprobada!'}
            {isRejected && 'Visita Rechazada'}
            {!isApproved && !isRejected && 'Acción Registrada'}
          </h1>
          
          <p className="text-white text-opacity-90 text-lg">
            {isApproved && 'La solicitud de visita ha sido aprobada exitosamente'}
            {isRejected && 'La solicitud de visita ha sido rechazada'}
            {!isApproved && !isRejected && 'Tu acción ha sido procesada correctamente'}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-10">
          {isApproved && (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-2 text-lg">¿Qué sigue?</h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>El visitante recibirá una notificación por correo electrónico con los detalles de la visita</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Se ha generado un código QR único para facilitar el ingreso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Recibirás una notificación cuando el visitante llegue</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Recordatorio</p>
                  <p>Asegúrate de estar disponible en la fecha y hora acordada para recibir a tu visitante.</p>
                </div>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                <h3 className="font-semibold text-red-800 mb-2 text-lg">Acción completada</h3>
                <p className="text-red-700">
                  El visitante ha sido notificado sobre el rechazo de su solicitud. 
                  Si proporcionaste un motivo, también lo recibirá en el correo electrónico.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Si cambias de opinión, puedes volver al panel de visitas y aprobar la solicitud desde allí.
                </p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/visits')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 font-medium transition-all shadow-lg hover:shadow-xl"
            >
              Ir al Panel de Visitas
            </button>
            <button
              onClick={() => window.close()}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cerrar Ventana
            </button>
          </div>

          {/* Auto-close countdown */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Esta página se cerrará automáticamente en{' '}
              <span className="font-semibold text-gray-700">{countdown}</span> segundos
            </p>
            <div className="mt-2 max-w-xs mx-auto">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    isApproved ? 'bg-green-500' :
                    isRejected ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            Sistema de Gestión de Visitas - SecurITI
          </p>
        </div>
      </div>
    </div>
  );
};
