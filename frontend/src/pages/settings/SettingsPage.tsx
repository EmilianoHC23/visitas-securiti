import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Building2, MapPin, Check, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';

type TabType = 'account' | 'additional-info' | 'manuals';

import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animated country dropdown used in Settings > Dirección
const CountryDropdown: React.FC<{
    value: string;
    onChange: (v: string) => void;
}> = ({ value, onChange }) => {
    const options = [
        '', 'México','Estados Unidos','Canadá','Argentina','Brasil','Chile','Colombia','Costa Rica','Ecuador','España','Guatemala','Honduras','Nicaragua','Panamá','Paraguay','Perú','El Salvador','Uruguay','Venezuela'
    ];

    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!(e.target instanceof Node)) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const wrapperVariants: Variants = {
        open: { opacity: 1, scaleY: 1, transition: { when: 'beforeChildren', staggerChildren: 0.02 } },
        closed: { opacity: 0, scaleY: 0, transition: { when: 'afterChildren' } }
    };

    const itemVariants: Variants = {
        open: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
        closed: { opacity: 0, y: -6 }
    };

    const chevronVariants: Variants = {
        open: { rotate: 180 },
        closed: { rotate: 0 }
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(s => !s)}
                aria-expanded={open}
                className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl flex items-center justify-between focus:outline-none"
            >
                <span className="text-gray-700">{value || 'Seleccionar país'}</span>
                <motion.span variants={chevronVariants} animate={open ? 'open' : 'closed'} className="ml-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={wrapperVariants}
                        className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-white border-2 border-gray-300 rounded-xl shadow-lg origin-top z-20"
                        style={{ transformOrigin: 'top' }}
                    >
                        {options.map((opt, idx) => (
                            <motion.li key={idx} variants={itemVariants}>
                                <button
                                    type="button"
                                    onClick={() => { onChange(opt); setOpen(false); }}
                                    className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 text-gray-700"
                                >
                                    {opt || 'Seleccionar país'}
                                </button>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

    // Animated State dropdown (Estados) used in Settings > Dirección
    const StateDropdown: React.FC<{
        value: string;
        onChange: (v: string) => void;
    }> = ({ value, onChange }) => {
        const options = [
            '', 'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'
        ];

        const [open, setOpen] = React.useState(false);
        const ref = React.useRef<HTMLDivElement | null>(null);

        React.useEffect(() => {
            const onDocClick = (e: MouseEvent) => {
                if (!ref.current) return;
                if (!(e.target instanceof Node)) return;
                if (!ref.current.contains(e.target)) setOpen(false);
            };
            document.addEventListener('mousedown', onDocClick);
            return () => document.removeEventListener('mousedown', onDocClick);
        }, []);

        const wrapperVariants: Variants = {
            open: { opacity: 1, scaleY: 1, transition: { when: 'beforeChildren', staggerChildren: 0.02 } },
            closed: { opacity: 0, scaleY: 0, transition: { when: 'afterChildren' } }
        };

        const itemVariants: Variants = {
            open: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
            closed: { opacity: 0, y: -6 }
        };

        const chevronVariants: Variants = {
            open: { rotate: 180 },
            closed: { rotate: 0 }
        };

        return (
            <div ref={ref} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(s => !s)}
                    aria-expanded={open}
                    className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl flex items-center justify-between focus:outline-none"
                >
                    <span className="text-gray-700">{value || 'Seleccionar estado'}</span>
                    <motion.span variants={chevronVariants} animate={open ? 'open' : 'closed'} className="ml-3 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.span>
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.ul
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={wrapperVariants}
                            className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-white border-2 border-gray-300 rounded-xl shadow-lg origin-top z-20"
                            style={{ transformOrigin: 'top' }}
                        >
                            {options.map((opt, idx) => (
                                <motion.li key={idx} variants={itemVariants}>
                                    <button
                                        type="button"
                                        onClick={() => { onChange(opt); setOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 text-gray-700"
                                    >
                                        {opt || 'Seleccionar estado'}
                                    </button>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        );
    };

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('account');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    
    // Mobile detection
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Account Tab State
    const [buildingName, setBuildingName] = useState('SecurITI');
    const [accountLanguage, setAccountLanguage] = useState('Español');
    const [timezone, setTimezone] = useState('Default (America/Mexico_City)');
    const [autoCheckout, setAutoCheckout] = useState(true);
    const [companyLogo, setCompanyLogo] = useState<string>('');

    // Additional Info Tab State
    const [street, setStreet] = useState('');
    const [colony, setColony] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('México');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [googleMapsUrl, setGoogleMapsUrl] = useState('');
    const [companyPhoto, setCompanyPhoto] = useState<string>('');
    const [arrivalInstructions, setArrivalInstructions] = useState('');

    // Manuals Tab State
    // Lista de manuales disponibles en /public/manuals/
    // Para agregar un nuevo manual, solo coloca el PDF en la carpeta public/manuals y agrégalo aquí
    const availableManuals = [
        { name: 'Manual de Usuario', file: 'Visitas SecuriTI - Manual de Usuario (1).pdf', description: 'Guía completa para el uso del sistema de visitas' },
        { name: 'Manual de Instalación', file: 'Manual de Instalación - Visitas SecuriTI.pdf', description: 'Guía paso a paso para instalar el sistema' },
    ];

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

            try {
                setLoading(true);
                
                // Convertir a Base64
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64Logo = event.target?.result as string;
                    
                    try {
                        // Guardar directamente en MongoDB como Base64
                        await api.updateCompanyConfig({
                            logo: base64Logo
                        } as any);
                        
                        setCompanyLogo(base64Logo);
                        console.log('✅ Logo guardado exitosamente en Base64');
                        
                        // Mostrar confirmación
                        setSaved(true);
                        setTimeout(() => setSaved(false), 3000);
                    } catch (error) {
                        console.error('Error al guardar logo:', error);
                        alert('Error al guardar el logo. Por favor, intenta de nuevo.');
                    } finally {
                        setLoading(false);
                    }
                };
                
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error al procesar logo:', error);
                alert('Error al procesar el logo. Por favor, intenta de nuevo.');
                setLoading(false);
            }
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
                setCompanyPhoto(base64Photo);
                console.log('✅ Foto de empresa cargada como Base64');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = async () => {
        if (!companyLogo) return;
        // Only update local state — persist when the user clicks "Guardar Cambios"
        setCompanyLogo('');
        // Clear any previous saved indicator because there are unsaved changes now
        setSaved(false);
    };

    const handleRemovePhoto = () => {
        if (!companyPhoto) return;
        setCompanyPhoto('');
        setSaved(false);
    };

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const config = await api.getCompanyConfig();
            setBuildingName(config.name || 'SecurITI');
            setCompanyLogo(config.logo || '');
            setAutoCheckout(config.settings?.autoCheckout !== false);
            
            // Cargar información de ubicación
            if (config.location) {
                setStreet(config.location.street || '');
                setColony(config.location.colony || '');
                setPostalCode(config.location.postalCode || '');
                setCountry(config.location.country || 'México');
                setState(config.location.state || '');
                setCity(config.location.city || '');
                setGoogleMapsUrl(config.location.googleMapsUrl || '');
                setCompanyPhoto(config.location.photo || '');
                setArrivalInstructions(config.location.arrivalInstructions || '');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleSaveAccount = async () => {
        setLoading(true);
        setSaved(false);
        try {
            await api.updateCompanyConfig({
                name: buildingName,
                logo: companyLogo,
                settings: {
                    autoCheckout,
                    requirePhoto: true,
                    enableSelfRegister: true
                } as any
            } as any);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAdditionalInfo = async () => {
        setLoading(true);
        setSaved(false);
        try {
            await api.updateCompanyConfig({
                location: {
                    street,
                    colony,
                    postalCode,
                    country,
                    state,
                    city,
                    googleMapsUrl,
                    photo: companyPhoto,
                    arrivalInstructions
                }
            } as any);
            
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving additional info:', error);
            alert('Error al guardar la información');
        } finally {
            setLoading(false);
        }
    };

    const handleViewManual = (filename: string) => {
        window.open(`/manuals/${filename}`, '_blank');
    };

    const handleDownloadManual = (filename: string, displayName: string) => {
        const link = document.createElement('a');
        link.href = `/manuals/${filename}`;
        link.download = displayName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header mejorado */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg`}>
                            <Building2 className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-white`} />
                        </div>
                        <div>
                            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-bold text-gray-900`}>Configuración</h1>
                            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm sm:text-base'} mt-1`}>
                                {isMobile ? 'Administra tu organización' : 'Administra tu organización y preferencias del sistema'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs mejorados */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50/50">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`flex-1 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-semibold border-b-3 transition-all ${
                                    activeTab === 'account'
                                        ? 'border-gray-900 text-gray-900 bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Información General</span>
                                    <span className="sm:hidden">General</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('additional-info')}
                                className={`flex-1 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-semibold border-b-3 transition-all ${
                                    activeTab === 'additional-info'
                                        ? 'border-gray-900 text-gray-900 bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="hidden sm:inline">Ubicación</span>
                                    <span className="sm:hidden">Ubicación</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('manuals')}
                                className={`flex-1 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-semibold border-b-3 transition-all ${
                                    activeTab === 'manuals'
                                        ? 'border-gray-900 text-gray-900 bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span className="hidden sm:inline">Manuales</span>
                                    <span className="sm:hidden">Manuales</span>
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 sm:p-8 lg:p-10">
                        {activeTab === 'account' && (
                            <div className="space-y-8">
                                {/* Logo Section - Rediseñada */}
                                <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}>
                                    <div className={`flex items-center ${isMobile ? 'gap-2 mb-4' : 'gap-3 mb-6'}`}>
                                        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-xl flex items-center justify-center`}>
                                            <Camera className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                                        </div>
                                        <h2 className={`${isMobile ? 'text-base' : 'text-xl sm:text-2xl'} font-bold text-gray-900`}>
                                            {isMobile ? 'Nombre y Logo' : 'Nombre y Logo de la Organización'}
                                        </h2>
                                    </div>
                                    
                                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                                        {/* Logo Preview */}
                                        <div className={`${isMobile ? 'mx-auto' : 'flex-shrink-0'}`}>
                                            <div className="relative">
                                                <div className={`${isMobile ? 'w-24 h-24' : 'w-28 h-28 sm:w-32 sm:h-32'} rounded-2xl ring-4 ring-sky-200 overflow-hidden flex items-center justify-center shadow-lg transition-all bg-gradient-to-br from-gray-100 to-gray-200`}>
                                                    {companyLogo ? (
                                                        // Use object-contain with slight padding so square logos display fully inside a square frame
                                                        <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <Building2 className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-gray-400`} />
                                                    )}
                                                </div>

                                                {/* small edit button */}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`absolute ${isMobile ? '-right-1 -bottom-1 w-7 h-7' : '-right-2 -bottom-2 w-9 h-9'} bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform`}
                                                    aria-label="Cambiar logo"
                                                >
                                                    <Edit2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                                </button>
                                                {companyLogo && (
                                                    <button
                                                        onClick={handleRemoveLogo}
                                                        className={`absolute ${isMobile ? '-left-2 -top-2 w-7 h-7' : '-left-3 -top-3 w-9 h-9'} bg-white text-red-600 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform border border-red-100 z-10`}
                                                        aria-label="Eliminar logo"
                                                        title="Eliminar logo"
                                                    >
                                                        <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Form Fields rediseñados (single row on md+) */}
                                        <div className="flex-1 lg:ml-6 w-full">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div>
                                                    <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                                        Nombre de la empresa*
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={buildingName}
                                                        onChange={(e) => setBuildingName(e.target.value)}
                                                        placeholder="Mi Empresa"
                                                        className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-base'} bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendation note spanning both columns */}
                                    <div className={`${isMobile ? 'mt-3' : 'mt-4'} bg-yellow-50 border border-yellow-200 rounded-xl ${isMobile ? 'p-2' : 'p-3'}`}>
                                        <div className="flex gap-2">
                                            <AlertCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-600 flex-shrink-0 mt-0.5`} />
                                            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-yellow-800 leading-relaxed`}>
                                                Recomendado: PNG con fondo transparente, 500×500px, menor a 2MB. 
                                                Este logo aparecerá en todos los correos del sistema.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* System Settings - Rediseñada */}
                                <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}>
                                    <div className={`flex items-center ${isMobile ? 'gap-2 mb-4' : 'gap-3 mb-6'}`}>
                                        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-xl flex items-center justify-center`}>
                                            <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-900`}>
                                            {isMobile ? 'Config. del Sistema' : 'Configuración del Sistema'}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Auto Checkout */}
                                        <div className={`bg-white border-2 border-gray-200 rounded-xl ${isMobile ? 'p-3' : 'p-5'} hover:border-gray-400 transition-all`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900 mb-2`}>
                                                        Checkout Automático
                                                    </h4>
                                                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 leading-relaxed`}>
                                                        {isMobile 
                                                            ? 'Salida automática a las 06:15 A.M. UTC cada día.'
                                                            : 'La salida se registra automáticamente a las 06:15 A.M. UTC cada día. Al deshabilitar, deberás registrar salidas manualmente.'
                                                        }
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setAutoCheckout(!autoCheckout)}
                                                    role="switch"
                                                    aria-checked={autoCheckout}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            setAutoCheckout(!autoCheckout);
                                                        }
                                                    }}
                                                    className={`relative inline-flex ${isMobile ? 'h-6 w-12' : 'h-7 w-14'} items-center rounded-full transition-colors flex-shrink-0 ${
                                                        autoCheckout ? 'bg-gray-900' : 'bg-gray-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block ${isMobile ? 'h-4 w-4' : 'h-5 w-5'} transform rounded-full bg-white transition-transform shadow-md ${
                                                            autoCheckout ? (isMobile ? 'translate-x-6' : 'translate-x-7') : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button mejorado */}
                                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4">
                                    {saved && (
                                        <div className={`flex items-center ${isMobile ? 'gap-1.5 px-3 py-1.5' : 'gap-2 px-4 py-2'} text-green-600 font-semibold bg-green-50 rounded-xl border border-green-200`}>
                                            <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                            <span className={isMobile ? 'text-sm' : 'text-base'}>
                                                {isMobile ? 'Guardado' : 'Guardado exitosamente'}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSaveAccount}
                                        disabled={loading}
                                        className={`w-full sm:w-auto ${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-base'} bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-xl hover:shadow-2xl flex items-center justify-center gap-3`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className={`animate-spin ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'manuals' && (
                            <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}>
                                {/* Encabezado */}
                                <div className={`flex items-center ${isMobile ? 'gap-2 mb-6' : 'gap-3 mb-8'}`}>
                                    <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-xl flex items-center justify-center`}>
                                        <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className={`${isMobile ? 'text-base' : 'text-xl sm:text-2xl'} font-bold text-gray-900`}>
                                            Manuales del Sistema
                                        </h2>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
                                            Documentación y guías de uso del sistema
                                        </p>
                                    </div>
                                </div>

                                {/* Lista de Manuales */}
                                <div className="space-y-3">
                                    {availableManuals.map((manual, index) => (
                                        <div
                                            key={index}
                                            className={`bg-white border-2 border-gray-200 rounded-xl ${isMobile ? 'p-3' : 'p-4'} hover:border-gray-400 transition-all group`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Icono PDF */}
                                                <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                    <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>

                                                {/* Info del archivo */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>
                                                        {manual.name}
                                                    </h3>
                                                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1 line-clamp-1`}>
                                                        {manual.description}
                                                    </p>
                                                </div>

                                                {/* Acciones */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewManual(manual.file)}
                                                        className={`${isMobile ? 'p-2' : 'p-2.5'} bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition-all`}
                                                        title="Ver"
                                                    >
                                                        <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadManual(manual.file, manual.name)}
                                                        className={`${isMobile ? 'p-2' : 'p-2.5'} bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-900 hover:text-white transition-all`}
                                                        title="Descargar"
                                                    >
                                                        <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'additional-info' && (
                            <div className="space-y-8">
                                {/* Photo Upload - Rediseñada */}
                                <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}>
                                    <div className={`flex items-center ${isMobile ? 'gap-2 mb-4' : 'gap-3 mb-6'}`}>
                                        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-xl flex items-center justify-center`}>
                                            <Camera className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                                        </div>
                                        <div>
                                            <h2 className={`${isMobile ? 'text-base' : 'text-xl sm:text-2xl'} font-bold text-gray-900`}>
                                                Foto de la Empresa
                                            </h2>
                                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
                                                {isMobile ? 'Para las invitaciones' : 'Imagen que se mostrará en las invitaciones'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="relative">
                                            <div 
                                                className={`${isMobile ? 'w-56 h-40' : 'w-64 h-48'} border-3 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gradient-to-br from-gray-50 to-white hover:border-gray-900 hover:bg-gray-50 transition-all cursor-pointer group overflow-hidden`}
                                                onClick={() => photoInputRef.current?.click()}
                                            >
                                                {companyPhoto ? (
                                                    <>
                                                        <img src={companyPhoto} alt="Company" className="w-full h-full object-cover rounded-2xl" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                                            <Upload className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-white mb-2`} />
                                                            <p className={`text-white ${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>
                                                                Cambiar Foto
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className={`text-center ${isMobile ? 'p-4' : 'p-6'}`}>
                                                        <Upload className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-400 mx-auto mb-3 group-hover:text-gray-900 transition-colors`} />
                                                        <p className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-700 group-hover:text-gray-900`}>
                                                            Subir foto
                                                        </p>
                                                        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1`}>
                                                            Haz clic para seleccionar
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* small edit button placed outside the clickable box (like logo section) */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                                                className={`absolute ${isMobile ? '-right-1 -bottom-1 w-7 h-7' : '-right-2 -bottom-2 w-9 h-9'} bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform`}
                                                aria-label="Cambiar foto"
                                            >
                                                <Edit2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                            </button>

                                            {companyPhoto && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                                                    className={`absolute ${isMobile ? '-left-2 -top-2 w-7 h-7' : '-left-3 -top-3 w-9 h-9'} bg-white text-red-600 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform border border-red-100 z-10`}
                                                    aria-label="Eliminar foto"
                                                    title="Eliminar foto"
                                                >
                                                    <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            ref={photoInputRef}
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                        <div className={`${isMobile ? 'mt-3' : 'mt-4'} bg-blue-50 border border-blue-200 rounded-xl ${isMobile ? 'p-2' : 'p-3'} max-w-md`}>
                                            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-blue-800 leading-relaxed text-center`}>
                                                <strong>Formatos:</strong> JPG, PNG • <strong>Peso máx:</strong> 2 MB<br />
                                                <strong>Tamaño recomendado:</strong> 355×260 px
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dirección - Rediseñada */}
                                <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}>
                                    <div className={`flex items-center ${isMobile ? 'gap-2 mb-4' : 'gap-3 mb-6'}`}>
                                        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-xl flex items-center justify-center`}>
                                            <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                                        </div>
                                        <div>
                                            <h2 className={`${isMobile ? 'text-base' : 'text-xl sm:text-2xl'} font-bold text-gray-900`}>
                                                {isMobile ? 'Dirección de la Organización' : 'Dirección de la Organización'}
                                            </h2>
                                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
                                                {isMobile ? 'Info de ubicación (Opcional)' : 'Información de ubicación para las invitaciones (Opcional)'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
                                        {/* Primera fila - Calle, Colonia, CP */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="lg:col-span-1">
                                                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                                    Calle y número
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={isMobile ? 'Av. Insurgentes 1458' : 'Ej: Av. Insurgentes Sur 1458'}
                                                    value={street}
                                                    onChange={(e) => setStreet(e.target.value)}
                                                    className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-base'} bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                                    Colonia
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={isMobile ? 'Insurgentes Mixcoac' : 'Ej: Insurgentes Mixcoac'}
                                                    value={colony}
                                                    onChange={(e) => setColony(e.target.value)}
                                                    className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-base'} bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                                    Código postal
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={isMobile ? '03920' : 'Ej: 03920'}
                                                    value={postalCode}
                                                    onChange={(e) => setPostalCode(e.target.value)}
                                                    className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-base'} bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all`}
                                                />
                                            </div>
                                        </div>

                                        {/* Segunda fila - País, Estado, Ciudad */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                                    País
                                                </label>
                                                <CountryDropdown value={country} onChange={(v) => setCountry(v)} />
                                            </div>
                                            <div>
                                                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                                    Estado
                                                </label>
                                                <StateDropdown value={state} onChange={(v) => setState(v)} />
                                            </div>
                                            <div>
                                                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                                    Ciudad
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={isMobile ? 'Ciudad de México' : 'Ej: Ciudad de México'}
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-base'} bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all`}
                                                />
                                            </div>
                                        </div>

                                        {/* URL Google Maps */}
                                        <div>
                                            <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2 flex items-center gap-2`}>
                                                <span>URL de Google Maps</span>
                                                {!isMobile && (
                                                    <div className="group relative">
                                                        <AlertCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
                                                            Abre Google Maps, busca tu ubicación, haz clic en "Compartir" y copia el enlace. 
                                                            Este aparecerá en las invitaciones para ayudar a los visitantes a encontrarte.
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                            <input
                                                type="text"
                                                value={googleMapsUrl}
                                                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                                placeholder={isMobile ? 'https://maps.google.com/...' : 'https://maps.google.com/?q=...'}
                                                className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-base'} bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Instrucciones adicionales - Rediseñada */}
                                <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}>
                                    <div className={`flex items-center ${isMobile ? 'gap-2 mb-4' : 'gap-3 mb-6'}`}>
                                        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-xl flex items-center justify-center`}>
                                            <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className={`${isMobile ? 'text-base' : 'text-xl sm:text-2xl'} font-bold text-gray-900`}>
                                                Información Adicional
                                            </h2>
                                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
                                                {isMobile ? 'Mensaje para notificaciones' : 'Mensaje personalizado para las notificaciones'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-700 mb-2`}>
                                            Instrucciones de llegada (Opcional)
                                        </label>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                                            {isMobile 
                                                ? 'Este mensaje se incluirá en las invitaciones por correo.'
                                                : 'Este mensaje se incluirá en las invitaciones por correo electrónico. Proporciona instrucciones de acceso, estacionamiento, o cualquier información útil para tus visitantes.'
                                            }
                                        </p>
                                        <div className="relative">
                                            <textarea
                                                value={arrivalInstructions}
                                                onChange={(e) => setArrivalInstructions(e.target.value)}
                                                maxLength={145}
                                                rows={isMobile ? 3 : 4}
                                                placeholder={isMobile 
                                                    ? 'Ejemplo: Muestra este mensaje en la recepción.'
                                                    : 'Ejemplo: Muestra este mensaje con una identificación en la recepción. ¡Olvídate de las filas!'
                                                }
                                                className={`w-full ${isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-base'} bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none`}
                                            />
                                            <div className={`absolute ${isMobile ? 'bottom-2 right-2 text-[10px] px-1.5 py-0.5' : 'bottom-3 right-3 text-xs px-2 py-1'} font-semibold rounded ${
                                                arrivalInstructions.length > 130 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {arrivalInstructions.length}/145
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button mejorado */}
                                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4">
                                    {saved && (
                                        <div className={`flex items-center ${isMobile ? 'gap-1.5 px-3 py-1.5' : 'gap-2 px-4 py-2'} text-green-600 font-semibold bg-green-50 rounded-xl border border-green-200`}>
                                            <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                            <span className={isMobile ? 'text-sm' : 'text-base'}>
                                                {isMobile ? 'Guardado' : 'Guardado exitosamente'}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSaveAdditionalInfo}
                                        disabled={loading}
                                        className={`w-full sm:w-auto ${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-base'} bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-xl hover:shadow-2xl flex items-center justify-center gap-3`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className={`animate-spin ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};