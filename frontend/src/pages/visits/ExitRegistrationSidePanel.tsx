import React, { useState, useRef, useEffect } from 'react';
import { Visit } from '../../types';
import { X, Upload, Trash2 } from 'lucide-react';
import { MdOutlineQrCodeScanner } from 'react-icons/md';
import { VscSignOut } from 'react-icons/vsc';
import { FaRegUser } from 'react-icons/fa';
import jsQR from 'jsqr';

interface ExitRegistrationSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: (visitId: string, photos: string[]) => void;
  visits: Visit[];
  onSelectVisit?: (visit: Visit) => void;
}

export const ExitRegistrationSidePanel: React.FC<ExitRegistrationSidePanelProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  visits,
  onSelectVisit
}) => {
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exitPhotos, setExitPhotos] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setSelectedVisit(null);
      setShowQrScanner(false);
      setSearchQuery('');
      setExitPhotos([]);
      stopCamera();
    }
  }, [isOpen]);

  // Calcular tiempo transcurrido
  useEffect(() => {
    if (!selectedVisit || !selectedVisit.checkInTime) return;

    const updateElapsedTime = () => {
      const start = new Date(selectedVisit.checkInTime!);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      setElapsedTime(`${hours}h ${minutes}m`);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [selectedVisit]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        startQrScanning();
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
            console.log('✅ QR detectado para salida:', code.data);
            handleQrDetected(code.data);
          }
        }
      }
    }, 300);
  };

  const handleQrDetected = (qrData: string) => {
    stopCamera();
    
    try {
      const data = JSON.parse(qrData);
      
      // Buscar la visita por token QR o visitId
      let foundVisit: Visit | null = null;
      
      if (data.type === 'visit-checkin' && data.visitId) {
        foundVisit = visits.find(v => v._id === data.visitId) || null;
      } else if (data.type === 'visitor-info' && data.email) {
        // Buscar por email del visitante
        foundVisit = visits.find(v => v.visitorEmail === data.email) || null;
      }
      
      if (foundVisit) {
        setSelectedVisit(foundVisit);
        if (onSelectVisit) {
          onSelectVisit(foundVisit);
        }
      } else {
        alert('No se encontró una visita activa para este QR');
      }
    } catch (error) {
      console.error('Error al procesar QR:', error);
      alert('Código QR no válido');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Limitar a 5 fotos
    const remainingSlots = 5 - exitPhotos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = event.target?.result as string;
        setExitPhotos(prev => [...prev, photoData]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setExitPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmExit = () => {
    if (!selectedVisit) return;
    onConfirmExit(selectedVisit._id, exitPhotos);
    onClose();
  };

  // Filtrar visitantes activos (checked-in)
  const checkedInVisits = visits.filter(v => v.status === 'checked-in');
  const filteredVisits = checkedInVisits.filter(v => 
    v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.visitorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.visitorCompany?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        className={`fixed right-0 top-0 h-full w-full md:w-[550px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><VscSignOut className="w-5 h-5" />Registrar Salida</h2>
          <button
            onClick={onClose}
            className="text-white bg-white/0 hover:bg-white/10 rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" aria-hidden={true} />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-73px)] overflow-y-auto">
          {!selectedVisit ? (
            <>
              {/* Búsqueda y opciones */}
              <div className="p-6 space-y-4">
                <p className="text-gray-600 mb-4">Selecciona el método de búsqueda:</p>
                
                {/* Botón QR */}
                <button
                  onClick={() => {
                    setShowQrScanner(true);
                    startCamera();
                  }}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                    <MdOutlineQrCodeScanner className="w-6 h-6 text-gray-600 group-hover:text-white" aria-hidden={true} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Escanear QR</h3>
                    <p className="text-sm text-gray-500">Escanea el QR del visitante</p>
                  </div>
                </button>

                {/* Buscador manual */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    O busca manualmente:
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o empresa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all hover:border-gray-400"
                  />
                </div>

                {/* Lista de visitantes activos */}
                {searchQuery && (
                  <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredVisits.length > 0 ? (
                      filteredVisits.map(visit => (
                        <button
                          key={visit._id}
                          onClick={() => setSelectedVisit(visit)}
                          className="w-full p-3 border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all text-left flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {visit.visitorPhoto ? (
                              <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
                            ) : (
                              <FaRegUser className="w-6 h-6 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{visit.visitorName}</p>
                            <p className="text-sm text-gray-500 truncate">{visit.visitorEmail}</p>
                            <p className="text-xs text-gray-400">{visit.visitorCompany || 'Sin empresa'}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 py-8">No se encontraron visitantes activos</p>
                    )}
                  </div>
                )}

                {!searchQuery && checkedInVisits.length === 0 && (
                  <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <FaRegUser className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">No hay visitantes dentro actualmente</p>
                  </div>
                )}
              </div>

              {/* QR Scanner */}
              {showQrScanner && (
                <div className="p-6 border-t border-gray-200">
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
                    onClick={stopCamera}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Detalles del visitante seleccionado */}
              <div className="p-6 space-y-6">
                {/* Foto y datos básicos */}
                <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-3 ring-4 ring-gray-100">
                    {selectedVisit.visitorPhoto ? (
                      <img src={selectedVisit.visitorPhoto} alt={selectedVisit.visitorName} className="w-full h-full object-cover" />
                    ) : (
                        <FaRegUser className="w-12 h-12 text-gray-600" aria-hidden={true} />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedVisit.visitorName}</h3>
                  <p className="text-sm text-gray-500">{selectedVisit.visitorEmail}</p>
                  {selectedVisit.visitorCompany && (
                    <p className="text-sm text-gray-600 mt-1">{selectedVisit.visitorCompany}</p>
                  )}
                </div>

                {/* Detalles de la visita */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">A quién visitó</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedVisit.host.firstName} {selectedVisit.host.lastName}
                    </span>
                  </div>

                  {selectedVisit.assignedResource && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Recurso asignado</span>
                      <span className="text-sm font-semibold text-gray-800">{selectedVisit.assignedResource}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Hora de entrada</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedVisit.checkInTime ? new Date(selectedVisit.checkInTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Tiempo transcurrido</span>
                    <span className="text-lg font-bold text-gray-800">{elapsedTime}</span>
                  </div>
                </div>

                {/* Fotos adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fotos adicionales (opcional, máx. 5)
                  </label>
                  
                  {/* Grid de fotos */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {exitPhotos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group">
                        <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Botón para agregar más fotos */}
                    {exitPhotos.length < 5 && (
                      <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-gray-50 flex items-center justify-center transition-all"
                        >
                          <Upload className="w-5 h-5 text-gray-400" aria-hidden={true} />
                        </button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-gray-500 text-center">
                    {exitPhotos.length}/5 fotos agregadas
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedVisit(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmExit}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-600 text-white rounded-xl hover:from-gray-800 hover:to-gray-500 font-semibold transition-all shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                  >
                    <span className="sr-only">Confirmar Salida</span>
                    Confirmar Salida
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
