import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../../services/api';

export const PublicVisitRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [hostId, setHostId] = useState('');
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  
  // Camera
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadHosts();
    // Pre-llenar datos desde QR code si existen
    prefillFromQR();
  }, []);

  const loadHosts = async () => {
    try {
      const data = await api.getHosts();
      setHosts(data);
    } catch (err) {
      console.error('Error loading hosts:', err);
    }
  };

  const prefillFromQR = () => {
    try {
      // Intentar obtener datos del QR desde los parámetros de la URL
      const qrData = searchParams.get('data');
      if (qrData) {
        const parsedData = JSON.parse(decodeURIComponent(qrData));
        
        // Pre-llenar los campos si existen en el QR
        if (parsedData.visitorName) setVisitorName(parsedData.visitorName);
        if (parsedData.visitorEmail) setVisitorEmail(parsedData.visitorEmail);
        if (parsedData.visitorCompany) setVisitorCompany(parsedData.visitorCompany);
        if (parsedData.hostId) setHostId(parsedData.hostId);
        if (parsedData.visitorPhoto) setPhoto(parsedData.visitorPhoto);
        
        console.log('✅ Datos pre-llenados desde QR:', parsedData);
      }
    } catch (err) {
      console.warn('Error al parsear datos del QR:', err);
      // No mostrar error al usuario, simplemente no pre-llenar
    }
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

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.onerror = () => setError('Error al leer la foto');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!visitorName || !visitorEmail || !hostId || !reason) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      await api.createVisit({
        visitorName,
        visitorEmail,
        visitorCompany,
        hostId,
        reason,
        destination: 'SecuriTI',
        scheduledDate: new Date().toISOString(),
        visitorPhoto: photo || undefined
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la visita');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
            <p className="text-gray-600">
              Tu visita se ha registrado correctamente. Se ha enviado una notificación al anfitrión para su aprobación.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Próximos pasos:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 text-left space-y-1">
              <li>• Recibirás un correo con la respuesta de tu solicitud</li>
              <li>• Si es aprobada, incluirá un código QR para tu ingreso</li>
              <li>• Espera en recepción la confirmación</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/public')}
            className="w-full px-6 py-3 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700 transition-colors font-semibold"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-securiti-blue-50 to-securiti-blue-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SecuriTI Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Visita</h1>
          <p className="text-gray-600">Completa el formulario para registrar tu visita</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={e => setVisitorName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500 focus:border-transparent"
                placeholder="Juan Pérez"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={visitorEmail}
                onChange={e => setVisitorEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500 focus:border-transparent"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa (opcional)
              </label>
              <input
                type="text"
                value={visitorCompany}
                onChange={e => setVisitorCompany(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500 focus:border-transparent"
                placeholder="Nombre de la empresa"
              />
            </div>

            {/* Anfitrión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿A quién visitas? <span className="text-red-500">*</span>
              </label>
              <select
                value={hostId}
                onChange={e => setHostId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Selecciona una persona</option>
                {hosts.map(host => (
                  <option key={host._id} value={host._id}>
                    {host.firstName} {host.lastName}{host.role === 'admin' ? ' (Administrador)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Visita <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-securiti-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Selecciona un motivo</option>
                <option value="Reunión">Reunión</option>
                <option value="Entrega">Entrega</option>
                <option value="Proveedor">Proveedor</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Foto (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotografía (opcional)
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 px-4 py-2 bg-securiti-blue-100 text-securiti-blue-700 rounded-lg hover:bg-securiti-blue-200 transition-colors"
                  >
                    📷 Usar cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    📁 Subir archivo
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files)}
                  />
                </div>

                {isCameraOn && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <video ref={videoRef} width="100%" className="rounded-lg mb-2" autoPlay />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Capturar
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {photo && !isCameraOn && (
                  <div className="border rounded-lg p-3">
                    <img src={photo} alt="Vista previa" className="w-32 h-32 object-cover rounded-lg mb-2" />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Eliminar foto
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/public')}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : 'Registrar Visita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
