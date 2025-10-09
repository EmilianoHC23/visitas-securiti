
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

export const Header: React.FC<{ sidebarCollapsed: boolean; setSidebarCollapsed: (collapsed: boolean) => void }> = ({ sidebarCollapsed, setSidebarCollapsed }) => {
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
        <nav className="navbar navbar-expand navbar-light bg-white border-bottom px-3" style={{ minHeight: 64 }}>
            <div className="container-fluid">
                <div className="d-flex align-items-center">
                    {/* Logo y nombre */}
                    <img src="/logo.png" alt="Logo" style={{ width: 52, height: 52 }} className="me-3" />
                    <div className="d-flex flex-column lh-1 me-4">
                        <span className="fw-bold text-dark" style={{ fontSize: 18, letterSpacing: 1 }}>VISITAS</span>
                        <span className="fw-bold" style={{ fontSize: 18, letterSpacing: 1, color: '#232b3e' }}>SECURITI</span>
                    </div>
                    {/* Botón hamburguesa a la izquierda */}
                    <button
                        className="btn btn-outline-primary me-2 d-flex align-items-center justify-content-center"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
                        style={{ boxShadow: 'none', width: 40, height: 40, borderRadius: '50%' }}
                    >
                        {/* Icono hamburguesa SVG */}
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect y="4" width="22" height="2.5" rx="1.25" fill="#222" />
                            <rect y="9.25" width="22" height="2.5" rx="1.25" fill="#222" />
                            <rect y="14.5" width="22" height="2.5" rx="1.25" fill="#222" />
                        </svg>
                    </button>
                </div>
                <span className="navbar-brand fw-semibold fs-4 text-dark mb-0 ms-4 flex-grow-1">{pageTitle}</span>
                <div className="ms-auto position-relative" ref={dropdownRef}>
                    <button
                        className="btn d-flex align-items-center"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        aria-expanded={dropdownOpen}
                    >
                        {user.profileImage && user.profileImage.trim() !== '' ? (
                            <span className="me-2 d-inline-flex align-items-center justify-content-center rounded-circle bg-gray-200 position-relative" style={{ width: 40, height: 40 }}>
                                <img 
                                    src={user.profileImage} 
                                    alt="Perfil" 
                                    className="rounded-circle position-absolute top-0 start-0" 
                                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                                    onError={e => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'inline';
                                    }}
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-gray-400" style={{ display: 'none' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </span>
                        ) : (
                            <span className="me-2 d-inline-flex align-items-center justify-content-center rounded-circle bg-gray-200" style={{ width: 40, height: 40 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </span>
                        )}
                        <div className="d-none d-md-block text-start me-2">
                            <div className="fw-semibold text-dark">{user.firstName} {user.lastName}</div>
                            <div className="text-muted text-capitalize small">{user.role}</div>
                        </div>
                        <ChevronDownIcon className="text-secondary" />
                    </button>
                    {dropdownOpen && (
                        <div className="dropdown-menu dropdown-menu-end show mt-2 shadow" style={{ minWidth: 200, right: 0 }}>
                            <a href="#profile" className="dropdown-item">Mi Perfil</a>
                            <button
                                onClick={logout}
                                className="dropdown-item d-flex align-items-center"
                            >
                                    <LogoutIcon className="me-2 w-5 h-5" />
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};
