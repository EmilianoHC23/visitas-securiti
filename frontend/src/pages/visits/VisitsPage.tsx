import React, { useState, useEffect, useCallback } from 'react';
import { Visit, VisitStatus, User } from '../../types';
import * as api from '../../services/api';
import { CheckoutModal } from './CheckoutModal';
import { VisitHistoryModal } from './VisitHistoryModal';
import { PendingVisitModal } from './PendingVisitModal';
import { ApprovedVisitModal } from './ApprovedVisitModal';
import { RejectionModal } from './RejectionModal';
import { CheckedInVisitModal } from './CheckedInVisitModal';
import { CheckCircleIcon, LogoutIcon, LoginIcon, ClockIcon } from '../../components/common/icons';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

// Hook para calcular y actualizar el tiempo de espera en tiempo real
function useElapsedTime(startDate: string) {
  const [elapsed, setElapsed] = React.useState('');
  React.useEffect(() => {
    function update() {
      const start = new Date(startDate);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const min = Math.floor(diffMs / 60000);
      const sec = Math.floor((diffMs % 60000) / 1000);
      setElapsed(`${min} min ${sec} seg`);
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startDate]);
  return elapsed;
}

const VisitCard: React.FC<{ 
  visit: Visit; 
  onCardClick: (visit: Visit) => void; 
  onApprove: (id: string) => void; 
  onReject: (id: string) => void; 
  onCheckIn: (id: string) => void; 
  onCheckout: (visit: Visit) => void 
}> = ({ visit, onCardClick, onApprove, onReject, onCheckIn, onCheckout }) => {
    
    const [showHistory, setShowHistory] = useState(false);
    
    const getStatusBadge = (status: VisitStatus) => {
        switch (status) {
            case VisitStatus.PENDING: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Pendiente</span>;
            case VisitStatus.APPROVED: return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">Aprobado</span>;
            case VisitStatus.REJECTED: return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Rechazado</span>;
            case VisitStatus.CHECKED_IN: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Activo</span>;
            case VisitStatus.COMPLETED: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Completado</span>;
        }
    };
    
    // Tiempo de espera en tiempo real
    const showElapsed = visit.status === VisitStatus.PENDING || visit.status === VisitStatus.APPROVED;
    const elapsed = showElapsed ? useElapsedTime(visit.scheduledDate) : null;
    
    // Color del borde según el estado
    const borderColor = visit.status === VisitStatus.REJECTED 
        ? 'border-red-500' 
        : 'border-securiti-blue-500';
    
    const formattedDate = new Date(visit.scheduledDate).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
    });

    const formattedTime = new Date(visit.scheduledDate).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    return (
    <div 
        className={`bg-white rounded-lg shadow-md p-3 border-l-4 ${borderColor} min-h-[140px] flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer`}
        onClick={() => onCardClick(visit)}
    >
            <div className="flex gap-3">
                {/* Foto del visitante */}
                <div className="w-12 h-12 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {visit.visitorPhoto ? (
                        <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
                    ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    )}
                </div>
                
                {/* Info del visitante */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 leading-tight truncate">{visit.visitorName}</p>
                            <p className="text-xs text-gray-500 leading-tight truncate">{visit.visitorCompany || 'Sin empresa'}</p>
                        </div>
                        {getStatusBadge(visit.status)}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                        <p className="truncate"><span className="font-medium">Fecha:</span> {formattedDate} {formattedTime}</p>
                        {showElapsed && <p><span className="font-medium">Esperando:</span> {elapsed}</p>}
                    </div>
                </div>
            </div>
            
            <VisitHistoryModal
                visitId={visit._id}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </div>
    );
};

const VisitFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; hosts: User[] }> = ({ isOpen, onClose, onSave, hosts }) => {

    const [visitorName, setVisitorName] = useState('');
    const [visitorCompany, setVisitorCompany] = useState('');
    const [destination, setDestination] = useState('SecurITI');
    const [reason, setReason] = useState('');
    const [hostId, setHostId] = useState('');
    const [visitorEmail, setVisitorEmail] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState('');
    const [hasQrInvitation, setHasQrInvitation] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const qrScannerRef = React.useRef<HTMLVideoElement | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isQrScannerOn, setIsQrScannerOn] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [qrStream, setQrStream] = useState<MediaStream | null>(null);

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

    const startQrScanner = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setQrStream(mediaStream);
            if (qrScannerRef.current) {
                qrScannerRef.current.srcObject = mediaStream;
                qrScannerRef.current.play();
            }
            setIsQrScannerOn(true);
            
            // Iniciar detección QR con jsQR
            scanQRCode();
        } catch (error) {
            alert('No se pudo acceder a la cámara para escanear QR. Ingresa el código manualmente.');
        }
    };

    const scanQRCode = () => {
        if (!qrScannerRef.current || !isQrScannerOn) return;
        
        const canvas = document.createElement('canvas');
        const video = qrScannerRef.current;
        
        const scan = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        try {
                            const qrData = JSON.parse(code.data);
                            
                            // Si es del tipo visitor-info, auto-completar el formulario
                            if (qrData.type === 'visitor-info') {
                                setVisitorName(qrData.visitorName || '');
                                setVisitorCompany(qrData.visitorCompany || '');
                                setVisitorEmail(qrData.visitorEmail || '');
                                setHostId(qrData.hostId || '');
                                setQrCode(code.data);
                                setHasQrInvitation(false);
                                stopQrScanner();
                                alert('✅ Datos cargados desde QR exitosamente');
                                return;
                            }
                            
                            // Si es otro tipo de QR, solo guardar el código
                            setQrCode(code.data);
                            setHasQrInvitation(false);
                            stopQrScanner();
                        } catch (e) {
                            // Si no es JSON válido, guardar como texto plano
                            setQrCode(code.data);
                            setHasQrInvitation(false);
                            stopQrScanner();
                        }
                    }
                }
            }
            
            if (isQrScannerOn) {
                requestAnimationFrame(scan);
            }
        };
        
        scan();
    };

    const stopQrScanner = () => {
        if (qrStream) {
            qrStream.getTracks().forEach(track => track.stop());
            setQrStream(null);
        }
        setIsQrScannerOn(false);
    };

    React.useEffect(() => {
        return () => {
            stopCamera();
            stopQrScanner();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitorEmail) {
            return;
        }
        try {
            // Usar fecha/hora actual para visitas espontáneas
            const scheduledDate = new Date().toISOString();
            await api.createVisit({ 
                visitorName, 
                visitorCompany, 
                reason, 
                hostId, 
                scheduledDate, 
                destination, 
                visitorEmail, 
                visitorPhoto: photo || undefined,
                qrToken: qrCode || undefined
            });
            onSave();
            onClose();
            // Reset form
            setPhoto(null);
            setQrCode('');
            setHasQrInvitation(false);
            setVisitorName('');
            setVisitorCompany('');
            setVisitorEmail('');
            setReason('');
            setHostId('');
        } catch (error) {
            console.error("Failed to create visit:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-[#1e3a8a]">Registrar visita</h2>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Sección de foto del visitante */}
                    <div className="flex flex-col items-center py-4 border-b border-gray-200">
                        <p className="text-sm text-gray-600 mb-4">Toma la fotografía de tu visitante</p>
                        
                        {!photo ? (
                            <div className="relative mb-4">
                                <button
                                    type="button"
                                    onClick={isCameraOn ? stopCamera : startCamera}
                                    className="w-32 h-32 rounded-full border-4 border-[#1e3a8a] flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-16 h-16 text-[#1e3a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="relative mb-4">
                                <img src={photo} alt="Foto visitante" className="w-32 h-32 rounded-full object-cover border-4 border-green-500" />
                                <button
                                    type="button"
                                    onClick={() => setPhoto(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Cámara activa */}
                        {isCameraOn && !photo && (
                            <div className="w-full max-w-sm mb-4">
                                <div className="relative bg-black rounded-lg overflow-hidden">
                                    <video ref={videoRef} autoPlay className="w-full h-64 object-cover" />
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                                <button 
                                    type="button" 
                                    className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                    onClick={capturePhoto}
                                >
                                    Capturar foto
                                </button>
                            </div>
                        )}

                        {/* Botón de escanear QR */}
                        <p className="text-sm text-gray-500 mb-3">Si tu visita cuenta con invitación QR</p>
                        <button 
                            type="button" 
                            onClick={() => {
                                setHasQrInvitation(!hasQrInvitation);
                                if (!hasQrInvitation) {
                                    setIsQrScannerOn(true);
                                    startQrScanner();
                                } else {
                                    setIsQrScannerOn(false);
                                    stopQrScanner();
                                    setQrCode('');
                                }
                            }}
                            className="text-cyan-500 hover:text-cyan-600 font-medium text-sm flex items-center gap-1 transition-colors"
                        >
                            {hasQrInvitation ? 'cerrar escáner' : 'escanea aquí'}
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Escáner QR */}
                    {hasQrInvitation && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-700">Escanear código QR</h3>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setHasQrInvitation(false);
                                        stopQrScanner();
                                        setQrCode('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {isQrScannerOn && (
                                <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-3">
                                    <video 
                                        ref={qrScannerRef} 
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
                            )}
                            
                            <input 
                                type="text" 
                                placeholder="O ingresa el código manualmente" 
                                value={qrCode}
                                onChange={e => setQrCode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm"
                            />
                            <p className="text-xs text-center text-gray-500 mt-2">
                                Coloca el código QR dentro del marco
                            </p>
                        </div>
                    )}

                    {/* Formulario de registro */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="text-center pb-3 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Formulario de registro</h3>
                        </div>
                        
                        <div>
                            <label htmlFor="modal-visitorEmail" className="block text-sm font-medium text-gray-700 mb-1">
                                Correo electrónico
                            </label>
                            <input 
                                id="modal-visitorEmail"
                                type="email" 
                                placeholder="Ingresa el correo electrónico (Opcional)" 
                                value={visitorEmail} 
                                onChange={e => setVisitorEmail(e.target.value)} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                            />
                        </div>

                        <div>
                            <label htmlFor="modal-visitorName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del visitante<span className="text-red-500">*</span>
                            </label>
                            <input 
                                id="modal-visitorName"
                                type="text" 
                                placeholder="Ingresa el nombre completo" 
                                value={visitorName} 
                                onChange={e => setVisitorName(e.target.value)} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="modal-visitorCompany" className="block text-sm font-medium text-gray-700 mb-1">
                                Empresa
                            </label>
                            <input 
                                id="modal-visitorCompany"
                                type="text" 
                                placeholder="Empresa (Opcional)" 
                                value={visitorCompany} 
                                onChange={e => setVisitorCompany(e.target.value)} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                            />
                        </div>

                        <div>
                            <label htmlFor="modal-hostId" className="block text-sm font-medium text-gray-700 mb-1">
                                ¿A quién visitas?<span className="text-red-500">*</span>
                            </label>
                            <select 
                                id="modal-hostId"
                                value={hostId} 
                                onChange={e => setHostId(e.target.value)} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all" 
                                required
                            >
                                <option value="" disabled>Selecciona un anfitrión</option>
                                {hosts.map(host => <option key={host._id} value={host._id}>{host.firstName} {host.lastName}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="modal-reason" className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo de la visita<span className="text-red-500">*</span>
                            </label>
                            <textarea 
                                id="modal-reason"
                                placeholder="Describe el motivo de tu visita" 
                                value={reason} 
                                onChange={e => setReason(e.target.value)} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all resize-none" 
                                rows={3}
                                required 
                            />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => {
                                    onClose();
                                    setPhoto(null);
                                    setQrCode('');
                                    setHasQrInvitation(false);
                                    setVisitorName('');
                                    setVisitorCompany('');
                                    setVisitorEmail('');
                                    setReason('');
                                    setHostId('');
                                    stopCamera();
                                    stopQrScanner();
                                }}
                                className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                            >
                                Confirmar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Modal de Salida de Visitante
const ExitVisitorModal: React.FC<{ isOpen: boolean; onClose: () => void; visits: Visit[]; onSelectVisit: (visit: Visit) => void }> = ({ isOpen, onClose, visits, onSelectVisit }) => {
    const [qrCode, setQrCode] = useState('');
    const [isScanning, setIsScanning] = useState(true);
    const qrVideoRef = React.useRef<HTMLVideoElement | null>(null);
    const [qrStream, setQrStream] = React.useState<MediaStream | null>(null);

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
            
            // Iniciar detección QR con jsQR
            scanExitQRCode();
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('No se pudo acceder a la cámara para escanear QR.');
        }
    };

    const scanExitQRCode = () => {
        if (!qrVideoRef.current || !isScanning) return;
        
        const canvas = document.createElement('canvas');
        const video = qrVideoRef.current;
        
        const scan = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        setQrCode(code.data);
                        setIsScanning(false);
                        stopQrScanner();
                        return;
                    }
                }
            }
            
            if (isScanning) {
                requestAnimationFrame(scan);
            }
        };
        
        scan();
    };

    const stopQrScanner = () => {
        if (qrStream) {
            qrStream.getTracks().forEach(track => track.stop());
            setQrStream(null);
        }
        setIsScanning(false);
    };

    React.useEffect(() => {
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

    const handleConfirm = async () => {
        if (!qrCode.trim()) {
            alert('Por favor, escanea o ingresa un código QR');
            return;
        }
        
        try {
            // Intentar parsear el QR como JSON
            let visitId = '';
            try {
                const qrData = JSON.parse(qrCode);
                // Si el QR contiene visitId directamente
                if (qrData.visitId) {
                    visitId = qrData.visitId;
                } else if (qrData.type === 'visit-checkin' && qrData.visitId) {
                    visitId = qrData.visitId;
                }
            } catch (e) {
                // Si no es JSON, asumir que es el ID directo
                visitId = qrCode;
            }
            
            if (!visitId) {
                alert('Código QR inválido');
                return;
            }
            
            // Buscar la visita en la lista actual
            const visit = visits.find(v => v._id === visitId);
            
            if (!visit) {
                alert('No se encontró la visita asociada a este código QR');
                return;
            }
            
            if (visit.status !== VisitStatus.CHECKED_IN) {
                alert('Esta visita no está registrada como activa (check-in)');
                return;
            }
            
            // Abrir el modal de detalles de visita checked-in para confirmar checkout
            handleClose();
            onSelectVisit(visit);
        } catch (error) {
            console.error('Error processing checkout:', error);
            alert('Error al procesar la salida. Intenta nuevamente.');
        }
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

                    {/* Input manual del código QR (opcional, oculto por defecto) */}
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


export const VisitsPage: React.FC = () => {

    const [visits, setVisits] = useState<Visit[]>([]);
    const [hosts, setHosts] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutVisit, setCheckoutVisit] = useState<Visit | null>(null);
    const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [exitVisitorSearch, setExitVisitorSearch] = useState('');
    
    // Nuevos modales
    const [pendingModalVisit, setPendingModalVisit] = useState<Visit | null>(null);
    const [approvedModalVisit, setApprovedModalVisit] = useState<Visit | null>(null);
    const [checkedInModalVisit, setCheckedInModalVisit] = useState<Visit | null>(null);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectionVisit, setRejectionVisit] = useState<Visit | null>(null);

    // Handler para clicks en las tarjetas
    const handleCardClick = (visit: Visit) => {
        switch (visit.status) {
            case VisitStatus.PENDING:
                setPendingModalVisit(visit);
                break;
            case VisitStatus.APPROVED:
                setApprovedModalVisit(visit);
                break;
            case VisitStatus.CHECKED_IN:
                setCheckedInModalVisit(visit);
                break;
            case VisitStatus.REJECTED:
                // Si está rechazada pero no tiene razón, abrir modal de razón
                if (!visit.rejectionReason) {
                    setRejectionVisit(visit);
                    setRejectionModalOpen(true);
                }
                break;
            default:
                break;
        }
    };

    // Handler para aprobar desde el modal
    const handleApproveFromModal = async (visitId: string) => {
        try {
            const updatedVisit = await api.approveVisit(visitId);
            setVisits(visits.map(v => v._id === visitId ? updatedVisit : v));
            setPendingModalVisit(null);
        } catch (error) {
            console.error('Failed to approve visit:', error);
        }
    };

    // Handler para rechazar (abre modal de razón)
    const handleRejectFromModal = (visit: Visit) => {
        setRejectionVisit(visit);
        setRejectionModalOpen(true);
        setPendingModalVisit(null);
    };

    // Handler para confirmar rechazo con razón
    const handleRejectWithReason = async (reason: string) => {
        if (!rejectionVisit) return;
        try {
            // Si la visita ya está rechazada, solo actualizar la razón sin cambiar estado
            if (rejectionVisit.status === VisitStatus.REJECTED) {
                const updatedVisit = await api.updateVisit(rejectionVisit._id, { rejectionReason: reason });
                setVisits(visits.map(v => v._id === rejectionVisit._id ? updatedVisit : v));
            } else {
                // Si está en otro estado (pending), rechazar con razón
                const updatedVisit = await api.updateVisitStatus(rejectionVisit._id, VisitStatus.REJECTED, reason);
                setVisits(visits.map(v => v._id === rejectionVisit._id ? updatedVisit : v));
            }
        } catch (error) {
            console.error('Failed to reject visit:', error);
        } finally {
            setRejectionModalOpen(false);
            setRejectionVisit(null);
        }
    };

    // Handler para check-in con recurso asignado
    const handleCheckInWithResource = async (visitId: string, assignedResource?: string) => {
        try {
            const updatedVisit = await api.checkInVisit(visitId, assignedResource);
            setVisits(visits.map(v => v._id === visitId ? updatedVisit : v));
            setApprovedModalVisit(null);
        } catch (error) {
            console.error('Failed to check in:', error);
        }
    };

    // Handler para checkout desde el modal
    const handleCheckoutFromModal = async (visitId: string) => {
        try {
            const result = await api.checkOutVisit(visitId, []);
            setVisits(visits.map(v => v._id === visitId ? result.visit : v));
            setCheckedInModalVisit(null);
        } catch (error) {
            console.error('Failed to check out:', error);
        }
    };

    // Estados y lógica para el modal de motivo de rechazo (antigua lógica)
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectVisitId, setRejectVisitId] = useState<string | null>(null);

    // Cerrar el menú de registrar visita cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (registerMenuOpen && !target.closest('.relative')) {
                setRegisterMenuOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [registerMenuOpen]);
    const [rejectReason, setRejectReason] = useState('');
    const [otherReason, setOtherReason] = useState('');

    const REJECTION_OPTIONS = [
      'No hay espacio disponible',
      'El horario no es conveniente',
      'Información incorrecta o incompleta',
      'Otro',
    ];

    const openRejectModal = (id: string) => {
      setRejectVisitId(id);
      setIsRejectModalOpen(true);
      setRejectReason('');
      setOtherReason('');
    };

    const handleRejectConfirm = async () => {
      if (!rejectVisitId) return;
      let reason = rejectReason === 'Otro' ? otherReason : rejectReason;
      try {
        const updatedVisit = await api.updateVisitStatus(rejectVisitId, VisitStatus.REJECTED, reason);
        setVisits(visits.map(v => v._id === rejectVisitId ? updatedVisit : v));
      } catch (error) {
        console.error('Failed to reject visit:', error);
      } finally {
        setIsRejectModalOpen(false);
        setRejectVisitId(null);
        setRejectReason('');
        setOtherReason('');
      }
    };

    const fetchVisits = useCallback(async () => {
        try {
            setLoading(true);
            const visitsData = await api.getVisits();
            setVisits(visitsData.visits);
        } catch (error) {
            console.error("Failed to fetch visits:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVisits();
        api.getHosts()
            .then(setHosts)
            .catch(err => console.error("Failed to fetch hosts:", err));
    }, [fetchVisits]);

    const updateVisitStatus = async (id: string, status: VisitStatus) => {
        try {
            const updatedVisit = await api.updateVisitStatus(id, status);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            console.error("Failed to update visit status:", error);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const updatedVisit = await api.approveVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            console.error('Failed to approve visit:', error);
        }
    };

    const handleCheckIn = async (id: string) => {
        try {
            const updatedVisit = await api.checkInVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            console.error('Failed to check in:', error);
        }
    };

    const openCheckoutModal = (visit: Visit) => {
        setCheckoutVisit(visit);
        setIsCheckoutOpen(true);
    };

    const handleCheckoutConfirm = async (photos: string[]) => {
        try {
            if (!checkoutVisit) return;
            const result = await api.checkOutVisit(checkoutVisit._id, photos);
            setVisits(visits.map(v => v._id === checkoutVisit._id ? result.visit : v));
        } catch (error) {
            console.error('Failed to check out:', error);
        } finally {
            setIsCheckoutOpen(false);
            setCheckoutVisit(null);
        }
    };

    // Toggles de auto-aprobación y auto-check-in
    const [autoApprove, setAutoApprove] = useState(false);
    const [autoCheckIn, setAutoCheckIn] = useState(false);
    const [companyConfig, setCompanyConfig] = useState<any>(null);

    // Cargar settings de la empresa
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const config = await api.getCompanyConfig();
                setCompanyConfig(config);
                setAutoApprove(config.settings.autoApproval || false);
                setAutoCheckIn(config.settings.autoCheckIn || false);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };

        fetchSettings();
    }, []);

    // Actualizar auto-aprobación en el backend
    const handleAutoApproveToggle = async (checked: boolean) => {
        setAutoApprove(checked);
        try {
            await api.updateCompanyConfig({
                ...companyConfig,
                settings: {
                    ...companyConfig.settings,
                    autoApproval: checked
                }
            });
        } catch (error) {
            console.error('Failed to update auto-approval:', error);
            setAutoApprove(!checked); // Revertir si falla
        }
    };

    // Actualizar auto-check-in en el backend
    const handleAutoCheckInToggle = async (checked: boolean) => {
        setAutoCheckIn(checked);
        try {
            await api.updateCompanyConfig({
                ...companyConfig,
                settings: {
                    ...companyConfig.settings,
                    autoCheckIn: checked
                }
            });
        } catch (error) {
            console.error('Failed to update auto-checkin:', error);
            setAutoCheckIn(!checked); // Revertir si falla
        }
    };

    const navigate = useNavigate();

    // Arrays de visitas por status (asegúrate que estén antes del return)
