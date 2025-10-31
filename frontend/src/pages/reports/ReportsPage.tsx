import React, { useState, useEffect } from 'react';
import { Visit, VisitStatus } from '../../types';
import * as api from '../../services/api';
import { formatDateTime, formatLongDate } from '../../utils/dateUtils';
import { VisitTimelineModal } from './VisitTimelineModal';

export default function ReportsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [visitEvents, setVisitEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  useEffect(() => {
    loadVisits();
  }, []);

  // NOTE: removed global overflow-x hack. Instead we make the
  // filters and table layout responsive and use internal
  // overflow-x on the table card so the page does not gain
  // a horizontal scrollbar when sidebar toggles.

  useEffect(() => {
    filterVisitsByDate();
  }, [visits, selectedDate, searchTerm]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      // Obtener todas las visitas y filtrar completadas y rechazadas con razón
      const response = await api.getVisits({ limit: 500 });
      const allVisits = response.visits || [];
      // Mostrar visitas completadas y rechazadas que tengan razón asignada
      const filtered = allVisits.filter(v => 
        v.status === VisitStatus.COMPLETED || 
        (v.status === VisitStatus.REJECTED && v.rejectionReason)
      );
      setVisits(filtered);
    } catch (e) {
      setVisits([]);
    }
    setLoading(false);
  };

  const filterVisitsByDate = () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let filtered = visits.filter(v => {
      const visitDate = new Date(v.checkOutTime || v.checkInTime || v.scheduledDate);
      return visitDate >= startOfDay && visitDate <= endOfDay;
    });

    // Aplicar búsqueda
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.visitorCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.visitorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.host?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.host?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVisits(filtered);
  };

  const handleVisitClick = async (visit: Visit) => {
    setSelectedVisit(visit);
    try {
      const details = await api.getVisitDetails(visit._id);
      setVisitEvents(details.events || []);
    } catch (e) {
      setVisitEvents([]);
    }
    setShowTimelineModal(true);
  };

  const handleDownloadReport = () => {
    // Implementar descarga de reporte (CSV/Excel)
    alert('Descarga de reporte no implementada');
  };

  const formatDateDisplay = (date: Date) => {
    return formatLongDate(date);
  };

  const splitDateTime = (dateStr?: string) => {
    if (!dateStr) return ['-', '-'];
    const formatted = formatDateTime(dateStr as any);
    const parts = formatted.split(',');
    return [parts[0]?.trim() || '-', parts[1]?.trim() || '-'];
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Visitas Recientes</h1>
          <p className="text-gray-600 capitalize">{formatDateDisplay(selectedDate)}</p>
        </div>

        {/* Filters Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 min-w-0">
          <div className="flex flex-col md:flex-row gap-4 items-center min-w-0">
            {/* Search */}
            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                placeholder="Buscar visitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Date Picker */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10">
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value));
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:from-cyan-500 hover:to-cyan-600 flex items-center gap-2 text-sm font-medium transition-all shadow-sm whitespace-nowrap flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar Reporte
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="text-lg font-bold text-gray-900">{filteredVisits.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Completadas:</span>
              <span className="text-lg font-bold text-green-600">
                {filteredVisits.filter(v => v.status === VisitStatus.COMPLETED).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rechazadas:</span>
              <span className="text-lg font-bold text-red-600">
                {filteredVisits.filter(v => v.status === VisitStatus.REJECTED).length}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-cyan-500"></div>
            <p className="mt-4 text-gray-600">Cargando visitas...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay visitas registradas</h3>
            <p className="text-gray-500 text-sm">No se encontraron visitas para la fecha seleccionada</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
            <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Foto</th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Visitante</th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Empresa</th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Anfitrión</th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Entrada</th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Salida</th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Estatus</th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Correo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVisits.map(v => (
                    <tr 
                      key={v._id} 
                      onClick={() => handleVisitClick(v)} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          {v.visitorPhoto ? (
                            <img src={v.visitorPhoto} alt={v.visitorName} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{v.visitorName}</div>
                      </td>
                      <td className="px-3 py-3 max-w-[8rem] min-w-0">
                        <div className="text-sm text-gray-600 truncate">{v.visitorCompany || '-'}</div>
                      </td>
                      <td className="px-3 py-3 max-w-[9rem] min-w-0">
                        <div className="text-sm text-gray-900 truncate">{v.host?.firstName} {v.host?.lastName}</div>
                      </td>
                        <td className="px-4 py-3 align-top">
                          {(() => {
                            const [date, time] = splitDateTime(v.checkInTime);
                            return (
                              <div>
                                <div className="text-sm text-gray-700">{date}</div>
                                <div className="text-xs text-gray-500 mt-1">{time !== '-' ? time : '-'}</div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {(() => {
                            const [date, time] = splitDateTime(v.checkOutTime);
                            return (
                              <div>
                                <div className="text-sm text-gray-700">{date}</div>
                                <div className="text-xs text-gray-500 mt-1">{time !== '-' ? time : '-'}</div>
                              </div>
                            );
                          })()}
                        </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          v.status === VisitStatus.COMPLETED 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {v.status === VisitStatus.COMPLETED ? 'Completada' : 'Rechazada'}
                        </span>
                      </td>
                        <td className="px-4 py-3">
                              <div className="text-sm text-gray-600 max-w-[12rem] truncate overflow-hidden whitespace-nowrap min-w-0">
                                {v.visitorEmail || '-'}
                              </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
                </table>
            </div>
            
          </div>
        )}

        {/* Timeline Modal */}
        <VisitTimelineModal
          visit={selectedVisit}
          isOpen={showTimelineModal}
          onClose={() => {
            setShowTimelineModal(false);
            setSelectedVisit(null);
          }}
          events={visitEvents}
        />
      </div>
    </div>
  );
};
