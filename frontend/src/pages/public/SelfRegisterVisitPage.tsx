import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Briefcase, MapPin, Users, FileText, Camera, X, ArrowLeft, Building2 } from 'lucide-react';
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        setShowCamera(true);
      }
    } catch (error) {
      console.error('❌ Error al iniciar cámara:', error);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
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
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, visitorPhoto: photoData }));
        stopCamera();
      }
    }
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
                  {!showCamera && (
                    <div className="mb-4">
                      {formData.visitorPhoto ? (
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
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-40 h-40 rounded-full border-4 border-dashed border-gray-300 hover:border-gray-900 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer group"
                        >
                          <User className="w-16 h-16 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </button>
                      )}
                    </div>
                  )}

                  {showCamera && (
                    <div className="w-full max-w-md mb-4">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          className="w-full rounded-2xl border-4 border-gray-300 shadow-lg"
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

                  {!showCamera && !formData.visitorPhoto && (
                    <p className="text-sm text-gray-500 text-center">
                      Haz clic en el círculo para capturar tu foto
                    </p>
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
                <select
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Selecciona un anfitrión</option>
                  {hosts.map((host) => (
                    <option key={host._id} value={host._id}>
                      {host.firstName} {host.lastName}
                      {host.role === 'admin' ? ' (Administrador)' : ''}
                    </option>
                  ))}
                </select>
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