const pendingVisits = visits.filter(v => v.status === VisitStatus.PENDING);
const approvedVisits = visits.filter(v => v.status === VisitStatus.APPROVED);
const rejectedVisits = visits.filter(v => v.status === VisitStatus.REJECTED);
const respondedVisits = [...approvedVisits, ...rejectedVisits].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime()
);
const checkedInVisits = visits.filter(v => v.status === VisitStatus.CHECKED_IN);

// Filtrar visitas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisits = visits.filter(v => {
        const visitDate = new Date(v.scheduledDate);
        visitDate.setHours(0, 0, 0, 0);
        return visitDate.getTime() === today.getTime();
    });

    const formattedDate = today.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });

// Agrega el botón de Agenda en el header
    return (
        <div className="p-6">
            {/* Header con contador total */}
            <div className="mb-6">
                <div className="flex items-baseline gap-3">
                    <div className="text-6xl font-bold text-securiti-blue-600">{todayVisits.length}</div>
                    <div>
                        <div className="text-sm text-gray-600">Total de registros hoy</div>
                        <div className="text-xs text-gray-500 capitalize">{formattedDate}</div>
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4 items-center mb-6">
                <button
                    onClick={() => navigate('/visits/agenda')}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ver agenda
                </button>
                
                {/* Botón Registrar con submenú */}
                <div className="relative">
                    <button
                        onClick={() => setRegisterMenuOpen(!registerMenuOpen)}
                        className="px-4 py-2 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 font-medium flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Registrar
                    </button>
                    {registerMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-50 min-w-[200px]">
                            <button
                                onClick={() => {
                                    setIsModalOpen(true);
                                    setRegisterMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <LoginIcon className="w-4 h-4" />
                                Entrada de Visitante
                            </button>
                            <button
                                onClick={() => {
                                    setShowExitModal(true);
                                    setRegisterMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 border-t"
                            >
                                <LogoutIcon className="w-4 h-4" />
                                Salida de Visitante
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center p-8">Cargando visitas...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Columna 1: En espera */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-white p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <ClockIcon className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-800">{pendingVisits.length}</div>
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Total</div>
                            </div>
                            <h2 className="text-base font-semibold text-gray-800 mb-3">En espera</h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={autoApprove} 
                                        onChange={e => handleAutoApproveToggle(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </div>
                                <span className="text-sm text-gray-700">Auto aprobación</span>
                            </label>
                        </div>
                        <div className="p-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                                {pendingVisits.length > 0 ? (
                                    pendingVisits.map(visit => (
                                        <VisitCard key={visit._id} visit={visit} onCardClick={handleCardClick} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No hay visitas pendientes.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna 2: Respuesta recibida */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-white p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-800">{respondedVisits.length}</div>
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-green-600">✓ {approvedVisits.length} Aprobadas</span>
                                        <span className="text-red-600">✗ {rejectedVisits.length} Rechazadas</span>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-base font-semibold text-gray-800 mb-3">Respuesta recibida</h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={autoCheckIn} 
                                        onChange={e => handleAutoCheckInToggle(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </div>
                                <span className="text-sm text-gray-700">Auto check in</span>
                            </label>
                        </div>
                        <div className="p-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                                {respondedVisits.length > 0 ? (
                                    respondedVisits.map(visit => (
                                        <VisitCard key={visit._id} visit={visit} onCardClick={handleCardClick} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No hay visitas aprobadas.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna 3: Dentro */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-white p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <LoginIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-800">{checkedInVisits.length}</div>
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Total</div>
                            </div>
                            <h2 className="text-base font-semibold text-gray-800 mb-3">Dentro</h2>
                        </div>
                        <div className="p-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                                {checkedInVisits.length > 0 ? (
                                    checkedInVisits.map(visit => (
                                        <VisitCard key={visit._id} visit={visit} onCardClick={handleCardClick} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No hay visitantes dentro.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <VisitFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchVisits}
                hosts={hosts}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => { setIsCheckoutOpen(false); setCheckoutVisit(null); }}
                onConfirm={handleCheckoutConfirm}
            />

            <ExitVisitorModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                visits={visits}
                onSelectVisit={(visit) => {
                    setCheckedInModalVisit(visit);
                    setShowExitModal(false);
                }}
            />

            {/* Modal de motivo de rechazo */}
            {isRejectModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
      <h2 className="text-lg font-bold mb-4">Motivo de rechazo</h2>
      <div className="space-y-2 mb-4">
        {REJECTION_OPTIONS.map(option => (
          <label key={option} className="flex items-center gap-2">
            <input
              type="radio"
              name="rejectReason"
              value={option}
              checked={rejectReason === option}
              onChange={() => setRejectReason(option)}
            />
            {option}
          </label>
        ))}
      </div>
      {rejectReason === 'Otro' && (
        <textarea
          className="w-full border rounded p-2 mb-2"
          placeholder="Escribe el motivo..."
          value={otherReason}
          onChange={e => setOtherReason(e.target.value)}
          required
        />
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => setIsRejectModalOpen(false)}
        >
          Cancelar
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={handleRejectConfirm}
          disabled={!rejectReason || (rejectReason === 'Otro' && !otherReason)}
        >
          Confirmar rechazo
        </button>
      </div>
    </div>
  </div>
)}

            {/* Nuevos modales del flujo */}
            <PendingVisitModal
                visit={pendingModalVisit}
                isOpen={!!pendingModalVisit}
                onClose={() => setPendingModalVisit(null)}
                onApprove={handleApproveFromModal}
                onReject={(visitId) => {
                    const visit = visits.find(v => v._id === visitId);
                    if (visit) handleRejectFromModal(visit);
                }}
            />

            <ApprovedVisitModal
                visit={approvedModalVisit}
                isOpen={!!approvedModalVisit}
                onClose={() => setApprovedModalVisit(null)}
                onCheckIn={handleCheckInWithResource}
            />

            {rejectionVisit && (
                <RejectionModal
                    isOpen={rejectionModalOpen}
                    onClose={() => {
                        setRejectionModalOpen(false);
                        setRejectionVisit(null);
                    }}
                    onConfirm={handleRejectWithReason}
                    visitorName={rejectionVisit.visitorName}
                />
            )}

            <CheckedInVisitModal
                visit={checkedInModalVisit}
                isOpen={!!checkedInModalVisit}
                onClose={() => setCheckedInModalVisit(null)}
                onCheckout={handleCheckoutFromModal}
            />
        </div>
    );
};
