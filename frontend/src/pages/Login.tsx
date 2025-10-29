import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../contexts/AuthContext';

// Fixed emailError undefined issue - all variables properly declared
export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const { login, loading } = useAuth();
    // Eliminado: área de subir imagen

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('El email es requerido');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Por favor ingrese un email válido');
            return false;
        }
        setEmailError(null);
        return true;
    };

    const validatePassword = (password: string): boolean => {
        if (!password) {
            setPasswordError('La contraseña es requerida');
            return false;
        }
        if (password.length < 3) {
            setPasswordError('La contraseña debe tener al menos 3 caracteres');
            return false;
        }
        setPasswordError(null);
        return true;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        if (emailError) {
            validateEmail(newEmail);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (passwordError) {
            validatePassword(newPassword);
        }
    };

    // Eliminado: función para subir imagen

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        // support being called from form onSubmit or button onClick
        try { e && (e as any).preventDefault(); } catch {};
        setError(null);

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        try {
            await login(email, password);
        } catch (err: any) {
            setError('Email o contraseña incorrectos.');
        }
    };

    return (
    <div className="min-h-screen flex flex-col md:flex-row">
            {/* Logo y nombre en la esquina superior izquierda */}
            <div className="absolute top-0 left-0 w-full flex items-center px-8 py-6 z-20">
                <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="w-auto mr-3" 
                    style={{ maxHeight: '80px', maxWidth: '220px', objectFit: 'contain', imageRendering: 'crisp-edges' }}
                    draggable={false}
                />
                <span className="text-2xl font-bold text-gray-800 tracking-tight">Visitas SecuriTI</span>
            </div>
            {/* Columna izquierda: Formulario */}
            <div className="w-full flex flex-col justify-center items-center bg-gray-100 px-4 py-12 md:w-2/3 md:px-6 md:py-0 relative">
                <div className="w-full max-w-md mx-auto mt-20 md:mt-0">
                    <h2 className="text-lg text-gray-500 mb-1 font-medium">Comienza tu experiencia</h2>
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Inicia sesión en Visitas SecuriTI</h1>
                    <form onSubmit={handleSubmit} className="w-full space-y-6">
                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    {/* Icono de mail */}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <path d="M3 7l9 6 9-6" />
                                    </svg>
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    placeholder="example@email.com"
                                    className={`pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-600 focus:outline-none transition-colors duration-200 hover:border-blue-700 hover:bg-blue-100 hover:shadow-lg ${
                                        emailError 
                                            ? 'border-red-300 focus:border-red-500' 
                                            : 'border-gray-200'
                                    }`}
                                />
                            </div>
                            {emailError && (
                                <p className="mt-1 text-sm text-red-600">{emailError}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password-login" className="block text-sm font-semibold text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    {/* Icono de candado */}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="10" rx="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="password-login"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    placeholder="********"
                                    className={`pl-10 pr-10 py-2 w-full border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-600 focus:outline-none transition-colors duration-200 hover:border-blue-700 hover:bg-blue-100 hover:shadow-lg ${
                                        passwordError 
                                            ? 'border-red-300 focus:border-red-500' 
                                            : 'border-gray-200'
                                    }`}
                                />
                                {/* Icono de ojo */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        // Ojo abierto
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    ) : (
                                        // Ojo cerrado
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.77 21.77 0 014.22-5.94M1 1l22 22" />
                                            <path d="M9.53 9.53A3 3 0 0112 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !!emailError || !!passwordError}
                            aria-busy={loading}
                            className="w-full py-3 rounded-lg text-white font-semibold text-base transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6 shadow flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <CircularProgress size={18} color="inherit" className="mr-3" />
                                    Ingresando...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>
                </div>
            </div>
            {/* Columna derecha: solo fondo decorativo */}
            <div className="hidden md:flex w-1/3 h-screen relative p-0 m-0 overflow-hidden">
                <img 
                    src="/login.png" 
                    alt="Fondo login personalizado" 
                    className="object-cover w-full h-full" 
                    style={{ pointerEvents: 'none' }}
                />
            </div>
        </div>
    );
};