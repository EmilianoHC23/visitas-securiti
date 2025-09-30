
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDownIcon, LogoutIcon } from '../common/icons';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string): string => {
    switch (pathname) {
        case '/':
            return 'Dashboard';
        case '/visits':
            return 'Gestión de Visitas';
        case '/users':
            return 'Gestión de Usuarios';
        case '/reports':
            return 'Reportes de Visitas';
        case '/settings':
            return 'Configuración de la Empresa';
        default:
            return 'Visitas SecuriTI';
    }
};

export const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const pageTitle = getPageTitle(location.pathname);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b">
            <h1 className="text-2xl font-semibold text-gray-800">{pageTitle}</h1>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <img src={user.profileImage} alt="Perfil" className="w-10 h-10 rounded-full" />
                    <div className="text-left hidden md:block">
                        <p className="font-semibold text-sm text-gray-700">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1">
                        <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a>
                        <button
                            onClick={logout}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <LogoutIcon className="w-5 h-5 mr-2" />
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};
