import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { X, Camera, User as UserIcon } from 'lucide-react';
import { MdOutlineQrCodeScanner } from 'react-icons/md';
import { VscSignIn } from 'react-icons/vsc';
import jsQR from 'jsqr';
import * as api from '../../services/api';
import { useToast } from '../../components/common/Toast';

interface VisitRegistrationSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (visitData: any) => void;
  hosts: User[];
}

type RegistrationMode = 'quick-qr' | 'manual' | null;

export const VisitRegistrationSidePanel: React.FC<VisitRegistrationSidePanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  hosts
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<RegistrationMode>(null);
  const [formData, setFormData] = useState({
    visitorEmail: '',
    visitorName: '',
    visitorCompany: '',
    destination: '',
    host: '',
    reason: '',
    visitorPhoto: ''
  });

  const [showCamera, setShowCamera] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setMode(null);
      setFormData({
        visitorEmail: '',
        visitorName: '',
        visitorCompany: '',
        destination: '',
        host: '',
        reason: '',
        visitorPhoto: ''
      });
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async (isQrMode: boolean = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isQrMode ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();

        if (isQrMode) {
          startQrScanning();
        }
      }
    } catch (error) {
      console.error('❌ Error al iniciar cámara:', error);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
    setShowQrScanner(false);
  };

  const startQrScanning = () => {
    if (scanIntervalRef.current) return;

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            console.log('✅ QR detectado:', code.data);
            handleQrDetected(code.data);
          }
        }
      }
    }, 300);
  };

  const handleQrDetected = async (qrData: string) => {
    stopCamera();
    
    try {
      const data = JSON.parse(qrData);
      
      // Si es un QR de invitación de acceso - SOLO RELLENAR FORMULARIO
      if (data.type === 'access-invitation') {
        console.log('✅ QR de invitación de acceso detectado:', data);
        
        // Auto-completar formulario con los datos del QR
        setFormData(prev => ({
          ...prev,
          visitorEmail: data.guestEmail || '',
          visitorName: data.guestName || '',
          visitorCompany: '',
          destination: data.location || '',
          host: '', // Debe seleccionar manualmente
          reason: `Evento: ${data.eventName}`
        }));
        
        // Guardar datos del acceso para actualizar asistencia después del registro
        (window as any).__pendingAccessCheckIn = {
          accessId: data.accessId,
          accessCode: data.accessCode,
          guestEmail: data.guestEmail,
          guestName: data.guestName
        };
        
        setMode('manual');
        alert(`✅ Datos del QR cargados\n\nEvento: ${data.eventName}\n\nPor favor completa el formulario y registra la visita.`);
      }
      // Si es un QR de visitante, autocompletar formulario
      else if (data.type === 'visitor-info') {
        setFormData(prev => ({
          ...prev,
          visitorEmail: data.email || '',
          visitorName: data.name || '',
          visitorCompany: data.company || '',
          visitorPhoto: data.photo || ''
        }));
        setMode('manual');
      }
      // Si es un QR de check-in, proceso directo
      else if (data.type === 'visit-checkin') {
        // Aquí iría la lógica de check-in directo
        console.log('QR de check-in detectado:', data);
      }
    } catch (error) {
      console.error('Error al procesar QR:', error);
      alert('Código QR no válido');
    }
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

    if (!formData.visitorEmail || !formData.visitorName || !formData.host || !formData.reason) {
      showToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    // Si hay un acceso pendiente de QR escaneado, registrar el check-in y crear visita con auto check-in
    const pendingAccess = (window as any).__pendingAccessCheckIn;

    // Crear objeto de datos con los flags necesarios
    const visitDataToSubmit = { ...formData };

    if (pendingAccess) {
      // Marcar que esta visita viene de un acceso/evento para auto check-in ANTES de intentar el fetch
      // Esto garantiza que la visita vaya a "Dentro" incluso si falla la actualización de asistencia
      (visitDataToSubmit as any).fromAccessEvent = true;
      (visitDataToSubmit as any).accessCode = pendingAccess.accessCode;

      console.log('🎫 Visita marcada como fromAccessEvent con código:', pendingAccess.accessCode);

      try {
        // Hacer check-in en el acceso usando el servicio API
        await api.publicAccessCheckIn({
          accessCode: pendingAccess.accessCode,
          guestEmail: pendingAccess.guestEmail || formData.visitorEmail,
          guestName: pendingAccess.guestName || formData.visitorName
        });

        console.log('✅ Asistencia actualizada en el acceso');

        // Limpiar el acceso pendiente
        delete (window as any).__pendingAccessCheckIn;
      } catch (error) {
        console.error('Error al actualizar asistencia:', error);
        // No bloqueamos el registro de visita si falla la actualización - el flag ya está establecido
      }
    }

    try {
      // onSubmit puede ser síncrono o devolver una promesa
      await Promise.resolve(onSubmit(visitDataToSubmit));
      showToast('Visita registrada correctamente', 'success');
      onClose();
    } catch (error: any) {
      console.error('Error al registrar visita:', error);
      const serverMessage = error?.response?.data?.message || error?.message;
      showToast(serverMessage ? `No se pudo registrar la visita: ${serverMessage}` : 'No se pudo registrar la visita', 'error');
    }
  };

  const handleModeSelection = (selectedMode: RegistrationMode) => {
    setMode(selectedMode);
    
    if (selectedMode === 'quick-qr') {
      setShowQrScanner(true);
      startCamera(true);
    }
  };

  /* Custom host selector: shows avatar + name + email in dropdown list */
  const HostSelect: React.FC<{
    hosts: User[];
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

    const renderAvatar = (host: User) => {
      // Try the most common property used across the app first
      const src = (host as any).profileImage || (host as any).photo || (host as any).avatar || (host as any).picture || '';

      const initials = `${host.firstName?.[0] || ''}${host.lastName?.[0] || ''}`.toUpperCase();

      // If there is a src and it hasn't previously failed, try to render the image
      if (src && !failedImages[host._id]) {
        return (
          <img
            src={src}
            alt={`${host.firstName} ${host.lastName}`}
            className="w-8 h-8 rounded-full object-cover"
            onError={() => setFailedImages(prev => ({ ...prev, [host._id]: true }))}
          />
        );
      }

      // Fallback: initials avatar
      return (
        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold">{initials}</div>
      );
    };

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-3 bg-white"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3">
            {selected ? renderAvatar(selected) : <div className="w-8 h-8 rounded-full bg-gray-100" />}
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{selected ? `${selected.firstName} ${selected.lastName}` : 'Selecciona un anfitrión'}</div>
              <div className="text-xs text-gray-500 truncate">{selected ? ((selected as any).email || '') : ''}</div>
            </div>
          </div>
          <svg className="ml-auto w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-56 overflow-auto">
            {hosts.map(host => (
              <button
                key={host._id}
                type="button"
                onClick={() => { onChange(host._id); setOpen(false); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
              >
                {renderAvatar(host)}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{host.firstName} {host.lastName}</div>
                  <div className="text-xs text-gray-500 truncate">{(host as any).email || ''}</div>
                </div>
              </button>
            ))}
            {hosts.length === 0 && (
              <div className="p-3 text-sm text-gray-500">No hay anfitriones disponibles</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 via-cyan-600 to-blue-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><VscSignIn className="w-5 h-5" />Registrar Entrada</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            className="text-white bg-white/0 hover:bg-white/10 rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-73px)] overflow-y-auto">
          {/* Mode Selection */}
          {!mode && (
            <div className="p-6 space-y-4">
              <p className="text-gray-600 mb-6">Selecciona el método de registro:</p>
              
              <button
                onClick={() => handleModeSelection('quick-qr')}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                  <MdOutlineQrCodeScanner className="w-6 h-6 text-cyan-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Registro Rápido con QR</h3>
                  <p className="text-sm text-gray-500">Escanea el código QR del visitante</p>
                </div>
              </button>

              <button
                onClick={() => handleModeSelection('manual')}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <UserIcon className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Registro Manual</h3>
                  <p className="text-sm text-gray-500">Completa el formulario manualmente</p>
                </div>
              </button>
            </div>
          )}

          {/* QR Scanner */}
          {mode === 'quick-qr' && showQrScanner && (
            <div className="p-6">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* QR Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-cyan-400 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-500 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-500 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-500 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-500 rounded-br-xl"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600 mb-4">
                Coloca el código QR dentro del marco
              </p>
              
              <button
                onClick={() => {
                  stopCamera();
                  setMode(null);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Manual Form */}
          {mode === 'manual' && !showCamera && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Photo Section */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center mb-3">
                  {formData.visitorPhoto ? (
                    <img src={formData.visitorPhoto} alt="Visitante" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCamera(true);
                    startCamera(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-cyan-600 border border-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {formData.visitorPhoto ? 'Cambiar foto' : 'Tomar foto (opcional)'}
                </button>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.visitorEmail}
                  onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.visitorCompany}
                  onChange={(e) => setFormData({ ...formData, visitorCompany: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Nombre de la empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  A dónde se dirige
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Oficina 302, Sala de juntas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  A quién visita *
                </label>
                <HostSelect
                  hosts={hosts}
                  value={formData.host}
                  onChange={(id) => setFormData({ ...formData, host: id })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón de la visita *
                </label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  placeholder="Describe brevemente el motivo de la visita..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode(null);
                    setFormData({
                      visitorEmail: '',
                      visitorName: '',
                      visitorCompany: '',
                      destination: '',
                      host: '',
                      reason: '',
                      visitorPhoto: ''
                    });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  Registrar Visita
                </button>
              </div>
            </form>
          )}

          {/* Camera View for Photo */}
          {mode === 'manual' && showCamera && (
            <div className="p-6">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover mirror"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={stopCamera}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  Capturar Foto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </>
  );
};
