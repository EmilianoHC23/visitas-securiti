import React, { useState, useEffect } from 'react';
import { Access } from '../../types';
import * as api from '../../services/api';

export const AccessCodesPage: React.FC = () => {
  const [accessCodes, setAccessCodes] = useState<Access[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccess, setEditingAccess] = useState<Access | null>(null);
  const [newAccess, setNewAccess] = useState({
    title: '',
    description: '',
    scheduleDate: '',
    scheduleStartTime: '09:00',
    scheduleEndTime: '17:00',
    maxUses: 1,
    autoApproval: true,
    requireApproval: false,
    allowGuests: false,
    invitedEmails: [] as string[]
  });

  useEffect(() => {
    loadAccessCodes();
  }, []);

  const loadAccessCodes = async () => {
    try {
      setLoading(true);
      const codes = await api.getAccesses();
      setAccessCodes(codes);
    } catch (error) {
      console.error('Error loading access codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAccess.title || !newAccess.scheduleDate) {
      alert('Título y fecha son requeridos');
      return;
    }

    try {
      const accessData = {
        title: newAccess.title,
        description: newAccess.description,
        schedule: {
          date: newAccess.scheduleDate,
          startTime: newAccess.scheduleStartTime,
          endTime: newAccess.scheduleEndTime,
          recurrence: 'none'
        },
        settings: {
          maxUses: newAccess.maxUses,
          autoApproval: newAccess.autoApproval,
          requireApproval: newAccess.requireApproval,
          allowGuests: newAccess.allowGuests
        },
        invitedEmails: newAccess.invitedEmails
      };

      const createdAccess = await api.createAccess(accessData);
      setAccessCodes([createdAccess, ...accessCodes]);
      
      // Reset form
      setNewAccess({
        title: '',
        description: '',
        scheduleDate: '',
        scheduleStartTime: '09:00',
        scheduleEndTime: '17:00',
        maxUses: 1,
        autoApproval: true,
        requireApproval: false,
        allowGuests: false,
        invitedEmails: []
      });
      
      setShowCreateForm(false);
      alert('Código de acceso creado exitosamente');
    } catch (error) {
      console.error('Error creating access code:', error);
      alert('Error al crear el código de acceso');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'cancelled' : 'active';
      const updatedAccess = await api.updateAccess(id, { status: newStatus });
      setAccessCodes(accessCodes.map(access => 
        access._id === id ? updatedAccess : access
      ));
    } catch (error) {
      console.error('Error toggling access status:', error);
      alert('Error al cambiar el estado del código');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este código de acceso?')) {
      return;
    }

    try {
      await api.deleteAccess(id);
      setAccessCodes(accessCodes.filter(access => access._id !== id));
    } catch (error) {
      console.error('Error deleting access code:', error);
      alert('Error al eliminar código de acceso');
    }
  };

  const getStatusLabel = (access: Access) => {
    if (access.status === 'cancelled') return 'Inactivo';
    if (access.status === 'expired') return 'Expirado';
    
    // Check if max uses reached
    if (access.settings?.maxUses && access.usageCount >= access.settings.maxUses) {
      return 'Agotado';
    }

    return 'Activo';
  };

  const getStatusColor = (access: Access) => {
    const status = getStatusLabel(access);
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-gray-100 text-gray-800';
      case 'Expirado': return 'bg-red-100 text-red-800';
      case 'Agotado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-2xl font-bold text-gray-800">Códigos de Acceso</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear Código de Acceso
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">Cargando códigos de acceso...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accessCodes.map((access) => (
                  <tr key={access._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">
                        {access.accessCode}
                      </div>
                      {access.title && (
                        <div className="text-sm text-gray-500">{access.title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Evento
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {access.usageCount} / {access.settings?.maxUses || '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(access)}`}>
                        {getStatusLabel(access)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {access.schedule?.from && access.schedule?.to && (
                        <div>
                          <div>Fecha: {access.schedule.from} - {access.schedule.to}</div>
                        </div>
                      )}
                      {access.description && (
                        <div className="text-xs text-gray-400 mt-1">{access.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleStatus(access._id, access.status)}
                        className={`${
                          access.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {access.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(access._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {accessCodes.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No hay códigos de acceso creados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para crear código de acceso */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Crear Código de Acceso
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  value={newAccess.title}
                  onChange={(e) => setNewAccess({ ...newAccess, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Reunión de trabajo, Conferencia, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newAccess.description}
                  onChange={(e) => setNewAccess({ ...newAccess, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del evento o propósito de la visita"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Evento *
                </label>
                <input
                  type="date"
                  value={newAccess.scheduleDate}
                  onChange={(e) => setNewAccess({ ...newAccess, scheduleDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    value={newAccess.scheduleStartTime}
                    onChange={(e) => setNewAccess({ ...newAccess, scheduleStartTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    value={newAccess.scheduleEndTime}
                    onChange={(e) => setNewAccess({ ...newAccess, scheduleEndTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número máximo de usos
                </label>
                <input
                  type="number"
                  min="1"
                  value={newAccess.maxUses}
                  onChange={(e) => setNewAccess({ ...newAccess, maxUses: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAccess.autoApproval}
                    onChange={(e) => setNewAccess({ ...newAccess, autoApproval: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aprobación automática</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAccess.allowGuests}
                    onChange={(e) => setNewAccess({ ...newAccess, allowGuests: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Permitir invitados</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Crear Código
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};