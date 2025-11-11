import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Mail, Camera, X, ArrowLeft, Building2, Calendar, MapPin, XCircle } from 'lucide-react';
import * as api from '../../services/api';

const CameraUserIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4.00002 21.8174C4.6026 22 5.41649 22 6.8 22H17.2C18.5835 22 19.3974 22 20 21.8174M4.00002 21.8174C3.87082 21.7783 3.75133 21.7308 3.63803 21.673C3.07354 21.3854 2.6146 20.9265 2.32698 20.362C2 19.7202 2 18.8802 2 17.2V6.8C2 5.11984 2 4.27976 2.32698 3.63803C2.6146 3.07354 3.07354 2.6146 3.63803 2.32698C4.27976 2 5.11984 2 6.8 2H17.2C18.8802 2 19.7202 2 20.362 2.32698C20.9265 2.6146 21.3854 3.07354 21.673 3.63803C22 4.27976 22 5.11984 22 6.8V17.2C22 18.8802 22 19.7202 21.673 20.362C21.3854 20.9265 20.9265 21.3854 20.362 21.673C20.2487 21.7308 20.1292 21.7783 20 21.8174M4.00002 21.8174C4.00035 21.0081 4.00521 20.5799 4.07686 20.2196C4.39249 18.6329 5.63288 17.3925 7.21964 17.0769C7.60603 17 8.07069 17 9 17H15C15.9293 17 16.394 17 16.7804 17.0769C18.3671 17.3925 19.6075 18.6329 19.9231 20.2196C19.9948 20.5799 19.9996 21.0081 19.9996 21.8174M16 9.5C16 11.7091 14.2091 13.5 12 13.5C9.79086 13.5 8 11.7091 8 9.5C8 7.29086 9.79086 5.5 12 5.5C14.2091 5.5 16 7.29086 16 9.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface CompanyInfo {
  name: string;
  logo?: string | null;
}

interface AccessInfo {
  _id: string;
  eventName: string;
  location?: string;
  eventImage?: string;
  startDate: string;
}

