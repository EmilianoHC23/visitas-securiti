import React, { useState, useEffect } from 'react';
import { Visit } from '../../types';
import { X, Clock, CheckCircle, UserCheck, LogOut, XCircle } from 'lucide-react';
import { FaRegUser } from 'react-icons/fa';
import { TbTimelineEventPlus } from 'react-icons/tb';
import { formatDateTime, formatShortDate, formatTime } from '../../utils/dateUtils';

interface VisitTimelineModalProps {
  visit: Visit | null;
  isOpen: boolean;
  onClose: () => void;
  events?: any[];
}

export const VisitTimelineModal: React.FC<VisitTimelineModalProps> = ({
  visit,
  isOpen,
  onClose,
  events = []
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !visit) return null;

  // Detectar si es una visita de acceso/evento
  const isAccessEvent = visit.visitType === 'access-code';

  // Construir timeline desde los datos de la visita
  const timeline = [];

  // Solo agregar evento de registro para visitas normales (no para accesos/eventos)
  if (!isAccessEvent) {
    timeline.push({
      type: 'registration',
      title: 'Registro de visita',
      description: 'Solicitud creada',
      timestamp: visit.createdAt || visit.scheduledDate,
      icon: Clock,
      color: 'blue'
    });
  }

  // Agregar aprobación o rechazo
  if (visit.status === 'approved' || visit.status === 'checked-in' || visit.status === 'completed') {
    timeline.push({
      type: 'approved',
      title: isAccessEvent ? 'Acceso/Evento creado' : 'Visita aprobada',
      description: isAccessEvent 
        ? `Código de acceso generado por ${visit.host.firstName} ${visit.host.lastName}`
        : `Por ${visit.host.firstName} ${visit.host.lastName}`,
      timestamp: visit.approvedAt || visit.updatedAt || visit.scheduledDate,
      icon: CheckCircle,
      color: 'green'
    });
  } else if (visit.status === 'rejected') {
    timeline.push({
      type: 'rejected',
      title: 'Visita rechazada',
      description: visit.rejectionReason || 'Sin motivo especificado',
      timestamp: visit.rejectedAt || visit.updatedAt || visit.scheduledDate,
      icon: XCircle,
      color: 'red'
    });
  }

  // Agregar check-in
  if (visit.checkInTime) {
    timeline.push({
      type: 'checkin',
      title: 'Entrada registrada',
      description: visit.assignedResource ? `Recurso: ${visit.assignedResource}` : 'Sin recurso asignado',
      timestamp: visit.checkInTime,
      icon: UserCheck,
      color: 'purple'
    });
  }

  // Agregar check-out
  if (visit.checkOutTime) {
    timeline.push({
      type: 'checkout',
      title: 'Salida registrada',
      description: 'Visita completada',
      timestamp: visit.checkOutTime,
      icon: LogOut,
      color: 'gray'
    });
  }

  // Calcular duración de la visita
  const calculateDuration = () => {
    if (!visit.checkInTime || !visit.checkOutTime) return null;
    const diffMs = new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const duration = calculateDuration();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-3 sm:p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${isMobile ? 'max-w-sm max-h-[85vh]' : 'max-w-5xl max-h-[90vh]'} overflow-hidden`}>
        {/* Header */}
        <div className={`bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} flex items-center justify-between`}>
          <h2 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-white flex items-center gap-2`}>
            <TbTimelineEventPlus className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
            Historial de Visita
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 rounded-full p-2 transition-colors"
          >
            <X className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isMobile ? 'h-[calc(85vh-52px)]' : 'lg:flex-row h-[calc(90vh-72px)]'}`}>
          {/* Left Panel - Visitor Info */}
          <div className={`${isMobile ? 'border-b' : 'lg:w-2/5 border-r'} border-gray-200 ${isMobile ? 'p-4' : 'p-6'} overflow-y-auto bg-gray-50`}>
            {/* Foto del visitante */}
            <div className={`flex flex-col items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <div className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center ${isMobile ? 'mb-2' : 'mb-3'} ring-4 ring-cyan-100`}>
                {visit.visitorPhoto ? (
                  <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
                ) : (
                  <FaRegUser className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-cyan-600`} />
                )}
              </div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>{visit.visitorName}</h3>
              {visit.visitorEmail && (
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>{visit.visitorEmail}</p>
              )}
              {visit.visitorCompany && (
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1 font-medium`}>{visit.visitorCompany}</p>
              )}
            </div>

            {/* Detalles de la visita */}
            <div className={isMobile ? "space-y-3" : "space-y-4"}>
              <div className={`bg-white rounded-lg ${isMobile ? 'p-3' : 'p-4'} shadow-sm`}>
                <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 ${isMobile ? 'mb-2' : 'mb-3'}`}>Información de la Visita</h4>
                <div className={isMobile ? "space-y-2" : "space-y-3"}>
                  <div>
                    <p className="text-xs text-gray-500">Anfitrión</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                      {visit.host.firstName} {visit.host.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Motivo</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-900`}>{visit.reason}</p>
                  </div>
                  
                  {visit.destination && (
                    <div>
                      <p className="text-xs text-gray-500">Destino</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-900`}>{visit.destination}</p>
                    </div>
                  )}
                  
                  {visit.assignedResource && (
                    <div>
                      <p className="text-xs text-gray-500">Recurso Asignado</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-900`}>{visit.assignedResource}</p>
                    </div>
                  )}

                  {duration && (
                    <div>
                      <p className="text-xs text-gray-500">Duración de la Visita</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-cyan-600`}>{duration}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado actual */}
              <div className={`bg-white rounded-lg ${isMobile ? 'p-3' : 'p-4'} shadow-sm`}>
                <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2`}>Estado Actual</h4>
                <div className="flex items-center gap-2">
                  {visit.status === 'completed' && (
                    <span className={`inline-flex items-center ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-medium bg-green-100 text-green-800`}>
                      ✓ Completada
                    </span>
                  )}
                  {visit.status === 'rejected' && (
                    <span className={`inline-flex items-center ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-medium bg-red-100 text-red-800`}>
                      ✗ Rechazada
                    </span>
                  )}
                  {visit.status === 'checked-in' && (
                    <span className={`inline-flex items-center ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-medium bg-purple-100 text-purple-800`}>
                      → Dentro
                    </span>
                  )}
                  {visit.status === 'approved' && (
                    <span className={`inline-flex items-center ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-medium bg-cyan-100 text-cyan-800`}>
                      ✓ Aprobada
                    </span>
                  )}
                  {visit.status === 'pending' && (
                    <span className={`inline-flex items-center ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-medium bg-yellow-100 text-yellow-800`}>
                      ⏱ Pendiente
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Timeline */}
          <div className={`${isMobile ? '' : 'lg:w-3/5'} ${isMobile ? 'p-4' : 'p-6'} overflow-y-auto`}>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-800 ${isMobile ? 'mb-4' : 'mb-6'}`}>Línea de Tiempo</h3>
            
            <div className="relative">
              {/* Línea vertical */}
              <div className={`absolute ${isMobile ? 'left-5' : 'left-6'} top-0 bottom-0 w-0.5 bg-gray-200`}></div>
              
              {/* Eventos */}
              <div className={isMobile ? "space-y-4" : "space-y-6"}>
                {timeline.map((event, index) => {
                  const Icon = event.icon;
                  const isLast = index === timeline.length - 1;
                  
                  return (
                    <div key={index} className={`relative flex ${isMobile ? 'gap-3' : 'gap-4'}`}>
                      {/* Icono */}
                      <div className={`relative z-10 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                        event.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        event.color === 'green' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                        event.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                        event.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                        'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        <Icon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                      </div>
                      
                      {/* Contenido */}
                      <div className={`flex-1 ${isMobile ? 'pb-6' : 'pb-8'}`}>
                        <div className={`bg-white rounded-lg border border-gray-200 ${isMobile ? 'p-3' : 'p-4'} shadow-sm hover:shadow-md transition-shadow`}>
                          <div className={`flex items-start justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                            <h4 className={`${isMobile ? 'text-sm' : 'font-semibold'} text-gray-900`}>{event.title}</h4>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatTime(event.timestamp)}
                            </span>
                          </div>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'mb-1' : 'mb-2'}`}>{event.description}</p>
                          <p className="text-xs text-gray-400">
                            {formatShortDate(event.timestamp)} • {formatTime(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
