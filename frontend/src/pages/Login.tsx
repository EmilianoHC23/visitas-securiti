import React, { useState } from 'react';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
       <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
        style={{ 
        backgroundImage: "url('/pattern.png')",
        backgroundSize: "60%",
        backgroundRepeat: "repeat"
         }}
        >

            {/* Overlay para opacidad */}
            <div className="absolute inset-0 bg-white opacity-60 pointer-events-none"></div>
            <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col items-center mx-2 sm:mx-0">
                <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-24 w-auto mb-2 mt-2"
                    draggable={false}
                />
                <h1 className="text-3xl font-bold text-gray-800 mb-1 text-center">Visitas SecuriTI</h1>
                <h2 className="text-base text-gray-400 mb-6 text-center">Inicia sesión para continuar</h2>
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    {error && (
                        <div className="p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <div className="relative group">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200 group-hover:text-blue-600">
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
                                placeholder="Ingresa tu correo"
                                className={`pl-10 pr-4 py-2 w-full border-0 border-b-2 rounded-none bg-transparent shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-colors duration-200 group-hover:border-blue-400 group-hover:bg-blue-50 ${
                                    emailError 
                                        ? 'border-b-red-300 focus:border-b-red-500' 
                                        : 'border-b-gray-200'
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
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200 group-hover:text-blue-600">
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
                            placeholder="Ingresa tu contraseña"
                            className={`pl-10 pr-10 py-2 w-full border-0 border-b-2 rounded-none bg-transparent shadow-none focus:ring-0 focus:border-blue-600 focus:outline-none transition-colors duration-200 group-hover:border-blue-400 group-hover:bg-blue-50 ${
                                passwordError 
                                    ? 'border-b-red-300 focus:border-b-red-500' 
                                    : 'border-b-gray-200'
                            }`}
                            />
                            {/* Icono de ojo */}
                           <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200 group-hover:text-blue-600 focus:outline-none"
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
                        type="submit"
                        disabled={loading || !!emailError || !!passwordError}
                        className="w-full py-3 rounded-lg text-white font-semibold text-base transition-colors bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2 shadow"
                    >
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};