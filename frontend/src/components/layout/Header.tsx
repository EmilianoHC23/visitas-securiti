
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';
import { ChevronDownIcon, LogoutIcon } from '../common/icons';
import { FaX } from 'react-icons/fa6';
import { FaRegUser } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string): string => {
    switch (pathname) {
        case '/':
            return 'Dashboard';
        case '/visits':
            return 'Gestión de Visitas';
        case '/agenda':
            return 'Agenda de Visitas y Eventos';
        case '/access-codes':
            return 'Códigos de Acceso y Eventos'; 
        case '/public-registration':
            return 'Auto-registro de Visitantes';
        case '/blacklist':
            return 'Lista Negra de Visitantes';
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
    const { showToast } = useToast();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [btnHover, setBtnHover] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const pageTitle = getPageTitle(location.pathname);
    const [imgError, setImgError] = useState(false);

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
                    {/* Botón hamburguesa a la izquierda */}
                    <button
                        className="btn btn-outline-primary me-2 d-flex align-items-center justify-content-center no-focus-ring"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
                        onMouseEnter={() => setBtnHover(true)}
                        onMouseLeave={() => setBtnHover(false)}
                        onFocus={(e) => {
                            // remove any browser or framework focus ring and keep hover state
                            setBtnHover(true);
                            const t = e.currentTarget as HTMLButtonElement;
                            try {
                                t.style.outline = 'none';
                                t.style.boxShadow = 'none';
                                t.style.border = 'none';
                            } catch (err) {
                                // ignore
                            }
                        }}
                        onBlur={(e) => {
                            setBtnHover(false);
                            const t = e.currentTarget as HTMLButtonElement;
                            try {
                                // clear styles set on focus so React's style object applies again
                                t.style.outline = '';
                                t.style.boxShadow = '';
                                t.style.border = '';
                            } catch (err) {
                                // ignore
                            }
                        }}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 0,
                            boxSizing: 'border-box',
                            transition: 'background 180ms ease, border-color 180ms ease',
                            /* hover: black -> gray gradient */
                            background: btnHover ? 'linear-gradient(180deg, #000000 0%, #6b7280 100%)' : 'transparent',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                    >
                        {/* Animated hamburger -> X: cross-fade between SVG and react-icon X for a crisper X */}
                        <div style={{ width: 22, height: 22, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/** icon color depends on hover state for contrast */}
                            {/** when hovered use white icons for contrast */}
                            {(() => {
                                const iconFill = btnHover ? '#fff' : '#222';
                                const iconColor = btnHover ? '#fff' : '#222';
                                return (
                                    <>
                                        <svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'block', transition: 'opacity 160ms ease, transform 160ms ease', opacity: sidebarCollapsed ? 0 : 1, transform: sidebarCollapsed ? 'scale(0.85)' : 'none' }} width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect
                                                y="4"
                                                width="22"
                                                height="2.5"
                                                rx="1.25"
                                                fill={iconFill}
                                            />
                                            <rect
                                                y="9.25"
                                                width="22"
                                                height="2.5"
                                                rx="1.25"
                                                fill={iconFill}
                                            />
                                            <rect
                                                y="14.5"
                                                width="22"
                                                height="2.5"
                                                rx="1.25"
                                                fill={iconFill}
                                            />
                                        </svg>
                                        <FaX style={{ position: 'absolute', top: '50%', left: '50%', transform: `${sidebarCollapsed ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.8)'}`, width: 18, height: 18, transition: 'opacity 180ms ease, transform 180ms ease', opacity: sidebarCollapsed ? 1 : 0, color: iconColor, display: 'block' }} aria-hidden />
                                    </>
                                );
                            })()}
                        </div>
                    </button>
                </div>
                <span className="navbar-brand fw-semibold fs-4 text-dark mb-0 ms-4 flex-grow-1">{pageTitle}</span>
                <div className="ms-auto position-relative" ref={dropdownRef}>
                    <button
                        className="btn d-flex align-items-center"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        aria-expanded={dropdownOpen}
                    >
                        <span className="me-2 d-inline-flex align-items-center justify-content-center rounded-circle bg-gray-200 position-relative" style={{ width: 40, height: 40 }}>
                            {user.profileImage && user.profileImage.trim() !== '' && !imgError ? (
                                <img
                                    src={user.profileImage}
                                    alt="Perfil"
                                    className="rounded-circle position-absolute top-0 start-0"
                                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <FaRegUser className="w-7 h-7 text-gray-400" />
                            )}
                        </span>
                        <div className="d-none d-md-block text-start me-2">
                            <div className="fw-semibold text-dark">{user.firstName} {user.lastName}</div>
                            <div className="text-muted text-capitalize small">{user.role}</div>
                        </div>
                        <ChevronDownIcon className="text-secondary w-5 h-5" />
                    </button>
                    {dropdownOpen && (
                        <div className="dropdown-menu dropdown-menu-end show mt-2 shadow" style={{ minWidth: 200, right: 0 }}>
                            <a href="#profile" className="dropdown-item">Mi Perfil</a>
                            <button
                                onClick={() => {
                                    try {
                                        logout();
                                        // show confirmation toast
                                        showToast('Sesión cerrada correctamente', 'success');
                                    } catch (err) {
                                        // if something goes wrong, show an error toast
                                        try {
                                            showToast('No se pudo cerrar la sesión', 'error');
                                        } catch (_) {
                                            // swallow
                                        }
                                    }
                                }}
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
