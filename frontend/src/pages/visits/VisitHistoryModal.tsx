import React, { useState, useEffect } from 'react';
import { Visit } from '../../types';
import * as api from '../../services/api';

interface Props {
  visitId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VisitEvent {
  _id: string;
  type: 'check-in' | 'check-out' | 'check-out-qr' | string;
  photos?: string[];
  createdAt: string;
}

export const VisitHistoryModal: React.FC<Props> = ({ visitId, isOpen, onClose }) => {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [events, setEvents] = useState<VisitEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && visitId) {
      fetchVisitDetails();
    }
  }, [isOpen, visitId]);

  const fetchVisitDetails = async () => {
    setLoading(true);
    try {
      const { visit, events } = await api.getVisitDetails(visitId);
      setVisit(visit);
      setEvents(events || []);
    } catch (error) {
      console.error('Error fetching visit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (checkIn: string, checkOut: string) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Historial de Visita</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">Cargando detalles...</div>
          ) : visit ? (
            <div className="space-y-6">
              {/* Visit Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Detalles de la Visita</h3>
                <div className="grid grid-cols-2 gap-4 text-sm items-center">
                  <div className="flex items-center gap-2">
                    {visit.visitorPhoto ? (
                      <img src={visit.visitorPhoto} alt="Foto visitante" className="w-10 h-10 rounded-full object-cover border-2 border-gray-300" />
                    ) : (
                      <span className="flex w-10 h-10 rounded-full bg-gray-200 items-center justify-center text-gray-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    <span><strong>Visitante:</strong> {visit.visitorName}</span>
                  </div>
                  <div><strong>Empresa:</strong> {visit.visitorCompany || 'No especificada'}</div>
                  <div className="flex items-center gap-2">
                    {visit.host.profileImage ? (
                      <img src={visit.host.profileImage} alt="Foto anfitrión" className="w-10 h-10 rounded-full object-cover border-2 border-blue-300" />
                    ) : (
                      <span className="flex w-10 h-10 rounded-full bg-blue-100 items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    <span><strong>Anfitrión:</strong> {visit.host.firstName} {visit.host.lastName}</span>
                  </div>
                  <div><strong>Motivo:</strong> {visit.reason}</div>
                  <div><strong>Estado:</strong> {visit.status}</div>
                  <div><strong>Fecha:</strong> {new Date(visit.scheduledDate).toLocaleString()}</div>
                </div>

                {/* Asignar recurso si la visita está aprobada */}
                {visit.status === 'approved' && (
                  <AssignResourceSection visit={visit} />
                )}

                {visit.checkInTime && visit.checkOutTime && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <div className="text-sm font-medium text-green-800">
                      Duración total: {formatDuration(visit.checkInTime, visit.checkOutTime)}
                    </div>
                  </div>
                )}
              </div>

              {/* Events Timeline */}
              <div>
                <h3 className="font-medium mb-4">Cronología de Eventos</h3>
                {events.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">No hay eventos registrados</div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event._id} className="flex items-start space-x-4">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          event.type === 'check-in' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {event.type === 'check-in' ? 'Entrada' : 'Salida'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(event.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          {event.photos && event.photos.length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm text-gray-600 mb-2">Fotos adjuntas:</div>
                              <div className="grid grid-cols-4 gap-2">
                                {event.photos.map((photo, idx) => (
                                  <img
                                    key={idx}
                                    src={photo}
                                    alt={`foto-${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(photo, '_blank')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No se encontró la visita</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para asignar recurso (tarjeta de acceso) al visitante aprobado
function AssignResourceSection({ visit }: { visit: Visit }) {
  const [accesses, setAccesses] = React.useState<any[]>([]);
  const [selectedAccessId, setSelectedAccessId] = React.useState<string>(visit.accessId || '');
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.getAccesses().then(setAccesses).catch(() => setAccesses([]));
  }, []);

  const handleAssign = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateVisitAccess(visit._id, selectedAccessId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError('Error al asignar recurso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-md">
      <div className="font-medium mb-2 text-blue-800">Asignar recurso (tarjeta de acceso)</div>
      <div className="flex gap-2 items-center">
        <select
          className="p-2 border rounded"
          value={selectedAccessId}
          onChange={e => setSelectedAccessId(e.target.value)}
        >
          <option value="">Selecciona tarjeta/acceso</option>
          {accesses.map(acc => (
            <option key={acc._id} value={acc._id}>{acc.title}</option>
          ))}
        </select>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={handleAssign}
          disabled={!selectedAccessId || saving}
        >
          {saving ? 'Guardando...' : 'Asignar'}
        </button>
        {success && <span className="text-green-600 ml-2">¡Asignado!</span>}
        {error && <span className="text-red-600 ml-2">{error}</span>}
      </div>
    </div>
  );
}