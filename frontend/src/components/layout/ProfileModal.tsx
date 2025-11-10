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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-br from-slate-800 to-slate-700 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Mi Perfil</h2>
                                <p className="text-sm text-slate-300">Actualiza tu información personal</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                            disabled={loading}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Foto de perfil */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-700">
                                Foto de perfil
                            </label>
                            <div className="flex items-center gap-4">
                                {/* Vista previa de la imagen */}
                                <div className="relative">
                                    {previewImage ? (
                                        <div className="relative w-24 h-24">
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                                disabled={loading}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center border-4 border-slate-300">
                                            <User className="w-10 h-10 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Botón de carga */}
                                <div className="flex-1">
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
                                        className="px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={loading}
                                    >
                                        <Upload className="w-4 h-4" />
                                        Cambiar foto
                                    </button>
                                    <p className="text-xs text-slate-500 mt-2">
                                        JPG, PNG o GIF. Máximo 5MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Información del usuario */}
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700">Información del usuario</h3>
                                    <p className="text-xs text-slate-500">Actualiza los datos del usuario</p>
                                </div>
                            </div>

                            {/* Nombre y Apellido */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nombre */}
                                <div className="space-y-2">
                                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Ingresa tu nombre"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                {/* Apellido */}
                                <div className="space-y-2">
                                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                                        Apellido <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Ingresa tu apellido"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer con botones */}
                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Guardando...
                                    </span>
                                ) : (
                                    'Guardar cambios'
                                )}
                            </button>
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
