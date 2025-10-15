import React, { useState, useEffect, useCallback } from 'react';
import { Visit, VisitStatus, User } from '../../types';
import * as api from '../../services/api';
import { CheckoutModal } from './CheckoutModal';
import { VisitHistoryModal } from './VisitHistoryModal';
import { CheckCircleIcon, LogoutIcon, LoginIcon, ClockIcon } from '../../components/common/icons';
import { useNavigate } from 'react-router-dom';

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

const VisitCard: React.FC<{ visit: Visit; onApprove: (id: string) => void; onReject: (id: string) => void; onCheckIn: (id: string) => void; onCheckout: (visit: Visit) => void }> = ({ visit, onApprove, onReject, onCheckIn, onCheckout }) => {
    
    const [showHistory, setShowHistory] = useState(false);
    
    const getStatusBadge = (status: VisitStatus) => {
        switch (status) {
            case VisitStatus.PENDING: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Pendiente</span>;
            case VisitStatus.APPROVED: return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">Aprobado</span>;
            case VisitStatus.CHECKED_IN: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Activo</span>;
            case VisitStatus.COMPLETED: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Completado</span>;
        }
    };
    
    // Tiempo de espera en tiempo real
    const showElapsed = visit.status === VisitStatus.PENDING || visit.status === VisitStatus.APPROVED;
    const elapsed = showElapsed ? useElapsedTime(visit.scheduledDate) : null;
    
    return (
    <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-securiti-blue-500 min-h-[180px] flex flex-col justify-between">
            <div className="flex justify-between items-start gap-2">
                <div>
                    <p className="text-base font-bold text-gray-800 leading-tight">{visit.visitorName}</p>
                    <p className="text-xs text-gray-500 leading-tight">{visit.visitorCompany}</p>
                </div>
                {getStatusBadge(visit.status)}
            </div>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p><strong>Motivo:</strong> {visit.reason}</p>
                <p><strong>Anfitrión:</strong> {visit.host.firstName} {visit.host.lastName}</p>
                <p><strong>Fecha:</strong> {new Date(visit.scheduledDate).toLocaleString()}</p>
                {showElapsed && <p><strong>Tiempo de espera:</strong> {elapsed}</p>}
                {visit.checkInTime && <p><strong>Check-in:</strong> {visit.checkInTime}</p>}
                {visit.checkOutTime && <p><strong>Check-out:</strong> {visit.checkOutTime}</p>}
            </div>
             <div className="mt-3 pt-3 border-t flex space-x-2">
                {visit.status === VisitStatus.PENDING && (
                    <>
                        <button 
                            onClick={() => onApprove(visit._id)} 
                            className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded hover:bg-green-600 flex items-center gap-1"
                        >
                            <CheckCircleIcon className="w-4 h-4" /> Aprobar
                        </button>
                        <button 
                            onClick={() => onReject(visit._id)} 
                            className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600 flex items-center gap-1"
                        >
                            <LogoutIcon className="w-4 h-4" /> Rechazar
                        </button>
                    </>
                )}
                {visit.status === VisitStatus.APPROVED && (
                    <button 
                        onClick={() => onCheckIn(visit._id)} 
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 flex items-center gap-1"
                    >
                        <LoginIcon className="w-4 h-4" /> Check-in
                    </button>
                )}
                 {visit.status === VisitStatus.CHECKED_IN && (
                    <button 
                        onClick={() => onCheckout(visit)} 
                        className="px-3 py-1 text-xs font-semibold text-white bg-purple-500 rounded hover:bg-purple-600 flex items-center gap-1"
                    >
                        <ClockIcon className="w-4 h-4" /> Check-out
                    </button>
                )}
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
        } catch (error) {
            alert('No se pudo acceder a la cámara para escanear QR. Ingresa el código manualmente.');
        }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-6">Registrar Nueva Visita</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Opción: ¿Tiene QR de invitación? */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={hasQrInvitation}
                                onChange={(e) => {
                                    setHasQrInvitation(e.target.checked);
                                    if (!e.target.checked) {
                                        setQrCode('');
                                        stopQrScanner();
                                    }
                                }}
                                className="w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700">El visitante tiene QR de invitación</span>
                        </label>
                    </div>

                    {/* Campo QR (solo si tiene invitación) */}
                    {hasQrInvitation && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <label className="block font-medium mb-2 text-sm">Código QR de Invitación</label>
                            <div className="space-y-2">
                                <input 
                                    type="text" 
                                    placeholder="Ingresa el código QR manualmente" 
                                    value={qrCode}
                                    onChange={e => setQrCode(e.target.value)}
                                    className="w-full p-2 border rounded text-sm"
                                />
                                <button 
                                    type="button" 
                                    onClick={isQrScannerOn ? stopQrScanner : startQrScanner}
                                    className={`w-full px-3 py-2 rounded text-sm font-medium ${
                                        isQrScannerOn 
                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    {isQrScannerOn ? '✕ Cerrar escáner QR' : '📷 Escanear código QR'}
                                </button>
                                {isQrScannerOn && (
                                    <div className="mt-2">
                                        <video ref={qrScannerRef} width="100%" autoPlay className="rounded border" />
                                        <p className="text-xs text-gray-500 mt-1">Enfoca el código QR para escanearlo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Foto del visitante (OPCIONAL - primero en el formulario) */}
                    <div>
                        <label className="block font-medium mb-2 text-sm">Foto del visitante (opcional)</label>
                        <div className="space-y-2">
                            <button 
                                type="button" 
                                className={`w-full px-3 py-2 rounded text-sm font-medium ${
                                    isCameraOn 
                                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                                        : 'bg-securiti-blue-600 hover:bg-securiti-blue-700 text-white'
                                }`}
                                onClick={isCameraOn ? stopCamera : startCamera}
                            >
                                {isCameraOn ? '✕ Cerrar cámara' : '📷 Tomar foto'}
                            </button>
                            
                            {isCameraOn && (
                                <div className="border rounded-lg p-3 bg-gray-50">
                                    <video ref={videoRef} width="100%" autoPlay className="rounded mb-2" />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <button 
                                        type="button" 
                                        className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                                        onClick={capturePhoto}
                                    >
                                        ✓ Capturar foto
                                    </button>
                                </div>
                            )}
                            
                            {photo && !isCameraOn && (
                                <div className="border rounded-lg p-3 bg-gray-50">
                                    <img src={photo} alt="Foto visitante" className="w-full h-48 object-cover rounded mb-2" />
                                    <button 
                                        type="button" 
                                        className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                        onClick={() => setPhoto(null)}
                                    >
                                        🗑 Eliminar foto
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Campos del formulario */}
                    <input 
                        type="text" 
                        placeholder="Nombre del Visitante *" 
                        value={visitorName} 
                        onChange={e => setVisitorName(e.target.value)} 
                        className="w-full p-2 border rounded" 
                        required 
                    />
                    
                    <input 
                        type="text" 
                        placeholder="Empresa del Visitante (opcional)" 
                        value={visitorCompany} 
                        onChange={e => setVisitorCompany(e.target.value)} 
                        className="w-full p-2 border rounded" 
                    />
                    
                    <input 
                        type="email" 
                        placeholder="Email del Visitante *" 
                        value={visitorEmail} 
                        onChange={e => setVisitorEmail(e.target.value)} 
                        className="w-full p-2 border rounded" 
                        required 
                    />
                    
                    <input 
                        type="text" 
                        placeholder="Destino (opcional)" 
                        value={destination} 
                        onChange={e => setDestination(e.target.value)} 
                        className="w-full p-2 border rounded" 
                    />
                    
                    <textarea 
                        placeholder="Motivo de la visita *" 
                        value={reason} 
                        onChange={e => setReason(e.target.value)} 
                        className="w-full p-2 border rounded" 
                        rows={3}
                        required 
                    />
                    
                    <select 
                        value={hostId} 
                        onChange={e => setHostId(e.target.value)} 
                        className="w-full p-2 border rounded bg-white" 
                        required
                    >
                        <option value="" disabled>Seleccionar Anfitrión *</option>
                        {hosts.map(host => (
                            <option key={host._id} value={host._id}>{host.firstName} {host.lastName}</option>
                        ))}
                    </select>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-securiti-blue-600 text-white rounded hover:bg-securiti-blue-700"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal de Salida de Visitante
const ExitVisitorModal: React.FC<{ isOpen: boolean; onClose: () => void; visits: Visit[]; onCheckout: (visit: Visit) => void }> = ({ isOpen, onClose, visits, onCheckout }) => {
    const [search, setSearch] = useState('');
    
    if (!isOpen) return null;
    
    const checkedInVisits = visits.filter(v => v.status === VisitStatus.CHECKED_IN);
    const filteredVisits = checkedInVisits.filter(v => 
        v.visitorName.toLowerCase().includes(search.toLowerCase()) ||
        (v.visitorCompany && v.visitorCompany.toLowerCase().includes(search.toLowerCase()))
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Salida de Visitante</h2>
                <p className="text-sm text-gray-600 mb-4">Selecciona el visitante que va a salir</p>
                
                <input
                    type="text"
                    placeholder="Buscar por nombre o empresa..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                />
                
                {filteredVisits.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {checkedInVisits.length === 0 ? 'No hay visitantes dentro actualmente.' : 'No se encontraron visitantes.'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredVisits.map(visit => (
                            <div key={visit._id} className="border rounded p-3 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-semibold">{visit.visitorName}</p>
                                    <p className="text-sm text-gray-600">{visit.visitorCompany}</p>
                                    <p className="text-xs text-gray-500">Anfitrión: {visit.host.firstName} {visit.host.lastName}</p>
                                    {visit.checkInTime && (
                                        <p className="text-xs text-gray-500">Entrada: {visit.checkInTime}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        onCheckout(visit);
                                        onClose();
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                                >
                                    <LogoutIcon className="w-4 h-4" />
                                    Registrar Salida
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
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

    // Estados y lógica para el modal de motivo de rechazo
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

    // Toggles de auto-aprobación y auto-check-in (simulación frontend)
    const [autoApprove, setAutoApprove] = useState(false);
    const [autoCheckIn, setAutoCheckIn] = useState(false);

    // Puedes conectar estos toggles con el backend si tienes endpoints para settings de la empresa
    // y guarda el estado en la base de datos

    // Ejemplo de uso en el efecto de carga de visitas:
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // const settings = await api.getSettings(); // Supongamos que tienes un endpoint para esto
                // setAutoApprove(settings.autoApprove);
                // setAutoCheckIn(settings.autoCheckIn);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const navigate = useNavigate();

    // Arrays de visitas por status (asegúrate que estén antes del return)
const pendingVisits = visits.filter(v => v.status === VisitStatus.PENDING);
const approvedVisits = visits.filter(v => v.status === VisitStatus.APPROVED);
const checkedInVisits = visits.filter(v => v.status === VisitStatus.CHECKED_IN);

// Agrega el botón de Agenda en el header
    return (
        <div className="p-6">
            {/* Header con contador total */}
            <div className="mb-6">
                <div className="flex items-baseline gap-3">
                    <div className="text-6xl font-bold text-securiti-blue-600">{visits.length}</div>
                    <div className="text-sm text-gray-600">Total de registros hoy</div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4 items-center mb-6">
                <button
                    onClick={() => navigate('/visits/agenda')}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
                >
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
                                        onChange={e => setAutoApprove(e.target.checked)}
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
                                        <VisitCard key={visit._id} visit={visit} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
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
                                    <div className="text-3xl font-bold text-gray-800">{approvedVisits.length}</div>
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Total</div>
                            </div>
                            <h2 className="text-base font-semibold text-gray-800 mb-3">Respuesta recibida</h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={autoCheckIn} 
                                        onChange={e => setAutoCheckIn(e.target.checked)}
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
                                {approvedVisits.length > 0 ? (
                                    approvedVisits.map(visit => (
                                        <VisitCard key={visit._id} visit={visit} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
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
                                        <VisitCard key={visit._id} visit={visit} onApprove={handleApprove} onReject={openRejectModal} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
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
                onCheckout={openCheckoutModal}
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
        </div>
    );
};
