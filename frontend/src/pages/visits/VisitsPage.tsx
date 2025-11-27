import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { FaRegUser } from 'react-icons/fa';
import { Visit, VisitStatus, User, UserRole } from '../../types';
import * as api from '../../services/api';
import { CheckoutModal } from './CheckoutModal';
import { VisitHistoryModal } from './VisitHistoryModal';
import { PendingVisitModal } from './PendingVisitModal';
import { ApprovedVisitModal } from './ApprovedVisitModal';
import { RejectionModal } from './RejectionModal';
import { CheckedInVisitModal } from './CheckedInVisitModal';
import { VisitRegistrationSidePanel } from './VisitRegistrationSidePanel';
import { ExitRegistrationSidePanel } from './ExitRegistrationSidePanel';
import { CheckCircleIcon, LogoutIcon, LoginIcon, ClockIcon } from '../../components/common/icons';
import { VscSignIn, VscSignOut } from 'react-icons/vsc';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jsQR from 'jsqr';
import { useAuth } from '../../contexts/AuthContext';
import { LuScanQrCode, LuClipboardPenLine, LuBuilding2, LuDoorOpen } from "react-icons/lu";
import { LiaUserTieSolid } from "react-icons/lia";
import { MdOutlinePendingActions } from "react-icons/md";
import { TbClipboardCheck } from "react-icons/tb";

