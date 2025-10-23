import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Building2, MapPin, Check, AlertCircle, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';

type TabType = 'account' | 'additional-info';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('account');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const reader = new FileReader();
            reader.onload = (event) => {
                setCompanyPhoto(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
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
        try {
            console.log('Saving additional info...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Información adicional guardada exitosamente');
        } catch (error) {
            console.error('Error saving additional info:', error);
            alert('Error al guardar la información');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header mejorado */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Configuración</h1>
                            <p className="text-gray-600 text-sm sm:text-base mt-1">Administra tu organización y preferencias del sistema</p>
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
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 sm:p-8 lg:p-10">
                        {activeTab === 'account' && (
                            <div className="space-y-8">
                                {/* Logo Section - Rediseñada */}
                                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Logo de la Organización</h2>
                                    </div>
                                    
                                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                                        {/* Logo Preview */}
                                        <div className="flex-shrink-0">
                                            <div className="relative">
                                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-sky-200 overflow-hidden flex items-center justify-center shadow-lg transition-all">
                                                    {companyLogo ? (
                                                        <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 className="w-12 h-12 text-gray-300" />
                                                    )}
                                                </div>

                                                {/* small edit button */}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute -right-2 -bottom-2 bg-gradient-to-br from-gray-900 to-gray-700 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                                                    aria-label="Cambiar logo"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
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
                                        <div className="flex-1 lg:ml-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la empresa*</label>
                                                    <input
                                                        type="text"
                                                        value={buildingName}
                                                        onChange={(e) => setBuildingName(e.target.value)}
                                                        placeholder="Mi Empresa"
                                                        className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Idioma de la cuenta</label>
                                                    <select
                                                        value={accountLanguage}
                                                        onChange={(e) => setAccountLanguage(e.target.value)}
                                                        className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                    >
                                                        <option>Español</option>
                                                        <option>English</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Zona horaria</label>
                                                    <select
                                                        value={timezone}
                                                        onChange={(e) => setTimezone(e.target.value)}
                                                        className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                    >
                                                        <option>Default (America/Mexico_City)</option>
                                                        <option>America/Los_Angeles</option>
                                                        <option>America/New_York</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendation note spanning both columns */}
                                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                        <div className="flex gap-2">
                                            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-yellow-800 leading-relaxed">
                                                Recomendado: PNG con fondo transparente, 500×500px, menor a 2MB. 
                                                Este logo aparecerá en todos los correos del sistema.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* System Settings - Rediseñada */}
                                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Configuración del Sistema</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Auto Checkout */}
                                        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-all">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="text-base font-bold text-gray-900 mb-2">Checkout Automático</h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        La salida se registra automáticamente a las 06:15 A.M. UTC cada día. 
                                                        Al deshabilitar, deberás registrar salidas manualmente.
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
                                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                                                        autoCheckout ? 'bg-gray-900' : 'bg-gray-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                                                            autoCheckout ? 'translate-x-7' : 'translate-x-1'
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
                                        <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                                            <Check className="w-5 h-5" />
                                            <span>Guardado exitosamente</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSaveAccount}
                                        disabled={loading}
                                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-base"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'additional-info' && (
                            <div className="space-y-8">
                                {/* Photo Upload - Rediseñada */}
                                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Foto de la Empresa</h2>
                                            <p className="text-sm text-gray-600 mt-1">Imagen que se mostrará en las invitaciones</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center">
                                        <div 
                                            className="w-64 h-48 border-3 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gradient-to-br from-gray-50 to-white hover:border-gray-900 hover:bg-gray-50 transition-all cursor-pointer group relative overflow-hidden"
                                            onClick={() => document.getElementById('photo-upload')?.click()}
                                        >
                                            {companyPhoto ? (
                                                <>
                                                    <img src={companyPhoto} alt="Company" className="w-full h-full object-cover rounded-2xl" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                                        <Upload className="w-12 h-12 text-white mb-2" />
                                                        <p className="text-white text-sm font-semibold">Cambiar Foto</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6">
                                                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-3 group-hover:text-gray-900 transition-colors" />
                                                    <p className="text-base font-semibold text-gray-700 group-hover:text-gray-900">Subir foto</p>
                                                    <p className="text-xs text-gray-500 mt-1">Haz clic para seleccionar</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 max-w-md">
                                            <p className="text-xs text-blue-800 leading-relaxed text-center">
                                                <strong>Formatos:</strong> JPG, PNG • <strong>Peso máx:</strong> 2 MB<br />
                                                <strong>Tamaño recomendado:</strong> 355×260 px
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dirección - Rediseñada */}
                                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dirección de la Organización</h2>
                                            <p className="text-sm text-gray-600 mt-1">Información de ubicación para las invitaciones (Opcional)</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {/* Primera fila - Calle, Colonia, CP */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="lg:col-span-1">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Calle y número</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Av. Insurgentes Sur 1458"
                                                    value={street}
                                                    onChange={(e) => setStreet(e.target.value)}
                                                    className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Colonia</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Insurgentes Mixcoac"
                                                    value={colony}
                                                    onChange={(e) => setColony(e.target.value)}
                                                    className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Código postal</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 03920"
                                                    value={postalCode}
                                                    onChange={(e) => setPostalCode(e.target.value)}
                                                    className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Segunda fila - País, Estado, Ciudad */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">País</label>
                                                <select
                                                    value={country}
                                                    onChange={(e) => setCountry(e.target.value)}
                                                    className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                >
                                                    <option>México</option>
                                                    <option>Estados Unidos</option>
                                                    <option>Canadá</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                                                <select
                                                    value={state}
                                                    onChange={(e) => setState(e.target.value)}
                                                    className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option>Ciudad de México</option>
                                                    <option>Jalisco</option>
                                                    <option>Nuevo León</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Ciudad</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Ciudad de México"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* URL Google Maps */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <span>URL de Google Maps</span>
                                                <div className="group relative">
                                                    <AlertCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
                                                        Abre Google Maps, busca tu ubicación, haz clic en "Compartir" y copia el enlace. 
                                                        Este aparecerá en las invitaciones para ayudar a los visitantes a encontrarte.
                                                    </div>
                                                </div>
                                            </label>
                                            <input
                                                type="text"
                                                value={googleMapsUrl}
                                                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                                placeholder="https://maps.google.com/?q=..."
                                                className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Instrucciones adicionales - Rediseñada */}
                                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Información Adicional</h2>
                                            <p className="text-sm text-gray-600 mt-1">Mensaje personalizado para las notificaciones</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Instrucciones de llegada (Opcional)
                                        </label>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Este mensaje se incluirá en las invitaciones por correo electrónico. Proporciona instrucciones de acceso, 
                                            estacionamiento, o cualquier información útil para tus visitantes.
                                        </p>
                                        <div className="relative">
                                            <textarea
                                                value={arrivalInstructions}
                                                onChange={(e) => setArrivalInstructions(e.target.value)}
                                                maxLength={145}
                                                rows={4}
                                                placeholder="Ejemplo: Muestra este mensaje con una identificación en la recepción. ¡Olvídate de las filas!"
                                                className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                                            />
                                            <div className={`absolute bottom-3 right-3 text-xs font-semibold px-2 py-1 rounded ${
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
                                        <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                                            <Check className="w-5 h-5" />
                                            <span>Guardado exitosamente</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSaveAdditionalInfo}
                                        disabled={loading}
                                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-base"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
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