import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';

type TabType = 'account' | 'additional-info';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('account');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Account Tab State
    const [buildingName, setBuildingName] = useState('SecurITI');
    const [accountLanguage, setAccountLanguage] = useState('Español');
    const [timezone, setTimezone] = useState('Default (America/Mexico_City)');
    const [autoCheckout, setAutoCheckout] = useState(true);
    const [autoApproval, setAutoApproval] = useState(false);
    const [autoCheckIn, setAutoCheckIn] = useState(false);
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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCompanyLogo(event.target?.result as string);
            };
            reader.readAsDataURL(file);
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
            setAutoApproval(config.settings?.autoApproval || false);
            setAutoCheckIn(config.settings?.autoCheckIn || false);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleSaveAccount = async () => {
        setLoading(true);
        try {
            await api.updateCompanyConfig({
                name: buildingName,
                logo: companyLogo,
                settings: {
                    autoApproval,
                    autoCheckIn,
                    requirePhoto: true,
                    enableSelfRegister: true
                }
            });
            alert('Configuración guardada exitosamente');
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                    <p className="text-gray-600 mt-1">Administra la configuración de tu cuenta y organización</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'account'
                                        ? 'border-cyan-500 text-cyan-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Cuenta
                            </button>
                            <button
                                onClick={() => setActiveTab('additional-info')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'additional-info'
                                        ? 'border-cyan-500 text-cyan-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Información adicional
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de la organización</h2>
                                
                                {/* Logo Upload */}
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                                            {companyLogo ? (
                                                <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-12 h-12 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" />
                                                </svg>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-2 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Cambiar
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Sube el logo de la organización (PNG 500 × 500 px recomendado). Nota: Cualquier cambio aquí aplica para todos los usuarios de esta cuenta.
                                        </p>
                                    </div>

                                    <div className="flex-1 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nombre del edificio*
                                            </label>
                                            <input
                                                type="text"
                                                value={buildingName}
                                                onChange={(e) => setBuildingName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Idioma de la cuenta
                                            </label>
                                            <select
                                                value={accountLanguage}
                                                onChange={(e) => setAccountLanguage(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            >
                                                <option>Español</option>
                                                <option>English</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Zona horaria
                                            </label>
                                            <select
                                                value={timezone}
                                                onChange={(e) => setTimezone(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            >
                                                <option>Default (America/Mexico_City)</option>
                                                <option>America/Los_Angeles</option>
                                                <option>America/New_York</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* System Settings */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del sistema</h3>
                                    <div className="space-y-3">
                                        {/* Auto Approval */}
                                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Aprobación automática</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Las visitas se aprueban automáticamente sin necesidad de confirmación del anfitrión.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setAutoApproval(!autoApproval)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    autoApproval ? 'bg-cyan-600' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        autoApproval ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Auto Check-in */}
                                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Check-in automático</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Las visitas aprobadas registran su entrada automáticamente al momento de aprobarlas.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setAutoCheckIn(!autoCheckIn)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    autoCheckIn ? 'bg-cyan-600' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        autoCheckIn ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Auto Checkout */}
                                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Registrar salida de manera automática</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    La salida de tus visitas se aplica de manera automática a las 06:15 A.M. UTC.
                                                    Al deshabilitar esta opción, deberás realizar la salida de tus visitas de manera manual.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setAutoCheckout(!autoCheckout)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    autoCheckout ? 'bg-cyan-600' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        autoCheckout ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveAccount}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {loading ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'additional-info' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dirección de la organización (opcional)</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Personaliza las invitaciones con tu dirección y foto de la empresa.
                                </p>

                                {/* Photo Upload */}
                                <div className="flex justify-center mb-6">
                                    <div className="text-center">
                                        <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                            onClick={() => document.getElementById('photo-upload')?.click()}
                                        >
                                            {companyPhoto ? (
                                                <img src={companyPhoto} alt="Company" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500">Subir foto</p>
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
                                        <p className="text-xs text-gray-500 mt-2">
                                            Formato permitido JPG y PNG.<br />
                                            Peso máximo 2 MB.<br />
                                            Tamaño máximo recomendado 355px × 260px.
                                        </p>
                                    </div>
                                </div>

                                {/* Address Fields */}
                                <div className="grid grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Calle y número"
                                        value={street}
                                        onChange={(e) => setStreet(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Colonia"
                                        value={colony}
                                        onChange={(e) => setColony(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Código postal"
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                                        <select
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        >
                                            <option>México</option>
                                            <option>Estados Unidos</option>
                                            <option>Canadá</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        <select
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option>Ciudad de México</option>
                                            <option>Jalisco</option>
                                            <option>Nuevo León</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            URL de google maps
                                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </label>
                                        <input
                                            type="text"
                                            value={googleMapsUrl}
                                            onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Additional Instructions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Información adicional para notificaciones (Opcional)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Esta información se incluirá en las invitaciones que envíes a los visitantes. Puedes editar o eliminarla.
                                    </p>
                                    <div className="relative">
                                        <textarea
                                            value={arrivalInstructions}
                                            onChange={(e) => setArrivalInstructions(e.target.value)}
                                            maxLength={145}
                                            rows={3}
                                            placeholder="Muestra este mensaje con una identificación y ¡Olvidate de las filas!"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                                        />
                                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                            {arrivalInstructions.length}/145
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveAdditionalInfo}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {loading ? 'Guardando...' : 'Guardar cambios'}
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