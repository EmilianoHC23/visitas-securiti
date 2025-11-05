import React, { useState, useEffect } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { BarChart3, Download, Search, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Visit, VisitStatus } from '../../types';
import * as api from '../../services/api';
import { formatDateTime, formatLongDate } from '../../utils/dateUtils';
import { VisitTimelineModal } from './VisitTimelineModal';
import { DatePicker } from '../../components/common/DatePicker';
import { jsPDF } from 'jspdf';

export default function ReportsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [visitEvents, setVisitEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  // Alert modal state (replace native alert)
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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

  const handleDownloadReport = async () => {
    if (filteredVisits.length === 0) {
      setAlertMessage('No hay visitas para generar el reporte');
      setAlertOpen(true);
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fondo
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header con gradiente
      pdf.setFillColor(31, 41, 55);
      pdf.rect(0, 0, pageWidth, 45, 'F');

      // Líneas decorativas
      pdf.setDrawColor(55, 65, 81);
      pdf.setLineWidth(0.5);
      for (let i = 0; i < 20; i++) {
        pdf.line(i * 15, 0, i * 15 + 30, 45);
      }

      // Logo (si existe)
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/logo.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = () => resolve(null); // Continuar sin logo si falla
        });
        
        const logoSize = 25;
        pdf.setFillColor(255, 255, 255);
        pdf.circle(25, 22.5, 15, 'F');
        pdf.addImage(logoImg, 'PNG', 12.5, 10, logoSize, logoSize);
      } catch (e) {
        console.log('Logo no disponible');
      }

      // Título
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Reporte de Visitas', 50, 20);

      // Subtítulo
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Fecha: ${formatLongDate(selectedDate)}`, 50, 30);

      // Estadísticas
      const statsY = 55;
      const completadas = filteredVisits.filter(v => v.status === VisitStatus.COMPLETED).length;
      const rechazadas = filteredVisits.filter(v => v.status === VisitStatus.REJECTED).length;

      // Card de estadísticas
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, statsY, pageWidth - 20, 25, 3, 3, 'F');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text('RESUMEN DEL DÍA', 15, statsY + 8);

      // Total
      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99);
      pdf.text('Total:', 15, statsY + 16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55);
      pdf.text(filteredVisits.length.toString(), 15, statsY + 21);

      // Completadas
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99);
      pdf.text('Completadas:', 50, statsY + 16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(34, 197, 94);
      pdf.text(completadas.toString(), 50, statsY + 21);

      // Rechazadas
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99);
      pdf.text('Rechazadas:', 85, statsY + 16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(239, 68, 68);
      pdf.text(rechazadas.toString(), 85, statsY + 21);

      // Tabla de visitas
      const tableY = statsY + 35;
      let currentY = tableY;

      // Headers de tabla
      pdf.setFillColor(249, 250, 251);
      pdf.rect(10, currentY, pageWidth - 20, 10, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(75, 85, 99);
      
      pdf.text('VISITANTE', 15, currentY + 7);
      pdf.text('EMPRESA', 70, currentY + 7);
      pdf.text('ANFITRIÓN', 115, currentY + 7);
      pdf.text('ENTRADA', 160, currentY + 7);
      pdf.text('SALIDA', 195, currentY + 7);
      pdf.text('ESTADO', 230, currentY + 7);

      currentY += 10;

      // Datos de visitas
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      filteredVisits.forEach((visit, index) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
          
          // Re-dibujar headers
          pdf.setFillColor(249, 250, 251);
          pdf.rect(10, currentY, pageWidth - 20, 10, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(75, 85, 99);
          pdf.text('VISITANTE', 15, currentY + 7);
          pdf.text('EMPRESA', 70, currentY + 7);
          pdf.text('ANFITRIÓN', 115, currentY + 7);
          pdf.text('ENTRADA', 160, currentY + 7);
          pdf.text('SALIDA', 195, currentY + 7);
          pdf.text('ESTADO', 230, currentY + 7);
          currentY += 10;
          pdf.setFont('helvetica', 'normal');
        }

        // Fila alternada
        if (index % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(10, currentY, pageWidth - 20, 8, 'F');
        }

        pdf.setTextColor(31, 41, 55);
        
        // Visitante
        const visitorName = visit.visitorName.length > 20 
          ? visit.visitorName.substring(0, 20) + '...' 
          : visit.visitorName;
        pdf.text(visitorName, 15, currentY + 5);

        // Empresa
        const company = (visit.visitorCompany || '-').length > 18
          ? (visit.visitorCompany || '-').substring(0, 18) + '...'
          : visit.visitorCompany || '-';
        pdf.text(company, 70, currentY + 5);

        // Anfitrión
        const hostName = `${visit.host?.firstName || ''} ${visit.host?.lastName || ''}`.trim();
        const shortHost = hostName.length > 18 ? hostName.substring(0, 18) + '...' : hostName;
        pdf.text(shortHost, 115, currentY + 5);

        // Entrada
        const checkIn = visit.checkInTime 
          ? formatDateTime(visit.checkInTime as any).split(',')[1]?.trim() || '-'
          : '-';
        pdf.text(checkIn, 160, currentY + 5);

        // Salida
        const checkOut = visit.checkOutTime
          ? formatDateTime(visit.checkOutTime as any).split(',')[1]?.trim() || '-'
          : '-';
        pdf.text(checkOut, 195, currentY + 5);

        // Estado
        if (visit.status === VisitStatus.COMPLETED) {
          pdf.setTextColor(34, 197, 94);
          pdf.text('Completada', 230, currentY + 5);
        } else {
          pdf.setTextColor(239, 68, 68);
          pdf.text('Rechazada', 230, currentY + 5);
        }

        pdf.setTextColor(31, 41, 55);
        currentY += 8;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(156, 163, 175);
      const footerText = `Generado el ${new Date().toLocaleDateString('es-MX')} - Sistema Visitas SecuriTI`;
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);

      // Guardar PDF
      const fileName = `Reporte-Visitas-${selectedDate.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      setAlertMessage('Error al generar el PDF. Por favor, intenta de nuevo.');
      setAlertOpen(true);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 md:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Reportes de Visitas</h1>
              <p className="text-gray-600 text-lg capitalize">{formatDateDisplay(selectedDate)}</p>
            </div>
          </div>
        </div>

        {/* Filters Card - Moderno */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search */}
            <div className="flex-1 lg:max-w-md relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por visitante, empresa, anfitrión..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Date Picker */}
            <div className="flex-shrink-0 w-full lg:w-52">
              <DatePicker
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(value) => setSelectedDate(new Date(value))}
                showClearButton={false}
              />
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadReport}
              className="px-6 py-3.5 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl hover:from-gray-800 hover:to-gray-600 flex items-center justify-center gap-3 text-sm font-bold transition-all shadow-lg hover:shadow-xl whitespace-nowrap flex-shrink-0"
            >
              <Download className="w-5 h-5" />
              Descargar PDF
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Visitas</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredVisits.length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {filteredVisits.filter(v => v.status === VisitStatus.COMPLETED).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-xl border-2 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Rechazadas</p>
                  <p className="text-3xl font-bold text-red-600">
                    {filteredVisits.filter(v => v.status === VisitStatus.REJECTED).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-900"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Cargando visitas...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay visitas registradas</h3>
            <p className="text-gray-500 text-base">No se encontraron visitas para la fecha seleccionada</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Foto</th>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Visitante</th>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Empresa</th>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Anfitrión</th>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Entrada</th>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Salida</th>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Estatus</th>
                    <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs">Correo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVisits.map(v => (
                    <tr 
                      key={v._id} 
                      onClick={() => handleVisitClick(v)} 
                      className="hover:bg-gray-50 cursor-pointer transition-all duration-200"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                          {v.visitorPhoto ? (
                            <img src={v.visitorPhoto} alt={v.visitorName} className="w-full h-full object-cover" />
                          ) : (
                            <FaRegUser className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{v.visitorName}</div>
                      </td>
                      <td className="px-4 py-4 max-w-[8rem] min-w-0">
                        <div className="text-sm text-gray-600 truncate">{v.visitorCompany || '-'}</div>
                      </td>
                      <td className="px-4 py-4 max-w-[9rem] min-w-0">
                        <div className="text-sm text-gray-700 truncate font-medium">{v.host?.firstName} {v.host?.lastName}</div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {(() => {
                          const [date, time] = splitDateTime(v.checkInTime);
                          return (
                            <div>
                              <div className="text-sm font-medium text-gray-800">{date}</div>
                              <div className="text-xs text-gray-500 mt-1">{time !== '-' ? time : '-'}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {(() => {
                          const [date, time] = splitDateTime(v.checkOutTime);
                          return (
                            <div>
                              <div className="text-sm font-medium text-gray-800">{date}</div>
                              <div className="text-xs text-gray-500 mt-1">{time !== '-' ? time : '-'}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                          v.status === VisitStatus.COMPLETED 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {v.status === VisitStatus.COMPLETED ? 'Completada' : 'Rechazada'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
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

        {/* Simple alert modal (styled like ConfirmDialog header) */}
        {alertOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200">
              <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-700 flex items-start justify-between text-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Aviso</h3>
                  </div>
                </div>
                <button 
                  onClick={() => { setAlertOpen(false); setAlertMessage(''); }} 
                  className="text-white/80 hover:text-white p-2 rounded-lg transition-colors hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 text-center">
                  <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{alertMessage}</p>
                  <button 
                    onClick={() => { setAlertOpen(false); setAlertMessage(''); }} 
                    className="px-6 py-3 min-w-[120px] text-white bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl shadow-lg hover:from-gray-800 hover:to-gray-600 font-bold transition-all"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
