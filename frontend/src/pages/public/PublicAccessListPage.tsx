import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';

interface AccessEvent {
  _id: string;
  title: string;
  description: string;
  accessCode: string;
  schedule: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  settings: {
    autoApproval: boolean;
    maxUses: number;
  };
  usageCount: number;
  status: string;
  host?: {
    firstName: string;
    lastName: string;
  };
  location?: string;
}

export const PublicAccessListPage: React.FC = () => {
  const navigate = useNavigate();
  const [accesses, setAccesses] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccess, setSelectedAccess] = useState<AccessEvent | null>(null);
  const [step, setStep] = useState<'list' | 'photo' | 'form' | 'success'>('list');
  
  // Form data
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Camera
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadActiveAccesses();
  }, []);

  const loadActiveAccesses = async () => {
    try {
      setLoading(true);
      const data = await api.getActiveAccesses();
      // Filtrar solo accesos activos con pre-registro habilitado
      const activeWithLink = data.filter((a: any) => 
        a.status === 'active' && a.accessCode
      );
      setAccesses(activeWithLink as unknown as AccessEvent[]);
    } catch (err) {
      console.error('Error loading accesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectAccess = (access: AccessEvent) => {
    setSelectedAccess(access);
    setStep('photo');
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsCameraOn(true);
    } catch (error) {
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(dataURL);
      stopCamera();
    }
  };

  const handlePhotoNext = () => {
    if (!photo) {
      setError('Por favor toma una fotografía para continuar');
      return;
    }
    setError('');
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccess) return;

    setError('');
    setSubmitting(true);

    try {
      // Check blacklist before registering access
      if (visitorEmail) {
        const blacklistEntry = await api.checkBlacklist(visitorEmail);
        if (blacklistEntry) {
          const confirmMessage = `⚠️ ALERTA DE SEGURIDAD\n\nEl usuario "${blacklistEntry.visitorName || blacklistEntry.identifier}" con correo ${blacklistEntry.identifier} se encuentra en la lista negra debido a:\n\n"${blacklistEntry.reason}"\n\n¿Desea continuar con el registro del acceso de todas formas?`;
          
          if (!confirm(confirmMessage)) {
            setSubmitting(false);
            return;
          }
        }
      }
      
      await api.redeemAccessCode(selectedAccess.accessCode, {
        name: visitorName,
        email: visitorEmail,
        company: visitorCompany
      } as any);
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Error al registrar acceso');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Lista de accesos
  if (step === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-securiti-blue-50 to-securiti-blue-100 p-4">
        <div className="max-w-4xl mx-auto py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/logo.png" alt="SecuriTI Logo" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accesos y Eventos Disponibles</h1>
            <p className="text-gray-600">Selecciona el evento al que fuiste invitado</p>
          </div>

          {/* Lista de accesos */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-securiti-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando eventos...</p>
              </div>
            ) : accesses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay eventos disponibles</h3>
                <p className="text-gray-600 mb-6">Por el momento no hay eventos o accesos activos</p>
                <button
                  onClick={() => navigate('/public')}
                  className="px-6 py-2 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700"
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <>
                {accesses.map(access => (
                  <div
                    key={access._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                    onClick={() => selectAccess(access)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{access.title}</h3>
                        <p className="text-gray-600 mb-4">{access.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-5 h-5 text-securiti-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {new Date(access.schedule.startDate).toLocaleDateString('es-ES')} - {access.schedule.startTime}
                            </span>
                          </div>
                          
                          {access.location && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg className="w-5 h-5 text-securiti-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{access.location}</span>
                            </div>
                          )}
                          
                          {access.host && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg className="w-5 h-5 text-securiti-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Anfitrión: {access.host.firstName} {access.host.lastName}</span>
                            </div>
                          )}
                          
                          {access.settings.maxUses && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg className="w-5 h-5 text-securiti-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span>Lugares disponibles: {access.settings.maxUses - access.usageCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <svg className="w-6 h-6 text-securiti-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Botón volver */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/public')}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Captura de foto obligatoria
  if (step === 'photo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-securiti-blue-50 to-securiti-blue-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fotografía Obligatoria</h2>
          <p className="text-gray-600 mb-6">Por seguridad, necesitamos tomar tu fotografía</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {!photo && !isCameraOn && (
            <button
              onClick={startCamera}
              className="w-full px-6 py-4 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Abrir Cámara
            </button>
          )}

          {isCameraOn && (
            <div>
              <video ref={videoRef} className="w-full rounded-lg mb-4" autoPlay />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Capturar Foto
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {photo && !isCameraOn && (
            <div>
              <img src={photo} alt="Foto capturada" className="w-full rounded-lg mb-4" />
              <div className="flex gap-3">
                <button
                  onClick={() => setPhoto(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Tomar de nuevo
                </button>
                <button
                  onClick={handlePhotoNext}
                  className="flex-1 px-4 py-2 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep('list')}
            className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Regresar
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Formulario de datos
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-securiti-blue-50 to-securiti-blue-100 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              {photo && (
                <img src={photo} alt="Tu foto" className="w-20 h-20 rounded-lg object-cover" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Completa tu Registro</h2>
                <p className="text-gray-600">Evento: {selectedAccess?.title}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={e => setVisitorEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={visitorCompany}
                  onChange={e => setVisitorCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500"
                  placeholder="Nombre de la empresa"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('photo')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  ← Regresar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700 font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Registrando...' : 'Finalizar →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Éxito
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ingreso Aprobado!</h2>
          <p className="text-gray-600 mb-4">
            Tu ingreso ha sido aprobado exitosamente. Ya puedes ingresar a:
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="font-semibold text-blue-900">{selectedAccess?.title}</p>
            {selectedAccess?.location && (
              <p className="text-sm text-blue-700 mt-1">Ubicación: {selectedAccess.location}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/public')}
          className="w-full px-6 py-3 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700 transition-colors font-semibold"
        >
          Finalizar
        </button>
      </div>
    </div>
  );
};
