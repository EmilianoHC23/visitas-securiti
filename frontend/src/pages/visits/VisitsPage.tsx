import React, { useState, useEffect, useCallback } from 'react';
import { Visit, VisitStatus, User } from '../../types';
import * as api from '../../services/api';

const VisitCard: React.FC<{ 
  visit: Visit, 
  onApprove: (id: string, notes?: string) => void,
  onReject: (id: string, reason?: string) => void,
  onCheckIn: (id: string) => void,
  onCheckOut: (id: string) => void
}> = ({ visit, onApprove, onReject, onCheckIn, onCheckOut }) => {
    
    const getStatusBadge = (status: VisitStatus) => {
        switch (status) {
            case VisitStatus.PENDING: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">En Espera</span>;
            case VisitStatus.APPROVED: return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">Aprobado</span>;
            case VisitStatus.REJECTED: return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Rechazado</span>;
            case VisitStatus.CHECKED_IN: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Dentro</span>;
            case VisitStatus.COMPLETED: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Completado</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Desconocido</span>;
        }
    };
    
    return (
        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-securiti-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-lg font-bold text-gray-800">{visit.visitorName}</p>
                    <p className="text-sm text-gray-500">{visit.visitorCompany}</p>
                </div>
                {getStatusBadge(visit.status)}
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><strong>Motivo:</strong> {visit.reason}</p>
                <p><strong>Anfitrión:</strong> {visit.host.firstName} {visit.host.lastName}</p>
                <p><strong>Fecha Programada:</strong> {new Date(visit.scheduledDate).toLocaleString()}</p>
                {visit.checkInTime && <p><strong>Check-in:</strong> {new Date(visit.checkInTime).toLocaleString()}</p>}
                {visit.checkOutTime && <p><strong>Check-out:</strong> {new Date(visit.checkOutTime).toLocaleString()}</p>}
                {visit.approvalTimestamp && (
                    <p><strong>Procesado:</strong> {new Date(visit.approvalTimestamp).toLocaleString()}</p>
                )}
                {visit.rejectionReason && (
                    <p><strong>Motivo rechazo:</strong> {visit.rejectionReason}</p>
                )}
            </div>
             <div className="mt-4 pt-4 border-t flex space-x-2">
                {visit.status === VisitStatus.PENDING && (
                    <>
                        <button 
                            onClick={() => onApprove(visit._id)} 
                            className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded hover:bg-green-600"
                        >
                            ✅ Aprobar
                        </button>
                        <button 
                            onClick={() => onReject(visit._id)} 
                            className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600"
                        >
                            ❌ Rechazar
                        </button>
                    </>
                )}
                {visit.status === VisitStatus.APPROVED && (
                    <button 
                        onClick={() => onCheckIn(visit._id)} 
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                        🚪 Check-in
                    </button>
                )}
                 {visit.status === VisitStatus.CHECKED_IN && (
                    <button 
                        onClick={() => onCheckOut(visit._id)} 
                        className="px-3 py-1 text-xs font-semibold text-white bg-purple-500 rounded hover:bg-purple-600"
                    >
                        👋 Check-out
                    </button>
                )}
            </div>
        </div>
    );
};

const VisitFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; hosts: User[] }> = ({ isOpen, onClose, onSave, hosts }) => {
    const [visitorName, setVisitorName] = useState('');
    const [visitorEmail, setVisitorEmail] = useState('');
    const [visitorCompany, setVisitorCompany] = useState('');
    const [destination, setDestination] = useState('SecurITI');
    const [hostId, setHostId] = useState('');
    const [reason, setReason] = useState('');
    const [hostId, setHostId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createVisit({ visitorName, visitorCompany, reason, hostId, scheduledDate });
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
                    <input type="text" placeholder="Empresa del Visitante" value={visitorCompany} onChange={e => setVisitorCompany(e.target.value)} className="w-full p-2 border rounded" required />
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
    const [activeTab, setActiveTab] = useState('active');
    const [visits, setVisits] = useState<Visit[]>([]);
    const [hosts, setHosts] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleApprove = async (id: string, notes?: string) => {
        try {
            const updatedVisit = await api.approveVisit(id, notes);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
            alert('Visita aprobada exitosamente');
        } catch (error) {
            console.error("Failed to approve visit:", error);
            alert('Error al aprobar la visita');
        }
    };

    const handleReject = async (id: string, reason?: string) => {
        const rejectionReason = reason || prompt('Motivo del rechazo (opcional):');
        try {
            const updatedVisit = await api.rejectVisit(id, rejectionReason);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
            alert('Visita rechazada exitosamente');
        } catch (error) {
            console.error("Failed to reject visit:", error);
            alert('Error al rechazar la visita');
        }
    };

    const handleCheckIn = async (id: string) => {
        try {
            const updatedVisit = await api.checkInVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
            alert('Check-in realizado exitosamente');
        } catch (error) {
            console.error("Failed to check-in visit:", error);
            alert('Error al realizar check-in');
        }
    };

    const handleCheckOut = async (id: string) => {
        try {
            const updatedVisit = await api.checkOutVisit(id);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
            alert('Check-out realizado exitosamente');
        } catch (error) {
            console.error("Failed to check-out visit:", error);
            alert('Error al realizar check-out');
        }
    };

    const filteredVisits = visits.filter(visit => {
        if (activeTab === 'active') return visit.status === VisitStatus.CHECKED_IN;
        if (activeTab === 'pending') return visit.status === VisitStatus.PENDING || visit.status === VisitStatus.APPROVED;
        if (activeTab === 'history') return visit.status === VisitStatus.COMPLETED || visit.status === VisitStatus.REJECTED;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVisits.length > 0 ? (
                        filteredVisits.map(visit => (
                            <VisitCard 
                                key={visit._id} 
                                visit={visit} 
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onCheckIn={handleCheckIn}
                                onCheckOut={handleCheckOut}
                            />
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
        </div>
    );
};
