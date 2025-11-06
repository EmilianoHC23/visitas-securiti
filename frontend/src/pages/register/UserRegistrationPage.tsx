import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Lock, Eye, EyeOff, CheckCircle, AlertCircle, User, Mail, Shield, X } from 'lucide-react';
import * as api from '../../services/api';

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName: string;
}

export const UserRegistrationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const token = searchParams.get('token');

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

  const startCamera = async () => {
    try {
      setShowCamera(true);
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
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Error al reproducir video:', err);
          });
        };
      }
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setUserPhoto(photoData);
    stopCamera();
  };

  useEffect(() => {
    // Clear any existing token to ensure clean registration process
    localStorage.removeItem('securitiToken');
    
    if (!token) {
      setError('Token de invitación no válido');
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const data = await api.verifyInvitationToken(token);
        setInvitationData(data.invitation);
      } catch (error) {
        console.error('Error verifying token:', error);
        setError('Token de invitación inválido o expirado');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !invitationData) return;

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Proceder con el registro directamente (foto es opcional)
    await completeRegistration();
  };

  const completeRegistration = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.completeRegistration(token!, {
        password,
        firstName: invitationData!.firstName,
        lastName: invitationData!.lastName,
        profileImage: userPhoto || '' // Foto opcional
      });

      // Auto-login after successful registration
      if (result.token) {
        localStorage.setItem('securitiToken', result.token);
        setRegistrationSuccess(true);
      }
    } catch (error) {
      console.error('Error completing registration:', error);
      setError('Error al completar el registro. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando invitación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitación Inválida</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitationData) return null;

  // Mostrar mensaje de éxito si el registro fue completado
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión con tu correo electrónico y la contraseña que acabas de crear.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header con logo */}
        <div className="mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full ring-2 ring-gray-800" style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Sistema"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/></svg>';
                  }}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Contraseña</h1>
            <p className="text-gray-600 mt-2">Completa tu registro para acceder al sistema</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Información del Usuario */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Datos de Invitación</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Mail className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Email
                      </label>
                      <p className="text-sm text-gray-900 font-medium truncate">{invitationData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Nombre
                      </label>
                      <p className="text-sm text-gray-900 font-medium">
                        {invitationData.firstName} {invitationData.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Shield className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Rol Asignado
                      </label>
                      <p className="text-sm text-gray-900 font-medium capitalize">
                        {invitationData.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foto de Perfil (Opcional) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                  Foto de Perfil (Opcional)
                </label>
                
                {!showCamera && !userPhoto && (
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 border-2 border-gray-300">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg"
                    >
                      <Camera className="w-5 h-5" />
                      Tomar Foto
                    </button>
                  </div>
                )}

                {showCamera && !userPhoto && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-md aspect-square bg-black rounded-xl overflow-hidden mb-4 border-2 border-gray-300">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg"
                      >
                        <Camera className="w-5 h-5" />
                        Capturar
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                      >
                        <X className="w-5 h-5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {userPhoto && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-gray-300 shadow-lg">
                      <img src={userPhoto} alt="Tu foto" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUserPhoto(''); startCamera(); }}
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      Tomar Otra Foto
                    </button>
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="Repite tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Botón Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold rounded-xl hover:from-gray-800 hover:to-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando cuenta...
                    </span>
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};