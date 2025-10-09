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
  type: 'check-in' | 'check-out';
  photos: string[];
  timestamp: string;
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
      // Note: We'd need a new API endpoint to get visit events
      // For now, we'll simulate this
      const visitData = await api.getVisits();
      const foundVisit = visitData.find(v => v._id === visitId);
      setVisit(foundVisit || null);
      
      // Simulate events - in real app, this would be a separate API call
      const mockEvents: VisitEvent[] = [];
      if (foundVisit?.checkInTime) {
        mockEvents.push({
          _id: '1',
          type: 'check-in',
          photos: [],
          timestamp: foundVisit.checkInTime
        });
      }
      if (foundVisit?.checkOutTime) {
        mockEvents.push({
          _id: '2',
          type: 'check-out',
          photos: [], // Would contain actual photo URLs
          timestamp: foundVisit.checkOutTime
        });
      }
      setEvents(mockEvents);
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Visitante:</strong> {visit.visitorName}</div>
                  <div><strong>Empresa:</strong> {visit.visitorCompany || 'No especificada'}</div>
                  <div><strong>Anfitrión:</strong> {visit.host.firstName} {visit.host.lastName}</div>
                  <div><strong>Motivo:</strong> {visit.reason}</div>
                  <div><strong>Estado:</strong> {visit.status}</div>
                  <div><strong>Fecha:</strong> {new Date(visit.scheduledDate).toLocaleString()}</div>
                </div>
                
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
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          {event.photos.length > 0 && (
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