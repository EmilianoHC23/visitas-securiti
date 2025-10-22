import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera } from 'lucide-react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
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

    // Lista de estados para México (se usará cuando country === 'México')
    const MEXICO_STATES = [
        'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
        'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
        'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
        'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
        'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
    ];

    const handleCountryChange = (value: string) => {
        setCountry(value);
        // Si no es México, limpiar el estado y no mostrar opciones
        if (value !== 'México') {
            setState('');
        }
    };

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

    const handleSaveAccount = async () => {
        setLoading(true);
        try {
            // Aquí iría la lógica de guardado
            console.log('Saving account settings...');
            await new Promise(resolve => setTimeout(resolve, 1000));
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
                                <div className="flex items-center gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-36 h-36 rounded-full border-2 border-gray-200 overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                                            {companyLogo ? (
                                                <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-12 h-12 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="mt-3">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700"
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
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="grid grid-cols-3 gap-4 items-center">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del edificio*</label>
                                                <input
                                                    type="text"
                                                    value={buildingName}
                                                    onChange={(e) => setBuildingName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma de la cuenta</label>
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
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
                                        <p className="text-xs text-gray-500 mt-2">
                                            Sube el logo de la organización (PNG 500 × 500 px recomendado). Nota: Cualquier cambio aquí aplica para todos los usuarios de esta cuenta.
                                        </p>
                                    </div>
                                </div>

                                {/* Auto Checkout Setting */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar salida</h3>
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

                                <div className="grid grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                                        <select
                                            value={country}
                                            onChange={(e) => handleCountryChange(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        >
                                            <option>México</option>
                                            <option>Estados Unidos</option>
                                            <option>Canadá</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        {country === 'México' ? (
                                            <FormControl fullWidth sx={{
                                                '& .MuiInputBase-root': {
                                                    height: 40,
                                                    borderRadius: '0.5rem',
                                                }
                                            }}>
                                                <Select
                                                    variant="outlined"
                                                    value={state}
                                                    onChange={(e) => setState(e.target.value as string)}
                                                    MenuProps={{
                                                        PaperProps: {
                                                            style: {
                                                                maxHeight: 220,
                                                                width: 220,
                                                            },
                                                        },
                                                        anchorOrigin: {
                                                            vertical: 'bottom',
                                                            horizontal: 'left',
                                                        },
                                                        transformOrigin: {
                                                            vertical: 'top',
                                                            horizontal: 'left',
                                                        },
                                                    }}
                                                    sx={{
                                                        '& .MuiSelect-select': {
                                                            paddingTop: '8px',
                                                            paddingBottom: '8px',
                                                            paddingLeft: '12px',
                                                            paddingRight: '36px'
                                                        },
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(209,213,219,1)'
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="">Seleccionar</MenuItem>
                                                    {MEXICO_STATES.map((s) => (
                                                        <MenuItem key={s} value={s}>{s}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <input
                                                type="text"
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                placeholder="Estado"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            />
                                        )}
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