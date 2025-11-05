
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';
import { ChevronDownIcon, LogoutIcon } from '../common/icons';
import { FaX } from 'react-icons/fa6';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string): string => {
    switch (pathname) {
        case '/':
            return 'Dashboard';
        case '/visits':
            return 'Gestión de Visitas';
        case '/agenda':
            return 'Agenda de Visitas y Eventos';
        case '/users':
            return 'Gestión de Usuarios';
        case '/access-codes':
            return 'Gestión de Accesos y Eventos';
        case '/public-registration':
            return 'Auto-registro';
        case '/blacklist':
            return 'Lista Negra';
        case '/reports':
            return 'Reportes de Visitas';
        case '/settings':
            return 'Configuración de la Empresa';
        default:
            return 'Visitas SecuriTI';
    }
};

// Animation variants (staggered dropdown + chevron rotation + icons)
const wrapperVariants: Variants = {
    open: {
        scaleY: 1,
        opacity: 1,
        transition: {
            when: 'beforeChildren',
            staggerChildren: 0.06,
        },
    },
    closed: {
        scaleY: 0,
        opacity: 0,
        transition: {
            when: 'afterChildren',
            staggerChildren: 0.04,
        },
    },
};

const itemVariants: Variants = {
    open: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
    closed: { opacity: 0, y: -8, transition: { duration: 0.12 } },
};

const actionIconVariants: Variants = {
    open: { scale: 1, y: 0, opacity: 1 },
    closed: { scale: 0.8, y: -4, opacity: 0 },
};

const iconVariants: Variants = {
    open: { rotate: 180 },
    closed: { rotate: 0 },
};

export const Header: React.FC<{ 
    sidebarCollapsed: boolean; 
    setSidebarCollapsed: (collapsed: boolean) => void;
    isMobile?: boolean;
    mobileMenuOpen?: boolean;
}> = ({ sidebarCollapsed, setSidebarCollapsed, isMobile = false, mobileMenuOpen = false }) => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [btnHover, setBtnHover] = useState(false);
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
        // make header background transparent and remove bottom border so the white "rectangle" disappears
        <nav className="navbar navbar-expand navbar-light px-3" style={{ minHeight: 64, background: 'transparent', borderBottom: 'none' }}>
            <div className="container-fluid">
                <div className="d-flex align-items-center">
                    {/* Botón hamburguesa a la izquierda */}
                    <button
                        className="btn btn-outline-primary me-2 d-flex align-items-center justify-content-center no-focus-ring"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={isMobile ? (mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú') : (sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú')}
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
                                const isMenuOpen = isMobile ? mobileMenuOpen : !sidebarCollapsed;
                                return (
                                    <>
                                        <svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'block', transition: 'opacity 160ms ease, transform 160ms ease', opacity: isMenuOpen ? 0 : 1, transform: isMenuOpen ? 'scale(0.85)' : 'none' }} width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                        <FaX style={{ position: 'absolute', top: '50%', left: '50%', transform: `${isMenuOpen ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.8)'}`, width: 18, height: 18, transition: 'opacity 180ms ease, transform 180ms ease', opacity: isMenuOpen ? 1 : 0, color: iconColor, display: 'block' }} aria-hidden />
                                    </>
                                );
                            })()}
                        </div>
                    </button>
                </div>
                <span className="navbar-brand fw-semibold fs-4 text-dark mb-0 ms-4 flex-grow-1" style={{ fontSize: isMobile ? '1.1rem' : undefined }}>{pageTitle}</span>
                <div className="ms-auto position-relative" ref={dropdownRef}>
                    {/* Pill container similar to the Horizon UI sample: subtle background, rounded, with a search area and the user block */}
                    <div
                        className="d-flex align-items-center gap-2 rounded-pill shadow-sm px-3 py-1"
                        style={{ background: 'rgba(255,255,255,0.95)', minHeight: 48, maxHeight: 56 }}
                    >
                        {/* user clickable block only (search & notifications removed as requested) */}
                        <button
                            className="btn d-flex align-items-center p-0"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            aria-expanded={dropdownOpen}
                            onFocus={(e) => {
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
                                const t = e.currentTarget as HTMLButtonElement;
                                try {
                                    t.style.outline = '';
                                    t.style.boxShadow = '';
                                    t.style.border = '';
                                } catch (err) {
                                    // ignore
                                }
                            }}
                            style={{ background: 'transparent', outline: 'none', boxShadow: 'none', border: 'none', WebkitTapHighlightColor: 'transparent' }}
                        >
                            {user.profileImage && user.profileImage.trim() !== '' ? (
                                <span className={`${isMobile ? '' : 'me-2'} d-inline-flex align-items-center justify-content-center rounded-circle bg-gray-200 position-relative`} style={{ width: 44, height: 44 }}>
                                    <img
                                        src={user.profileImage}
                                        alt="Perfil"
                                        className="rounded-circle position-absolute top-0 start-0"
                                        style={{ width: 44, height: 44, objectFit: 'cover' }}
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
                                <span className={`${isMobile ? '' : 'me-2'} d-inline-flex align-items-center justify-content-center rounded-circle bg-gray-200`} style={{ width: 44, height: 44 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </span>
                            )}

                            {!isMobile && (
                                <div className="d-none d-md-block text-start me-2">
                                    <div className="fw-semibold text-dark" style={{ lineHeight: 1 }}>{user.firstName} {user.lastName}</div>
                                    <div className="text-muted text-capitalize small" style={{ lineHeight: 1 }}>{user.role}</div>
                                </div>
                            )}
                            <motion.span variants={iconVariants} animate={dropdownOpen ? 'open' : 'closed'} className={`d-inline-block ${isMobile ? 'd-none' : ''}`}>
                                <ChevronDownIcon className="text-secondary w-5 h-5" />
                            </motion.span>
                        </button>
                    </div>

                    {/* Animated dropdown menu using framer-motion (staggered items + chevron rotation) */}
                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial="closed"
                                animate="open"
                                exit="closed"
                                variants={wrapperVariants}
                                style={{ transformOrigin: 'top', right: 0, minWidth: 200 }}
                                className="dropdown-menu dropdown-menu-end show mt-2 shadow position-absolute"
                            >
                                <motion.a variants={itemVariants} href="#profile" className="dropdown-item">Mi Perfil</motion.a>

                                <motion.button
                                    variants={itemVariants}
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
                                    <motion.span variants={actionIconVariants} className="me-2 d-inline-flex align-items-center justify-content-center">
                                        <LogoutIcon />
                                    </motion.span>
                                    Cerrar Sesión
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};
