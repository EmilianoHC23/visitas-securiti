import React, { useState, useEffect } from 'react';
import { Visit, VisitStatus } from '../../types';
import * as api from '../../services/api';

export const ReportsPage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [visitEvents, setVisitEvents] = useState<any[]>([]);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      // Obtener todas las visitas y filtrar completadas y rechazadas con razón
      const response = await api.getVisits({ limit: 100 });
      const allVisits = response.visits || [];
      // Mostrar visitas completadas y rechazadas que tengan razón asignada
      const filteredVisits = allVisits.filter(v => 
        v.status === VisitStatus.COMPLETED || 
        (v.status === VisitStatus.REJECTED && v.rejectionReason)
      );
      setVisits(filteredVisits);
    } catch (e) {
      setVisits([]);
    }
    setLoading(false);
  };

  const handleVisitClick = async (visit: Visit) => {
    setSelectedVisit(visit);
    try {
      const details = await api.getVisitDetails(visit._id);
      setVisitEvents(details.events || []);
    } catch (e) {
      setVisitEvents([]);
    }
  };

  const handleDownloadReport = (visit: Visit) => {
    // Implementar descarga de reporte (PDF/Excel)
    alert('Descarga de reporte no implementada');
  };

  return (
    <div className="reports-page">
      <h2>Visitas Recientes</h2>
      {loading ? <div>Cargando...</div> : (
        <table className="visits-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Visitante</th>
              <th>Empresa</th>
              <th>Anfitrión</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estatus</th>
              <th>Razón Rechazo</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(v => (
              <tr key={v._id} onClick={() => handleVisitClick(v)} style={{ cursor: 'pointer' }}>
                <td><img src={v.visitorPhoto || '/default-avatar.png'} alt="Foto" width={40} /></td>
                <td>{v.visitorName}</td>
                <td>{v.visitorCompany}</td>
                <td>{v.host?.firstName} {v.host?.lastName}</td>
                <td>{v.checkInTime ? new Date(v.checkInTime).toLocaleString() : '-'}</td>
                <td>{v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : '-'}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: v.status === VisitStatus.COMPLETED ? '#10b981' : '#ef4444',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {v.status === VisitStatus.COMPLETED ? 'Completada' : 'Rechazada'}
                  </span>
                </td>
                <td>{v.rejectionReason || '-'}</td>
                <td>{v.visitorEmail}</td>
                <td><button onClick={e => { e.stopPropagation(); handleDownloadReport(v); }}>Descargar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedVisit && (
        <div className="visit-details-modal">
          <h3>Detalles de la visita</h3>
          <p><strong>Visitante:</strong> {selectedVisit.visitorName}</p>
          <p><strong>Empresa:</strong> {selectedVisit.visitorCompany}</p>
          <p><strong>Anfitrión:</strong> {selectedVisit.host?.firstName} {selectedVisit.host?.lastName}</p>
          <p><strong>Entrada:</strong> {selectedVisit.checkInTime ? new Date(selectedVisit.checkInTime).toLocaleString() : '-'}</p>
          <p><strong>Salida:</strong> {selectedVisit.checkOutTime ? new Date(selectedVisit.checkOutTime).toLocaleString() : '-'}</p>
          <p><strong>Estatus:</strong> {selectedVisit.status}</p>
          {selectedVisit.rejectionReason && (
            <p><strong>Razón de rechazo:</strong> {selectedVisit.rejectionReason}</p>
          )}
          {selectedVisit.assignedResource && (
            <p><strong>Recurso asignado:</strong> {selectedVisit.assignedResource}</p>
          )}
          <p><strong>Correo:</strong> {selectedVisit.visitorEmail}</p>
          <h4>Línea de tiempo</h4>
          <ul>
            {visitEvents.map(ev => (
              <li key={ev._id}>{ev.type} - {new Date(ev.createdAt).toLocaleString()}</li>
            ))}
          </ul>
          <button onClick={() => setSelectedVisit(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
};
