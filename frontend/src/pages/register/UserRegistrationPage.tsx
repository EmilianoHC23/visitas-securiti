import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  const [showPhotoStep, setShowPhotoStep] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const token = searchParams.get('token');

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setError("Tu navegador no soporta el acceso a la cámara.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo acceder a la cámara. Por favor, revisa los permisos.");
      setShowPhotoStep(false);
    }
  };

  useEffect(() => {
    if (showPhotoStep) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showPhotoStep]);

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const photoDataUrl = canvas.toDataURL('image/jpeg');
      setUserPhoto(photoDataUrl);
      stopCamera();
    }
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

    // Si no hay foto tomada, mostrar opción de tomar foto
    if (!userPhoto) {
      setShowPhotoStep(true);
      return;
    }

    // Si ya hay foto o se saltó, proceder con el registro
    await completeRegistration();
  };

  const completeRegistration = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.completeRegistration(token, {
        password,
        firstName: invitationData.firstName,
        lastName: invitationData.lastName,
        profileImage: userPhoto // Foto opcional
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

  const skipPhoto = () => {
    setShowPhotoStep(false);
    completeRegistration();
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
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invitación Inválida</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

  // Mostrar paso de foto opcional
  if (showPhotoStep) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Foto de Perfil (Opcional)
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Puedes tomarte una foto para tu perfil o saltar este paso
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm bg-gray-200 rounded-md overflow-hidden aspect-square mb-4 relative shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {userPhoto && <img src={userPhoto} alt="Tu foto" className="absolute top-0 left-0 w-full h-full object-cover" />}
              </div>
              <canvas ref={canvasRef} className="hidden"></canvas>

              {!userPhoto ? (
                <button
                  onClick={handleTakePhoto}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tomar Foto
                </button>
              ) : (
                <div className="w-full space-y-3">
                  <button
                    onClick={() => setShowPhotoStep(false)}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Usar Esta Foto
                  </button>
                  <button
                    onClick={() => { setUserPhoto(''); startCamera(); }}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Tomar de Nuevo
                  </button>
                </div>
              )}

              <button
                onClick={skipPhoto}
                className="mt-4 text-sm text-gray-600 hover:text-gray-900"
              >
                Saltar y Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje de éxito si el registro fue completado
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-green-600 text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Registro Exitoso!</h2>
              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión con tu correo electrónico y la contraseña que acabas de crear.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Crear Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Completa tu registro para acceder al sistema
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* User Information Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-900">
                  Email
                </label>
                <p className="text-sm text-blue-700 font-medium">{invitationData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900">
                  Nombre
                </label>
                <p className="text-sm text-blue-700 font-medium">
                  {invitationData.firstName} {invitationData.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900">
                  Rol asignado
                </label>
                <p className="text-sm text-blue-700 font-medium capitalize">
                  {invitationData.role}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Repite tu contraseña"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};