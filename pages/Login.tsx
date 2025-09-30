import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-securiti-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944L12 23l9-2.056A12.02 12.02 0 0021.618 7.984a11.955 11.955 0 01-4.016-4.016z" />
    </svg>
);


export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('reception@securiti.com');
    const [password, setPassword] = useState('password'); // Default password for demo purposes
    const [error, setError] = useState<string | null>(null);
    const { login, loading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await login(email, password);
        } catch (err) {
            setError('Credenciales incorrectas. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <ShieldIcon />
                    <h1 className="text-3xl font-bold text-gray-800 mt-2">Visitas SecuriTI</h1>
                    <p className="text-gray-500">Inicia sesión para continuar</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div role="alert" aria-live="polite" className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-securiti-blue-500 focus:border-securiti-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password-login" className="text-sm font-medium text-gray-700">Contraseña</label>
                         <input
                            id="password-login"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-securiti-blue-500 focus:border-securiti-blue-500"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-securiti-blue-600 hover:bg-securiti-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-securiti-blue-500 disabled:bg-securiti-blue-400"
                        >
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};