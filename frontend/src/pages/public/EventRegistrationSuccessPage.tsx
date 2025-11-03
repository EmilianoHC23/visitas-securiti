import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Calendar, ArrowLeft, Building2 } from 'lucide-react';
import * as api from '../../services/api';

interface AccessInfo {
  eventName: string;
  startDate?: string;
}

export const EventRegistrationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessId } = useParams<{ accessId: string }>();
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccessInfo();
  }, [accessId]);

  const loadAccessInfo = async () => {
    if (!accessId) {
      navigate('/public/self-register');
      return;
    }

    try {
      const data = await api.getAccessPublicInfo(accessId);
      setAccessInfo(data);
    } catch (err) {
      console.error('Error loading access info:', err);
      setAccessInfo({ eventName: 'el evento' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 p-8 sm:p-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            ¡Tu acceso a {accessInfo?.eventName || 'el evento'} fue aprobado!
          </h1>

          <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6 mb-6">
            <p className="text-xl font-semibold text-center text-green-900">
              Ya puedes ingresar a {accessInfo?.eventName || 'este evento'}
            </p>
            {accessInfo?.startDate && (
              <div className="flex items-center justify-center text-gray-700 mt-3">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="text-sm">{formatDate(accessInfo.startDate)}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Pre-registro completado</h3>
                  <p className="text-sm text-gray-600">
                    Tu información ha sido registrada exitosamente en el sistema
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Llega al evento</h3>
                  <p className="text-sm text-gray-600">
                    Preséntate en recepción el día del evento con tu identificación
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Acceso aprobado</h3>
                  <p className="text-sm text-gray-600">
                    El personal de recepción completará tu ingreso al evento
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 mb-6">
            <p className="text-sm text-blue-900 text-center">
              <strong>Importante:</strong> Recuerda llegar con tu identificación oficial. 
              El personal de recepción verificará tu pre-registro al momento de tu llegada.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/public/self-register')}
              className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              Volver al inicio
            </button>
            
            <button
              onClick={() => navigate('/public/self-register/events')}
              className="w-full px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Ver más eventos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
