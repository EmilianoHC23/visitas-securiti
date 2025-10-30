// Modal de vista previa de usuario
const UserPreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}> = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 border-b border-gray-700 flex items-start justify-between text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shadow-sm ring-1 ring-white/20">
                            <FaUser className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Detalle de usuario</h3>
                            <p className="text-sm text-gray-200">Información básica del usuario</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-200 hover:text-white p-2 rounded-lg transition-colors"
                        title="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0">
                                <span className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-200">
                                    {/* Always render both image and fallback. Control visibility via inline styles and handlers. */}
                                    <img
                                        src={user.profileImage || ''}
                                        alt={`${user.firstName} ${user.lastName}`}
                                        className="w-28 h-28 object-cover"
                                        onError={e => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                            const fallback = img.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'inline-flex';
                                        }}
                                        onLoad={e => {
                                            const img = e.target as HTMLImageElement;
                                            // If loaded successfully, ensure img is visible and fallback hidden
                                            img.style.display = 'inline';
                                            const fallback = img.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'none';
                                        }}
                                        style={{ display: user.profileImage && user.profileImage.trim() !== '' ? 'inline' : 'none' }}
                                    />
                                    <FaUser className="w-16 h-16 text-blue-300" style={{ display: user.profileImage && user.profileImage.trim() !== '' ? 'none' : 'inline-flex' }} />
                                </span>
                            </div>

                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 mb-3">Datos generales</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-gray-700">
                                    <div>
                                        <span className="font-semibold block">Nombre</span>
                                        <div className="mt-1 text-sm text-gray-800">{user.firstName}</div>
                                    </div>
                                    <div>
                                        <span className="font-semibold block">Apellido</span>
                                        <div className="mt-1 text-sm text-gray-800">{user.lastName}</div>
                                    </div>
                                    <div>
                                        <span className="font-semibold block">Correo electrónico</span>
                                        <div className="mt-1 text-sm text-gray-800 break-words">{user.email}</div>
                                    </div>
                                    <div>
                                        <span className="font-semibold block">Rol de usuario</span>
                                        <div className="mt-1"><RoleBadge role={user.role} /></div>
                                    </div>
                                    <div className="md:col-span-2 mt-4">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Permisos</h5>
                                        <div className="flex flex-wrap">
                                            {ROLE_PERMISSIONS[user.role]?.map(p => (
                                                <PermissionBadge key={p} permission={p} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { LogoutIcon, SettingsIcon } from '../../components/common/icons';
import { FaUser, FaAddressBook, FaShieldAlt } from 'react-icons/fa';
import { MdEditNote } from 'react-icons/md';
import { FaRegUser, FaUsers } from 'react-icons/fa6';
import { FiShield, FiMail } from 'react-icons/fi';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { User, UserRole } from '../../types';
import * as api from '../../services/api';

// Reusable confirm dialog (Tailwind based, styled like example)
const ConfirmDialog: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    showSecondary?: boolean;
    onClose: () => void;
    onPrimary: () => void;
    onSecondary?: () => void;
    icon?: React.ReactNode;
}> = ({ isOpen, title, message, primaryLabel = 'Confirmar', secondaryLabel = 'Cancelar', showSecondary = false, onClose, onPrimary, onSecondary, icon }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">
                {/* Header: gradient like other modals */}
                <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 border-b border-gray-700 flex items-start justify-between text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shadow-sm ring-1 ring-white/20">
                            {/* Warning icon */}
                            {icon || (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                            <p className="text-sm text-indigo-100">{/* small subtitle if needed */}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-200 hover:text-white p-2 rounded-lg transition-colors"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                        <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{message}</p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => { onClose(); }}
                                className="px-4 py-2 min-w-[120px] text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                {secondaryLabel}
                            </button>

                            <button
                                onClick={() => { onPrimary(); }}
                                className="px-4 py-2 min-w-[120px] text-white bg-gradient-to-r from-gray-900 to-gray-600 rounded-lg shadow hover:from-gray-800 hover:to-gray-500"
                            >
                                {primaryLabel}
                            </button>
                        </div>

                        {showSecondary && onSecondary && (
                            <div className="mt-6">
                                <button
                                    onClick={() => { onSecondary(); }}
                                    className="w-full px-4 py-3 text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    Eliminar permanentemente
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple notification banner (top-center)
const NotificationBanner: React.FC<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }> = ({ message, type, onClose }) => {
    const bg = type === 'success' ? 'bg-green-50 border-green-200' : type === 'error' ? 'bg-red-50 border-red-200' : type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200';
    const text = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : type === 'warning' ? 'text-yellow-800' : 'text-blue-800';
    return (
        <div className={`fixed left-1/2 -translate-x-1/2 top-6 z-[60] ${bg} border p-3 rounded-md shadow-md`}> 
            <div className={`flex items-start gap-3 ${text}`}>
                <span className="flex-shrink-0 mt-0.5">
                    {type === 'success' && <CheckCircleOutlineIcon fontSize="small" className="text-green-600" />}
                    {type === 'error' && <ErrorOutlineIcon fontSize="small" className="text-red-600" />}
                    {type === 'warning' && <WarningAmberOutlinedIcon fontSize="small" className="text-yellow-600" />}
                    {type === 'info' && <InfoOutlinedIcon fontSize="small" className="text-blue-600" />}
                </span>
                <div className="flex-1 text-sm">{message}</div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
        </div>
    );
};

interface NewUserData {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

interface EditUserData {
    firstName: string;
    lastName: string;
    role: UserRole;
    email: string;
}

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const roleStyles: Record<UserRole, string> = {
    // Admin: dark blue for a stronger, professional tone (slight transparency)
    [UserRole.ADMIN]: 'bg-blue-900/80 text-white',
    // Reception: darker yellow/amber with slightly more transparency
    [UserRole.RECEPTION]: 'bg-amber-500/60 text-amber-900',
        // Host: slightly darker orange for better contrast (slight transparency)
        [UserRole.HOST]: 'bg-orange-300/80 text-orange-900',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleStyles[role]}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
    );
};

const formatPermissionLabel = (perm: string) => {
    // Expected format: Resource:action e.g. "Usuarios:ver"
    const parts = perm.split(':');
    if (parts.length !== 2) return perm;
    const [resource, action] = parts;

    // Map action -> human verb phrase
    const actionMap: Record<string, string> = {
        ver: 'ver',
        editar: 'editar',
        registrar: 'registrar',
        acceder: 'acceder',
        enviar: 'enviar'
    };

    const verb = actionMap[action] || action;

    // Lowercase resource for natural reading
    const resourceLabel = resource.toLowerCase();

    return `Puede ${verb} ${resourceLabel}`;
};

const PermissionBadge: React.FC<{ permission: string }> = ({ permission }) => (
    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 mr-2 mb-1">
        {formatPermissionLabel(permission)}
    </span>
);

// Map role -> permissions (example granular permissions; adapt to real backend permissions later)
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: ['Usuarios:ver', 'Usuarios:editar', 'Visitas:ver', 'Configuración:acceder'],
    [UserRole.RECEPTION]: ['Visitas:ver', 'Visitas:registrar', 'Invitaciones:enviar'],
    [UserRole.HOST]: ['Visitas:ver', 'Invitaciones:ver']
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusStyles: Record<string, string> = {
        'registered': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'none': 'bg-gray-100 text-gray-800',
    };
    const statusLabels: Record<string, string> = {
        'registered': 'Registrado',
        'pending': 'Pendiente',
        'none': 'Sin Invitar',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.none}`}>{statusLabels[status] || 'Sin Invitar'}</span>
};

// RoleSelect: custom dropdown that shows an icon for the selected role and for each option
const RoleSelect: React.FC<{ value: UserRole; onChange: (r: UserRole) => void }> = ({ value, onChange }) => {
    const options: { value: UserRole; label: string; icon: React.ReactNode }[] = [
        { value: UserRole.HOST, label: 'Host', icon: <FaUser className="w-4 h-4" /> },
        { value: UserRole.RECEPTION, label: 'Recepcionista', icon: <FaAddressBook className="w-4 h-4" /> },
        { value: UserRole.ADMIN, label: 'Administrador', icon: <FaShieldAlt className="w-4 h-4" /> },
    ];

    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!(e.target instanceof Node)) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const selected = options.find(o => o.value === value) || options[0];

    return (
        <div className="relative" ref={ref}>
            <button type="button" onClick={() => setOpen(s => !s)} className="w-full text-left pl-10 pr-3 py-3 border border-gray-100 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{selected.icon}</span>
                <span className="flex-1">{selected.label}</span>
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            {open && (
                <ul className="absolute left-0 right-0 mt-2 bg-white shadow-lg border border-gray-100 rounded-md overflow-hidden z-50">
                    {options.map(o => (
                        <li key={o.value}>
                            <button
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-100 ${o.value === value ? 'bg-gray-100' : ''}`}
                            >
                                <span className="text-gray-600">{o.icon}</span>
                                <span className="flex-1 text-sm text-gray-800">{o.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const InviteUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onInvite: (userData: NewUserData) => void;
    loading: boolean;
}> = ({ isOpen, onClose, onInvite, loading }) => {
    const initialFormData: NewUserData = {
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.HOST,
    };

    const [formData, setFormData] = useState<NewUserData>(initialFormData);

    // Reset form whenever the modal is opened so fields are empty for a new invite
    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onInvite(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.name === 'role' ? (value as unknown as UserRole) : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 border-b border-gray-700 flex items-start justify-between text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shadow-sm ring-1 ring-white/20">
                            {/* Decorative user icon (react-icons) */}
                            <FaUser className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Invitar Nuevo Usuario</h3>
                            <p className="text-sm text-indigo-100">Envía una invitación por correo para crear acceso al sistema</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-200 hover:text-white p-2 rounded-lg transition-colors"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-700 ring-1 ring-gray-50">
                                    <MdEditNote className="w-5 h-5" />
                                </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800">Datos del usuario</h4>
                                <p className="text-xs text-gray-500">Rellena la información básica para enviar la invitación</p>
                            </div>
                        </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <FaRegUser className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                            <div>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-100 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                {/* Mail icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a3 3 0 003.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                placeholder="correo@ejemplo.com"
                                required
                            />
                        </div>
                    </div>

                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <div className="relative">
                            {/* Custom RoleSelect shows icon in the control and icons in the menu */}
                            <RoleSelect
                                value={formData.role}
                                onChange={(r: UserRole) => setFormData(prev => ({ ...prev, role: r }))}
                            />
                        </div>
                    </div>

                    </div>
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-gradient-to-r from-gray-900 to-gray-600 rounded-lg shadow hover:from-gray-800 hover:to-gray-500 disabled:opacity-60"
                        >
                            {loading ? 'Invitando...' : 'Invitar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (userData: EditUserData) => void;
    loading: boolean;
    user: User | null;
}> = ({ isOpen, onClose, onUpdate, loading, user }) => {
    const [formData, setFormData] = useState<EditUserData>({
        firstName: '',
        lastName: '',
        role: UserRole.HOST,
        email: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                email: user.email,
            });
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 border-b border-gray-700 flex items-start justify-between text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shadow-sm ring-1 ring-white/20">
                            <MdEditNote className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Editar Usuario</h3>
                            <p className="text-sm text-indigo-100">Actualiza la información básica del usuario</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-200 hover:text-white p-2 rounded-lg transition-colors"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-700 ring-1 ring-gray-50">
                                <MdEditNote className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800">Datos del usuario</h4>
                                <p className="text-xs text-gray-500">Rellena la información básica para actualizar al usuario</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <FaRegUser className="w-5 h-5" />
                                    </span>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                <div>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-100 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <FiMail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                            <div className="relative">
                                <RoleSelect
                                    value={formData.role}
                                    onChange={(r: UserRole) => setFormData(prev => ({ ...prev, role: r }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-gradient-to-r from-gray-900 to-gray-600 rounded-lg shadow hover:from-gray-800 hover:to-gray-500 disabled:opacity-60"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState<any>(null);

    // Notification/banner state
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // We'll use CSS :hover for row highlight (no JS state needed)

    // Estado para la vista previa
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewUser, setPreviewUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersData = await api.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInviteUser = async (userData: NewUserData) => {
        try {
            setInviteLoading(true);
            await api.sendInvitation({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role
            });
            setIsModalOpen(false);
            // Refrescar la lista de usuarios para mostrar el nuevo usuario invitado
            await fetchUsers();
            setNotification({ message: 'Invitación enviada exitosamente. El usuario aparecerá en la tabla con estatus "Pendiente".', type: 'success' });
        } catch (error) {
            console.error('Error sending invitation:', error);
            setNotification({ message: 'Error al enviar invitación. Revisa la consola para más detalles.', type: 'error' });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (userData: EditUserData) => {
        if (!editingUser) return;

        try {
            setEditLoading(true);
            const updatedUser = await api.updateUser(editingUser._id, userData);
            setUsers(prev => prev.map(user => 
                user._id === editingUser._id ? updatedUser : user
            ));
            setIsEditModalOpen(false);
            setEditingUser(null);
            setNotification({ message: 'Usuario actualizado exitosamente', type: 'success' });
        } catch (error) {
            console.error('Error updating user:', error);
            setNotification({ message: 'Error al actualizar usuario', type: 'error' });
        } finally {
            setEditLoading(false);
        }
    };
    // Open a confirm dialog with data describing the action
    const openConfirm = (data: any) => {
        setConfirmData(data);
        setConfirmOpen(true);
    };

    const closeConfirm = () => {
        setConfirmOpen(false);
        setConfirmData(null);
    };

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type });
        window.setTimeout(() => setNotification(null), 4500);
    };

    const handleConfirmPrimary = async () => {
        if (!confirmData) return closeConfirm();
        const { type, user } = confirmData;
        try {
            if (type === 'resend') {
                await api.resendInvitation(user._id);
                showNotification('Invitación reenviada exitosamente', 'success');
            } else if (type === 'delete-invite') {
                await api.deleteInvitation(user._id);
                showNotification('Invitación eliminada exitosamente. Puedes reutilizar este correo.', 'success');
            } else if (type === 'deactivate') {
                await api.deactivateUser(user._id);
                showNotification('Usuario desactivado exitosamente.', 'success');
            } else if (type === 'delete') {
                await api.deleteUser(user._id);
                showNotification('Usuario eliminado completamente del sistema.', 'success');
            }
            await fetchUsers();
        } catch (err) {
            console.error('Error performing action:', err);
            showNotification('Ocurrió un error. Revisa la consola.', 'error');
        } finally {
            closeConfirm();
        }
    };

    const handleConfirmSecondary = async () => {
        // Used for explicit "Eliminar permanentemente" button on the dialog
        if (!confirmData) return closeConfirm();
        const { user } = confirmData;
        try {
            await api.deleteUser(user._id);
            showNotification('Usuario eliminado completamente del sistema.', 'success');
            await fetchUsers();
        } catch (err) {
            console.error('Error deleting user permanently:', err);
            showNotification('Error al eliminar usuario.', 'error');
        } finally {
            closeConfirm();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-md">
                        <FaUsers className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 font-semibold text-white bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 rounded-lg shadow-md hover:from-gray-800 hover:via-gray-700 hover:to-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-transform"
                >
                    Invitar Usuario
                </button>
            </div>
            
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100">
                {loading ? (
                     <div className="text-center p-8">Cargando usuarios...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Foto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Rol</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estatus</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user, rowIndex) => (
                                <tr
                                    key={user._id}
                                    className="group bg-white even:bg-gray-50 border-b cursor-pointer transition-colors hover:bg-blue-100 focus-within:bg-blue-100"
                                    onClick={e => {
                                        // Evitar que los botones de acción abran el modal
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        setPreviewUser(user);
                                        setIsPreviewModalOpen(true);
                                    }}
                                >
                                    <td className="px-6 py-4 align-middle transition-colors group-hover:bg-blue-100">
                                        <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-gray-200">
                                            <img
                                                src={user.profileImage || ''}
                                                alt={`${user.firstName} ${user.lastName}`}
                                                className="w-10 h-10 object-cover"
                                                onError={e => {
                                                    const img = e.target as HTMLImageElement;
                                                    img.style.display = 'none';
                                                    const fallback = img.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'inline-flex';
                                                }}
                                                onLoad={e => {
                                                    const img = e.target as HTMLImageElement;
                                                    img.style.display = 'inline';
                                                    const fallback = img.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'none';
                                                }}
                                                style={{ display: user.profileImage && user.profileImage.trim() !== '' ? 'inline' : 'none' }}
                                            />
                                            <FaUser className="w-7 h-7 text-gray-400" style={{ display: user.profileImage && user.profileImage.trim() !== '' ? 'none' : 'inline-flex' }} />
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap transition-colors group-hover:bg-blue-100">
                                        {user.firstName} {user.lastName}
                                    </td>
                                    <td className="px-6 py-4 transition-colors group-hover:bg-blue-100">{user.email}</td>
                                    <td className="px-6 py-4 transition-colors group-hover:bg-blue-100">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4 transition-colors group-hover:bg-blue-100">
                                        <StatusBadge status={user.invitationStatus || 'none'} />
                                    </td>
                                    <td className="px-6 py-4 text-right transition-colors group-hover:bg-blue-100">
                                        <div className="flex justify-end items-center space-x-2">
                                            {user.invitationStatus === 'pending' && (
                                                <button 
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        openConfirm({
                                                            type: 'resend',
                                                            title: 'Reenviar invitación',
                                                            message: '¿Estás seguro de que quieres reenviar la invitación a este usuario?',
                                                            user
                                                        });
                                                    }}
                                                    className="p-2 text-blue-600 hover:text-blue-800 rounded hover:bg-gray-100 transition"
                                                    title="Reenviar invitación"
                                                >
                                                    {/* Heroicons outline: Envelope + Arrow Right (forward email) */}
                                                    <span className="relative inline-block w-5 h-5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-0 top-0 w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.5 7.5a2.25 2.25 0 01-3.182 0l-7.5-7.5A2.25 2.25 0 012.25 6.993V6.75" />
                                                        </svg>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute right-0 bottom-0 w-3 h-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-3-3m3 3l-3 3" />
                                                        </svg>
                                                    </span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={e => { e.stopPropagation(); handleEditUser(user); }}
                                                className="p-2 text-green-600 hover:text-green-800 rounded hover:bg-gray-100 transition"
                                                title="Editar usuario"
                                            >
                                                {/* Heroicons outline: Pencil Square */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.687-4.5 12.175-13.013z" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={e => { 
                                                    e.stopPropagation();
                                                    // Decide dialog type based on invitationStatus
                                                    if (user.invitationStatus === 'pending' || user.invitationStatus === 'none') {
                                                        openConfirm({
                                                            type: 'delete-invite',
                                                            title: 'Eliminar invitación',
                                                            message: '¿Estás seguro de que quieres eliminar esta invitación? El usuario será eliminado permanentemente y podrás reutilizar este correo.',
                                                            user
                                                        });
                                                    } else {
                                                        // For registered users, ask whether deactivate or delete
                                                        openConfirm({
                                                            type: 'deactivate',
                                                            title: '¿Qué deseas hacer con este usuario?',
                                                            message: 'Puedes desactivar al usuario (será inactivable y podrá reactivarse) o eliminarlo completamente. Usa "Confirmar" para desactivar o "Eliminar permanentemente" para borrarlo.',
                                                            user
                                                        });
                                                    }
                                                }}
                                                className="p-2 text-red-600 hover:text-red-800 rounded hover:bg-gray-100 transition"
                                                title="Eliminar usuario"
                                            >
                                                {/* Heroicons outline: X-Mark (tache) */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
            {/* Modal de vista previa de usuario */}
            <UserPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                user={previewUser}
            />
                        </tbody>
                    </table>
                )}
            </div>

            <InviteUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onInvite={handleInviteUser}
                loading={inviteLoading}
            />

            {/* Confirm dialog used for delete/resend actions */}
            <ConfirmDialog
                isOpen={confirmOpen}
                title={confirmData?.title || ''}
                message={confirmData?.message || ''}
                primaryLabel={confirmData?.type === 'deactivate' ? 'Desactivar' : confirmData?.type === 'resend' ? 'Reenviar' : 'Confirmar'}
                secondaryLabel="Cancelar"
                showSecondary={confirmData?.type === 'deactivate'}
                onClose={() => closeConfirm()}
                onPrimary={() => handleConfirmPrimary()}
                onSecondary={() => handleConfirmSecondary()}
            />

            {notification && (
                <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
            )}

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                }}
                onUpdate={handleUpdateUser}
                loading={editLoading}
                user={editingUser}
            />
        </div>
    );
};
