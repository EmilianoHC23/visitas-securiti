import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import { ImageCropModal } from '../common/ImageCropModal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSuccess, onError }) => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        profileImage: '',
    });
    const [previewImage, setPreviewImage] = useState<string>('');
    const [tempImage, setTempImage] = useState<string>(''); // Imagen temporal antes de recortar
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Inicializar datos del formulario cuando se abre el modal
    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                profileImage: user.profileImage || '',
            });
            setPreviewImage(user.profileImage || '');
        }
    }, [isOpen, user]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                onError?.('La imagen no debe superar los 5MB');
                return;
            }

            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                onError?.('Solo se permiten archivos JPG, PNG o GIF');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setTempImage(base64);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropSave = (croppedImage: string) => {
        setPreviewImage(croppedImage);
        setFormData(prev => ({ ...prev, profileImage: croppedImage }));
        setIsCropModalOpen(false);
        setTempImage('');
        // Limpiar el input file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropCancel = () => {
        setIsCropModalOpen(false);
        setTempImage('');
        // Limpiar el input file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage('');
        setFormData(prev => ({ ...prev, profileImage: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            onError?.('El nombre y apellido son obligatorios');
            return;
        }

        setLoading(true);
        try {
            const response = await api.updateUser(user?._id || '', {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                profileImage: formData.profileImage,
            });

            // Actualizar el contexto de autenticación con los nuevos datos
            if (response) {
                updateUser(response);
            }

            onSuccess?.('Perfil actualizado correctamente');
            onClose();
        } catch (error: any) {
            console.error('Error al actualizar perfil:', error);
            onError?.(error.response?.data?.message || 'Error al actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden"
                >
                    {/* Decorative Header Background */}
                    <div className="relative overflow-hidden">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-600/30 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-600/20 rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
                        </div>
                        
                        {/* Header Content */}
                        <div className="relative px-8 py-8">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-1">Mi Perfil</h2>
                                        <p className="text-slate-300 text-sm">Gestiona tu información personal</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/20 text-white"
                                    disabled={loading}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* User info preview */}
                            {user && (
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/20">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                                            <p className="text-slate-300 text-sm">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-medium text-white border border-white/30">
                                        {user.role === 'admin' ? '👑 Admin' : user.role === 'host' ? '🏢 Host' : '📋 Recepción'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(92vh-240px)]">
                        {/* Foto de perfil - Sección destacada */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Foto de Perfil</h3>
                                    <p className="text-xs text-slate-500">Tu imagen personal en el sistema</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                {/* Vista previa de la imagen - Mejorada */}
                                <div className="relative group">
                                    {previewImage ? (
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-2 ring-slate-200">
                                                <img
                                                    src={previewImage}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute -top-2 -right-2 w-9 h-9 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-all shadow-lg hover:scale-110 transform"
                                                disabled={loading}
                                                title="Eliminar foto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-4 border-white shadow-xl ring-2 ring-slate-200">
                                            <User className="w-14 h-14 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Botón de carga mejorado */}
                                <div className="flex-1 space-y-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/jpeg,image/png,image/gif"
                                        className="hidden"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full px-5 py-3.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                                        disabled={loading}
                                    >
                                        <Upload className="w-5 h-5" />
                                        {previewImage ? 'Cambiar foto' : 'Subir foto'}
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

                        {/* Información del usuario - Rediseñada */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Información Personal</h3>
                                    <p className="text-xs text-slate-500">Actualiza tus datos básicos</p>
                                </div>
                            </div>

                            {/* Nombre y Apellido - Grid mejorado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Nombre */}
                                <div className="space-y-2">
                                    <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="Tu nombre"
                                            className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed bg-white placeholder:text-slate-400 text-slate-800 font-medium shadow-sm"
                                            required
                                            disabled={loading}
                                        />
                                        {formData.firstName && (
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

                                {/* Apellido */}
                                <div className="space-y-2">
                                    <label htmlFor="lastName" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                                        Apellido <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Tu apellido"
                                            className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed bg-white placeholder:text-slate-400 text-slate-800 font-medium shadow-sm"
                                            required
                                            disabled={loading}
                                        />
                                        {formData.lastName && (
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

                        {/* Footer con botones rediseñados */}
                        <div className="flex gap-4 pt-6 mt-2">
                            <motion.button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md"
                                disabled={loading}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancelar
                            </motion.button>
                            <motion.button
                                type="submit"
                                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-900 hover:to-slate-950 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl"
                                disabled={loading}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2.5">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Guardando cambios...
                                    </span>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Guardar cambios</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>

                {/* Modal de recorte de imagen */}
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    imageSrc={tempImage}
                    onClose={handleCropCancel}
                    onSave={handleCropSave}
                />
            </div>
        </AnimatePresence>
    );
};
