import React, { useState, useEffect, useRef } from 'react';
import { BlacklistEntry } from '../../types';
import * as api from '../../services/api';
import { Shield, Search, UserX, Mail, AlertCircle, Camera, Upload, Trash2, X } from 'lucide-react';

export const BlacklistPage: React.FC = () => {
  const [blacklistEntries, setBlacklistEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newEntry, setNewEntry] = useState({
    visitorName: '',
    email: '',
    reason: '',
    photo: ''
  });

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    try {
      setLoading(true);
      const entries = await api.getBlacklist();
      setBlacklistEntries(entries as BlacklistEntry[]);
    } catch (error) {
      console.error('Error loading blacklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }

      // Validar tipo
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        alert('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Photo = event.target?.result as string;
        setNewEntry({ ...newEntry, photo: base64Photo });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEntry.visitorName || !newEntry.email || !newEntry.reason) {
      alert('El nombre, correo electrónico y motivo son requeridos');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEntry.email)) {
      alert('Por favor, ingrese un correo electrónico válido');
      return;
    }
    
    try {
      console.log('� Adding to blacklist:', newEntry);
      
      const entry = await api.addToBlacklist({
        visitorName: newEntry.visitorName,
        email: newEntry.email,
        reason: newEntry.reason,
        photo: newEntry.photo || undefined
      });
      console.log('✅ Blacklist entry added:', entry);
      
      setBlacklistEntries([...blacklistEntries, entry as BlacklistEntry]);
      setNewEntry({ 
        visitorName: '',
        email: '',
        reason: '',
        photo: ''
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
    entry.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lista Negra</h1>
              <p className="text-gray-600 mt-1">
                Gestiona las personas restringidas de acceso a las instalaciones
              </p>
            </div>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg font-semibold flex items-center justify-center gap-2"
            >
              <UserX className="w-5 h-5" />
              Agregar a Lista Negra
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando lista negra...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <UserX className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'No hay entradas en la lista negra'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'Agrega personas a la lista negra para restringir su acceso'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => (
              <div
                key={entry._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Photo Section */}
                <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
                  {entry.photo ? (
                    <img
                      src={entry.photo}
                      alt={entry.visitorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="p-6 bg-gray-200 rounded-full">
                        <UserX className="w-16 h-16 text-gray-600" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleRemove(entry._id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                      title="Eliminar de la lista negra"
                    >
                      <Trash2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                    {entry.visitorName}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 mb-1">Correo electrónico</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{entry.identifier}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Motivo</p>
                        <p className="text-sm text-gray-900 leading-relaxed">{entry.reason}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Agregado el {new Date(entry.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar entrada */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-900 rounded-lg flex items-center justify-center">
                    <UserX className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Agregar a Lista Negra
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAdd} className="p-6 space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Foto del visitante (opcional)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {newEntry.photo ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={newEntry.photo}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setNewEntry({ ...newEntry, photo: '' })}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0">
                      <Camera className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      {newEntry.photo ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG o GIF. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visitor Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del visitante *
                </label>
                <input
                  type="text"
                  value={newEntry.visitorName}
                  onChange={(e) => setNewEntry({ ...newEntry, visitorName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={newEntry.email}
                  onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo *
                </label>
                <textarea
                  value={newEntry.reason}
                  onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="Describe el motivo por el cual se agrega a la lista negra..."
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg font-semibold"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};