// Only log in development
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const RegistrarIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4C16.93 4 17.395 4 17.7765 4.10222C18.8117 4.37962 19.6204 5.18827 19.8978 6.22354C20 6.60504 20 7.07003 20 8V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V8C4 7.07003 4 6.60504 4.10222 6.22354C4.37962 5.18827 5.18827 4.37962 6.22354 4.10222C6.60504 4 7.07003 4 8 4M12 17V11M9 14H15M9.6 6H14.4C14.9601 6 15.2401 6 15.454 5.89101C15.6422 5.79513 15.7951 5.64215 15.891 5.45399C16 5.24008 16 4.96005 16 4.4V3.6C16 3.03995 16 2.75992 15.891 2.54601C15.7951 2.35785 15.6422 2.20487 15.454 2.10899C15.2401 2 14.9601 2 14.4 2H9.6C9.03995 2 8.75992 2 8.54601 2.10899C8.35785 2.20487 8.20487 2.35785 8.10899 2.54601C8 2.75992 8 3.03995 8 3.6V4.4C8 4.96005 8 5.24008 8.10899 5.45399C8.20487 5.64215 8.35785 5.79513 8.54601 5.89101C8.75992 6 9.03995 6 9.6 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const EntradaIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 17C6 17.3513 6 17.5269 6.01567 17.6796C6.14575 18.9474 7.0626 19.9946 8.30206 20.2911C8.45134 20.3268 8.6255 20.35 8.97368 20.3965L15.5656 21.2754C17.442 21.5256 18.3803 21.6507 19.1084 21.3611C19.7478 21.1069 20.2803 20.6407 20.6168 20.0406C21 19.357 21 18.4105 21 16.5175V7.48244C21 5.5894 21 4.64288 20.6168 3.95935C20.2803 3.35923 19.7478 2.893 19.1084 2.6388C18.3803 2.34926 17.442 2.47435 15.5656 2.72455L8.97368 3.60347C8.62546 3.6499 8.45135 3.67311 8.30206 3.70883C7.0626 4.00532 6.14575 5.05254 6.01567 6.3203C6 6.47301 6 6.64866 6 6.99996M12 7.99996L16 12M16 12L12 16M16 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SalidaIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 16.9999L21 11.9999M21 11.9999L16 6.99994M21 11.9999H9M12 16.9999C12 17.2955 12 17.4433 11.989 17.5713C11.8748 18.9019 10.8949 19.9968 9.58503 20.2572C9.45903 20.2823 9.31202 20.2986 9.01835 20.3312L7.99694 20.4447C6.46248 20.6152 5.69521 20.7005 5.08566 20.5054C4.27293 20.2453 3.60942 19.6515 3.26118 18.8724C3 18.2881 3 17.5162 3 15.9722V8.02764C3 6.4837 3 5.71174 3.26118 5.12746C3.60942 4.34842 4.27293 3.75454 5.08566 3.49447C5.69521 3.29941 6.46246 3.38466 7.99694 3.55516L9.01835 3.66865C9.31212 3.70129 9.45901 3.71761 9.58503 3.74267C10.8949 4.0031 11.8748 5.09798 11.989 6.42855C12 6.55657 12 6.70436 12 6.99994" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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
            case VisitStatus.PENDING: 
                return <span className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">En espera</span>;
            case VisitStatus.APPROVED: 
                return <span className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">Aprobado</span>;
            case VisitStatus.REJECTED: 
                return <span className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">Rechazado</span>;
            case VisitStatus.CHECKED_IN: 
                return <span className="px-3 py-1 text-xs font-medium text-cyan-700 bg-cyan-100 rounded-full">Dentro</span>;
            case VisitStatus.COMPLETED: 
                return <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">Completado</span>;
        }
    };

    // Avatar / color helpers según estado
    const getAvatarClasses = (status: VisitStatus) => {
        switch (status) {
            case VisitStatus.PENDING:
                return 'w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-orange-50 via-orange-300 to-orange-200 flex items-center justify-center flex-shrink-0 ring-2 ring-orange-600';
            case VisitStatus.APPROVED:
                return 'w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-300 to-emerald-200 flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-600';
            case VisitStatus.CHECKED_IN:
                return 'w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-cyan-50 via-cyan-300 to-cyan-200 flex items-center justify-center flex-shrink-0 ring-2 ring-cyan-600';
            case VisitStatus.REJECTED:
                return 'w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-red-50 via-red-300 to-red-200 flex items-center justify-center flex-shrink-0 ring-2 ring-red-600';
            default:
                return 'w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100';
        }
    };

    const getAvatarIconColor = (status: VisitStatus) => {
        switch (status) {
            case VisitStatus.PENDING: return 'text-orange-600';
            case VisitStatus.APPROVED: return 'text-emerald-600';
            case VisitStatus.CHECKED_IN: return 'text-cyan-600';
            case VisitStatus.REJECTED: return 'text-red-600';
            default: return 'text-gray-600';
        }
    };
    
    // Tiempo de espera/transcurrido en tiempo real según el estado
    let timeReference = visit.scheduledDate;
    if (visit.status === VisitStatus.PENDING) {
        // Tiempo desde que se registró
        timeReference = visit.createdAt || visit.scheduledDate;
    } else if (visit.status === VisitStatus.APPROVED) {
        // CONTINUAR contando desde el registro, NO reiniciar
        timeReference = visit.createdAt || visit.scheduledDate;
    } else if (visit.status === VisitStatus.CHECKED_IN) {
        // REINICIAR tiempo desde que entró
        timeReference = visit.checkInTime || visit.scheduledDate;
    }
    
    const showElapsed = visit.status === VisitStatus.PENDING || visit.status === VisitStatus.APPROVED || visit.status === VisitStatus.CHECKED_IN;
    const elapsed = showElapsed ? useElapsedTime(timeReference) : null;
    
    const formattedDate = new Date(visit.scheduledDate).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const formattedTime = new Date(visit.scheduledDate).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    return (
        <>
            <div 
                className="bg-white rounded-xl shadow-sm hover:shadow-md p-4 border border-gray-100 transition-all cursor-pointer hover:border-cyan-300"
                onClick={() => onCardClick(visit)}
            >
                <div className="flex gap-3">
                    {/* Foto circular del visitante */}
                    <div className={getAvatarClasses(visit.status)}>
                        {visit.visitorPhoto ? (
                            <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
                        ) : (
                            <FaRegUser className={`w-8 h-8 ${getAvatarIconColor(visit.status)}`} />
                        )}
                    </div>
                    
                    {/* Info del visitante */}
                    <div className="flex-1 min-w-0">
                        {/* Nombre y badge */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">{visit.visitorName}</h3>
                                {visit.visitorEmail && (
                                    <p className="text-xs text-gray-500 truncate">{visit.visitorEmail}</p>
                                )}
                            </div>
                            {getStatusBadge(visit.status)}
                        </div>
                        
                        {/* Empresa */}
                        {visit.visitorCompany && (
                            <p className="text-xs text-gray-600 mb-2 truncate">
                                <span className="inline-flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                    </svg>
                                    {visit.visitorCompany}
                                </span>
                            </p>
                        )}
                        
                        {/* Fecha/Hora y tiempo transcurrido */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {formattedDate} {formattedTime}
                            </span>
                            {showElapsed && (
                                <span className={`flex items-center gap-1 ${getAvatarIconColor(visit.status)} font-medium`}>
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {elapsed}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <VisitHistoryModal
                visitId={visit._id}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </>
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
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play().catch(e => console.log('Play interrupted:', e));
            }
            setIsCameraOn(true);
        } catch (error) {
            if (isLocalhost) console.error('Camera error:', error);
            alert('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    };

    // Cambiar entre cámara frontal y trasera
    const toggleFacingMode = () => {
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
        setTimeout(() => {
            stopCamera();
            setTimeout(() => {
                startCamera();
            }, 200);
        }, 100);
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
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            setQrStream(mediaStream);
            if (qrScannerRef.current) {
                qrScannerRef.current.srcObject = mediaStream;
                await qrScannerRef.current.play().catch(e => console.log('QR scanner play interrupted:', e));
            }
            setIsQrScannerOn(true);
            
            // Iniciar detección QR con jsQR
            scanQRCode();
        } catch (error) {
            if (isLocalhost) console.error('QR Scanner error:', error);
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
                        if (isLocalhost) console.log('✅ QR detectado en VisitFormModal:', code.data);
                        try {
                            const qrData = JSON.parse(code.data);
                            if (isLocalhost) console.log('📋 QR Data parsed:', qrData);
                            
                            // Si es del tipo visitor-info, auto-completar el formulario
                            if (qrData.type === 'visitor-info') {
                                if (isLocalhost) console.log('🔄 Autocompletando formulario con datos del QR');
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
                            
                            // Si es del tipo visit-checkin (QR del correo de aprobación)
                            if (qrData.type === 'visit-checkin') {
                                if (isLocalhost) console.log('📧 QR de visita aprobada detectado, guardando token');
                                setQrCode(code.data);
                                setHasQrInvitation(false);
                                stopQrScanner();
                                alert('✅ QR de visita escaneado. Completa los datos restantes.');
                                return;
                            }
                            
                            // Si es otro tipo de QR, solo guardar el código
                            if (isLocalhost) console.log('📝 QR de tipo desconocido, guardando como texto');
                            setQrCode(code.data);
                            setHasQrInvitation(false);
                            stopQrScanner();
                        } catch (e) {
                            // Si no es JSON válido, guardar como texto plano
                            if (isLocalhost) console.log('⚠️ QR no es JSON, guardando como texto plano');
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
        // Auto-iniciar cámara al abrir modal
        if (isOpen && !photo) {
            startCamera();
        }
        return () => {
            stopCamera();
            stopQrScanner();
        };
    }, [isOpen, photo, facingMode]);

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
            if (isLocalhost) console.error("Failed to create visit:", error);
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
                    <div className="flex flex-col items-center py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <p className="text-sm text-gray-600 mb-4">Toma la fotografía de tu visitante</p>
                        
                        {!photo ? (
                            <div className="relative mb-4 flex flex-col items-center">
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
                                <button
                                    type="button"
                                    onClick={toggleFacingMode}
                                    className="mt-2 px-3 py-1 bg-cyan-500 text-white rounded-lg text-xs hover:bg-cyan-600 transition-colors"
                                >
                                    Cambiar cámara
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
                            <div className="w-full max-w-sm mb-4 sticky top-24 z-20">
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
                                {hosts.map(host => <option key={host._id} value={host._id}>{host.firstName} {host.lastName}{host.role === 'admin' ? ' (Administrador)' : ''}</option>)}
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
const ExitVisitorModal: React.FC<{ isOpen: boolean; onClose: () => void; visits: Visit[]; onSelectVisit: (visit: Visit) => void; onOpenApprovedModal?: (visit: Visit) => void }> = ({ isOpen, onClose, visits, onSelectVisit, onOpenApprovedModal }) => {
    const [qrCode, setQrCode] = useState('');
    const [isScanning, setIsScanning] = useState(true);
    const qrVideoRef = React.useRef<HTMLVideoElement | null>(null);
    const [qrStream, setQrStream] = React.useState<MediaStream | null>(null);

    const startQrScanner = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            setQrStream(mediaStream);
            if (qrVideoRef.current) {
                qrVideoRef.current.srcObject = mediaStream;
                await qrVideoRef.current.play().catch(e => console.log('Exit QR scanner play interrupted:', e));
            }
            setIsScanning(true);
            
            // Iniciar detección QR con jsQR
            scanExitQRCode();
        } catch (error) {
            if (isLocalhost) console.error('Exit QR Scanner error:', error);
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
                        if (isLocalhost) console.log('✅ QR detectado en Exit Modal:', code.data);
                        setQrCode(code.data);
                        setIsScanning(false);
                        stopQrScanner();
                        // Auto-procesar el QR inmediatamente
                        setTimeout(() => {
                            processExitQR(code.data);
                        }, 100);
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

    const processExitQR = async (qrData: string) => {
        try {
            // Intentar parsear el QR como JSON
            let visitId = '';
            let qrToken = '';
            try {
                const parsedData = JSON.parse(qrData);
                // Si el QR contiene visitId directamente
                if (parsedData.visitId) {
                    visitId = parsedData.visitId;
                } else if (parsedData.type === 'visit-checkin' && parsedData.visitId) {
                    visitId = parsedData.visitId;
                    qrToken = parsedData.token || '';
                }
            } catch (e) {
                // Si no es JSON, asumir que es el ID directo o token
                visitId = qrData;
                qrToken = qrData;
            }
            
            if (!visitId && !qrToken) {
                alert('Código QR inválido');
                return;
            }
            
            // Buscar la visita en la lista actual por ID o por qrToken
            let visit = visits.find(v => v._id === visitId);
            if (!visit && qrToken) {
                visit = visits.find(v => v.qrToken === qrToken);
            }
            
            if (!visit) {
                alert('No se encontró la visita asociada a este código QR');
                return;
            }
            
            // Si la visita está aprobada pero no checked-in, abrir el modal de approved para hacer check-in
            if (visit.status === VisitStatus.APPROVED) {
                handleClose();
                if (onOpenApprovedModal) {
                    onOpenApprovedModal(visit);
                }
                return;
            }
            
            // Si la visita está checked-in, abrir el modal de checkout
            if (visit.status === VisitStatus.CHECKED_IN) {
                handleClose();
                onSelectVisit(visit);
                return;
            }
            
            alert(`Esta visita está en estado "${visit.status}" y no puede ser procesada en este momento.`);
        } catch (error) {
            if (isLocalhost) console.error('Error processing QR:', error);
            alert('Error al procesar el código QR.');
        }
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
        
        processExitQR(qrCode);
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
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [visits, setVisits] = useState<Visit[]>([]);
    const [hosts, setHosts] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutVisit, setCheckoutVisit] = useState<Visit | null>(null);
    const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [exitVisitorSearch, setExitVisitorSearch] = useState('');
    
    // Estado para controlar qué columna se muestra en móvil
    const [mobileActiveTab, setMobileActiveTab] = useState<'pending' | 'responded' | 'checkedIn'>('pending');
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si estamos en móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Detectar parámetro openPanel en la URL para abrir el side panel automáticamente
    useEffect(() => {
        const openPanel = searchParams.get('openPanel');
        if (openPanel === 'true') {
            setIsModalOpen(true);
            // Limpiar el parámetro de la URL
            searchParams.delete('openPanel');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);
    
    // Nuevos modales
    const [pendingModalVisit, setPendingModalVisit] = useState<Visit | null>(null);
    const [approvedModalVisit, setApprovedModalVisit] = useState<Visit | null>(null);
    const [checkedInModalVisit, setCheckedInModalVisit] = useState<Visit | null>(null);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectionVisit, setRejectionVisit] = useState<Visit | null>(null);
    
    // Estado para alerta de lista negra en registro
    const [registerBlacklistAlert, setRegisterBlacklistAlert] = useState<{
        visitData: any;
        blacklistInfo: {
            _id: string;
            visitorName: string;
            email: string;
            reason: string;
            photo?: string;
            addedAt: string;
        };
    } | null>(null);
    const [registerBlacklistLoading, setRegisterBlacklistLoading] = useState(false);

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
        if (isLocalhost) console.log('🟢 [APPROVE] Starting approval for visit:', visitId);
        try {
            // Cerrar modal inmediatamente para mejor UX
            setPendingModalVisit(null);

            // Actualización optimista: actualizar UI inmediatamente
            setVisits(prevVisits => prevVisits.map(v => {
                if (v._id === visitId) {
                    if (isLocalhost) console.log('✅ [APPROVE] Optimistic update - changing status to APPROVED');
                    return { ...v, status: VisitStatus.APPROVED };
                }
                return v;
            }));

            // Luego hacer la llamada API en segundo plano
            const updatedVisit = await api.approveVisit(visitId);
            if (isLocalhost) console.log('✅ [APPROVE] Successfully approved visit:', visitId, 'new status:', updatedVisit.status);
            
            // Actualizar con la respuesta real del servidor
            setVisits(prevVisits => prevVisits.map(v => v._id === visitId ? updatedVisit : v));
        } catch (error) {
            if (isLocalhost) console.error('❌ [APPROVE] Failed to approve visit:', error);
            // Recargar visitas en caso de error para revertir el cambio optimista
            fetchVisits();
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
        
        // Cerrar modal inmediatamente para mejor UX
        setRejectionModalOpen(false);
        const visitToReject = rejectionVisit;
        setRejectionVisit(null);

        try {
            // Si la visita ya está rechazada, solo actualizar la razón sin cambiar estado
            if (visitToReject.status === VisitStatus.REJECTED) {
                const updatedVisit = await api.updateVisit(visitToReject._id, { rejectionReason: reason });
                setVisits(prevVisits => prevVisits.map(v => v._id === visitToReject._id ? updatedVisit : v));
            } else if (visitToReject.status === VisitStatus.APPROVED) {
                // No permitir rechazar si ya está aprobada
                alert('No se puede rechazar una visita que ya fue aprobada.');
            } else {
                // Actualización optimista: actualizar UI inmediatamente
                setVisits(prevVisits => prevVisits.map(v => {
                    if (v._id === visitToReject._id) {
                        return { ...v, status: VisitStatus.REJECTED, rejectionReason: reason };
                    }
                    return v;
                }));

                // Si está en otro estado (pending), rechazar con razón
                try {
                    const updatedVisit = await api.updateVisitStatus(visitToReject._id, VisitStatus.REJECTED, reason);
                    setVisits(prevVisits => prevVisits.map(v => v._id === visitToReject._id ? updatedVisit : v));
                } catch (error: any) {
                    // Mostrar error del backend si la transición no es permitida
                    alert(error?.response?.data?.message || 'No se pudo rechazar la visita.');
                    // Recargar visitas en caso de error
                    fetchVisits();
                }
            }
        } catch (error) {
            alert('No se pudo rechazar la visita.');
            if (isLocalhost) console.error('Failed to reject visit:', error);
            // Recargar visitas en caso de error
            fetchVisits();
        }
    };

    // Handler para check-in con recurso asignado
    const handleCheckInWithResource = async (visitId: string, assignedResource?: string) => {
        try {
            const response: any = await api.checkInVisit(visitId, assignedResource);
            setVisits(prevVisits => prevVisits.map(v => v._id === visitId ? response : v));
            setApprovedModalVisit(null);
        } catch (error) {
            if (isLocalhost) console.error('Failed to check in:', error);
        }
    };

    // Handler para checkout desde el modal
    const handleCheckoutFromModal = async (visitId: string) => {
        try {
            // Feedback optimista: actualizar UI inmediatamente
            setVisits(prevVisits => prevVisits.map(v => 
                v._id === visitId 
                    ? { ...v, status: VisitStatus.COMPLETED, checkOutTime: new Date().toISOString() }
                    : v
            ));
            
            // Cerrar modal inmediatamente
            setCheckedInModalVisit(null);
            
            // Toast de confirmación
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '✅ Salida registrada correctamente', severity: 'success' }
            }));
            
            // Hacer la llamada real al backend en segundo plano
            const result = await api.checkOutVisit(visitId, []);
            
            // Actualizar con datos reales del servidor
            setVisits(prevVisits => prevVisits.map(v => v._id === visitId ? result.visit : v));
        } catch (error) {
            if (isLocalhost) console.error('Failed to check out:', error);
            
            // Recargar visitas en caso de error para sincronizar estado
            fetchVisits();
            
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '❌ Error al registrar la salida', severity: 'error' }
            }));
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
        setVisits(prevVisits => prevVisits.map(v => v._id === rejectVisitId ? updatedVisit : v));
      } catch (error) {
        if (isLocalhost) console.error('Failed to reject visit:', error);
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
            
            // Filter visits for hosts - only show their own visits
            let filteredVisits = visitsData.visits;
            if (user?.role === UserRole.HOST) {
                filteredVisits = visitsData.visits.filter((visit: Visit) => 
                    visit.host && typeof visit.host === 'object' && visit.host._id === user._id
                );
            }
            
            setVisits(filteredVisits);
        } catch (error) {
            if (isLocalhost) console.error("Failed to fetch visits:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handler para el side panel de registro
    const handleVisitRegistration = async (visitData: any) => {
        try {
            const scheduledDate = new Date().toISOString();
            
            if (isLocalhost) console.log('📝 Datos de visita recibidos:', visitData);
            if (isLocalhost) console.log('🔍 fromAccessEvent:', visitData.fromAccessEvent);
            
            let response: any;
            
            // Si viene de un acceso/evento, crear como aprobada (irá a "Respuesta recibida")
            if (visitData.fromAccessEvent) {
                if (isLocalhost) console.log('🎫 Procesando visita de ACCESO/EVENTO - irá a "Respuesta recibida"');
                
                response = await api.createVisit({
                    visitorName: visitData.visitorName,
                    visitorCompany: visitData.visitorCompany,
                    reason: visitData.reason,
                    hostId: visitData.host,
                    scheduledDate,
                    destination: visitData.destination || '',
                    visitorEmail: visitData.visitorEmail,
                    visitorPhoto: visitData.visitorPhoto || undefined,
                    visitType: 'access-code',
                    accessCode: visitData.accessCode,
                    fromAccessEvent: true
                });
                
                if (isLocalhost) console.log('✅ Visita creada como aprobada');
                
                // Si autoCheckIn está activado, hacer check-in automático
                if (autoCheckIn && response && response._id) {
                    if (isLocalhost) console.log('🔄 Auto check-in activado - registrando entrada automáticamente');
                    try {
                        await api.checkInVisit(response._id);
                        if (isLocalhost) console.log('✅ Check-in automático completado');
                    } catch (checkInError) {
                        if (isLocalhost) console.error('❌ Error en check-in automático:', checkInError);
                    }
                }
            } else {
                if (isLocalhost) console.log('👤 Procesando visita REGULAR - flujo normal');
                
                // Flujo normal para visitas regulares
                response = await api.createVisit({
                    visitorName: visitData.visitorName,
                    visitorCompany: visitData.visitorCompany,
                    reason: visitData.reason,
                    hostId: visitData.host,
                    scheduledDate,
                    destination: visitData.destination || '',
                    visitorEmail: visitData.visitorEmail,
                    visitorPhoto: visitData.visitorPhoto || undefined,
                });
            }
            
            // Verificar si hay alerta de lista negra
            if (response && response.warning === 'blacklist' && response.blacklistInfo) {
                if (isLocalhost) console.log('⚠️ [REGISTER] Alerta de lista negra detectada');
                setRegisterBlacklistAlert({
                    visitData: {
                        ...visitData,
                        scheduledDate,
                        visitType: visitData.fromAccessEvent ? 'access-code' : undefined,
                        accessCode: visitData.accessCode,
                        fromAccessEvent: visitData.fromAccessEvent
                    },
                    blacklistInfo: response.blacklistInfo
                });
                return; // No continuar con el registro normal
            }
            
            fetchVisits();
        } catch (error) {
            if (isLocalhost) console.error('Failed to create visit:', error);
            alert('Error al registrar la visita. Por favor intenta de nuevo.');
        }
    };

    useEffect(() => {
        fetchVisits();
        api.getHosts()
            .then(hosts => {
                if (isLocalhost) console.log('🔍 Hosts recibidos del backend:', hosts.length);
                if (isLocalhost) {
                    hosts.forEach(h => {
                        console.log(`  - ${h.firstName} ${h.lastName} (${h.email}): role=${h.role}`);
                    });
                }
                setHosts(hosts);
            })
            .catch(err => { if (isLocalhost) console.error("Failed to fetch hosts:", err) });
    }, [fetchVisits]);

    // 🔄 Actualización automática en tiempo real con polling inteligente
    useEffect(() => {
        // Polling cada 15 segundos cuando la página está visible
        const pollingInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && !loading) {
                fetchVisits();
            }
        }, 15000); // 15 segundos

        // Recargar cuando el usuario vuelva a la pestaña
        const handleFocus = () => {
            if (!loading) {
                fetchVisits();
            }
        };

        // Recargar cuando la página vuelva a ser visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !loading) {
                fetchVisits();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(pollingInterval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchVisits, loading]);

    const updateVisitStatus = async (id: string, status: VisitStatus) => {
        try {
            const updatedVisit = await api.updateVisitStatus(id, status);
            setVisits(prevVisits => prevVisits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            if (isLocalhost) console.error("Failed to update visit status:", error);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            // Actualización optimista: actualizar UI inmediatamente
            setVisits(prevVisits => prevVisits.map(v => {
                if (v._id === id) {
                    return { ...v, status: VisitStatus.APPROVED };
                }
                return v;
            }));

            // Luego hacer la llamada API en segundo plano
            const updatedVisit = await api.approveVisit(id);
            
            // Actualizar con la respuesta real del servidor
            setVisits(prevVisits => prevVisits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            if (isLocalhost) console.error('Failed to approve visit:', error);
            // Recargar visitas en caso de error para revertir el cambio optimista
            fetchVisits();
        }
    };

    const handleCheckIn = async (id: string) => {
        try {
            const response: any = await api.checkInVisit(id);
            setVisits(prevVisits => prevVisits.map(v => v._id === id ? response : v));
        } catch (error) {
            if (isLocalhost) console.error('Failed to check in:', error);
        }
    };

    // Handler para confirmar registro después de alerta de lista negra
    const handleRegisterBlacklistAction = async (action: 'allow' | 'cancel') => {
        if (!registerBlacklistAlert) return;
        if (registerBlacklistLoading) return;
        
        if (action === 'cancel') {
            setRegisterBlacklistAlert(null);
            return;
        }
        
        try {
            setRegisterBlacklistLoading(true);
            const { visitData } = registerBlacklistAlert;
            
            // Feedback optimista inmediato
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '⏳ Registrando visita...', severity: 'info' }
            }));
            
            // Mapear correctamente los campos para el backend
            const forceVisitData = {
                visitorName: visitData.visitorName,
                visitorCompany: visitData.visitorCompany,
                visitorEmail: visitData.visitorEmail,
                visitorPhoto: visitData.visitorPhoto || '',
                reason: visitData.reason,
                hostId: visitData.host, // Mapear host a hostId
                scheduledDate: visitData.scheduledDate,
                destination: visitData.destination || '',
                visitType: visitData.visitType,
                accessCode: visitData.accessCode,
                fromAccessEvent: visitData.fromAccessEvent
            };
            
            // Usar force-register para continuar a pesar de la alerta
            await api.forceCreateVisit(forceVisitData);
            
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '✅ Visita registrada correctamente', severity: 'success' }
            }));
            
            setRegisterBlacklistAlert(null);
            setIsModalOpen(false); // Cerrar el side panel
            fetchVisits();
        } catch (error) {
            if (isLocalhost) console.error('Failed to force register visit:', error);
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '❌ Error al registrar la visita', severity: 'error' }
            }));
        }
        finally {
            setRegisterBlacklistLoading(false);
        }
    };

    const openCheckoutModal = (visit: Visit) => {
        setCheckoutVisit(visit);
        setIsCheckoutOpen(true);
    };

    const handleCheckoutConfirm = async (photos: string[]) => {
        try {
            if (!checkoutVisit) return;
            
            // Feedback optimista: actualizar UI inmediatamente
            const optimisticVisit: Visit = {
                ...checkoutVisit,
                status: VisitStatus.COMPLETED,
                checkOutTime: new Date().toISOString()
            };
            
            setVisits(prevVisits => prevVisits.map(v => 
                v._id === checkoutVisit._id ? optimisticVisit : v
            ));
            
            // Cerrar modal inmediatamente para mejor UX
            setIsCheckoutOpen(false);
            setCheckoutVisit(null);
            
            // Toast de confirmación
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '✅ Salida registrada correctamente', severity: 'success' }
            }));
            
            // Hacer la llamada real al backend en segundo plano
            const result = await api.checkOutVisit(checkoutVisit._id, photos);
            
            // Actualizar con datos reales del servidor (por si acaso hubo diferencia)
            setVisits(prevVisits => prevVisits.map(v => 
                v._id === checkoutVisit._id ? result.visit : v
            ));
        } catch (error) {
            if (isLocalhost) console.error('Failed to check out:', error);
            
            // Revertir cambio optimista en caso de error
            setVisits(prevVisits => prevVisits.map(v => 
                v._id === checkoutVisit?._id ? checkoutVisit : v
            ));
            
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '❌ Error al registrar la salida', severity: 'error' }
            }));
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
                if (isLocalhost) console.error('Failed to fetch settings:', error);
            }
        };

        fetchSettings();
    }, []);

    // Actualizar auto-aprobación en el backend
    const handleAutoApproveToggle = async (checked: boolean) => {
        // Validar que companyConfig esté cargado
        if (!companyConfig) {
            if (isLocalhost) console.error('Company config not loaded yet');
            return;
        }

        // Actualización optimista
        setAutoApprove(checked);
        
        try {
            // Actualizar en backend
            const updatedConfig = await api.updateCompanyConfig({
                ...companyConfig,
                settings: {
                    ...companyConfig.settings,
                    autoApproval: checked
                }
            });
            
            // Actualizar companyConfig con la respuesta del servidor
            setCompanyConfig(updatedConfig);
            
            // Confirmar que el estado local coincide con el servidor
            setAutoApprove(updatedConfig.settings.autoApproval || false);
            
            if (isLocalhost) console.log('✅ Auto-aprobación actualizada:', updatedConfig.settings.autoApproval);
        } catch (error) {
            if (isLocalhost) console.error('❌ Failed to update auto-approval:', error);
            // Revertir al estado anterior si falla
            setAutoApprove(!checked);
            
            // Mostrar toast de error
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '❌ Error al actualizar configuración', severity: 'error' }
            }));
        }
    };

    // Actualizar auto-check-in en el backend
    const handleAutoCheckInToggle = async (checked: boolean) => {
        // Validar que companyConfig esté cargado
        if (!companyConfig) {
            if (isLocalhost) console.error('Company config not loaded yet');
            return;
        }

        // Actualización optimista
        setAutoCheckIn(checked);
        
        try {
            // Actualizar en backend
            const updatedConfig = await api.updateCompanyConfig({
                ...companyConfig,
                settings: {
                    ...companyConfig.settings,
                    autoCheckIn: checked
                }
            });
            
            // Actualizar companyConfig con la respuesta del servidor
            setCompanyConfig(updatedConfig);
            
            // Confirmar que el estado local coincide con el servidor
            setAutoCheckIn(updatedConfig.settings.autoCheckIn || false);
            
            if (isLocalhost) console.log('✅ Auto check-in actualizado:', updatedConfig.settings.autoCheckIn);
        } catch (error) {
            if (isLocalhost) console.error('❌ Failed to update auto-checkin:', error);
            // Revertir al estado anterior si falla
            setAutoCheckIn(!checked);
            
            // Mostrar toast de error
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { message: '❌ Error al actualizar configuración', severity: 'error' }
            }));
        }
    };

    const navigate = useNavigate();

    // local framer-motion variants for the register dropdown
    const registerWrapperVariants: Variants = {
        open: {
            scaleY: 1,
            opacity: 1,
            transition: { when: 'beforeChildren', staggerChildren: 0.06 },
        },
        closed: {
            scaleY: 0,
            opacity: 0,
            transition: { when: 'afterChildren', staggerChildren: 0.04 },
        },
    };

    const registerItemVariants: Variants = {
        open: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
        closed: { opacity: 0, y: -8, transition: { duration: 0.12 } },
    };

    // Arrays de visitas por status (asegúrate que estén antes del return)
