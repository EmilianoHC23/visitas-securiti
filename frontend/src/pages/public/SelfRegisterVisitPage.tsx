import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Briefcase, MapPin, Users, FileText, Camera, X, ArrowLeft, Building2 } from 'lucide-react';
import { FaRegUser } from 'react-icons/fa';
import * as api from '../../services/api';

interface CompanyInfo {
  name: string;
  logo?: string | null;
}

export const SelfRegisterVisitPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [hosts, setHosts] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string; role: string }>>([]);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorCompany: '',
    destination: '',
    host: '',
    reason: '',
    visitorPhoto: ''
  });

  useEffect(() => {
    loadInitialData();
    return () => {
      stopCamera();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [config, hostsData] = await Promise.all([
        api.getPublicCompanyConfig(),
        api.getHostsPublic()
      ]);
      
      setCompanyInfo({
        name: config.name || 'Empresa',
        logo: config.logo || null
      });
      
      setHosts(hostsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const startCamera = async () => {
    try {
      console.log('🎥 Iniciando cámara...');
      setShowCamera(true); // Mostrar la UI primero
      
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
        
        // Esperar a que el video esté listo
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
    
    // Establecer dimensiones del canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('✅ Foto capturada, tamaño:', photoData.length, 'bytes');
    
    setFormData(prev => ({ ...prev, visitorPhoto: photoData }));
    stopCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.visitorName || !formData.host) {
      alert('Por favor completa al menos el nombre y selecciona un anfitrión');
      return;
    }

    if (!formData.visitorPhoto) {
      if (!confirm('No has capturado tu foto. ¿Deseas continuar sin foto?')) {
        return;
      }
    }

    try {
      setLoading(true);

      // Crear la visita usando el endpoint de self-register
      await api.selfRegisterVisit({
        visitorName: formData.visitorName,
        visitorEmail: formData.visitorEmail,
        visitorCompany: formData.visitorCompany,
        destination: formData.destination,
        hostId: formData.host,
        reason: formData.reason,
        visitorPhoto: formData.visitorPhoto
      });

      // Redirigir a página de confirmación
      navigate('/public/self-register/success');
    } catch (error: any) {
      console.error('Error registering visit:', error);
      alert(error?.message || 'Error al registrar la visita. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Custom host selector component
  const HostSelect: React.FC<{
    hosts: Array<{ _id: string; firstName: string; lastName: string; email: string; role: string; profileImage?: string }>;
    value: string;
    onChange: (id: string) => void;
  }> = ({ hosts, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = hosts.find(h => h._id === value) || null;

    const sortedHosts = useMemo(() => {
      return [...hosts].sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }, [hosts]);

    const renderAvatar = (host: typeof hosts[0]) => {
      const src = (host as any).profileImage || (host as any).photo || (host as any).avatar || (host as any).picture || '';
      const initials = `${host.firstName?.[0] || ''}${host.lastName?.[0] || ''}`.toUpperCase();

      if (src && !failedImages[host._id]) {
        return (
          <img
            src={src}
            alt={`${host.firstName} ${host.lastName}`}
            className="w-10 h-10 rounded-full object-cover"
            onError={() => setFailedImages(prev => ({ ...prev, [host._id]: true }))}
          />
        );
      }

      return (
        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
      );
    };

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full text-left px-4 py-3 border-2 border-gray-300 rounded-xl flex items-center gap-3 bg-white hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selected ? renderAvatar(selected) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <FaRegUser className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-800 truncate">
                {selected ? `${selected.firstName} ${selected.lastName}` : 'Selecciona un anfitrión'}
              </div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-h-64 overflow-auto">
            {sortedHosts.map(host => (
              <button
                key={host._id}
                type="button"
                onClick={() => { onChange(host._id); setOpen(false); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors"
              >
                {renderAvatar(host)}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {host.firstName} {host.lastName}
                  </div>
                </div>
              </button>
            ))}
            {hosts.length === 0 && (
              <div className="p-4 text-sm text-gray-500 text-center">No hay anfitriones disponibles</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/public/self-register')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>

          <div className="text-center mb-6">
            {companyInfo?.logo ? (
              <img
                src={companyInfo.logo}
                alt={companyInfo.name}
                className="h-16 w-auto mx-auto object-contain mb-4"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Registro de Visita</h1>
            <p className="text-gray-600 mt-2">Completa tus datos para registrar tu visita</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Foto del visitante - PRIMERO */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                  <Camera className="w-4 h-4 inline mr-2" />
                  Foto del visitante
                </label>
                
                <div className="flex flex-col items-center">
                  {/* Mostrar foto capturada */}
                  {formData.visitorPhoto && !showCamera && (
                    <div className="mb-4">
                      <div className="relative">
                        <img
                          src={formData.visitorPhoto}
                          alt="Foto capturada"
                          className="w-40 h-40 object-cover rounded-full border-4 border-gray-300 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, visitorPhoto: '' })}
                          className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mostrar vista previa de la cámara */}
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

                  {/* Mostrar botón para iniciar cámara */}
                  {!showCamera && !formData.visitorPhoto && (
                    <div className="mb-4 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-40 h-40 rounded-full border-4 border-dashed border-gray-300 hover:border-gray-900 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer group"
                      >
                        <User className="w-16 h-16 text-gray-400 group-hover:text-gray-900 transition-colors" />
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
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.visitorEmail}
                  onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.visitorCompany}
                  onChange={(e) => setFormData({ ...formData, visitorCompany: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Nombre de tu empresa"
                />
              </div>

              {/* A quién visita */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  A quién visita *
                </label>
                <HostSelect
                  hosts={hosts}
                  value={formData.host}
                  onChange={(id) => setFormData({ ...formData, host: id })}
                />
              </div>

              {/* A dónde se dirige */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  A dónde se dirige
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Ej: Sala de juntas, Oficina 203"
                />
              </div>

              {/* Razón de la visita */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Razón de la visita
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                  placeholder="Describe brevemente el motivo de tu visita"
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
                  'Completar registro'
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
