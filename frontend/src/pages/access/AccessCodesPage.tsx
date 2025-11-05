import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Upload,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  MinusCircle,
  UserCircle,
  Bell,
  Link as LinkIcon,
  Copy,
  Download
} from 'lucide-react';
import { IoQrCodeOutline } from 'react-icons/io5';
import { getAccesses, createAccess, updateAccess, cancelAccess, getUsers, checkBlacklist } from '../../services/api';
import { Access, InvitedUser } from '../../types';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { DatePicker, TimePicker } from '../../components/common/DatePicker';
import { useAuth } from '../../contexts/AuthContext';

export const AccessCodesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'finalized'>('active');
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [filteredAccesses, setFilteredAccesses] = useState<Access[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<Access | null>(null);

  // Toast / Alert flotante (global dentro de esta página)
  const [toast, setToast] = useState<{ show: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      const message = detail.message || '';
      const severity = detail.severity || 'success';
      setToast({ show: true, message, severity });
      window.setTimeout(() => setToast((s) => ({ ...s, show: false })), 3500);
    };

    window.addEventListener('app-toast', handler as EventListener);
    return () => window.removeEventListener('app-toast', handler as EventListener);
  }, []);

  // Cargar accesos
  useEffect(() => {
    loadAccesses();
  }, []);

  // Filtrar por tab y búsqueda
  useEffect(() => {
    let filtered = accesses;

    // Filtrar por estado
    if (activeTab === 'active') {
      filtered = filtered.filter(a => a.status === 'active');
    } else {
      filtered = filtered.filter(a => ['finalized', 'cancelled'].includes(a.status));
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.eventName.toLowerCase().includes(term) ||
        a.location?.toLowerCase().includes(term) ||
        a.type.toLowerCase().includes(term)
      );
    }

    // Filtrar por día seleccionado (intersección con el rango del acceso)
    if (selectedDate) {
      const dayStart = new Date(`${selectedDate}T00:00:00`);
      const dayEnd = new Date(`${selectedDate}T23:59:59.999`);
      filtered = filtered.filter(a => {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        return start <= dayEnd && end >= dayStart;
      });
    }

    setFilteredAccesses(filtered);
  }, [accesses, activeTab, searchTerm, selectedDate]);

  const loadAccesses = async () => {
    setLoading(true);
    try {
      const data = await getAccesses();
      setAccesses(data);
    } catch (error) {
      console.error('Error loading accesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedAccess(null);
    setShowCreateModal(true);
  };

  const handleEdit = (access: Access) => {
    setSelectedAccess(access);
    setShowEditModal(true);
  };

  const handleViewDetails = (access: Access) => {
    setSelectedAccess(access);
    setShowDetailsModal(true);
  };

  const handleDelete = async (access: Access) => {
    if (!confirm(`¿Estás seguro de cancelar el acceso "${access.eventName}"?`)) return;
    
    try {
      await cancelAccess(access._id);
      await loadAccesses();
    } catch (error) {
      console.error('Error canceling access:', error);
      alert('Error al cancelar el acceso');
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      reunion: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
      proyecto: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300',
      evento: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300',
      visita: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
      otro: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
    };
    return colors[type as keyof typeof colors] || colors.otro;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      reunion: 'Reunión',
      proyecto: 'Proyecto',
      evento: 'Evento',
      visita: 'Visita',
      otro: 'Otro'
    };
    return labels[type as keyof typeof labels] || 'Otro';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isMobile ? 'p-3' : 'p-4 sm:p-6 lg:p-8'}`}>
      {/* Header mejorado */}
      <div className={isMobile ? 'mb-4' : 'mb-8'}>
        <div className={`flex items-center gap-3 ${isMobile ? 'mb-2' : 'gap-4 mb-3'}`}>
          <div className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
            <IoQrCodeOutline className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-white`} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl sm:text-4xl'} font-bold text-gray-900`}>
              {isMobile ? 'Accesos' : 'Accesos / Eventos'}
            </h1>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm sm:text-base'} mt-1`}>
              {isMobile ? 'Gestiona los accesos creados' : 'Gestiona, filtra y consulta los accesos creados en tu organización'}
            </p>
          </div>
        </div>
      </div>

      {/* Toast flotante */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-6 right-6 z-50"
          >
            <div className={`max-w-sm w-full px-5 py-4 rounded-xl shadow-2xl text-sm font-medium border-2 ${
              toast.severity === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : toast.severity === 'error' 
                ? 'bg-red-50 text-red-900 border-red-200' 
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}>
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs mejorados */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
        <div className="border-b border-gray-100 bg-gray-50/50">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 ${isMobile ? 'px-3 py-3 text-sm' : 'px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base'} font-semibold border-b-3 transition-all ${
                activeTab === 'active'
                  ? 'border-gray-900 text-gray-900 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                <span>Activos</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('finalized')}
              className={`flex-1 ${isMobile ? 'px-3 py-3 text-sm' : 'px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base'} font-semibold border-b-3 transition-all ${
                activeTab === 'finalized'
                  ? 'border-gray-900 text-gray-900 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                <span>Finalizados</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Toolbar con búsqueda y calendario */}
        <div className={`${isMobile ? 'p-3' : 'p-6'} space-y-4`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <input
                type="text"
                placeholder={isMobile ? "Buscar..." : "Buscar por nombre, ubicación o tipo..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-9 pr-3 py-2 text-sm' : 'pl-10 pr-4 py-3'} border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white`}
              />
            </div>
            <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                showClearButton={true}
                placeholder={isMobile ? "Fecha" : "Seleccionar fecha"}
              />
              <button
                onClick={handleCreate}
                className={`flex items-center ${isMobile ? 'px-3 py-2 text-sm' : 'px-5 py-3'} bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all font-semibold shadow-lg hover:shadow-xl whitespace-nowrap`}
              >
                <Plus className={`${isMobile ? 'w-4 h-4 mr-1' : 'w-5 h-5 mr-2'}`} />
                {isMobile ? 'Crear' : 'Crear Acceso'}
              </button>
            </div>
          </div>

          {/* Tabla de accesos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-3 border-gray-900"></div>
              <p className="mt-3 text-gray-600 font-medium">Cargando accesos...</p>
            </div>
          ) : filteredAccesses.length === 0 ? (
            <div className={`text-center ${isMobile ? 'py-12' : 'py-16'} bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 ${isMobile ? 'mx-0 mb-0' : 'mx-6 mb-6'}`}>
              <Calendar className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-400 mx-auto mb-4`} />
              <p className={`text-gray-700 font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                No hay accesos {activeTab === 'active' ? 'activos' : 'finalizados'}
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>
                Los accesos que crees aparecerán aquí
              </p>
            </div>
          ) : isMobile ? (
            // Vista móvil: Cards
            <div className="space-y-3">
              {filteredAccesses.map((access) => (
                <div
                  key={access._id}
                  onClick={() => handleViewDetails(access)}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {access.eventName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${getTypeColor(access.type)}`}>
                          {getTypeLabel(access.type)}
                        </span>
                        {activeTab === 'finalized' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                            access.status === 'finalized' 
                              ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300' 
                              : 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300'
                          }`}>
                            {access.status === 'finalized' ? 'Finalizado' : 'Cancelado'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        {new Date(access.startDate).toLocaleDateString('es-MX', { 
                          day: '2-digit', 
                          month: 'short'
                        })} {new Date(access.startDate).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span>
                        {new Date(access.endDate).toLocaleDateString('es-MX', { 
                          day: '2-digit', 
                          month: 'short'
                        })} {new Date(access.endDate).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{access.invitedUsers.length} invitado{access.invitedUsers.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(access);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </button>
                    {access.settings?.enablePreRegistration && access.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = `${window.location.origin}/public/register/${access._id}`;
                          navigator.clipboard.writeText(link)
                            .then(() => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Enlace copiado', severity: 'success' } })))
                            .catch(() => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al copiar', severity: 'error' } })));
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 rounded-lg hover:from-emerald-200 hover:to-emerald-300 transition-all text-xs font-medium"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </button>
                    )}
                    {access.status === 'active' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(access);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all text-xs font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(access);
                          }}
                          className="flex items-center justify-center p-2 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-lg hover:from-red-200 hover:to-red-300 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Vista desktop: Tabla
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Hora Inicio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Hora Fin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Razón
                  </th>
                  {activeTab === 'finalized' && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Estado
                    </th>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAccesses.map((access) => (
                  <tr key={access._id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {access.eventName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {access.invitedUsers.length} invitado{access.invitedUsers.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(access.startDate).toLocaleDateString('es-MX', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(access.startDate).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(access.endDate).toLocaleDateString('es-MX', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(access.endDate).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getTypeColor(access.type)}`}>
                        {getTypeLabel(access.type)}
                      </span>
                    </td>
                    {activeTab === 'finalized' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border ${
                          access.status === 'finalized' 
                            ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300' 
                            : 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300'
                        }`}>
                          {access.status === 'finalized' ? 'Finalizado' : 'Cancelado'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(access)}
                          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all text-sm font-medium shadow-sm"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {access.settings?.enablePreRegistration && access.status === 'active' && (
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/public/register/${access._id}`;
                              navigator.clipboard.writeText(link)
                                .then(() => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Enlace de pre-registro copiado al portapapeles', severity: 'success' } })))
                                .catch(() => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al copiar enlace', severity: 'error' } })));
                            }}
                            className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 rounded-lg hover:from-emerald-200 hover:to-emerald-300 transition-all text-sm font-medium shadow-sm"
                            title="Copiar enlace de pre-registro"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {access.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleEdit(access)}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all text-sm font-medium shadow-sm"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(access)}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-lg hover:from-red-200 hover:to-red-300 transition-all text-sm font-medium shadow-sm"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}
    </div>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CreateAccessModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadAccesses();
            setShowCreateModal(false);
          }}
        />
      )}

      {showEditModal && selectedAccess && (
        <EditAccessModal
          access={selectedAccess}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadAccesses();
            setShowEditModal(false);
          }}
        />
      )}

      {showDetailsModal && selectedAccess && (
        <DetailsModal
          access={selectedAccess}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

// ==================== CREATE ACCESS MODAL ====================
interface CreateAccessModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Reusable small animated dropdown for Razón del acceso
const ReasonDropdown: React.FC<{
  value: 'reunion' | 'proyecto' | 'evento' | 'visita' | 'otro';
  onChange: (v: 'reunion' | 'proyecto' | 'evento' | 'visita' | 'otro') => void;
}> = ({ value, onChange }) => {
  const options = [
    { value: 'reunion', label: 'Reunión' },
    { value: 'proyecto', label: 'Proyecto' },
    { value: 'evento', label: 'Evento' },
    { value: 'visita', label: 'Visita' },
    { value: 'otro', label: 'Otro' }
  ] as const;

  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const wrapperVariants: Variants = {
    open: { opacity: 1, scaleY: 1, transition: { when: 'beforeChildren', staggerChildren: 0.03 } },
    closed: { opacity: 0, scaleY: 0, transition: { when: 'afterChildren' } }
  };

  const itemVariants: Variants = {
    open: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
    closed: { opacity: 0, y: -6 }
  };

  const chevronVariants: Variants = {
    open: { rotate: 180 },
    closed: { rotate: 0 }
  };

  const selectedLabel = options.find((o) => o.value === value)?.label || 'Seleccionar';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white flex items-center justify-between focus:outline-none"
      >
        <span className="text-gray-700">{selectedLabel}</span>
        <motion.span
          className="ml-3 text-gray-500"
          variants={chevronVariants}
          animate={open ? 'open' : 'closed'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial="closed"
            animate="open"
            exit="closed"
            variants={wrapperVariants}
            className="absolute left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg origin-top z-20 overflow-hidden"
            style={{ transformOrigin: 'top' }}
          >
            {options.map((opt) => (
              <motion.li key={opt.value} variants={itemVariants}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value as any);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700"
                >
                  {opt.label}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

// Animated Host selector used in advanced options
const HostDropdown: React.FC<{
  hosts: Array<{ id: string; name: string; email: string; photo?: string; firstName?: string; lastName?: string }>;
  value: string;
  onChange: (id: string) => void;
}> = ({ hosts, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const wrapperVariants: Variants = {
    open: { opacity: 1, scaleY: 1, transition: { when: 'beforeChildren', staggerChildren: 0.02 } },
    closed: { opacity: 0, scaleY: 0, transition: { when: 'afterChildren' } }
  };

  const itemVariants: Variants = {
    open: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
    closed: { opacity: 0, y: -6 }
  };

  const chevronVariants: Variants = {
    open: { rotate: 180 },
    closed: { rotate: 0 }
  };

  const selected = hosts.find((h) => h.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white flex items-center justify-between focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {selected?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.photo} alt={selected?.name || 'host'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {(() => {
                  const first = selected?.firstName || selected?.name?.split(' ')[0] || '';
                  const last = selected?.lastName || (selected?.name?.split(' ')[1] || '');
                  const initials = `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
                  return initials || 'H';
                })()}
              </span>
            )}
          </div>

          <div className="text-left">
            <div className="text-sm font-medium text-gray-700">{selected ? selected.name : 'Seleccionar anfitrión'}</div>
            <div className="text-xs text-gray-400">{selected ? selected.email : ''}</div>
          </div>
        </div>

        <motion.span
          className="ml-3 text-gray-500"
          variants={chevronVariants}
          animate={open ? 'open' : 'closed'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial="closed"
            animate="open"
            exit="closed"
            variants={wrapperVariants}
            className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-white border-2 border-gray-200 rounded-lg shadow-lg origin-top z-20"
            style={{ transformOrigin: 'top' }}
          >
            {hosts.length === 0 ? (
              <motion.li variants={itemVariants} className="px-4 py-3 text-gray-500">No hay anfitriones</motion.li>
            ) : (
              hosts.map((h) => (
                <motion.li key={h.id} variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(h.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {h.photo ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={h.photo} alt={h.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold flex-shrink-0">
                          {((h.firstName || '')[0] || '') + ((h.lastName || '')[0] || '')}
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-gray-900 truncate">{h.name}</div>
                        <div className="text-xs text-gray-500 truncate">{h.email}</div>
                      </div>
                    </div>
                  </button>
                </motion.li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
const CreateAccessModal: React.FC<CreateAccessModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [hosts, setHosts] = useState<Array<{ id: string; name: string; email: string; photo?: string; firstName?: string; lastName?: string }>>([]);
  
  // Estado para alerta de lista negra
  const [blacklistAlert, setBlacklistAlert] = useState<{
    blacklistedUsers: Array<{
      _id: string;
      visitorName: string;
      identifier: string;
      email: string;
      reason: string;
      photo?: string;
      createdAt: string;
    }>;
    accessData: any;
  } | null>(null);
  
  // Calculate default dates/times
  const getDefaultDateTime = () => {
    const now = new Date();
    // Add 3 minutes to current time (allow near-immediate scheduling)
    now.setMinutes(now.getMinutes() + 3);
    
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().slice(0, 5); // HH:MM
    
    return { date, time };
  };
  
  const getDefaultEndDateTime = () => {
    const now = new Date();
    // Keep default duration ~60 minutes relative to start: 3 + 60 = 63 minutes from now
    now.setMinutes(now.getMinutes() + 63);
    
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    
    return { date, time };
  };
  
  const defaultStart = getDefaultDateTime();
  const defaultEnd = getDefaultEndDateTime();
  
  const [formData, setFormData] = useState({
    eventName: '',
    type: 'reunion' as 'reunion' | 'proyecto' | 'evento' | 'visita' | 'otro',
    startDate: defaultStart.date,
    startTime: defaultStart.time,
    endDate: defaultEnd.date,
    endTime: defaultEnd.time,
    location: '',
    eventImage: '',
    additionalInfo: '',
    sendEmail: true,
    enablePreRegistration: true,
    hostId: user?._id || '',
  });
  const [invitedUsers, setInvitedUsers] = useState<Array<{
    name: string;
    email: string;
  }>>([{ name: '', email: '' }]);

  // Load hosts on mount
  useEffect(() => {
    const loadHosts = async () => {
      try {
        const response = await getUsers();
        const hostUsers = response.filter((u: any) => u.role === 'host' || u.role === 'admin');
        setHosts(hostUsers.map((h: any) => ({
          id: h._id,
          firstName: h.firstName || '',
          lastName: h.lastName || '',
          name: `${h.firstName} ${h.lastName}${h.role === 'admin' ? ' (Administrador)' : ''}`,
          email: h.email,
          // prefer common photo fields if present
          photo: h.profileImage || h.photo || h.avatar || h.picture || ''
        })));
      } catch (error) {
        console.error('Error loading hosts:', error);
      }
    };
    loadHosts();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, eventImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const addInvitedUser = () => {
    setInvitedUsers([...invitedUsers, { name: '', email: '' }]);
  };

  const removeInvitedUser = (index: number) => {
    if (invitedUsers.length > 1) {
      setInvitedUsers(invitedUsers.filter((_, i) => i !== index));
    }
  };

  const updateInvitedUser = (index: number, field: string, value: string) => {
    const updated = [...invitedUsers];
    updated[index] = { ...updated[index], [field]: value };
    setInvitedUsers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.eventName || !formData.startDate || !formData.endDate) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      // Prepare invited users with name from email if not provided
      const validInvitedUsers = invitedUsers
        .filter(u => u.email)
        .map(u => ({
          name: u.name || u.email.split('@')[0], // Use email username as name if not provided
          email: u.email
        }));

      // Check for blacklisted emails
      const blacklistPromises = validInvitedUsers.map(u => checkBlacklist(u.email));
      const blacklistResults = await Promise.all(blacklistPromises);
      const blacklistedUsers = blacklistResults.filter(r => r !== null);

      if (blacklistedUsers.length > 0) {
        // Mostrar modal de alerta en lugar de confirm
        const accessData = {
          eventName: formData.eventName,
          type: formData.type,
          startDate: startDateTime,
          endDate: endDateTime,
          location: formData.location,
          eventImage: formData.eventImage,
          invitedUsers: validInvitedUsers,
          settings: {
            sendAccessByEmail: formData.sendEmail,
            enablePreRegistration: formData.enablePreRegistration,
            noExpiration: false
          },
          additionalInfo: formData.additionalInfo
        };
        
        setBlacklistAlert({
          blacklistedUsers: blacklistedUsers.map(b => ({
            _id: b!._id,
            visitorName: b!.visitorName || b!.identifier,
            identifier: b!.identifier,
            email: b!.identifier || '',
            reason: b!.reason,
            photo: b!.photo,
            createdAt: b!.createdAt
          })),
          accessData
        });
        setLoading(false);
        return;
      }

      await createAccess({
        eventName: formData.eventName,
        type: formData.type,
        startDate: startDateTime,
        endDate: endDateTime,
        location: formData.location,
        eventImage: formData.eventImage,
        invitedUsers: validInvitedUsers,
        settings: {
          sendAccessByEmail: formData.sendEmail,
          enablePreRegistration: formData.enablePreRegistration,
          noExpiration: false
        },
        additionalInfo: formData.additionalInfo
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating access:', error);
      alert('Error al crear el acceso');
    } finally {
      setLoading(false);
    }
  };

  // Handler para confirmar creación de acceso después de alerta de lista negra
  const handleBlacklistAction = async (action: 'allow' | 'cancel') => {
    if (!blacklistAlert) return;
    
    if (action === 'cancel') {
      setBlacklistAlert(null);
      return;
    }
    
    // Continuar con la creación del acceso
    setLoading(true);
    try {
      await createAccess(blacklistAlert.accessData);
      setBlacklistAlert(null);
      onSuccess();
    } catch (error) {
      console.error('Error creating access:', error);
      alert('Error al crear el acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear acceso</h2>
              <p className="text-sm text-gray-600">Configura los detalles del acceso para tus visitantes</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <IoQrCodeOutline className="w-5 h-5 text-white" />
                </div>
                Información del Acceso
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-gray-900" />
                    Razón del acceso <span className="text-red-500 ml-1">*</span>
                  </label>
                  {/* Animated dropdown for reason */}
                  <ReasonDropdown
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Edit2 className="w-4 h-4 mr-2 text-gray-900" />
                    Título <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="Ej: Reunión de proyecto Q4"
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white text-base"
                    required
                  />
                </div>
              </div>
              
              {/* Toggle Pre-registro */}
              <div className="bg-white border-2 border-gray-300 rounded-xl p-5 hover:border-gray-400 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <LinkIcon className="w-4 h-4 mr-2 text-gray-900" />
                      <h4 className="text-base font-bold text-gray-900">Crear enlace de pre-registro</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Genera un enlace público para que las personas puedan registrarse al evento sin necesidad de invitación directa
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, enablePreRegistration: !formData.enablePreRegistration })}
                    role="switch"
                    aria-checked={formData.enablePreRegistration}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                      formData.enablePreRegistration ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                        formData.enablePreRegistration ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Fechas y Horas */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                Horario del Acceso
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Inicio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-900" />
                    Fecha y hora de inicio <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      value={formData.startDate}
                      onChange={(value) => setFormData({ ...formData, startDate: value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <TimePicker
                      value={formData.startTime}
                      onChange={(value) => setFormData({ ...formData, startTime: value })}
                    />
                  </div>
                </div>

                {/* Fin */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-900" />
                    Fecha y hora de finalización <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      value={formData.endDate}
                      onChange={(value) => setFormData({ ...formData, endDate: value })}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                    <TimePicker
                      value={formData.endTime}
                      onChange={(value) => setFormData({ ...formData, endTime: value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invitados */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Visitantes Invitados
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-900" />
                Ingresa el correo electrónico y nombre de tus visitantes
              </p>

              <div className="space-y-3">
                {invitedUsers.map((user, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all">
                    {/* Email input */}
                    <div className="flex-1">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={user.email}
                          onChange={(e) => updateInvitedUser(index, 'email', e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                        />
                      </div>
                    </div>

                    {/* Name input (appears when email is filled) */}
                    {user.email && (
                      <div className="flex-1">
                        <div className="relative">
                          <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Nombre del visitante"
                            value={user.name}
                            onChange={(e) => updateInvitedUser(index, 'name', e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Remove button */}
                    {invitedUsers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvitedUser(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar visitante"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add more button */}
                <button
                  type="button"
                  onClick={addInvitedUser}
                  className="w-full py-3.5 text-sm font-semibold text-gray-900 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all flex items-center justify-center shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar otro visitante
                </button>
              </div>
            </div>

            {/* Opciones avanzadas */}
            <div className="border-t-2 border-gray-200 pt-6">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
              >
                <svg className={`w-5 h-5 mr-2 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="group-hover:underline">Opciones avanzadas</span>
                <span className="ml-2 text-xs text-gray-500">(opcional)</span>
              </button>

              {showAdvancedOptions && (
                <div className="mt-6 space-y-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
                  
                  {/* Anfitrión */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <UserCircle className="w-5 h-5 mr-2 text-gray-900" />
                      Anfitrión responsable
                    </label>
                      {/* Animated host dropdown */}
                      <HostDropdown
                        hosts={hosts}
                        value={formData.hostId}
                        onChange={(v) => setFormData({ ...formData, hostId: v })}
                      />
                    <p className="text-xs text-gray-600 mt-2">
                      Este usuario recibirá las notificaciones del acceso
                    </p>
                  </div>

                  {/* Lugar */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-gray-900" />
                      Ubicación específica
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ej. Sala de juntas, Edificio A, Piso 3"
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white text-base"
                    />
                  </div>

                  {/* Imagen del evento */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <Upload className="w-5 h-5 mr-2 text-gray-900" />
                      Imagen del evento
                    </label>
                    <div className="flex items-start space-x-4">
                      {formData.eventImage ? (
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-300 shadow-md">
                          <img src={formData.eventImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, eventImage: '' })}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-900 hover:bg-gray-100 transition-all group">
                          <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-900 mb-2 transition-colors" />
                          <span className="text-xs text-gray-500 group-hover:text-gray-900 font-medium">Subir imagen</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                      <div className="flex-1 text-xs text-gray-600 space-y-1">
                        <p className="flex items-center"><CheckCircle className="w-3 h-3 mr-1 text-gray-600" /> Formatos: PNG, JPEG, JPG</p>
                        <p className="flex items-center"><CheckCircle className="w-3 h-3 mr-1 text-gray-600" /> Tamaño máximo: 2MB</p>
                        <p className="flex items-center"><CheckCircle className="w-3 h-3 mr-1 text-gray-600" /> Recomendado: 800x600px</p>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <Edit2 className="w-5 h-5 mr-2 text-gray-900" />
                      Notas adicionales
                    </label>
                    <textarea
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      rows={4}
                      placeholder="Agrega instrucciones especiales, requisitos de entrada, código de vestimenta, etc."
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none bg-white text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t-2 border-gray-200">
              <div className="flex items-center text-sm text-gray-600 font-medium">
                <Bell className="w-4 h-4 mr-2 text-gray-900" />
                Los invitados recibirán un correo con QR de acceso
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl hover:from-gray-800 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center font-semibold shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando acceso...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Crear acceso
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Modal de Alerta de Lista Negra */}
      {blacklistAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white sticky top-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Visitantes en lista negra detectados</h3>
                  <p className="text-yellow-100 text-sm mt-1">{blacklistAlert.blacklistedUsers.length} invitado(s) encontrado(s)</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Lista de visitantes en lista negra */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {blacklistAlert.blacklistedUsers.map((user, index) => (
                  <div key={index} className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Foto si existe */}
                      {user.photo && (
                        <img
                          src={user.photo}
                          alt={user.visitorName}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-yellow-500 flex-shrink-0"
                        />
                      )}
                      {/* Info */}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-yellow-900 text-base">{user.visitorName}</h4>
                        <p className="text-yellow-800 text-sm">
                          <strong>Correo:</strong> {user.email}
                        </p>
                        <p className="text-yellow-800 text-sm">
                          <strong>Agregado:</strong> {new Date(user.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {/* Razón */}
                        <div className="mt-2 pt-2 border-t border-yellow-300">
                          <p className="text-xs font-semibold text-yellow-900 mb-1">Motivo del registro:</p>
                          <p className="text-yellow-800 text-sm">{user.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advertencia */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-900 text-sm">
                  <strong>⚠️ Importante:</strong> Estas personas están registradas en la lista negra. 
                  ¿Deseas continuar con la creación del acceso de todas formas?
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleBlacklistAction('cancel')}
                  className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-md font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar Creación
                </button>
                <button
                  onClick={() => handleBlacklistAction('allow')}
                  disabled={loading}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Continuar de Todos Modos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== EDIT ACCESS MODAL ====================
interface EditAccessModalProps {
  access: Access;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAccessModal: React.FC<EditAccessModalProps> = ({ access, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [endDate, setEndDate] = useState(
    new Date(access.endDate).toISOString().split('T')[0]
  );
  const [endTime, setEndTime] = useState(
    new Date(access.endDate).toTimeString().slice(0, 5)
  );
  // Nuevos invitados: solo Nombre y Email (obligatorios)
  const [newInvitedUsers, setNewInvitedUsers] = useState<Array<{
    name: string;
    email: string;
  }>>([]);

  // Estado para alerta de lista negra
  const [blacklistAlert, setBlacklistAlert] = useState<{
    blacklistedUsers: Array<{
      _id: string;
      visitorName: string;
      identifier: string;
      email: string;
      reason: string;
      photo?: string;
      createdAt: string;
    }>;
    updateData: any;
  } | null>(null);

  const addNewInvitedUser = () => {
    setNewInvitedUsers([...newInvitedUsers, { name: '', email: '' }]);
  };

  const removeNewInvitedUser = (index: number) => {
    setNewInvitedUsers(newInvitedUsers.filter((_, i) => i !== index));
  };

  const updateNewInvitedUser = (index: number, field: string, value: string) => {
    const updated = [...newInvitedUsers];
    updated[index] = { ...updated[index], [field]: value };
    setNewInvitedUsers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const endDateTime = new Date(`${endDate}T${endTime}`);
      const updates: any = {};

      // Solo enviar campos modificados
      if (new Date(endDateTime).getTime() !== new Date(access.endDate).getTime()) {
        updates.endDate = endDateTime;
      }
      if (newInvitedUsers.length > 0) {
        // Validar que todos los nuevos invitados tienen nombre y email
        const invalid = newInvitedUsers.some(u => !u.name || !u.email);
        if (invalid) {
          alert('Por favor ingresa Nombre y Email para todos los nuevos invitados');
          setLoading(false);
          return;
        }

        // Verificar lista negra para nuevos invitados
        const blacklistPromises = newInvitedUsers.map(u => checkBlacklist(u.email));
        const blacklistResults = await Promise.all(blacklistPromises);
        const blacklistedUsers = blacklistResults.filter(r => r !== null);

        if (blacklistedUsers.length > 0) {
          updates.invitedUsers = newInvitedUsers.map(u => ({ name: u.name, email: u.email }));
          
          setBlacklistAlert({
            blacklistedUsers: blacklistedUsers.map(b => ({
              _id: b!._id,
              visitorName: b!.visitorName || b!.identifier,
              identifier: b!.identifier,
              email: b!.identifier || '',
              reason: b!.reason,
              photo: b!.photo,
              createdAt: b!.createdAt
            })),
            updateData: updates
          });
          setLoading(false);
          return;
        }

        updates.invitedUsers = newInvitedUsers.map(u => ({ name: u.name, email: u.email }));
      }

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updateAccess(access._id, updates);
      onSuccess();
    } catch (error) {
      console.error('Error updating access:', error);
      alert('Error al actualizar el acceso');
    } finally {
      setLoading(false);
    }
  };

  // Handler para confirmar actualización después de alerta de lista negra
  const handleBlacklistAction = async (action: 'allow' | 'cancel') => {
    if (!blacklistAlert) return;
    
    if (action === 'cancel') {
      setBlacklistAlert(null);
      return;
    }
    
    // Continuar con la actualización del acceso
    setLoading(true);
    try {
      await updateAccess(access._id, blacklistAlert.updateData);
      setBlacklistAlert(null);
      onSuccess();
    } catch (error) {
      console.error('Error updating access:', error);
      alert('Error al actualizar el acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Editar acceso</h2>
              <p className="text-sm text-gray-500">Extiende la vigencia y agrega más invitados si lo necesitas</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Aviso */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                ℹ️ En esta edición puedes extender la fecha de fin y agregar nuevos invitados.
              </p>
            </div>

            {/* Fecha de fin */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                Nueva fecha y hora de finalización
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <DatePicker
                  label="Fecha fin"
                  value={endDate}
                  onChange={setEndDate}
                  min={new Date(access.endDate).toISOString().split('T')[0]}
                />
                <TimePicker
                  label="Hora fin"
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>
            </div>

            {/* Agregar nuevos invitados */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Agregar nuevos invitados
              </h3>

              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">Añade nuevos invitados con su nombre y correo electrónico</p>
                <button
                  type="button"
                  onClick={addNewInvitedUser}
                  className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                >
                  + Agregar invitado
                </button>
              </div>

              {newInvitedUsers.length > 0 && (
                <div className="space-y-3">
                  {newInvitedUsers.map((user, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-all">
                      {/* Email */}
                      <div className="flex-1">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={user.email}
                            onChange={(e) => updateNewInvitedUser(index, 'email', e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Nombre */}
                      <div className="flex-1">
                        <div className="relative">
                          <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Nombre del invitado"
                            value={user.name}
                            onChange={(e) => updateNewInvitedUser(index, 'name', e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeNewInvitedUser(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar invitado"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Alerta de Lista Negra */}
      {blacklistAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white sticky top-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Visitantes en lista negra detectados</h3>
                  <p className="text-yellow-100 text-sm mt-1">{blacklistAlert.blacklistedUsers.length} invitado(s) encontrado(s)</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Lista de visitantes en lista negra */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {blacklistAlert.blacklistedUsers.map((user, index) => (
                  <div key={index} className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                    <div className="flex gap-4">
                      {user.photo && (
                        <img
                          src={user.photo}
                          alt={user.visitorName}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-yellow-500 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-yellow-900 text-base">{user.visitorName}</h4>
                        <p className="text-yellow-800 text-sm">
                          <strong>Correo:</strong> {user.email}
                        </p>
                        <p className="text-yellow-800 text-sm">
                          <strong>Agregado:</strong> {new Date(user.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="mt-2 pt-2 border-t border-yellow-300">
                          <p className="text-xs font-semibold text-yellow-900 mb-1">Motivo del registro:</p>
                          <p className="text-yellow-800 text-sm">{user.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advertencia */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-900 text-sm">
                  <strong>⚠️ Importante:</strong> Estas personas están registradas en la lista negra. 
                  ¿Deseas continuar con la actualización del acceso de todas formas?
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleBlacklistAction('cancel')}
                  className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-md font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar Actualización
                </button>
                <button
                  onClick={() => handleBlacklistAction('allow')}
                  disabled={loading}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Continuar de Todos Modos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== DETAILS MODAL ====================
interface DetailsModalProps {
  access: Access;
  onClose: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ access, onClose }) => {
  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'asistio':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'no-asistio':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <MinusCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAttendanceLabel = (status: string) => {
    const labels = {
      pendiente: 'Pendiente',
      asistio: 'Asistió',
      'no-asistio': 'No asistió'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      reunion: 'Reunión',
      proyecto: 'Proyecto',
      evento: 'Evento',
      visita: 'Visita',
      otro: 'Otro'
    };
    return labels[type as keyof typeof labels] || 'Otro';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border-2 border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Detalles del Acceso</h2>
              <p className="text-sm text-gray-600 mt-1">Consulta información del evento y el estado de sus invitados</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Imagen */}
          {access.eventImage && (
            <div className="mb-5 rounded-xl overflow-hidden ring-1 ring-gray-200">
              <img 
                src={access.eventImage} 
                alt={access.eventName}
                className="w-full h-52 object-cover"
              />
            </div>
          )}

          {/* Información general */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{access.eventName}</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-gray-600">{getTypeLabel(access.type)}</span>
                {access.status !== 'active' && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${access.status === 'finalized' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                    {access.status === 'finalized' ? 'Finalizado' : 'Cancelado'}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(access.startDate)} - {formatDate(access.endDate)}
                  </p>
                </div>
              </div>

              {access.location && (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Ubicación</p>
                    <p className="text-sm text-gray-600">{access.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen de pre-registro */}
            <div className="flex items-start">
              <LinkIcon className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700">Pre-registro</p>
                {access.status !== 'active' ? (
                  <p className="text-sm text-gray-600">
                    Deshabilitado ({access.status === 'cancelled' ? 'acceso cancelado' : 'acceso finalizado'})
                  </p>
                ) : access.settings?.enablePreRegistration ? (
                    <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl p-3 mt-1">
                    <p className="text-sm text-gray-700">Habilitado</p>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/public/register/${access._id}`;
                        navigator.clipboard.writeText(link)
                          .then(() => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Enlace copiado al portapapeles', severity: 'success' } })))
                          .catch(() => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error al copiar enlace', severity: 'error' } })));
                      }}
                      className="flex items-center px-3 py-1.5 text-xs text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Copiar enlace
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Deshabilitado</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <Users className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Código de acceso</p>
                <p className="text-sm text-gray-600 font-mono">{access.accessCode}</p>
              </div>
            </div>

            {access.additionalInfo && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Información adicional</p>
                <p className="text-sm text-gray-600">{access.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Tabla de invitados */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Invitados ({access.invitedUsers.length})
            </h3>
            
            {/* Se elimina duplicado del enlace de pre-registro; ahora solo se muestra en el resumen superior */}
            
            {access.invitedUsers.length === 0 ? (
              <p className="text-sm text-gray-600">No hay invitados registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border-2 border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Asistencia
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        QR
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {access.invitedUsers.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {user.name}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email || '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getAttendanceIcon(user.attendanceStatus)}
                            <span className="ml-2 text-sm text-gray-700">
                              {getAttendanceLabel(user.attendanceStatus)}
                            </span>
                          </div>
                          {user.checkInTime && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(user.checkInTime)}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {user.qrCode && (() => {
                            const isActive = access.status === 'active';
                            const handleDownload = () => {
                              if (!isActive) return;
                              const link = document.createElement('a');
                              link.href = user.qrCode;
                              link.download = `QR-${user.name.replace(/\s/g, '_')}.png`;
                              link.click();
                            };

                            return (
                              <button
                                onClick={handleDownload}
                                disabled={!isActive}
                                title={isActive ? 'Descargar' : (access.status === 'cancelled' ? 'Acceso cancelado' : 'Acceso finalizado')}
                                className={`flex items-center px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 transition-colors ${isActive ? 'text-gray-900 bg-gray-100 hover:bg-gray-200' : 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-70'}`}
                                aria-disabled={!isActive}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Descargar
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botón cerrar */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
