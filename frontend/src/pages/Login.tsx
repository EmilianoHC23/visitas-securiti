import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('reception@securiti.com');
    const [password, setPassword] = useState('password'); // Default password for demo purposes
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
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
        setSuccess(null);

        // Validar campos
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        try {
            await login(email, password);
            setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
        } catch (err: any) {
            console.error('Login error:', err);
            
            // Manejar errores específicos del servidor
            if (err.response?.status === 401) {
                const message = err.response.data?.message || '';
                if (message.includes('Credenciales incorrectas')) {
                    if (message.includes('Usuario no encontrado') || message.includes('not found')) {
                        setError('El usuario no existe. Verifique su email.');
                    } else {
                        setError('Contraseña incorrecta. Inténtelo de nuevo.');
                    }
                } else if (message.includes('Usuario desactivado')) {
                    setError('Su cuenta está desactivada. Contacte al administrador.');
                } else {
                    setError('Email o contraseña incorrectos.');
                }
            } else if (err.response?.status === 400) {
                setError('Datos incompletos. Verifique email y contraseña.');
            } else if (err.response?.status === 500) {
                setError('Error del servidor. Inténtelo más tarde.');
            } else {
                setError('Error de conexión. Verifique su internet.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src="/logo.png" 
                        alt="Visitas SecuriTI Logo" 
                        className="h-16 w-auto mb-2"
                    />
                    <h1 className="text-3xl font-bold text-gray-800 mt-2">Visitas SecuriTI</h1>
                    <p className="text-gray-500">Inicia sesión para continuar</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div role="alert" aria-live="polite" className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}
                    {success && (
                        <div role="alert" aria-live="polite" className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {success}
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            placeholder="tu@email.com"
                            className={`mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 ${
                                emailError 
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                        />
                        {emailError && (
                            <p className="mt-1 text-sm text-red-600">{emailError}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="password-login" className="text-sm font-medium text-gray-700">Contraseña</label>
                         <input
                            id="password-login"
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            placeholder="••••••••"
                            className={`mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 ${
                                passwordError 
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                        />
                        {passwordError && (
                            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                        )}
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!emailError || !!passwordError}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Ingresando...
                                </div>
                            ) : 'Ingresar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};