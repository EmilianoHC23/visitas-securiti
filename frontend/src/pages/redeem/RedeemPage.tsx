import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../../services/api';

interface AccessDetails {
  _id: string;
  title: string;
  description?: string;
  accessCode: string;
  settings: {
    autoApproval: boolean;
    maxUses: number;
    allowGuests: boolean;
    requireApproval: boolean;
  };
  schedule: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  usageCount: number;
  status: string;
}

export const RedeemPage: React.FC = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const [accessDetails, setAccessDetails] = useState<AccessDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [visitorData, setVisitorData] = useState({
    name: '',
    company: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (accessCode) {
      loadAccessDetails();
    }
  }, [accessCode]);

  const loadAccessDetails = async () => {
    try {
      setLoading(true);
      const details = await api.getAccessByCode(accessCode!);
      setAccessDetails(details);
    } catch (error) {
      console.error('Error loading access details:', error);
      setError('Código de acceso no válido o expirado');
    } finally {
      setLoading(false);
    }
  };

  const now = useMemo(() => new Date(), []);

  const scheduleInfo = useMemo(() => {
    if (!accessDetails) return null;
    const { schedule } = accessDetails;
    const start = new Date(`${schedule.startDate}T${schedule.startTime}:00`);
    const end = new Date(`${schedule.endDate}T${schedule.endTime}:00`);
    return { start, end };
  }, [accessDetails]);

  const isActive = accessDetails?.status === 'active';
  const hasCapacity = useMemo(() => {
    if (!accessDetails) return false;
    const max = accessDetails.settings?.maxUses;
    if (!max || max <= 0) return true; // sin límite o no configurado
    return accessDetails.usageCount < max;
  }, [accessDetails]);

  const withinSchedule = useMemo(() => {
    if (!scheduleInfo) return false;
    return now >= scheduleInfo.start && now <= scheduleInfo.end;
  }, [scheduleInfo, now]);

  const notAvailableReason = useMemo(() => {
    if (!accessDetails) return null;
    if (!isActive) return 'Este evento no está activo.';
    if (!withinSchedule) return 'Fuera del horario del evento.';
    if (!hasCapacity) return 'Cupo agotado.';
    return null;
  }, [accessDetails, isActive, withinSchedule, hasCapacity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (notAvailableReason) {
      setSubmitError(notAvailableReason);
      return;
    }
    
    if (!visitorData.name || !visitorData.company || !visitorData.email) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      const result = await api.redeemAccessCode(accessCode!, visitorData);
      
      if (result.autoApproved) {
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch (error: any) {
      console.error('Error redeeming access code:', error);
      setSubmitError(error.message || 'Error al procesar el código de acceso');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Validando código de acceso...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Código no válido</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    const remainingUses = accessDetails ? 
      (accessDetails.settings.maxUses && accessDetails.settings.maxUses > 0 ? 
        Math.max(0, accessDetails.settings.maxUses - accessDetails.usageCount - 1) : null) 
      : null;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Registro exitoso!</h2>
          <p className="text-gray-600 mb-4">
            Su visita ha sido registrada correctamente. 
            {accessDetails?.settings.autoApproval 
              ? ' Su acceso está pre-aprobado. Puede proceder al edificio.' 
              : ' Su solicitud está pendiente de aprobación. Recibirá una notificación por email cuando sea aprobada.'
            }
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p><strong>Evento:</strong> {accessDetails?.title}</p>
            <p><strong>Código:</strong> {accessCode}</p>
            <p><strong>Visitante:</strong> {visitorData.name}</p>
            <p><strong>Empresa:</strong> {visitorData.company}</p>
            {remainingUses !== null && (
              <p><strong>Cupos restantes:</strong> {remainingUses}</p>
            )}
          </div>
          {accessDetails?.settings.autoApproval && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Su acceso está pre-aprobado. Presente este código al llegar:
              </p>
              <div className="mt-2 font-mono text-lg font-bold text-green-800">
                {accessCode}
              </div>
            </div>
          )}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Finalizar
            </button>
            {accessDetails?.settings.autoApproval && (
              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Imprimir confirmación
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Visitas SecuriTI Logo" 
            className="h-16 w-auto"
          />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Registro de Visita</h2>
          <p className="text-gray-600 mt-2">Complete sus datos para registrar su visita</p>
        </div>

        {accessDetails && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900">{accessDetails.title}</h3>
            {accessDetails.description && (
              <p className="text-blue-700 text-sm mt-1">{accessDetails.description}</p>
            )}
            {scheduleInfo && (
              <div className="text-xs text-blue-700 mt-2">
                <p><strong>Inicio:</strong> {scheduleInfo.start.toLocaleString()}</p>
                <p><strong>Fin:</strong> {scheduleInfo.end.toLocaleString()}</p>
              </div>
            )}
            <div className="text-xs text-blue-600 mt-2 flex gap-3 flex-wrap">
              <span><strong>Usos:</strong> {accessDetails.usageCount}/{accessDetails.settings.maxUses || '∞'}</span>
              <span><strong>Estatus:</strong> {isActive ? 'Activo' : 'No activo'}</span>
              <span><strong>Horario:</strong> {withinSchedule ? 'En ventana' : 'Fuera de ventana'}</span>
            </div>
            {notAvailableReason && (
              <div className="mt-3 p-2 rounded bg-red-100 text-red-700 text-sm">
                {notAvailableReason}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre completo *
            </label>
            <input
              id="name"
              type="text"
              value={visitorData.name}
              onChange={(e) => setVisitorData({ ...visitorData, name: e.target.value })}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Su nombre completo"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Empresa *
            </label>
            <input
              id="company"
              type="text"
              value={visitorData.company}
              onChange={(e) => setVisitorData({ ...visitorData, company: e.target.value })}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre de su empresa"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={visitorData.email}
              onChange={(e) => setVisitorData({ ...visitorData, email: e.target.value })}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="su@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={visitorData.phone}
              onChange={(e) => setVisitorData({ ...visitorData, phone: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Su número de teléfono"
            />
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !!notAvailableReason}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Registrando...' : 'Registrar Visita'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Al registrarse acepta nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
};