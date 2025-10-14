import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@mui/material';
import { Visit, VisitStatus, User } from '../../types';
import * as api from '../../services/api';
import { CheckoutModal } from './CheckoutModal';
import { VisitHistoryModal } from './VisitHistoryModal';
<<<<<<< HEAD
import { CheckCircleIcon, LogoutIcon, LoginIcon, ClockIcon } from '../../components/common/icons';

const VisitCard: React.FC<{ visit: Visit; onApprove: (id: string) => void; onReject: (id: string) => void; onCheckIn: (id: string) => void; onCheckout: (visit: Visit) => void }> = ({ visit, onApprove, onReject, onCheckIn, onCheckout }) => {
    
=======
import { useToast } from '../../components/common/Toast';

const rejectionOptions = [
    'Anfitrión no disponible',
    'Visita no agendada',
    'Cancelación por emergencia',
    'Otro'
];

// Modal para mostrar agenda/accesos
const AgendaModal: React.FC<{ open: boolean; onClose: () => void; events: any[] }> = ({ open, onClose, events }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Agenda de Accesos/Eventos Programados</h2>
            {events.length === 0 ? (
                <p className="text-gray-500">No hay eventos programados.</p>
            ) : (
                <ul className="space-y-3">
                    {events.map((ev, idx) => (
                        <li key={ev._id || idx} className="border-b pb-2">
                            <div className="font-semibold">{ev.title || ev.accessType || 'Acceso'}</div>
                            <div className="text-sm text-gray-600">{ev.description || ev.details}</div>
                            <div className="text-xs text-gray-400">{ev.scheduledDate ? new Date(ev.scheduledDate).toLocaleString() : ''}</div>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex justify-end pt-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cerrar</button>
            </div>
        </div>
    </Dialog>
);

// Diálogo de confirmación ligero para cambios de configuración
const ConfirmDialog: React.FC<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ open, title, message, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-securiti-blue-600 text-white rounded">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const VisitCard: React.FC<{ visit: Visit; onApprove: (id: string) => void; onCheckIn: (id: string) => void; onCheckout: (visit: Visit) => void; onReject?: (id: string, reason: string) => void; loadingAction?: string }> = ({ visit, onApprove, onCheckIn, onCheckout, onReject, loadingAction }) => {
>>>>>>> 9b9a908 (Implementación completa de Accesos/Eventos, pre-registro público, auto-registro, integración de emails y mejoras de UX. Todo el flujo listo para producción.)
    const [showHistory, setShowHistory] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [otherReason, setOtherReason] = useState('');

    const getStatusBadge = (status: VisitStatus) => {
        switch (status) {
            case VisitStatus.PENDING: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Pendiente</span>;
            case VisitStatus.APPROVED: return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">Aprobado</span>;
            case VisitStatus.CHECKED_IN: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Activo</span>;
            case VisitStatus.COMPLETED: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Completado</span>;
        }
    };

    const handleReject = () => {
        setShowRejectModal(true);
    };
    const handleRejectSubmit = () => {
        let reason = selectedReason;
        if (selectedReason === 'Otro') reason = otherReason;
        if (onReject && reason) {
            onReject(visit._id, reason);
            setShowRejectModal(false);
            setSelectedReason('');
            setOtherReason('');
        }
    };

    return (
<<<<<<< HEAD
    <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-securiti-blue-500 min-h-[180px] flex flex-col justify-between">
            <div className="flex justify-between items-start gap-2">
                <div>
                    <p className="text-base font-bold text-gray-800 leading-tight">{visit.visitorName}</p>
                    <p className="text-xs text-gray-500 leading-tight">{visit.visitorCompany}</p>
=======
        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-securiti-blue-500">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    {visit.visitorPhoto ? (
                        <img src={visit.visitorPhoto} alt="Foto visitante" className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                        <span className="inline-block w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">👤</span>
                    )}
                    <div>
                        <p className="text-lg font-bold text-gray-800">{visit.visitorName}</p>
                        <p className="text-sm text-gray-500">{visit.visitorCompany}</p>
                    </div>
>>>>>>> 9b9a908 (Implementación completa de Accesos/Eventos, pre-registro público, auto-registro, integración de emails y mejoras de UX. Todo el flujo listo para producción.)
                </div>
                {getStatusBadge(visit.status)}
            </div>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p><strong>Motivo:</strong> {visit.reason}</p>
<<<<<<< HEAD
                <p><strong>Anfitrión:</strong> {visit.host.firstName} {visit.host.lastName}</p>
                <p><strong>Fecha:</strong> {new Date(visit.scheduledDate).toLocaleString()}</p>
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
=======
                <p className="flex items-center gap-2"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600">👤</span> <span><strong>Anfitrión:</strong> {visit.host.firstName} {visit.host.lastName}</span></p>
                <p><strong>Fecha Programada:</strong> {new Date(visit.scheduledDate).toLocaleString()}</p>
                {visit.checkInTime && <p><strong>Check-in:</strong> {visit.checkInTime}</p>}
                {visit.checkOutTime && <p><strong>Check-out:</strong> {visit.checkOutTime}</p>}
            </div>
            <div className="mt-4 pt-4 border-t flex space-x-2">
                {visit.status === VisitStatus.PENDING && (
                    <>
                        <button onClick={() => onApprove(visit._id)} disabled={loadingAction === 'approve'} className={`px-3 py-1 text-xs font-semibold text-white rounded ${loadingAction === 'approve' ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>{loadingAction === 'approve' ? 'Aprobando...' : 'Aprobar'}</button>
                        <button onClick={handleReject} disabled={loadingAction === 'reject'} className={`px-3 py-1 text-xs font-semibold text-white rounded ${loadingAction === 'reject' ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>{loadingAction === 'reject' ? 'Rechazando...' : 'Rechazar'}</button>
                    </>
                )}
                {visit.status === VisitStatus.APPROVED && (
                    <button onClick={() => onCheckIn(visit._id)} disabled={loadingAction === 'checkin'} className={`px-3 py-1 text-xs font-semibold text-white rounded ${loadingAction === 'checkin' ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>{loadingAction === 'checkin' ? 'Entrando...' : 'Check-in'}</button>
                )}
                {visit.status === VisitStatus.CHECKED_IN && (
                    <button onClick={() => onCheckout(visit)} disabled={loadingAction === 'checkout'} className={`px-3 py-1 text-xs font-semibold text-white rounded ${loadingAction === 'checkout' ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>{loadingAction === 'checkout' ? 'Saliendo...' : 'Check-out'}</button>
                )}
                {(visit.checkInTime || visit.checkOutTime) && (
                    <button onClick={() => setShowHistory(true)} className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300">Ver historial</button>
>>>>>>> 9b9a908 (Implementación completa de Accesos/Eventos, pre-registro público, auto-registro, integración de emails y mejoras de UX. Todo el flujo listo para producción.)
                )}
            </div>
            <VisitHistoryModal
                visitId={visit._id}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Rechazar visita</h3>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium mb-2">Motivo de rechazo</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedReason}
                                onChange={e => setSelectedReason(e.target.value)}
                            >
                                <option value="" disabled>Selecciona una opción</option>
                                {rejectionOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {selectedReason === 'Otro' && (
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded mt-2"
                                    placeholder="Especifica el motivo"
                                    value={otherReason}
                                    onChange={e => setOtherReason(e.target.value)}
                                />
                            )}
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                            <button onClick={handleRejectSubmit} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-60" disabled={loadingAction === 'reject' || !selectedReason || (selectedReason === 'Otro' && !otherReason)}>
                                {loadingAction === 'reject' ? 'Rechazando...' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const VisitFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; hosts: User[] }> = ({ isOpen, onClose, onSave, hosts }) => {
    const [visitorName, setVisitorName] = useState('');
    const [visitorCompany, setVisitorCompany] = useState('');
    const [destination, setDestination] = useState('SecurITI');
    const [reason, setReason] = useState('');
    const [hostId, setHostId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.createVisit({ visitorName, visitorCompany, reason, hostId, scheduledDate, destination });
            onSave();
            onClose();
            showToast('Visita creada', 'success');
        } catch (error) {
            console.error("Failed to create visit:", error);
            showToast('Error al crear visita', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">Registrar Nueva Visita</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre del Visitante" value={visitorName} onChange={e => setVisitorName(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="text" placeholder="Empresa del Visitante (opcional)" value={visitorCompany} onChange={e => setVisitorCompany(e.target.value)} className="w-full p-2 border rounded" />
                    <input type="text" placeholder="Destino (opcional)" value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-2 border rounded" />
                    <textarea placeholder="Motivo de la visita" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded" required />
                    <select value={hostId} onChange={e => setHostId(e.target.value)} className="w-full p-2 border rounded bg-white" required>
                        <option value="" disabled>Seleccionar Anfitrión</option>
                        {hosts.map(host => (
                            <option key={host._id} value={host._id}>{host.firstName} {host.lastName}</option>
                        ))}
                    </select>
                    <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full p-2 border rounded" required />
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                        <button type="submit" disabled={saving} className={`px-4 py-2 text-white rounded ${saving ? 'bg-securiti-blue-300 cursor-not-allowed' : 'bg-securiti-blue-600'}`}>{saving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const VisitsPage: React.FC = () => {
<<<<<<< HEAD
    const handleReject = async (id: string) => {
        try {
            const updatedVisit = await api.rejectVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            console.error('Failed to reject visit:', error);
        }
    };
    const [activeTab, setActiveTab] = useState('active');
=======
>>>>>>> 9b9a908 (Implementación completa de Accesos/Eventos, pre-registro público, auto-registro, integración de emails y mejoras de UX. Todo el flujo listo para producción.)
    const [visits, setVisits] = useState<Visit[]>([]);
    const [agendaOpen, setAgendaOpen] = useState(false);
    const [agendaEvents, setAgendaEvents] = useState<any[]>([]);
    // Obtener accesos/eventos para agenda
    const fetchAgenda = async () => {
        try {
            const { events } = await api.getAgendaEvents(); // Debe existir en api.ts
            setAgendaEvents(events || []);
        } catch {
            setAgendaEvents([]);
        }
    };
    const [hosts, setHosts] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutVisit, setCheckoutVisit] = useState<Visit | null>(null);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [modalType, setModalType] = useState<'entrada' | 'salida' | null>(null);
    const [autoApprove, setAutoApprove] = useState(false);
    const [autoCheckIn, setAutoCheckIn] = useState(false);
    const { showToast } = useToast();
    const [loadingActionById, setLoadingActionById] = useState<Record<string, string | undefined>>({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{ type: 'autoApprove' | 'autoCheckIn'; value: boolean } | null>(null);

    const fetchVisits = useCallback(async () => {
        try {
            setLoading(true);
            const { visits } = await api.getVisits({ limit: 100 });
            setVisits(visits || []);
        } catch (error) {
            setVisits([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVisits();
        api.getHosts()
            .then(setHosts)
            .catch(() => setHosts([]));
    }, [fetchVisits]);

    const handleApprove = async (id: string) => {
        try {
            setLoadingActionById(prev => ({ ...prev, [id]: 'approve' }));
            const updatedVisit = await api.approveVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
            showToast('Visita aprobada', 'success');
        } catch (error) {
            showToast('Error al aprobar la visita', 'error');
        } finally {
            setLoadingActionById(prev => ({ ...prev, [id]: undefined }));
        }
    };
    const handleCheckIn = async (id: string) => {
        try {
            setLoadingActionById(prev => ({ ...prev, [id]: 'checkin' }));
            const updatedVisit = await api.checkInVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
            showToast('Check-in realizado', 'success');
        } catch (error) {
            showToast('Error al realizar check-in', 'error');
        } finally {
            setLoadingActionById(prev => ({ ...prev, [id]: undefined }));
        }
    };
    const handleRejectVisit = async (id: string, reason: string) => {
        try {
            setLoadingActionById(prev => ({ ...prev, [id]: 'reject' }));
            const updatedVisit = await api.updateVisitStatus(id, VisitStatus.REJECTED, reason);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
            showToast('Visita rechazada', 'warning');
        } catch (error) {
            showToast('Error al rechazar la visita', 'error');
        } finally {
            setLoadingActionById(prev => ({ ...prev, [id]: undefined }));
        }
    };
    const openCheckoutModal = (visit: Visit) => {
        setCheckoutVisit(visit);
        setIsCheckoutOpen(true);
    };
    const handleCheckoutConfirm = async (photos: string[]) => {
        try {
            if (!checkoutVisit) return;
            setLoadingActionById(prev => ({ ...prev, [checkoutVisit._id]: 'checkout' }));
            const result = await api.checkOutVisit(checkoutVisit._id, photos);
            setVisits(visits.map(v => v._id === checkoutVisit._id ? result.visit : v));
            showToast('Check-out realizado', 'success');
        } catch (error) {
            showToast('Error al realizar check-out', 'error');
        } finally {
            if (checkoutVisit) setLoadingActionById(prev => ({ ...prev, [checkoutVisit._id]: undefined }));
        }
        setIsCheckoutOpen(false);
        setCheckoutVisit(null);
    };

    // Kanban columns
    const pendingVisits = visits.filter(v => v.status === VisitStatus.PENDING || v.status === VisitStatus.APPROVED || v.status === VisitStatus.REJECTED);
    const activeVisits = visits.filter(v => v.status === VisitStatus.CHECKED_IN);
    const completedVisits = visits.filter(v => v.status === VisitStatus.COMPLETED);

    return (
        <div>
            <div className="flex justify-between items-center mb-6 relative">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Visitas</h2>
                    <button
                        onClick={async () => { await fetchAgenda(); setAgendaOpen(true); }}
                        className="px-3 py-2 font-semibold text-securiti-blue-700 bg-white border border-securiti-blue-600 rounded-lg shadow hover:bg-securiti-blue-50 transition-colors"
                    >
                        Ver agenda
                    </button>
                </div>
<<<<<<< HEAD
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-semibold text-white bg-securiti-blue-600 rounded-lg shadow-md hover:bg-securiti-blue-700 transition-colors">
                    Registrar Visita
                </button>
            </div>
            
            {loading ? (
                <div className="text-center p-8">Cargando visitas...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredVisits.length > 0 ? (
                        filteredVisits.map(visit => (
                            <VisitCard key={visit._id} visit={visit} onApprove={handleApprove} onReject={handleReject} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 mt-8">No hay visitas que mostrar en esta categoría.</p>
=======
                <div className="relative">
                    <button
                        onClick={() => setSubmenuOpen((open) => !open)}
                        className="px-4 py-2 font-semibold text-white bg-securiti-blue-600 rounded-lg shadow-md hover:bg-securiti-blue-700 transition-colors"
                    >
                        Registrar Visita
                    </button>
                    {submenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => { setModalType('entrada'); setIsModalOpen(true); setSubmenuOpen(false); }}
                            >
                                Entrada de visitante
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => { setModalType('salida'); setIsModalOpen(true); setSubmenuOpen(false); }}
                            >
                                Salida de visitante
                            </button>
                        </div>
>>>>>>> 9b9a908 (Implementación completa de Accesos/Eventos, pre-registro público, auto-registro, integración de emails y mejoras de UX. Todo el flujo listo para producción.)
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center gap-2">
                    <label className="font-medium">Auto-aprobar visitas en espera</label>
                    <input
                        type="checkbox"
                        checked={autoApprove}
                        onChange={e => { setConfirmConfig({ type: 'autoApprove', value: e.target.checked }); setConfirmOpen(true); }}
                        className="w-5 h-5"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="font-medium">Auto check-in en respuesta recibida</label>
                    <input
                        type="checkbox"
                        checked={autoCheckIn}
                        onChange={e => { setConfirmConfig({ type: 'autoCheckIn', value: e.target.checked }); setConfirmOpen(true); }}
                        className="w-5 h-5"
                    />
                </div>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[0,1,2].map(col => (
                        <div key={col}>
                            <div className="h-5 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
                            {[0,1].map(i => (
                                <div key={i} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-gray-200 animate-pulse mb-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-full" />
                                        <div className="h-3 bg-gray-100 rounded w-5/6" />
                                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Pendientes / Aprobadas / Rechazadas</h3>
                <ConfirmDialog
                    open={confirmOpen}
                    title={confirmConfig?.type === 'autoApprove' ? 'Confirmar auto-aprobación' : 'Confirmar auto check-in'}
                    message={confirmConfig?.type === 'autoApprove' ? 'Esto aprobará automáticamente las nuevas visitas en espera.' : 'Esto realizará el check-in automáticamente al aprobar.'}
                    onConfirm={() => {
                        if (!confirmConfig) return;
                        if (confirmConfig.type === 'autoApprove') {
                            setAutoApprove(confirmConfig.value);
                            showToast(confirmConfig.value ? 'Auto-aprobación activada' : 'Auto-aprobación desactivada', 'info');
                        } else {
                            setAutoCheckIn(confirmConfig.value);
                            showToast(confirmConfig.value ? 'Auto check-in activado' : 'Auto check-in desactivado', 'info');
                        }
                        setConfirmOpen(false);
                        setConfirmConfig(null);
                    }}
                    onCancel={() => { setConfirmOpen(false); setConfirmConfig(null); }}
                />
                        {pendingVisits.length > 0 ? pendingVisits.map(visit => (
                            <VisitCard key={visit._id} visit={visit} onApprove={handleApprove} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} onReject={handleRejectVisit} loadingAction={loadingActionById[visit._id]} />
                        )) : <p className="text-gray-500">No hay visitas pendientes.</p>}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Activas (Dentro)</h3>
                        {activeVisits.length > 0 ? activeVisits.map(visit => (
                            <VisitCard key={visit._id} visit={visit} onApprove={handleApprove} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} onReject={handleRejectVisit} loadingAction={loadingActionById[visit._id]} />
                        )) : <p className="text-gray-500">No hay visitas activas.</p>}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Completadas (Historial)</h3>
                        {completedVisits.length > 0 ? completedVisits.map(visit => (
                            <VisitCard key={visit._id} visit={visit} onApprove={handleApprove} onCheckIn={handleCheckIn} onCheckout={openCheckoutModal} onReject={handleRejectVisit} loadingAction={loadingActionById[visit._id]} />
                        )) : <p className="text-gray-500">No hay visitas completadas.</p>}
                    </div>
                </div>
            )}
            {modalType === 'entrada' && (
                <VisitFormModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setModalType(null); }}
                    onSave={fetchVisits}
                    hosts={hosts}
                />
            )}
            {modalType === 'salida' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-6">Registrar Salida de Visitante</h2>
                        {/* Aquí va el formulario para registrar salida por QR o selección de visita activa */}
                        <p>Funcionalidad de salida de visitante próximamente...</p>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => { setIsModalOpen(false); setModalType(null); }} className="px-4 py-2 bg-gray-200 rounded">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => { setIsCheckoutOpen(false); setCheckoutVisit(null); }}
                onConfirm={handleCheckoutConfirm}
            />
            <AgendaModal open={agendaOpen} onClose={() => setAgendaOpen(false)} events={agendaEvents} />
        </div>
    );
};
