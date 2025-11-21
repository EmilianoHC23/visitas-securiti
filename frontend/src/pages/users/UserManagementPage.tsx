import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Users, FileText, UserPlus, Mail, Upload, Trash2, X, Shield, ChevronDown, CheckCircle, AlertCircle, Info, AlertTriangle, Camera, Search, Filter } from 'lucide-react';
import { LiaUserTieSolid } from "react-icons/lia";
import { PiUserPlusBold, PiUserCircleLight, PiUserList } from "react-icons/pi";
import { BiMailSend } from "react-icons/bi";
import { User, UserRole } from '../../types';
import * as api from '../../services/api';
import { useSearchParams } from 'react-router-dom';

// Modal de vista previa de usuario - Modernizado
const UserPreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}> = memo(({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
            >
                <div className="relative p-6 bg-gradient-to-br from-gray-900 to-gray-700">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative flex items-start justify-between text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                                <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Detalle de usuario</h3>
                                <p className="text-sm text-white/90">Información básica del usuario</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200/50 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-200">
                                    {user.profileImage ? (
                                        <img
                                            src={user.profileImage}
                                            alt={`${user.firstName} ${user.lastName}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="w-14 h-14 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Información */}
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Datos generales
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <span className="text-xs font-medium text-gray-500 block mb-1">Nombre completo</span>
                                        <div className="text-sm text-gray-900 font-medium">{user.firstName} {user.lastName}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <span className="text-xs font-medium text-gray-500 block mb-1">Correo electrónico</span>
                                        <div className="text-sm text-gray-900 font-medium break-words">{user.email}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <span className="text-xs font-medium text-gray-500 block mb-1">Rol de usuario</span>
                                        <div className="mt-1"><RoleBadge role={user.role} /></div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-200 md:col-span-1">
                                        <span className="text-xs font-medium text-gray-500 block mb-2">Permisos</span>
                                        <div className="flex flex-wrap gap-1">
                                            {ROLE_PERMISSIONS[user.role]?.slice(0, 2).map(p => (
                                                <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {p.split(':')[1]}
                                                </span>
                                            ))}
                                            {(ROLE_PERMISSIONS[user.role]?.length || 0) > 2 && (
                                                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                                    +{(ROLE_PERMISSIONS[user.role]?.length || 0) - 2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

// Reusable confirm dialog - Colores consistentes con SettingsPage
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
    variant?: 'dark' | 'danger';
}> = ({ isOpen, title, message, primaryLabel = 'Confirmar', secondaryLabel = 'Cancelar', showSecondary = false, onClose, onPrimary, onSecondary, icon, variant = 'dark' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
                {/* Header: dark by default, danger for destructive actions */}
                <div className={"relative p-8 rounded-t-2xl " + (variant === 'danger' ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gradient-to-br from-gray-900 to-gray-700')}>
                    {/* Ensure overlay respects header rounding to avoid visual artefacts */}
                    <div className="absolute inset-0 rounded-t-2xl bg-black/10 pointer-events-none"></div>
                    <div className="relative flex items-start justify-between text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                                {icon || (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 rounded-b-2xl bg-white">
                    <p className="text-sm text-gray-700 mb-6 whitespace-pre-line leading-relaxed">{message}</p>

                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => { onClose(); }}
                            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                        >
                            {secondaryLabel}
                        </button>

                        <button
                            onClick={() => { onPrimary(); }}
                            className={"px-6 py-2.5 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium " + (variant === 'danger' ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600')}
                        >
                            {primaryLabel}
                        </button>
                    </div>

                    {showSecondary && onSecondary && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => { onSecondary(); }}
                                className="w-full px-4 py-3 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-all font-medium"
                            >
                                Eliminar permanentemente
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// Floating toast notification (top-right) - unified with other pages
const NotificationBanner: React.FC<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }> = memo(({ message, type, onClose }) => {
    const config = {
        success: { bg: 'bg-emerald-600', iconBg: 'bg-emerald-700', text: 'text-white', icon: <CheckCircle className="w-5 h-5 text-white" /> },
        error: { bg: 'bg-red-600', iconBg: 'bg-red-700', text: 'text-white', icon: <AlertCircle className="w-5 h-5 text-white" /> },
        warning: { bg: 'bg-yellow-600', iconBg: 'bg-yellow-700', text: 'text-white', icon: <AlertTriangle className="w-5 h-5 text-white" /> },
        info: { bg: 'bg-blue-600', iconBg: 'bg-blue-700', text: 'text-white', icon: <Info className="w-5 h-5 text-white" /> }
    };
    const { bg, iconBg, text, icon } = config[type];

    useEffect(() => {
        const t = setTimeout(() => onClose(), 4500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="fixed top-4 right-4 z-[9999]"
            >
                <div className={`flex items-center gap-3 ${bg} rounded-lg px-4 py-3 shadow-lg max-w-md`}>
                    <div className={`${iconBg} w-8 h-8 rounded-full flex items-center justify-center`}>{icon}</div>
                    <div className={`text-sm font-medium ${text} flex-1`}>{message}</div>
                    <button onClick={onClose} className="text-white/90 hover:text-white ml-3">✕</button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

interface NewUserData {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profileImage?: string;
}

interface EditUserData {
    firstName: string;
    lastName: string;
    role: UserRole;
    email: string;
    profileImage?: string;
}

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const roleStyles: Record<UserRole, string> = {
    // Admin: dark blue for a stronger, professional tone (slight transparency)
    [UserRole.ADMIN]: 'bg-blue-600 text-white',
    // Reception: darker yellow/amber with slightly more transparency
    [UserRole.RECEPTION]: 'bg-amber-600 text-white',
        // Host: slightly darker orange for better contrast (slight transparency)
        [UserRole.HOST]: 'bg-orange-600 text-white',
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
        'registered': 'bg-green-600 text-white',
        'pending': 'bg-yellow-500 text-black',
        'none': 'bg-gray-600 text-white',
    };
    const statusLabels: Record<string, string> = {
        'registered': 'Registrado',
        'pending': 'Pendiente',
        'none': 'Sin Invitar',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.none}`}>{statusLabels[status] || 'Sin Invitar'}</span>
};

// RoleFilterDropdown: Dropdown animado para filtro de roles
const RoleFilterDropdown: React.FC<{ value: UserRole | 'all'; onChange: (r: UserRole | 'all') => void }> = memo(({ value, onChange }) => {
    const options: { value: UserRole | 'all'; label: string; icon: React.ReactNode }[] = [
        { value: 'all', label: 'Todos los roles', icon: <Filter className="w-4 h-4" /> },
        { value: UserRole.ADMIN, label: 'Administrador', icon: <Shield className="w-4 h-4" /> },
        { value: UserRole.RECEPTION, label: 'Recepcionista', icon: <Users className="w-4 h-4" /> },
        { value: UserRole.HOST, label: 'Host', icon: <UserIcon className="w-4 h-4" /> },
    ];

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.value === value) || options[0];

    const wrapper: any = {
        open: { scaleY: 1, opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.06 } },
        closed: { scaleY: 0, opacity: 0, transition: { when: 'afterChildren', staggerChildren: 0.04 } },
    };

    const item: any = {
        open: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
        closed: { opacity: 0, y: -6, transition: { duration: 0.12 } },
    };

    const chevron: any = { open: { rotate: 180 }, closed: { rotate: 0 } };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full text-left px-3 py-2.5 border border-gray-200 rounded-lg flex items-center gap-3 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm transition-all"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-gray-500 flex-shrink-0">{selected.icon}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{selected.label}</span>
                </div>
                <motion.span className="inline-block flex-shrink-0" variants={chevron} animate={open ? 'open' : 'closed'}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={wrapper}
                        style={{ transformOrigin: 'top' }}
                        className="absolute z-[100] mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-auto"
                    >
                        {options.map(o => (
                            <motion.button
                                key={o.value}
                                type="button"
                                variants={item}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors"
                            >
                                <span className="text-gray-500 flex-shrink-0">{o.icon}</span>
                                <span className="text-sm font-medium text-gray-800 flex-1">{o.label}</span>
                                {o.value === value && <CheckCircle className="w-4 h-4 text-gray-900 flex-shrink-0" />}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// StatusFilterDropdown: Dropdown animado para filtro de status
const StatusFilterDropdown: React.FC<{ value: 'all' | 'registered' | 'pending'; onChange: (s: 'all' | 'registered' | 'pending') => void }> = memo(({ value, onChange }) => {
    const options: { value: 'all' | 'registered' | 'pending'; label: string; icon: React.ReactNode; color: string }[] = [
        { value: 'all', label: 'Todos los status', icon: <Filter className="w-4 h-4" />, color: 'text-gray-600' },
        { value: 'registered', label: 'Registrado', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' },
        { value: 'pending', label: 'Pendiente', icon: <AlertCircle className="w-4 h-4" />, color: 'text-yellow-600' },
    ];

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.value === value) || options[0];

    const wrapper: any = {
        open: { scaleY: 1, opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.06 } },
        closed: { scaleY: 0, opacity: 0, transition: { when: 'afterChildren', staggerChildren: 0.04 } },
    };

    const item: any = {
        open: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
        closed: { opacity: 0, y: -6, transition: { duration: 0.12 } },
    };

    const chevron: any = { open: { rotate: 180 }, closed: { rotate: 0 } };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full text-left px-3 py-2.5 border border-gray-200 rounded-lg flex items-center gap-3 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm transition-all"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`flex-shrink-0 ${selected.color}`}>{selected.icon}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{selected.label}</span>
                </div>
                <motion.span className="inline-block flex-shrink-0" variants={chevron} animate={open ? 'open' : 'closed'}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={wrapper}
                        style={{ transformOrigin: 'top' }}
                        className="absolute z-[100] mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-auto"
                    >
                        {options.map(o => (
                            <motion.button
                                key={o.value}
                                type="button"
                                variants={item}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors"
                            >
                                <span className={`flex-shrink-0 ${o.color}`}>{o.icon}</span>
                                <span className="text-sm font-medium text-gray-800 flex-1">{o.label}</span>
                                {o.value === value && <CheckCircle className="w-4 h-4 text-gray-900 flex-shrink-0" />}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// RoleSelect: con animaciones de Framer Motion estilo AgendaPage
const RoleSelect: React.FC<{ value: UserRole; onChange: (r: UserRole) => void }> = memo(({ value, onChange }) => {
    const options: { value: UserRole; label: string; icon: React.ReactNode }[] = [
        { value: UserRole.HOST, label: 'Host', icon: <UserIcon className="w-4 h-4" /> },
        { value: UserRole.RECEPTION, label: 'Recepcionista', icon: <Users className="w-4 h-4" /> },
        { value: UserRole.ADMIN, label: 'Administrador', icon: <Shield className="w-4 h-4" /> },
    ];

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.value === value) || options[0];

    // Variants para animaciones
    const wrapper: any = {
        open: { scaleY: 1, opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.06 } },
        closed: { scaleY: 0, opacity: 0, transition: { when: 'afterChildren', staggerChildren: 0.04 } },
    };

    const item: any = {
        open: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
        closed: { opacity: 0, y: -6, transition: { duration: 0.12 } },
    };

    const chevron: any = { open: { rotate: 180 }, closed: { rotate: 0 } };

    return (
        <div className="relative" ref={ref}>
            <button 
                type="button" 
                onClick={() => setOpen(s => !s)} 
                className="w-full text-left pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm text-sm flex items-center gap-3 transition-all"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{selected.icon}</span>
                <span className="flex-1 text-gray-900 font-medium">{selected.label}</span>
                <motion.span className="inline-block" variants={chevron} animate={open ? 'open' : 'closed'}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial="closed" 
                        animate="open" 
                        exit="closed" 
                        variants={wrapper} 
                        style={{ transformOrigin: 'top' }} 
                        className="absolute left-0 right-0 mt-2 bg-white shadow-xl border border-gray-200 rounded-xl overflow-hidden z-50"
                    >
                        {options.map(o => (
                            <motion.button
                                key={o.value}
                                type="button"
                                variants={item}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${o.value === value ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}`}
                            >
                                <span className="text-gray-500">{o.icon}</span>
                                <span className="flex-1 text-sm font-medium">{o.label}</span>
                                {o.value === value && <CheckCircle className="w-4 h-4 text-gray-900" />}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export const InviteUserModal: React.FC<{
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
        profileImage: '',
    };

    const [formData, setFormData] = useState<NewUserData>(initialFormData);
    const [previewImage, setPreviewImage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form whenever the modal is opened so fields are empty for a new invite
    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setPreviewImage('');
        }
    }, [isOpen]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                const base64Image = event.target?.result as string;
                setPreviewImage(base64Image);
                setFormData(prev => ({ ...prev, profileImage: base64Image }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage('');
        setFormData(prev => ({ ...prev, profileImage: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                {/* Header con gradiente gris consistente con SettingsPage */}
                <div className="relative p-8 bg-gradient-to-br from-gray-900 to-gray-700">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative flex items-start justify-between text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                                <UserPlus className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Invitar Nuevo Usuario</h3>
                                <p className="text-sm text-white/90">Envía una invitación por correo para crear acceso al sistema</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                            aria-label="Cerrar"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* Sección de foto de perfil */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                            Foto de perfil
                        </label>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-200">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <PiUserCircleLight className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                {previewImage && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                                        title="Eliminar foto"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="profile-image-upload"
                                />
                                <label
                                    htmlFor="profile-image-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer font-medium"
                                >
                                    <Upload className="w-4 h-4" />
                                    {previewImage ? 'Cambiar foto' : 'Subir foto'}
                                </label>
                                <p className="text-xs text-gray-500 mt-2">
                                    JPG, PNG o GIF. Máximo 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Datos del usuario */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200/50 shadow-sm mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                                <PiUserList className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800">Información del usuario</h4>
                                <p className="text-xs text-gray-500">Completa los datos para enviar la invitación</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <UserIcon className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                        placeholder="Nombre"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    placeholder="Apellido"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rol del usuario</label>
                            <RoleSelect
                                value={formData.role}
                                onChange={(r: UserRole) => setFormData(prev => ({ ...prev, role: r }))}
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-white bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Invitando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <BiMailSend className="w-4 h-4" />
                                    Enviar Invitación
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
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
        profileImage: '',
    });
    const [previewImage, setPreviewImage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                email: user.email,
                profileImage: user.profileImage || '',
            });
            setPreviewImage(user.profileImage || '');
        }
    }, [user]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Máximo 5MB.');
                return;
            }

            if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
                alert('Solo se permiten archivos de imagen');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Image = event.target?.result as string;
                setPreviewImage(base64Image);
                setFormData(prev => ({ ...prev, profileImage: base64Image }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage('');
        setFormData(prev => ({ ...prev, profileImage: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                {/* Header con gradiente gris */}
                <div className="relative p-8 bg-gradient-to-br from-gray-900 to-gray-700">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative flex items-start justify-between text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Editar Usuario</h3>
                                <p className="text-sm text-white/90">Actualiza la información del usuario</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                            aria-label="Cerrar"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* Sección de foto de perfil */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                            Foto de perfil
                        </label>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-200">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <PiUserCircleLight className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                {previewImage && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                                        title="Eliminar foto"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="edit-profile-image-upload"
                                />
                                <label
                                    htmlFor="edit-profile-image-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer font-medium"
                                >
                                    <Upload className="w-4 h-4" />
                                    {previewImage ? 'Cambiar foto' : 'Subir foto'}
                                </label>
                                <p className="text-xs text-gray-500 mt-2">
                                    JPG, PNG o GIF. Máximo 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Datos del usuario */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200/50 shadow-sm mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                                <PiUserList className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800">Información del usuario</h4>
                                <p className="text-xs text-gray-500">Actualiza los datos del usuario</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <UserIcon className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rol del usuario</label>
                            <RoleSelect
                                value={formData.role}
                                onChange={(r: UserRole) => setFormData(prev => ({ ...prev, role: r }))}
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-white bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Actualizando...
                                </span>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export const UserManagementPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState<any>(null);

    // Notification/banner state
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Estado para la vista previa
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewUser, setPreviewUser] = useState<User | null>(null);

    // Estados para búsqueda y filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'pending'>('all');

    // Detect mobile
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const usersData = await api.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Detectar parámetro openInvite en la URL para abrir el modal automáticamente
    useEffect(() => {
        const openInvite = searchParams.get('openInvite');
        if (openInvite === 'true') {
            setIsModalOpen(true);
            // Limpiar el parámetro de la URL
            searchParams.delete('openInvite');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    const handleInviteUser = useCallback(async (userData: NewUserData) => {
        try {
            setInviteLoading(true);
            await api.sendInvitation({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                profileImage: userData.profileImage
            });
            setIsModalOpen(false);
            await fetchUsers();
            setNotification({ message: '✅ Invitación enviada exitosamente. El usuario aparecerá en la tabla con estatus "Pendiente".', type: 'success' });
        } catch (error) {
            console.error('Error sending invitation:', error);
            setNotification({ message: '❌ Error al enviar invitación. Revisa la consola para más detalles.', type: 'error' });
        } finally {
            setInviteLoading(false);
        }
    }, [fetchUsers]);

    const handleEditUser = useCallback((user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    }, []);

    const handleUpdateUser = useCallback(async (userData: EditUserData) => {
        if (!editingUser) return;

        try {
            setEditLoading(true);
            const updatedUser = await api.updateUser(editingUser._id, userData);
            setUsers(prev => prev.map(user => 
                user._id === editingUser._id ? updatedUser : user
            ));
            setIsEditModalOpen(false);
            setEditingUser(null);
            setNotification({ message: '✅ Usuario actualizado exitosamente', type: 'success' });
        } catch (error) {
            console.error('Error updating user:', error);
            setNotification({ message: '❌ Error al actualizar usuario', type: 'error' });
        } finally {
            setEditLoading(false);
        }
    }, [editingUser]);

    const openConfirm = useCallback((data: any) => {
        setConfirmData(data);
        setConfirmOpen(true);
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmOpen(false);
        setConfirmData(null);
    }, []);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type });
        window.setTimeout(() => setNotification(null), 4500);
    }, []);

    // Filtrar usuarios según búsqueda y filtros
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Filtro de búsqueda (nombre o email)
            const matchesSearch = searchTerm === '' || 
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtro de rol
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;

            // Filtro de status
            const userStatus = user.invitationStatus || 'none';
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'registered' && userStatus === 'registered') ||
                (statusFilter === 'pending' && userStatus === 'pending');

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const handleConfirmPrimary = useCallback(async () => {
        if (!confirmData) return closeConfirm();
        const { type, user } = confirmData;
        try {
            if (type === 'resend') {
                await api.resendInvitation(user._id);
                showNotification('Invitación reenviada exitosamente', 'success');
            } else if (type === 'delete-invite') {
                await api.deleteInvitation(user._id);
                showNotification('Usuario eliminado correctamente', 'success');
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
    }, [confirmData, closeConfirm, fetchUsers, showNotification]);

    const handleConfirmSecondary = useCallback(async () => {
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
    }, [confirmData, closeConfirm, fetchUsers, showNotification]);

    return (
        <div>
            {/* Header area modernizado - Colores consistentes con SettingsPage */}
            <div className={`mb-8 flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-start'} ${isMobile ? 'px-3' : 'px-6'}`}>
                <div className="flex items-start gap-3 md:gap-5">
                    <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <LiaUserTieSolid className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                    </div>
                    <div className="flex-1">
                        <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 mb-2`}>
                            {isMobile ? 'Usuarios' : 'Gestión de Usuarios'}
                        </h2>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 max-w-2xl leading-relaxed`}>
                            {isMobile 
                                ? 'Administra usuarios y permisos del sistema'
                                : 'Administra usuarios, asigna roles y permisos. Invita nuevos miembros, edita información o gestiona accesos del sistema.'
                            }
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`${isMobile ? 'w-full justify-center px-4 py-2.5 text-sm' : 'px-6 py-3'} group relative font-semibold text-white bg-gradient-to-br from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-all duration-200 transform hover:scale-105 flex-shrink-0`}
                >
                    <span className="inline-flex items-center gap-2">
                        <PiUserPlusBold className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                        <span>{isMobile ? 'Invitar' : 'Invitar Usuario'}</span>
                    </span>
                </button>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className={`mb-6 ${isMobile ? 'px-3' : 'px-6'} relative z-10`}>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-4">
                    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row gap-4 items-center'}`}>
                        {/* Barra de búsqueda */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o correo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white placeholder-gray-400 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Filtro por rol */}
                        <div className={isMobile ? 'w-full' : 'w-48'}>
                            <RoleFilterDropdown
                                value={roleFilter}
                                onChange={setRoleFilter}
                            />
                        </div>

                        {/* Filtro por status */}
                        <div className={isMobile ? 'w-full' : 'w-48'}>
                            <StatusFilterDropdown
                                value={statusFilter}
                                onChange={setStatusFilter}
                            />
                        </div>

                        {/* Contador de resultados */}
                        {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                            <div className={`${isMobile ? 'w-full text-center' : ''} flex items-center gap-2 text-sm text-gray-600`}>
                                <span className="font-medium">{filteredUsers.length}</span>
                                <span>resultado{filteredUsers.length !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>

                    {/* Botón para limpiar filtros */}
                    {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('all');
                                    setStatusFilter('all');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main card containing the table - modernizado con colores de SettingsPage */}
            <div className={`bg-white/80 backdrop-blur-sm ${isMobile ? 'p-3' : 'p-6'} rounded-2xl shadow-xl border border-gray-200/50 relative z-0`}>
                {isMobile ? (
                    // Vista móvil: Cards en lugar de tabla
                    <div className="space-y-3">
                        {loading ? (
                            <div className={`text-center ${isMobile ? 'py-12' : 'py-20'} bg-white rounded-2xl shadow-xl border border-gray-200`}>
                                <div className={`inline-block animate-spin rounded-full ${isMobile ? 'h-12 w-12 border-4' : 'h-16 w-16 border-4'} border-gray-200 border-t-gray-900`}></div>
                                <p className={`${isMobile ? 'mt-4 text-base' : 'mt-6 text-lg'} text-gray-600 font-medium`}>Cargando usuarios...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-200">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                                        ? 'Intenta ajustar los filtros de búsqueda' 
                                        : 'Comienza invitando a un nuevo usuario'}
                                </p>
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    onClick={() => {
                                        setPreviewUser(user);
                                        setIsPreviewModalOpen(true);
                                    }}
                                    className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-white flex-shrink-0">
                                            {user.profileImage ? (
                                                <img
                                                    src={user.profileImage}
                                                    alt={`${user.firstName} ${user.lastName}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UserIcon className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                                                {user.firstName} {user.lastName}
                                            </h3>
                                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <RoleBadge role={user.role} />
                                                <StatusBadge status={user.invitationStatus || 'none'} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        {user.invitationStatus === 'pending' && (
                                            <button 
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    openConfirm({ type: 'resend', title: 'Reenviar invitación', message: '¿Estás seguro de que quieres reenviar la invitación a este usuario?', user });
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-medium shadow-sm"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Reenviar
                                            </button>
                                        )}
                                        <button 
                                            onClick={e => { e.stopPropagation(); handleEditUser(user); }} 
                                            className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-xs font-medium shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.687-4.5 12.175-13.013z" />
                                            </svg>
                                            Editar
                                        </button>
                                        <button 
                                            onClick={e => { 
                                                e.stopPropagation(); 
                                                // Simplificar: todos los usuarios (pendientes o registrados) usan el modal simple de eliminación
                                                openConfirm({ 
                                                    type: 'delete-invite', 
                                                    title: 'Eliminar usuario', 
                                                    message: '¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.', 
                                                    user 
                                                }); 
                                            }} 
                                            className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-xs font-medium shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // Vista desktop: Tabla original
                    <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                        {loading ? (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200">
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-900"></div>
                                <p className="mt-6 text-lg text-gray-600 font-medium">Cargando usuarios...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-200">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg text-gray-500 font-medium">No se encontraron usuarios</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                                        ? 'Intenta ajustar los filtros de búsqueda' 
                                        : 'Comienza invitando a un nuevo usuario'}
                                </p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Foto</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Usuario</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Email</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Rol</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Estatus</th>
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredUsers.map((user, rowIndex) => (
                                        <tr
                                            key={user._id}
                                            className="group bg-white even:bg-gray-50/50 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent"
                                            onClick={e => {
                                                if ((e.target as HTMLElement).closest('button')) return;
                                                setPreviewUser(user);
                                                setIsPreviewModalOpen(true);
                                            }}
                                        >
                                            <td className="px-6 py-4 align-middle transition-all duration-200 group-hover:bg-transparent">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-white group-hover:ring-gray-300 transition-all">
                                                    {user.profileImage ? (
                                                        <img
                                                            src={user.profileImage}
                                                            alt={`${user.firstName} ${user.lastName}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <UserIcon className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap transition-all duration-200 group-hover:bg-transparent">
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className="px-6 py-4 transition-all duration-200 group-hover:bg-transparent text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 transition-all duration-200 group-hover:bg-transparent">
                                                <RoleBadge role={user.role} />
                                            </td>
                                            <td className="px-6 py-4 transition-all duration-200 group-hover:bg-transparent">
                                                <StatusBadge status={user.invitationStatus || 'none'} />
                                            </td>
                                            <td className="px-6 py-4 text-right transition-all duration-200 group-hover:bg-transparent">
                                                <div className="flex justify-end items-center space-x-2">
                                                    {user.invitationStatus === 'pending' && (
                                                        <button 
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                openConfirm({ type: 'resend', title: 'Reenviar invitación', message: '¿Estás seguro de que quieres reenviar la invitación a este usuario?', user });
                                                            }}
                                                            className="inline-flex items-center justify-center p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                                                            title="Reenviar invitación"
                                                        >
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
                                                        className="inline-flex items-center justify-center p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm" 
                                                        title="Editar usuario"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.687-4.5 12.175-13.013z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={e => { 
                                                        e.stopPropagation(); 
                                                        // Simplificar: todos los usuarios usan el modal simple de eliminación
                                                        openConfirm({ 
                                                            type: 'delete-invite', 
                                                            title: 'Eliminar usuario', 
                                                            message: '¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.', 
                                                            user 
                                                        }); 
                                                    }} 
                                                    className="inline-flex items-center justify-center p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm" 
                                                    title="Eliminar usuario"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modales y banners montados fuera de la tarjeta/tabla */}
            <InviteUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onInvite={handleInviteUser}
                loading={inviteLoading}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                onUpdate={handleUpdateUser}
                loading={editLoading}
                user={editingUser}
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
                /* Use dark variant for all confirms (including delete) to match other alerts */
                variant={'dark'}
            />

            {notification && (
                <NotificationBanner
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Modal de vista previa de usuario fuera de la tabla */}
            <UserPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                user={previewUser}
            />

            {/* Estilos inline para animaciones */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.15s ease-out;
                }
            `}</style>
        </div>
    );
};
