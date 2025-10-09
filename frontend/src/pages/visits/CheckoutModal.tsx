import React, { useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photos: string[]) => void;
  maxPhotos?: number;
}

export const CheckoutModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, maxPhotos = 5 }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const toRead = Array.from(files).slice(0, maxPhotos - photos.length);
    const reads = await Promise.all(
      toRead.map(
        file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Error reading file'));
          reader.readAsDataURL(file);
        })
      )
    );
    setPhotos(prev => [...prev, ...reads].slice(0, maxPhotos));
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
        setIsCameraOn(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
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
      if (!videoRef.current || !canvasRef.current || photos.length >= maxPhotos) return;
    
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => [...prev, dataURL]);
      }
    };

    const handleClose = () => {
      stopCamera();
      setPhotos([]);
      onClose();
    };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold">Fotos de salida (hasta {maxPhotos})</h2>
        <p className="text-sm text-gray-500 mb-4">Adjunta evidencias de salida si aplica. Puedes tomar fotos con la cámara o subir archivos.</p>

        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700"
          >
              Subir fotos
          </button>
            <button
              type="button"
              onClick={isCameraOn ? stopCamera : startCamera}
              className={`px-3 py-2 rounded-md ${isCameraOn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {isCameraOn ? 'Cerrar cámara' : 'Abrir cámara'}
            </button>
            {isCameraOn && (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={photos.length >= maxPhotos}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              >
                📸 Capturar
              </button>
            )}
          <span className="text-sm text-gray-500">{photos.length}/{maxPhotos} seleccionadas</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>

          {isCameraOn && (
            <div className="mb-4">
              <video ref={videoRef} className="w-full max-w-sm mx-auto rounded border" autoPlay muted />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {photos.map((src, i) => (
              <div key={i} className="relative border rounded-md overflow-hidden">
                <img src={src} alt={`foto-${i+1}`} className="w-full h-24 object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full text-xs px-2 py-0.5"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 rounded-md bg-gray-200">Cancelar</button>
          <button
            onClick={() => { onConfirm(photos); handleClose(); }}
            className="px-4 py-2 rounded-md bg-green-600 text-white"
          >
            Confirmar salida
          </button>
        </div>
      </div>
    </div>
  );
};
