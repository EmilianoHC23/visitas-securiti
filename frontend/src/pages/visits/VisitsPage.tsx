import React, { useState, useEffect, useCallback } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';
registerLocale('es', es);
import { Visit, VisitStatus, User } from '../../types';
import * as api from '../../services/api';

const VisitCard: React.FC<{ visit: Visit, onUpdateStatus: (id: string, status: VisitStatus) => void }> = ({ visit, onUpdateStatus }) => {
    
    const getStatusBadge = (status: VisitStatus) => {
        switch (status) {
            case VisitStatus.PENDING: return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Pendiente</span>;
            case VisitStatus.APPROVED: return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">Aprobado</span>;
            case VisitStatus.CHECKED_IN: return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Activo</span>;
            case VisitStatus.COMPLETED: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Completado</span>;
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
                {visit.checkInTime && <p><strong>Check-in:</strong> {visit.checkInTime}</p>}
                {visit.checkOutTime && <p><strong>Check-out:</strong> {visit.checkOutTime}</p>}
            </div>
             <div className="mt-4 pt-4 border-t flex space-x-2">
                {visit.status === VisitStatus.PENDING && (
                    <button onClick={() => onUpdateStatus(visit._id, VisitStatus.APPROVED)} className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600">Aprobar</button>
                )}
                {visit.status === VisitStatus.APPROVED && (
                    <button onClick={() => onUpdateStatus(visit._id, VisitStatus.CHECKED_IN)} className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded hover:bg-green-600">Check-in</button>
                )}
                 {visit.status === VisitStatus.CHECKED_IN && (
                    <button onClick={() => onUpdateStatus(visit._id, VisitStatus.COMPLETED)} className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600">Check-out</button>
                )}
            </div>
        </div>
    );
};

const VisitFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; hosts: User[] }> = ({ isOpen, onClose, onSave, hosts }) => {
    const [visitorName, setVisitorName] = useState('');
    const [visitorCompany, setVisitorCompany] = useState('');
    const [reason, setReason] = useState('');
    const [hostId, setHostId] = useState('');
    // Inicializar con la fecha y hora actual como objeto Date
    const getNow = () => {
        const now = new Date();
        now.setSeconds(0, 0);
        return now;
    };
    const [scheduledDate, setScheduledDate] = useState<Date>(getNow());
    // Cuando se abre el modal, reiniciar la fecha a la actual
    React.useEffect(() => {
        if (isOpen) {
            setScheduledDate(getNow());
        }
    }, [isOpen]);
    const [nameError, setNameError] = useState('');
    const [companyError, setCompanyError] = useState('');

    // Expresión regular: solo letras, puede tener acentos, debe tener al menos un espacio (nombre y apellido)
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)+$/;
    // Expresión regular mejorada para empresa: al menos dos palabras o una palabra de mínimo 3 letras, permite letras, números y algunos símbolos, no solo letras repetidas
    const companyRegex = /^(?!.*(.)\1{3,})[A-Za-zÁÉÍÓÚáéíóúÑñ0-9&.,'"\-]{3,}(\s+[A-Za-zÁÉÍÓÚáéíóúÑñ0-9&.,'"\-]{2,})+$/;

    // Función auxiliar para detectar cadenas tipo garabato (letras iguales, sin vocales, etc.)
    function isGibberishCompany(str: string) {
        // No debe ser solo letras iguales o solo consonantes
        const onlyConsonants = /^[^AEIOUaeiouÁÉÍÓÚáéíóú]+$/;
        const repeatedChar = /(.)\1{3,}/;
        // Debe tener al menos una vocal
        const hasVowel = /[AEIOUaeiouÁÉÍÓÚáéíóú]/;
        // Debe tener al menos dos palabras o una palabra de mínimo 3 letras
        const twoWords = /\w+\s+\w+/;
        const minLength = str.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ]/g, '').length >= 3;
        return (
            onlyConsonants.test(str.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ]/g, '')) ||
            repeatedChar.test(str) ||
            !hasVowel.test(str) ||
            (!twoWords.test(str) && !minLength)
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let valid = true;
        // Validar nombre
        if (!nameRegex.test(visitorName.trim())) {
            setNameError('Por favor ingresa un nombre y apellido válidos (solo letras, sin símbolos ni garabatos).');
            valid = false;
        } else {
            setNameError('');
        }
        // Validar empresa
        const companyValue = visitorCompany.trim();
        if (!companyRegex.test(companyValue) || isGibberishCompany(companyValue)) {
            setCompanyError('Por favor ingresa un nombre de empresa válido (debe ser un nombre real, no garabatos, puede incluir letras, números y algunos símbolos como & . , -).');
            valid = false;
        } else {
            setCompanyError('');
        }
        if (!valid) return;
        try {
            // Formatear la fecha a string ISO (o el formato que espera tu backend)
            const scheduledDateStr = scheduledDate.toISOString();
            await api.createVisit({ visitorName, visitorCompany, reason, hostId, scheduledDate: scheduledDateStr });
            onSave(); // This will trigger a refetch in the parent component
            onClose(); // Close modal on success
        } catch (error) {
            console.error("Failed to create visit:", error);
            // Aquí podrías mostrar un mensaje de error en el modal
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-6">Registrar Nueva Visita</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nombre del Visitante"
                        value={visitorName}
                        onChange={e => setVisitorName(e.target.value)}
                        className={`w-full p-2 border rounded ${nameError ? 'border-red-500' : ''}`}
                        required
                    />
                    {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                    <input
                        type="text"
                        placeholder="Empresa del Visitante"
                        value={visitorCompany}
                        onChange={e => setVisitorCompany(e.target.value)}
                        className={`w-full p-2 border rounded ${companyError ? 'border-red-500' : ''}`}
                        required
                    />
                    {companyError && <p className="text-red-500 text-xs mt-1">{companyError}</p>}
                    <textarea placeholder="Motivo de la visita" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded" required />
                    <select value={hostId} onChange={e => setHostId(e.target.value)} className="w-full p-2 border rounded bg-white" required>
                        <option value="" disabled>Seleccionar Anfitrión</option>
                        {hosts.map(host => (
                            <option key={host._id} value={host._id}>{host.firstName} {host.lastName}</option>
                        ))}
                    </select>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha y hora de la visita</label>
                        <DatePicker
                            selected={scheduledDate}
                            onChange={(date: Date | null) => date && setScheduledDate(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="dd/MM/yyyy HH:mm"
                            timeCaption="Hora"
                            className="w-full p-2 border rounded"
                            minDate={new Date()}
                            popperPlacement="right-start"
                            locale="es"
                        />
                    </div>
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

    const updateVisitStatus = async (id: string, status: VisitStatus) => {
        try {
            const updatedVisit = await api.updateVisitStatus(id, status);
            setVisits(visits.map(v => v._id === id ? updatedVisit : v));
        } catch (error) {
            console.error("Failed to update visit status:", error);
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVisits.length > 0 ? (
                        filteredVisits.map(visit => (
                            <VisitCard key={visit._id} visit={visit} onUpdateStatus={updateVisitStatus} />
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
