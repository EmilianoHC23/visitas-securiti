import React, { useRef, useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photos: string[]) => void;
  maxPhotos?: number;
}

export const CheckoutModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, maxPhotos = 5 }) => {
  const [qrCode, setQrCode] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const [qrStream, setQrStream] = useState<MediaStream | null>(null);

  const startQrScanner = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setQrStream(mediaStream);
      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = mediaStream;
        qrVideoRef.current.play();
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara para escanear QR.');
    }
  };

  const stopQrScanner = () => {
    if (qrStream) {
      qrStream.getTracks().forEach(track => track.stop());
      setQrStream(null);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      startQrScanner();
    } else {
      stopQrScanner();
    }
    return () => stopQrScanner();
  }, [isOpen]);

  const handleClose = () => {
    stopQrScanner();
    setQrCode('');
    onClose();
  };

  const handleConfirm = () => {
    if (!qrCode.trim()) {
      alert('Por favor, escanea o ingresa un código QR');
      return;
    }
    // Aquí se procesaría el QR code para validar la salida
    onConfirm([]); // Por ahora solo confirmamos sin fotos
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Registrar salida del edificio</h2>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-8 space-y-6">
          {/* Instrucción */}
          <div className="text-center">
            <p className="text-gray-700 font-medium">Escanea el código QR de tu visitante</p>
          </div>

          {/* Icono de cámara circular */}
          <div className="flex justify-center">
            <div className="w-40 h-40 rounded-full border-4 border-[#1e3a8a] flex items-center justify-center bg-gray-50">
              <svg className="w-20 h-20 text-[#1e3a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Texto de invitación QR */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Si tu visita cuenta con invitación QR</p>
            <button 
              type="button" 
              onClick={() => setIsScanning(!isScanning)}
              className="text-cyan-500 hover:text-cyan-600 font-medium text-sm flex items-center gap-1 mx-auto transition-colors"
            >
              {isScanning ? 'cerrar escáner' : 'escanea aquí'}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3z"/>
              </svg>
            </button>
          </div>

          {/* Escáner QR */}
          {isScanning && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-3">
                <video 
                  ref={qrVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                {/* Overlay de esquinas para el escáner */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-gray-500">
                Coloca el código QR dentro del marco
              </p>
            </div>
          )}

          {/* Input manual del código QR (opcional) */}
          <div className="hidden">
            <input 
              type="text" 
              placeholder="O ingresa el código manualmente" 
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={handleClose}
              className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleConfirm}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Confirmar salida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