export const SelfRegisterEventFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessId } = useParams<{ accessId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photo: ''
  });
  // Styled alert modal state (replace native alert)
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadInitialData();
    return () => {
      stopCamera();
    };
  }, [accessId]);

  const loadInitialData = async () => {
    if (!accessId) {
      navigate('/public/self-register/events');
      return;
    }

    try {
      setLoadingData(true);
      const [config, accessData] = await Promise.all([
        api.getPublicCompanyConfig(),
        api.getAccessPublicInfo(accessId)
      ]);
      
      setCompanyInfo({
        name: config.name || 'Empresa',
        logo: config.logo || null
      });
      
      setAccessInfo(accessData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      alert('No se pudo cargar la información del evento');
      navigate('/public/self-register/events');
    } finally {
      setLoadingData(false);
    }
  };

  const startCamera = async () => {
    try {
      console.log('🎥 Iniciando cámara...');
      setShowCamera(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('✅ Stream obtenido:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Metadata cargada, reproduciendo video...');
          videoRef.current?.play().catch(err => {
            console.error('Error al reproducir video:', err);
          });
        };
      }
    } catch (error) {
      console.error('❌ Error al iniciar cámara:', error);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
  };

  const capturePhoto = () => {
    console.log('📸 Capturando foto...');
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Referencias no disponibles');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('❌ No se pudo obtener contexto 2D');
      return;
    }

    console.log('📐 Dimensiones del video:', video.videoWidth, 'x', video.videoHeight);
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('✅ Foto capturada, tamaño:', photoData.length, 'bytes');
    
    setFormData(prev => ({ ...prev, photo: photoData }));
    stopCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Por favor completa tu nombre y correo electrónico');
      return;
    }

    if (!formData.photo) {
      // Show styled alert modal instead of native alert
      setAlertMessage('Por favor captura tu foto antes de continuar');
      setAlertOpen(true);
      return;
    }

    if (!accessId) {
      alert('Error: No se encontró el evento');
      return;
    }

    try {
      setLoading(true);

      // Verificar lista negra ANTES de pre-registrar - BLOQUEAR si está en lista negra
      const blacklistEntry = await api.checkBlacklist(formData.email);
      if (blacklistEntry) {
        // Show styled alert modal, do not include the blacklist reason or emoji
        setAlertMessage('No es posible completar el registro al evento.\n\nPor favor contacta al organizador o a un recepcionista para validar tu acceso.');
        setAlertOpen(true);
        setLoading(false);
        return; // BLOQUEAR - no permitir continuar
      }

      // Pre-registrar en el evento
      await api.preRegisterToAccess(accessId, {
        name: formData.name,
        email: formData.email,
        company: '', // Opcional
        phone: '', // Opcional
        photo: formData.photo
      });

      // Redirigir a página de éxito con el ID del acceso
      navigate(`/public/self-register/event-success/${accessId}`);
    } catch (error: any) {
      console.error('Error registering for event:', error);
      alert(error?.message || 'Error al registrarse. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/public/self-register/events')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a la lista
          </button>

          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full ring-2 ring-gray-800" style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                {companyInfo?.logo ? (
                  <img
                    src={companyInfo.logo}
                    alt={companyInfo.name}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Pre-registro</h1>
            <p className="text-gray-600 mt-2">Completa tu información para acceder al evento</p>
          </div>
        </div>

        {/* Event Info Card */}
        {accessInfo && (
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Evento seleccionado:</h3>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-blue-900">{accessInfo.eventName}</p>
              {accessInfo.startDate && (
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">{formatDate(accessInfo.startDate)}</span>
                </div>
              )}
              {accessInfo.location && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{accessInfo.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {/* Styled alert modal for photo missing / blacklist */}
            {alertOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 border-b border-gray-700 flex items-start justify-between text-white">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shadow-sm ring-1 ring-white/20">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Atención</h3>
                        <p className="text-sm text-indigo-100"></p>
                      </div>
                    </div>
                    <button onClick={() => { setAlertOpen(false); setAlertMessage(''); }} className="text-gray-200 hover:text-white p-2 rounded-lg transition-colors">✕</button>
                  </div>

                  <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{alertMessage}</p>
                      <div className="flex items-center justify-center">
                        <button onClick={() => { setAlertOpen(false); setAlertMessage(''); }} className="px-4 py-2 min-w-[120px] text-white bg-gradient-to-r from-gray-900 to-gray-600 rounded-lg shadow hover:from-gray-800 hover:to-gray-500">Aceptar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-6">
              {/* Foto - PRIMERO Y OBLIGATORIO */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                  <Camera className="w-4 h-4 inline mr-2" />
                  Tu foto *
                </label>
                
                <div className="flex flex-col items-center">
                  {formData.photo && !showCamera && (
                    <div className="mb-4">
                      <div className="relative">
                        <img
                          src={formData.photo}
                          alt="Foto capturada"
                          className="w-40 h-40 object-cover rounded-full border-4 border-gray-300 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photo: '' })}
                          className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {showCamera && (
                    <div className="w-full max-w-md mb-4">
                      <div className="relative bg-black rounded-2xl overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-auto"
                          autoPlay
                          playsInline
                          muted
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold shadow-lg flex items-center justify-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          Tomar foto
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {!showCamera && !formData.photo && (
                    <div className="mb-4 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-40 h-40 rounded-full border-4 border-dashed border-gray-300 hover:border-gray-900 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer group"
                      >
                        <CameraUserIcon className="w-16 h-16 text-gray-400 group-hover:text-gray-900 transition-colors" />
                      </button>
                      <p className="text-sm text-gray-500 text-center mt-3">
                        Haz clic en el círculo para capturar tu foto
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nombre completo */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-xl hover:shadow-2xl text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  'Completar pre-registro'
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                * Campos obligatorios
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
