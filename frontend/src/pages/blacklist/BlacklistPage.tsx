import React, { useState, useEffect, useRef } from 'react';
import { BlacklistEntry } from '../../types';
import * as api from '../../services/api';
import { Search, UserX, Mail, AlertCircle, Camera, Upload, Trash2, X } from 'lucide-react';

export const BlacklistPage: React.FC = () => {
  const [blacklistEntries, setBlacklistEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [newEntry, setNewEntry] = useState({
    visitorName: '',
    email: '',
    reason: '',
    photo: ''
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // legacy: kept for reference but we now use the styled confirm dialog
    openConfirmById(id);
  };

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEntry, setConfirmEntry] = useState<BlacklistEntry | null>(null);

  const openConfirm = (entry: BlacklistEntry) => {
    setConfirmEntry(entry);
    setConfirmOpen(true);
  };

  const openConfirmById = (id: string) => {
    const entry = blacklistEntries.find(e => e._id === id) || null;
    setConfirmEntry(entry);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmEntry(null);
  };

  const confirmDelete = async () => {
    if (!confirmEntry) return closeConfirm();
    try {
      setLoading(true);
      await api.removeFromBlacklist(confirmEntry._id);
      setBlacklistEntries(prev => prev.filter(e => e._id !== confirmEntry._id));
      closeConfirm();
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      alert('Error al eliminar de la lista negra');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = blacklistEntries.filter(entry =>
    entry.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={isMobile ? "mb-4" : "mb-8"}>
          <div className={`flex items-center ${isMobile ? 'gap-2 mb-2' : 'gap-3 mb-2'}`}>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <UserX className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
              </div>
            <div className="min-w-0">
              <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900`}>Lista Negra</h1>
              <p className={`text-gray-600 mt-1 ${isMobile ? 'text-xs' : ''}`}>
                {isMobile ? 'Personas restringidas de acceso' : 'Gestiona las personas restringidas de acceso a las instalaciones'}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${isMobile ? 'p-4 mb-4' : 'p-6 mb-6'}`}>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <input
                type="text"
                placeholder={isMobile ? "Buscar..." : "Buscar por nombre, correo o motivo..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-10 pr-3 py-2.5 text-sm' : 'pl-12 pr-4 py-3'} border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all`}
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className={`w-full sm:w-auto ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3'} bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg font-semibold flex items-center justify-center gap-2`}
            >
              <UserX className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
              {isMobile ? 'Agregar a Lista' : 'Agregar a Lista Negra'}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={`text-center ${isMobile ? 'py-12' : 'py-20'} bg-white rounded-2xl shadow-xl border border-gray-200`}>
            <div className={`inline-block animate-spin rounded-full ${isMobile ? 'h-12 w-12 border-4' : 'h-16 w-16 border-4'} border-gray-200 border-t-gray-900`}></div>
            <p className={`${isMobile ? 'mt-4 text-base' : 'mt-6 text-lg'} text-gray-600 font-medium`}>Cargando lista negra...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${isMobile ? 'p-8' : 'p-12'} text-center`}>
            <div className="max-w-md mx-auto">
              <div className={`p-4 bg-gray-100 rounded-full ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} flex items-center justify-center mx-auto mb-4`}>
                <UserX className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-400`} />
              </div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>
                {searchTerm ? 'No se encontraron resultados' : 'No hay entradas en la lista negra'}
              </h3>
              <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'Agrega personas a la lista negra para restringir su acceso'}
              </p>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
            {filteredEntries.map((entry) => (
              <div
                key={entry._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Photo Section */}
                <div className={`relative ${isMobile ? 'h-40' : 'h-48'} bg-gradient-to-br from-gray-50 to-gray-100`}>
                  {entry.photo ? (
                    <img
                      src={entry.photo}
                      alt={entry.visitorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className={`${isMobile ? 'p-4' : 'p-6'} bg-gray-200 rounded-full`}>
                        <UserX className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-600`} />
                      </div>
                    </div>
                  )}
                  <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-3 right-3'}`}>
                    <button
                      onClick={() => openConfirm(entry)}
                      className={`${isMobile ? 'p-1.5' : 'p-2'} bg-white/90 backdrop-blur-sm rounded-lg hover:bg-gray-100 transition-colors shadow-lg`}
                      title="Eliminar de la lista negra"
                    >
                      <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`} />
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className={isMobile ? "p-4" : "p-6"}>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'} group-hover:text-gray-700 transition-colors`}>
                    {entry.visitorName}
                  </h3>
                  
                  <div className={isMobile ? "space-y-2" : "space-y-3"}>
                    <div className="flex items-start gap-2">
                      <Mail className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Correo electrónico</p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 break-all`}>{entry.identifier}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600 flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Motivo</p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-900 leading-relaxed`}>{entry.reason}</p>
                      </div>
                    </div>

                    <div className={`${isMobile ? 'pt-2' : 'pt-3'} border-t border-gray-100`}>
                      <p className="text-xs text-gray-500">
                        Agregado el {new Date(entry.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: isMobile ? 'short' : 'long',
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

      {/* Confirm dialog (copied/adapted from UserManagementPage ConfirmDialog) */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl ${isMobile ? 'max-w-sm' : 'max-w-2xl'} w-full shadow-2xl overflow-hidden`}>
            {/* Header: gradient like other modals */}
            <div className={`${isMobile ? 'p-4' : 'p-6'} bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 border-b border-gray-700 flex items-start justify-between text-white`}>
              <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-4'}`}>
                <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg bg-white/15 flex items-center justify-center shadow-sm ring-1 ring-white/20`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white`}>Eliminar entrada</h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-indigo-100`}>Confirmación</p>
                </div>
              </div>
              <button
                onClick={closeConfirm}
                className="text-gray-200 hover:text-white p-2 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className={isMobile ? "p-4" : "p-6"}>
              <div className={`bg-gray-50 rounded-xl ${isMobile ? 'p-4' : 'p-6'} border border-gray-200 shadow-sm text-center`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 ${isMobile ? 'mb-4' : 'mb-6'} whitespace-pre-line`}>{`¿Está seguro de que desea eliminar esta entrada de la lista negra?\n${confirmEntry?.visitorName || ''}`}</p>

                <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                  <button
                    onClick={() => { closeConfirm(); }}
                    className={`${isMobile ? 'px-3 py-2 min-w-[100px] text-sm' : 'px-4 py-2 min-w-[120px]'} text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors`}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => { confirmDelete(); }}
                    className={`${isMobile ? 'px-3 py-2 min-w-[100px] text-sm' : 'px-4 py-2 min-w-[120px]'} text-white bg-gradient-to-r from-gray-900 to-gray-600 rounded-lg shadow hover:from-gray-800 hover:to-gray-500`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar entrada */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className={`bg-white rounded-2xl ${isMobile ? 'max-w-sm' : 'max-w-2xl'} w-full shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto`}>
            {/* Header */}
            <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                  <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-gray-900 rounded-lg flex items-center justify-center`}>
                    <UserX className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                  </div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                    {isMobile ? 'Agregar a Lista' : 'Agregar a Lista Negra'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAdd} className={`${isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
              {/* Photo Upload */}
              <div>
                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                  Foto del visitante (opcional)
                </label>
                <div className={`flex flex-col sm:flex-row items-start sm:items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                  {newEntry.photo ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={newEntry.photo}
                        alt="Preview"
                        className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-xl object-cover border-2 border-gray-200`}
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
                    <div className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0`}>
                      <Camera className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-400`} />
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
                      className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2`}
                    >
                      <Upload className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
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
                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2`}>
                  Nombre del visitante *
                </label>
                <input
                  type="text"
                  value={newEntry.visitorName}
                  onChange={(e) => setNewEntry({ ...newEntry, visitorName: e.target.value })}
                  className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all`}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2`}>
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={newEntry.email}
                  onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
                  className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all`}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2`}>
                  Motivo *
                </label>
                <textarea
                  value={newEntry.reason}
                  onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                  className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all resize-none`}
                  rows={isMobile ? 3 : 4}
                  placeholder="Describe el motivo por el cual se agrega a la lista negra..."
                  required
                />
              </div>

              {/* Buttons */}
              <div className={`flex gap-3 ${isMobile ? 'pt-3' : 'pt-4'} sticky bottom-0 bg-white pb-2`}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`flex-1 ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3'} bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg font-semibold`}
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