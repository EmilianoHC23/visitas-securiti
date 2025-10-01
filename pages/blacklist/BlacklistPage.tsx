import React, { useState, useEffect } from 'react';
import { BlacklistEntry } from '../../types';
import * as api from '../../services/api';

export const BlacklistPage: React.FC = () => {
  const [blacklistEntries, setBlacklistEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEntry, setNewEntry] = useState({
    identifierType: 'email' as 'document' | 'phone' | 'email',
    identifier: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    try {
      setLoading(true);
      const entries = await api.getBlacklist();
      setBlacklistEntries(entries);
    } catch (error) {
      console.error('Error loading blacklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEntry.identifier || !newEntry.reason) {
      alert('El identificador y la razón son requeridos');
      return;
    }
    
    try {
      console.log('🚫 Adding to blacklist:', newEntry);
      
      // Convert form data to backend format
      const blacklistData = {
        email: newEntry.identifierType === 'email' ? newEntry.identifier : '',
        name: newEntry.identifierType !== 'email' ? newEntry.identifier : `Usuario (${newEntry.identifierType})`,
        reason: newEntry.reason
      };
      
      console.log('📤 Sending blacklist data:', blacklistData);
      
      const entry = await api.addToBlacklist(blacklistData);
      console.log('✅ Blacklist entry added:', entry);
      
      setBlacklistEntries([...blacklistEntries, entry]);
      setNewEntry({ 
        identifierType: 'email' as 'document' | 'phone' | 'email',
        identifier: '',
        reason: '',
        notes: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('❌ Error adding to blacklist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al agregar a la lista negra: ${errorMessage}`);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta entrada de la lista negra?')) {
      return;
    }

    try {
      await api.removeFromBlacklist(id);
      setBlacklistEntries(blacklistEntries.filter(entry => entry._id !== id));
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      alert('Error al eliminar de la lista negra');
    }
  };

  const filteredEntries = blacklistEntries.filter(entry =>
    entry.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getIdentifierTypeLabel = (type: string) => {
    switch (type) {
      case 'document': return 'Documento';
      case 'phone': return 'Teléfono';
      case 'email': return 'Email';
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-2xl font-bold text-gray-800">Lista Negra</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Agregar a Lista Negra
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Buscar por identificador, razón o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">Cargando lista negra...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identificador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Razón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.identifier}</div>
                      {entry.notes && (
                        <div className="text-sm text-gray-500">{entry.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {getIdentifierTypeLabel(entry.identifierType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{entry.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemove(entry._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? 'No se encontraron entradas que coincidan con la búsqueda' : 'No hay entradas en la lista negra'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para agregar entrada */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Agregar a Lista Negra
            </h3>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Identificador
                </label>
                <select
                  value={newEntry.identifierType}
                  onChange={(e) => setNewEntry({ ...newEntry, identifierType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="document">Documento</option>
                  <option value="phone">Teléfono</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador
                </label>
                <input
                  type="text"
                  value={newEntry.identifier}
                  onChange={(e) => setNewEntry({ ...newEntry, identifier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de documento, teléfono o email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón
                </label>
                <input
                  type="text"
                  value={newEntry.reason}
                  onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Motivo de inclusión en lista negra"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Información adicional"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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