import React, { useEffect, useState } from 'react';
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
  MinusCircle
} from 'lucide-react';
import { getAccesses, createAccess, updateAccess, cancelAccess } from '../../services/api';
import { Access, InvitedUser } from '../../types';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

export const AccessCodesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'finalized'>('active');
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [filteredAccesses, setFilteredAccesses] = useState<Access[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<Access | null>(null);

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

    setFilteredAccesses(filtered);
  }, [accesses, activeTab, searchTerm]);

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
      reunion: 'bg-blue-100 text-blue-800',
      proyecto: 'bg-purple-100 text-purple-800',
      evento: 'bg-green-100 text-green-800',
      visita: 'bg-yellow-100 text-yellow-800',
      otro: 'bg-gray-100 text-gray-800'
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesos / Eventos</h1>
        <p className="text-gray-600">Gestiona los accesos y eventos de tu organización</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => setActiveTab('finalized')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'finalized'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Finalizados
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, ubicación o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCreate}
          className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Acceso
        </button>
      </div>

      {/* Lista de accesos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando accesos...</p>
        </div>
      ) : filteredAccesses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay accesos {activeTab === 'active' ? 'activos' : 'finalizados'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccesses.map((access) => (
            <div
              key={access._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {/* Imagen del evento */}
              {access.eventImage && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <img 
                    src={access.eventImage} 
                    alt={access.eventName}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* Tipo */}
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getTypeColor(access.type)}`}>
                {getTypeLabel(access.type)}
              </span>

              {/* Nombre del evento */}
              <h3 className="font-semibold text-gray-900 mb-2">{access.eventName}</h3>

              {/* Información */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(access.startDate)}
                </div>
                {access.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {access.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {access.invitedUsers.length} invitados
                </div>
              </div>

              {/* Acciones */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDetails(access)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </button>
                {access.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleEdit(access)}
                      className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(access)}
                      className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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

const CreateAccessModal: React.FC<CreateAccessModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    type: 'reunion' as 'reunion' | 'proyecto' | 'evento' | 'visita' | 'otro',
    startDate: '',
    startTime: '14:15',
    endDate: '',
    endTime: '15:15',
    location: '',
    eventImage: '',
    additionalInfo: '',
    sendEmail: true,
    preApproveAccess: false,
  });
  const [invitedUsers, setInvitedUsers] = useState<Array<{
    name: string;
    email: string;
  }>>([{ name: '', email: '' }]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Crear accesos</h2>
              <p className="text-sm text-gray-600 mt-1">Crea uno o varios accesos para tus visitantes.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Alert Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 flex items-start">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Limitado a 10 invitados por WhatsApp por acceso.</span> Para más, utiliza su e-mail.
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Razón del acceso y Título */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del acceso <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="reunion">Reunión</option>
                  <option value="proyecto">Proyecto</option>
                  <option value="evento">Evento</option>
                  <option value="visita">Visita</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="Título de tu acceso"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Fechas y Horas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inicia <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Finaliza <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle: Crear un enlace para pre-registro */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">Crear un enlace para pre-registro</span>
                <button type="button" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preApproveAccess}
                  onChange={(e) => setFormData({ ...formData, preApproveAccess: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Agregar visitantes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Agregar visitantes
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-3">
                    Ingresa el correo electrónico de tus visitantes
                  </span>
                  <button
                    type="button"
                    onClick={addInvitedUser}
                    className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Importar invitados
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {invitedUsers.map((user, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {/* Icon dropdown (email by default) */}
                    <div className="relative w-12">
                      <button
                        type="button"
                        className="w-full h-11 flex items-center justify-center border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>

                    {/* Email input */}
                    <input
                      type="email"
                      placeholder="Correo electrónico del visitante"
                      value={user.email}
                      onChange={(e) => updateInvitedUser(index, 'email', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Remove button */}
                    {invitedUsers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvitedUser(index)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  className="w-full py-2.5 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  + Agregar otro visitante
                </button>
              </div>
            </div>

            {/* Opciones avanzadas */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <svg className={`w-4 h-4 mr-1 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Opciones avanzadas
              </button>

              {showAdvancedOptions && (
                <div className="mt-4 space-y-4 pl-5 border-l-2 border-gray-200">
                  {/* Imagen del evento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agrega una imagen a tu acceso
                    </label>
                    <div className="flex items-center space-x-3">
                      {formData.eventImage ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                          <img src={formData.eventImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, eventImage: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Subir</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                      <div className="text-xs text-gray-500">
                        <p>Formatos permitidos: PNG y JPEG</p>
                        <p>Tamaño máximo: 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Anfitrión */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anfitrión
                    </label>
                    <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option>Emiliano Hernandez</option>
                    </select>
                  </div>

                  {/* Notificar a alguien más */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notificar a alguien más
                    </label>
                    <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option>Selecciona los usuarios a notificar</option>
                    </select>
                  </div>

                  {/* Lugar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lugar
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ej. Sala de juntas, Piso 3, Salón, etc."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Información adicional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Información adicional
                    </label>
                    <textarea
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      rows={3}
                      placeholder="Ingresa alguna nota adicional del acceso"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </>
                ) : (
                  'Enviar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
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
  const [eventImage, setEventImage] = useState(access.eventImage || '');
  const [additionalInfo, setAdditionalInfo] = useState(access.additionalInfo || '');
  const [newInvitedUsers, setNewInvitedUsers] = useState<Array<{
    name: string;
    email: string;
    phone: string;
    company: string;
  }>>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEventImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addNewInvitedUser = () => {
    setNewInvitedUsers([...newInvitedUsers, { name: '', email: '', phone: '', company: '' }]);
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
      if (eventImage !== access.eventImage) {
        updates.eventImage = eventImage;
      }
      if (additionalInfo !== access.additionalInfo) {
        updates.additionalInfo = additionalInfo;
      }
      if (newInvitedUsers.length > 0) {
        updates.invitedUsers = newInvitedUsers.filter(u => u.name && (u.email || u.phone));
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Editar Acceso</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ Solo puedes editar: fecha de fin (extender), imagen, información adicional y agregar nuevos invitados.
              </p>
            </div>

            {/* Fecha de fin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva fecha fin (extender)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date(access.endDate).toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actualizar imagen del evento
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Cambiar imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {eventImage && (
                  <img src={eventImage} alt="Preview" className="h-12 w-12 object-cover rounded" />
                )}
              </div>
            </div>

            {/* Agregar nuevos invitados */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Agregar nuevos invitados
                </label>
                <button
                  type="button"
                  onClick={addNewInvitedUser}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Agregar invitado
                </button>
              </div>
              {newInvitedUsers.length > 0 && (
                <div className="space-y-3">
                  {newInvitedUsers.map((user, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Nombre *"
                          value={user.name}
                          onChange={(e) => updateNewInvitedUser(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={user.email}
                          onChange={(e) => updateNewInvitedUser(index, 'email', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="Teléfono"
                          value={user.phone}
                          onChange={(e) => updateNewInvitedUser(index, 'phone', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Empresa"
                            value={user.company}
                            onChange={(e) => updateNewInvitedUser(index, 'company', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewInvitedUser(index)}
                            className="px-2 text-red-600 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Información adicional
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas, instrucciones, etc."
              />
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
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
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Detalles del Acceso</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Imagen */}
          {access.eventImage && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img 
                src={access.eventImage} 
                alt={access.eventName}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Información general */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{access.eventName}</h3>
              <p className="text-sm text-gray-600">{getTypeLabel(access.type)}</p>
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
            
            {access.invitedUsers.length === 0 ? (
              <p className="text-sm text-gray-600">No hay invitados registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asistencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {access.invitedUsers.map((user, index) => (
                      <tr key={index}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email || '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.phone || '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.company || '-'}
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