// Filtrar visitas según el rol del usuario
let filteredVisits = visits;
if (user?.role === UserRole.HOST) {
    // El host solo ve visitas destinadas a él
    filteredVisits = visits.filter(v => v.host._id === user._id);
}

const pendingVisits = filteredVisits.filter(v => v.status === VisitStatus.PENDING);
const approvedVisits = filteredVisits.filter(v => v.status === VisitStatus.APPROVED);
// Solo visitas rechazadas SIN razón asignada (esperando que se especifique la razón)
const rejectedVisits = filteredVisits.filter(v => v.status === VisitStatus.REJECTED && !v.rejectionReason);
const respondedVisits = [...approvedVisits, ...rejectedVisits].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime()
);
const checkedInVisits = filteredVisits.filter(v => v.status === VisitStatus.CHECKED_IN);

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
        <div className={isMobile ? "p-3" : "p-6"}>
            {/* Header con contador total y botones al mismo nivel */}
            <div className={`mb-${isMobile ? '4' : '6'} flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold text-gray-900`}>{todayVisits.length}</div>
                        <div className="text-xs text-gray-600 mt-1">Total de registros hoy</div>
                        <div className="text-xs text-gray-500 capitalize">{formattedDate}</div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className={`flex gap-3 ${isMobile ? 'w-full' : 'items-center'}`}>
                    <button
                        onClick={() => navigate('/agenda')}
                        className={`${isMobile ? 'flex-1' : ''} px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center ${isMobile ? 'justify-center' : ''} gap-2 transition-colors`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {!isMobile && 'Ver agenda'}
                    </button>
                    
                    {/* Botón Registrar con submenú - OCULTO para el rol HOST */}
                    {user?.role !== UserRole.HOST && (
                    <div className={`relative ${isMobile ? 'flex-1' : ''}`}>
                        <button
                            onClick={() => setRegisterMenuOpen(!registerMenuOpen)}
                            className={`${isMobile ? 'w-full justify-center' : ''} px-4 py-2.5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white rounded-lg hover:from-gray-800 hover:to-gray-600 font-medium flex items-center gap-2 transition-all shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-700`}
                        >
                            <RegistrarIcon className="w-5 h-5" />
                            Registrar
                        </button>
                        <AnimatePresence>
                            {registerMenuOpen && (
                                <motion.div
                                    initial="closed"
                                    animate="open"
                                    exit="closed"
                                    variants={registerWrapperVariants}
                                    style={{ transformOrigin: 'top', right: 0, minWidth: 200 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-50 min-w-[200px] overflow-hidden"
                                >
                                    <motion.button
                                        variants={registerItemVariants}
                                        onClick={() => {
                                            setIsModalOpen(true);
                                            setRegisterMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <EntradaIcon className="w-4 h-4" />
                                        Entrada de Visitante
                                    </motion.button>

                                    <motion.button
                                        variants={registerItemVariants}
                                        onClick={() => {
                                            setShowExitModal(true);
                                            setRegisterMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 border-t"
                                    >
                                        <SalidaIcon className="w-4 h-4" />
                                        Salida de Visitante
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className={`text-center ${isMobile ? 'py-12' : 'py-20'} bg-white rounded-2xl shadow-xl border border-gray-200`}>
                    <div className={`inline-block animate-spin rounded-full ${isMobile ? 'h-12 w-12 border-4' : 'h-16 w-16 border-4'} border-gray-200 border-t-gray-900`}></div>
                    <p className={`${isMobile ? 'mt-4 text-base' : 'mt-6 text-lg'} text-gray-600 font-medium`}>Cargando visitas...</p>
                </div>
            ) : (
                <>
                    {/* Tabs para móvil - Host solo ve "En espera" y "Dentro" */}
                    {isMobile && (
                        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setMobileActiveTab('pending')}
                                className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                    mobileActiveTab === 'pending'
                                        ? 'bg-gradient-to-br from-gray-900 via-orange-600 to-orange-400 text-white shadow-lg'
                                        : 'bg-white border border-gray-300 text-gray-700'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-lg font-bold">{pendingVisits.length}</span>
                                    <span className="text-xs">En espera</span>
                                </div>
                            </button>
                            {user?.role !== UserRole.HOST && (
                            <button
                                onClick={() => setMobileActiveTab('responded')}
                                className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                    mobileActiveTab === 'responded'
                                        ? 'bg-gradient-to-br from-gray-900 via-green-600 to-green-400 text-white shadow-lg'
                                        : 'bg-white border border-gray-300 text-gray-700'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-lg font-bold">{respondedVisits.length}</span>
                                    <span className="text-xs">Respondidas</span>
                                </div>
                            </button>
                            )}
                            <button
                                onClick={() => setMobileActiveTab('checkedIn')}
                                className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                    mobileActiveTab === 'checkedIn'
                                        ? 'bg-gradient-to-br from-gray-900 via-cyan-600 to-cyan-400 text-white shadow-lg'
                                        : 'bg-white border border-gray-300 text-gray-700'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-lg font-bold">{checkedInVisits.length}</span>
                                    <span className="text-xs">Dentro</span>
                                </div>
                            </button>
                        </div>
                    )}

                    <div className={`grid ${isMobile ? 'grid-cols-1' : user?.role === UserRole.HOST ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'} gap-4 lg:gap-5`}>
                    {/* Columna 1: En espera */}
                    {(!isMobile || mobileActiveTab === 'pending') && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-br from-orange-50 to-white p-5 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-900 via-orange-600 to-orange-400 flex items-center justify-center shadow-lg ring-1 ring-white/10">
                                        <MdOutlinePendingActions aria-hidden="true" className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-gray-800">{pendingVisits.length}</div>
                                        <div className="text-xs text-gray-500 font-medium">Total</div>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 mb-3">En espera</h2>
                            {/* Toggle de auto-aprobación - OCULTO para el rol HOST */}
                            {user?.role !== UserRole.HOST && (
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={autoApprove} 
                                        onChange={e => handleAutoApproveToggle(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-400 peer-checked:to-orange-500"></div>
                                </div>
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Auto aprobación</span>
                            </label>
                            )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="relative mb-3">
                                <input
                                    type="text"
                                    placeholder="Buscar visitante..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1" style={{ maxHeight: isMobile ? 'calc(100vh - 420px)' : 'calc(100vh - 380px)' }}>
                                {pendingVisits.length > 0 ? (
                                    pendingVisits.map(visit => (
                                        <VisitCard key={visit._id} visit={visit} onCardClick={handleCardClick} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                            <ClockIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 text-sm">No hay visitas pendientes.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Columna 2: Respuesta recibida - OCULTA para el rol HOST */}
                    {user?.role !== UserRole.HOST && (!isMobile || mobileActiveTab === 'responded') && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-br from-green-50 to-white p-5 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-900 via-green-600 to-green-400 flex items-center justify-center shadow-lg ring-1 ring-white/10">
                                        <TbClipboardCheck aria-hidden="true" className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-gray-800">{respondedVisits.length}</div>
                                        <div className="flex gap-3 mt-1">
                                            <span className="text-xs text-green-600 font-medium">✓ {approvedVisits.length}</span>
                                            <span className="text-xs text-red-600 font-medium">✗ {rejectedVisits.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 mb-3">Respuesta recibida</h2>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={autoCheckIn} 
                                        onChange={e => handleAutoCheckInToggle(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-green-500"></div>
                                </div>
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Auto check in</span>
                            </label>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="relative mb-3">
                                <input
                                    type="text"
                                    placeholder="Buscar visitante..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1" style={{ maxHeight: isMobile ? 'calc(100vh - 420px)' : 'calc(100vh - 380px)' }}>
                                {respondedVisits.length > 0 ? (
                                    respondedVisits.map(visit => (
                                        <VisitCard key={visit._id} visit={visit} onCardClick={handleCardClick} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                            <CheckCircleIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 text-sm">No hay visitas aprobadas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Columna 3: Dentro */}
                    {(!isMobile || mobileActiveTab === 'checkedIn') && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-br from-cyan-50 to-white p-5 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-900 via-cyan-600 to-cyan-400 flex items-center justify-center shadow-lg ring-1 ring-white/10">
                                        <LuDoorOpen aria-hidden="true" className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-gray-800">{checkedInVisits.length}</div>
                                        <div className="text-xs text-gray-500 font-medium">Total</div>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Dentro</h2>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="relative mb-3">
                                <input
                                    type="text"
                                    placeholder="Buscar visitante..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1" style={{ maxHeight: isMobile ? 'calc(100vh - 420px)' : 'calc(100vh - 380px)' }}>
                                {checkedInVisits.length > 0 ? (
                                    checkedInVisits.map(visit => (
                                        <VisitCard key={visit._id} visit={visit} onCardClick={handleCardClick} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                            <LoginIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 text-sm">No hay visitantes dentro.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    )}
                </div>
                </>
            )}

            <VisitRegistrationSidePanel
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleVisitRegistration}
                hosts={hosts}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => { setIsCheckoutOpen(false); setCheckoutVisit(null); }}
                onConfirm={handleCheckoutConfirm}
            />

            <ExitRegistrationSidePanel
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                visits={visits}
                onSelectVisit={(visit) => {
                    setCheckedInModalVisit(visit);
                    setShowExitModal(false);
                }}
                onConfirmExit={async (visitId, photos) => {
                    try {
                        await api.checkOutVisit(visitId, photos);
                        fetchVisits();
                        setShowExitModal(false);
                    } catch (error) {
                        if (isLocalhost) console.error('Failed to checkout:', error);
                        alert('Error al registrar la salida');
                    }
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


            {/* Modal de Alerta de Lista Negra en Registro */}
            {registerBlacklistAlert && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl animate-slideUp overflow-hidden">
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Visitante encontrado en lista negra al registrar</h3>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Información del visitante con foto */}
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                                <h4 className="font-bold text-yellow-900 mb-3">Información del Visitante</h4>
                                <div className="flex gap-4">
                                    {/* Foto si existe */}
                                    {registerBlacklistAlert.blacklistInfo.photo && (
                                        <img
                                            src={registerBlacklistAlert.blacklistInfo.photo}
                                            alt={registerBlacklistAlert.blacklistInfo.visitorName}
                                            className="w-20 h-20 rounded-lg object-cover border-2 border-yellow-500 flex-shrink-0"
                                        />
                                    )}
                                    {/* Info */}
                                    <div className="space-y-1 text-sm flex-1">
                                        <p className="text-yellow-800">
                                            <strong>Nombre:</strong> {registerBlacklistAlert.blacklistInfo.visitorName}
                                        </p>
                                        <p className="text-yellow-800">
                                            <strong>Correo:</strong> {registerBlacklistAlert.blacklistInfo.email}
                                        </p>
                                        <p className="text-yellow-800">
                                            <strong>Agregado a lista negra:</strong> {new Date(registerBlacklistAlert.blacklistInfo.addedAt).toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Razón del bloqueo */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-gray-900 mb-2">Motivo del Registro</h4>
                                <p className="text-gray-700 text-sm">{registerBlacklistAlert.blacklistInfo.reason}</p>
                            </div>

                            {/* Advertencia */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-900 text-sm">
                                    <strong>⚠️ Importante:</strong> Esta persona está registrada en la lista negra. 
                                    ¿Deseas continuar con el registro de visita o cancelar?
                                </p>
                            </div>

                            {/* Botones de Acción */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => handleRegisterBlacklistAction('cancel')}
                                    disabled={registerBlacklistLoading}
                                    className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-md font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelar Registro
                                </button>
                                <button
                                    onClick={() => handleRegisterBlacklistAction('allow')}
                                    disabled={registerBlacklistLoading}
                                    className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {registerBlacklistLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Continuar de Todos Modos
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
