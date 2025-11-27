import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BlacklistEntry } from '../../types';
import * as api from '../../services/api';
import { Search, UserX, Mail, AlertCircle, Camera, Upload, Trash2, X, ShieldBan } from 'lucide-react';

export const BlacklistPage: React.FC = () => {
  const [blacklistEntries, setBlacklistEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [errorAlert, setErrorAlert] = useState<{ show: boolean; message: string } | null>(null);
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
        setErrorAlert({ show: true, message: 'El archivo es demasiado grande. Máximo 5MB.' });
        return;
      }

      // Validar tipo
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        setErrorAlert({ show: true, message: 'Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)' });
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
    if (addSubmitting) return;
    
    if (!newEntry.visitorName || !newEntry.email || !newEntry.reason) {
      setErrorAlert({ show: true, message: 'El nombre, correo electrónico y motivo son requeridos' });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEntry.email)) {
      setErrorAlert({ show: true, message: 'Por favor, ingrese un correo electrónico válido' });
      return;
    }
    
    try {
      setAddSubmitting(true);
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
      setErrorAlert({ show: true, message: errorMessage });
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    // legacy: kept for reference but we now use the styled confirm dialog
    openConfirmById(id);
  };

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEntry, setConfirmEntry] = useState<BlacklistEntry | null>(null);
  const [confirmDeleting, setConfirmDeleting] = useState(false);

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
      if (confirmDeleting) return;
      setConfirmDeleting(true);
      setLoading(true);
      await api.removeFromBlacklist(confirmEntry._id);
      setBlacklistEntries(prev => prev.filter(e => e._id !== confirmEntry._id));
      closeConfirm();
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      closeConfirm();
      setErrorAlert({ show: true, message: 'Error al eliminar de la lista negra' });
    } finally {
      setConfirmDeleting(false);
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
              <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <UserX className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
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
          <div className={`bg-white rounded-xl ${isMobile ? 'max-w-sm' : 'max-w-md'} w-full shadow-2xl overflow-hidden`}>
            {/* Header: gradient like other modals */}
            <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-gray-200 flex items-start justify-between`}>
              <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
                <div className={`${isMobile ? 'p-2' : 'p-2.5'} rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm`}>
                  <AlertCircle className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-gray-700`} />
                </div>
                <div>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>Eliminar entrada</h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Confirmación requerida</p>
                </div>
              </div>
              <button
                onClick={closeConfirm}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={isMobile ? "p-4" : "p-6"}>
              <div className={`bg-gray-50 rounded-xl ${isMobile ? 'p-4' : 'p-5'} border border-gray-200 shadow-sm`}>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-700 ${isMobile ? 'mb-4' : 'mb-5'} text-center`}>
                  ¿Está seguro de que desea eliminar esta entrada de la lista negra?
                </p>
                {confirmEntry && (
                  <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm">{confirmEntry.visitorName}</p>
                    <p className="text-xs text-gray-600">{confirmEntry.identifier}</p>
                  </div>
                )}

                <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                  <button
                    onClick={() => { if (!confirmDeleting) closeConfirm(); }}
                    disabled={confirmDeleting}
                    className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-5 py-2.5'} text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium flex-1 disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => { confirmDelete(); }}
                    disabled={confirmDeleting}
                    className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-5 py-2.5'} text-white bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow hover:from-gray-800 hover:to-gray-900 transition-all font-medium flex-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {confirmDeleting ? (
                      <>
                        <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      'Eliminar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar entrada - Modernizado */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className={`bg-white rounded-3xl ${isMobile ? 'max-w-sm' : 'max-w-2xl'} w-full shadow-2xl animate-slideUp max-h-[92vh] overflow-hidden`}>
            {/* Decorative Header Background */}
            <div className="relative overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-600/30 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-600/20 rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
              </div>
              
              {/* Header Content */}
              <div className={`relative ${isMobile ? 'px-6 py-6' : 'px-8 py-8'}`}>
                <div className="flex items-start justify-between">
                  <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                    <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20`}>
                      <ShieldBan className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-white`} />
                    </div>
                    <div>
                      <h3 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-1`}>
                        {isMobile ? 'Agregar a Lista' : 'Agregar a Lista Negra'}
                      </h3>
                      <p className="text-slate-300 text-sm">Restringir acceso a las instalaciones</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/20 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAdd} className={`${isMobile ? 'p-6 space-y-6' : 'p-8 space-y-8'} overflow-y-auto max-h-[calc(92vh-180px)]`}>
              {/* Photo Upload Section - Rediseñada */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Foto del Visitante</h3>
                    <p className="text-xs text-slate-500">Identificación visual (opcional)</p>
                  </div>
                </div>
                
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center gap-6`}>
                  {/* Vista previa de la imagen */}
                  <div className="relative group">
                    {newEntry.photo ? (
                      <div className="relative">
                        <div className={`${isMobile ? 'w-28 h-28' : 'w-32 h-32'} rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-2 ring-slate-200`}>
                          <img
                            src={newEntry.photo}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewEntry({ ...newEntry, photo: '' })}
                          className="absolute -top-2 -right-2 w-9 h-9 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-all shadow-lg hover:scale-110 transform"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className={`${isMobile ? 'w-28 h-28' : 'w-32 h-32'} rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-4 border-white shadow-xl ring-2 ring-slate-200`}>
                        <Camera className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} text-slate-400`} />
                      </div>
                    )}
                  </div>

                  {/* Botón de carga mejorado */}
                  <div className="flex-1 space-y-3 w-full">
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
                      className={`w-full ${isMobile ? 'px-4 py-3' : 'px-5 py-3.5'} bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
                    >
                      <Upload className="w-5 h-5" />
                      {newEntry.photo ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    <div className="flex items-start gap-2 bg-white/70 rounded-lg p-3 border border-slate-200">
                      <svg className="w-4 h-4 text-slate-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <p className="font-medium mb-1">Formatos permitidos:</p>
                        <p>JPG, PNG o GIF • Máximo 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Visitante - Rediseñada */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <UserX className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Datos del Visitante</h3>
                    <p className="text-xs text-slate-500">Información de identificación</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Nombre del visitante */}
                  <div className="space-y-2">
                    <label htmlFor="visitorName" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="visitorName"
                        value={newEntry.visitorName}
                        onChange={(e) => setNewEntry({ ...newEntry, visitorName: e.target.value })}
                        className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all outline-none bg-white placeholder:text-slate-400 text-slate-800 font-medium shadow-sm"
                        placeholder="Nombre completo del visitante"
                        required
                      />
                      {newEntry.visitorName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        id="email"
                        value={newEntry.email}
                        onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all outline-none bg-white placeholder:text-slate-400 text-slate-800 font-medium shadow-sm"
                        placeholder="correo@ejemplo.com"
                        required
                      />
                      {newEntry.email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivo - Sección separada */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200/60 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Motivo de Restricción</h3>
                    <p className="text-xs text-slate-500">Por qué se agrega a la lista negra</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="reason" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                    Descripción del motivo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={newEntry.reason}
                    onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                    className="w-full px-4 py-3.5 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none bg-white placeholder:text-slate-400 text-slate-800 font-medium shadow-sm resize-none"
                    rows={isMobile ? 3 : 4}
                    placeholder="Describe el motivo por el cual se agrega a la lista negra..."
                    required
                  />
                </div>
              </div>

              {/* Buttons - Rediseñados */}
              <div className="flex gap-4 pt-6 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`flex-1 ${isMobile ? 'px-4 py-3' : 'px-6 py-3.5'} border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 font-semibold transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02] hover:-translate-y-0.5`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className={`flex-1 ${isMobile ? 'px-4 py-3' : 'px-6 py-3.5'} bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-900 hover:to-slate-950 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 transform hover:scale-[1.02] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {addSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Agregando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldBan className="w-5 h-5" />
                      <span>Agregar a Lista</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Error - Modernizado */}
      {errorAlert?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            {/* Header con gradiente gris */}
            <div className="relative p-8 rounded-t-2xl bg-gradient-to-br from-gray-900 to-gray-700">
              <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
              <div className="relative flex items-start justify-between text-white">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                    <AlertCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">Error al agregar</h3>
                    <p className="text-sm text-white/90 mt-1">No se pudo completar la operación</p>
                  </div>
                </div>
                <button
                  onClick={() => setErrorAlert(null)}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 rounded-b-2xl bg-white">
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                {errorAlert.message}
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setErrorAlert(null)}
                  className="px-6 py-2.5 text-white bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 rounded-xl shadow-md hover:shadow-lg transition-all font-medium"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </motion.div>
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