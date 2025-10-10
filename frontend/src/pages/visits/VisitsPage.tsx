import React, { useState, useEffect, useCallback } from 'react';
import { Visit, VisitStatus, User } from '../../types';
import * as api from '../../services/api';
import { CheckoutModal } from './CheckoutModal';
import { VisitHistoryModal } from './VisitHistoryModal';
import { CheckCircleIcon, LogoutIcon, LoginIcon, ClockIcon } from '../../components/common/icons';

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
    const [scheduledDate, setScheduledDate] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createVisit({ visitorName, visitorCompany, reason, hostId, scheduledDate, destination });
            onSave(); // This will trigger a refetch in the parent component
            onClose(); // Close modal on success
        } catch (error) {
            console.error("Failed to create visit:", error);
            // Here you could show an error message in the modal
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
                        <button type="submit" className="px-4 py-2 bg-securiti-blue-600 text-white rounded">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const VisitsPage: React.FC = () => {
    const handleReject = async (id: string) => {
        try {
            const updatedVisit = await api.rejectVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            console.error('Failed to reject visit:', error);
        }
    };
    const [activeTab, setActiveTab] = useState('active');
    const [visits, setVisits] = useState<Visit[]>([]);
    const [hosts, setHosts] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutVisit, setCheckoutVisit] = useState<Visit | null>(null);

    const fetchVisits = useCallback(async () => {
        try {
            setLoading(true);
            const visitsData = await api.getVisits();
            setVisits(visitsData);
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

    const filteredVisits = visits.filter(visit => {
        if (activeTab === 'active') return visit.status === VisitStatus.CHECKED_IN;
        if (activeTab === 'pending') return visit.status === VisitStatus.PENDING || visit.status === VisitStatus.APPROVED;
        if (activeTab === 'history') return visit.status === VisitStatus.COMPLETED;
        return false;
    });

    const TabButton: React.FC<{ tabName: string; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === tabName
                    ? 'border-b-2 border-securiti-blue-600 text-securiti-blue-600'
                    : 'text-gray-500 hover:text-securiti-blue-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="border-b">
                    <TabButton tabName="active" label="Visitas Activas" />
                    <TabButton tabName="pending" label="Visitas Pendientes" />
                    <TabButton tabName="history" label="Historial" />
                </div>
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
                    )}
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
        </div>
    );
};
