
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
    LayoutDashboard, 
    Users, 
    ClipboardList, 
    Calendar, 
    UserPlus, 
    UserX, 
    BarChart3, 
    Settings 
} from 'lucide-react';
import { IoQrCodeOutline } from 'react-icons/io5';

const DashboardIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const AccessIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 12H12V17M3.01 12H3M8.01 17H8M12.01 21H12M21.01 12H21M3 17H4.5M15.5 12H17.5M3 21H8M12 2V8M17.6 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V17.6C21 17.0399 21 16.7599 20.891 16.546C20.7951 16.3578 20.6422 16.2049 20.454 16.109C20.2401 16 19.9601 16 19.4 16H17.6C17.0399 16 16.7599 16 16.546 16.109C16.3578 16.2049 16.2049 16.3578 16.109 16.546C16 16.7599 16 17.0399 16 17.6V19.4C16 19.9601 16 20.2401 16.109 20.454C16.2049 20.6422 16.3578 20.7951 16.546 20.891C16.7599 21 17.0399 21 17.6 21ZM17.6 8H19.4C19.9601 8 20.2401 8 20.454 7.89101C20.6422 7.79513 20.7951 7.64215 20.891 7.45399C21 7.24008 21 6.96005 21 6.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H17.6C17.0399 3 16.7599 3 16.546 3.10899C16.3578 3.20487 16.2049 3.35785 16.109 3.54601C16 3.75992 16 4.03995 16 4.6V6.4C16 6.96005 16 7.24008 16.109 7.45399C16.2049 7.64215 16.3578 7.79513 16.546 7.89101C16.7599 8 17.0399 8 17.6 8ZM4.6 8H6.4C6.96005 8 7.24008 8 7.45399 7.89101C7.64215 7.79513 7.79513 7.64215 7.89101 7.45399C8 7.24008 8 6.96005 8 6.4V4.6C8 4.03995 8 3.75992 7.89101 3.54601C7.79513 3.35785 7.64215 3.20487 7.45399 3.10899C7.24008 3 6.96005 3 6.4 3H4.6C4.03995 3 3.75992 3 3.54601 3.10899C3.35785 3.20487 3.20487 3.35785 3.10899 3.54601C3 3.75992 3 4.03995 3 4.6V6.4C3 6.96005 3 7.24008 3.10899 7.45399C3.20487 7.64215 3.35785 7.79513 3.54601 7.89101C3.75992 8 4.03995 8 4.6 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BlacklistIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4C16.93 4 17.395 4 17.7765 4.10222C18.8117 4.37962 19.6204 5.18827 19.8978 6.22354C20 6.60504 20 7.07003 20 8V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V8C4 7.07003 4 6.60504 4.10222 6.22354C4.37962 5.18827 5.18827 4.37962 6.22354 4.10222C6.60504 4 7.07003 4 8 4M9.5 12L14.5 17M14.5 12L9.5 17M9.6 6H14.4C14.9601 6 15.2401 6 15.454 5.89101C15.6422 5.79513 15.7951 5.64215 15.891 5.45399C16 5.24008 16 4.96005 16 4.4V3.6C16 3.03995 16 2.75992 15.891 2.54601C15.7951 2.35785 15.6422 2.20487 15.454 2.10899C15.2401 2 14.9601 2 14.4 2H9.6C9.03995 2 8.75992 2 8.54601 2.10899C8.35785 2.20487 8.20487 2.35785 8.10899 2.54601C8 2.75992 8 3.03995 8 3.6V4.4C8 4.96005 8 5.24008 8.10899 5.45399C8.20487 5.64215 8.35785 5.79513 8.54601 5.89101C8.75992 6 9.03995 6 9.6 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

type NavItemProps = { to: string; icon: React.ReactNode; label: string; collapsed: boolean; onClick?: () => void };
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    const [hover, setHover] = useState(false);
    // Styles for active / inactive (grayscale contrast)
    const activeBackground = 'linear-gradient(90deg,#111827,#374151)';
    const inactiveColor = 'rgba(255,255,255,0.95)';
    const inactiveColorSub = 'rgba(255,255,255,0.8)';

    return (
        <li className="nav-item w-100" style={{ listStyle: 'none' }}>
            <NavLink
                to={to}
                end
                onClick={onClick}
                className={`nav-link d-flex align-items-center ${collapsed ? 'justify-content-center' : ''} px-3 py-2 border-0 w-100`}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={collapsed ? {
                    flexDirection: 'column', width: 56, height: 56, padding: 0, borderRadius: 8, margin: '0.35rem auto',
                    background: isActive ? activeBackground : (hover ? 'rgba(255,255,255,0.04)' : 'transparent'),
                    color: isActive ? '#fff' : inactiveColor,
                    boxShadow: isActive ? '0 6px 18px rgba(0,0,0,0.25)' : 'none',
                    transition: 'background-color 120ms ease, box-shadow 120ms ease'
                } : {
                    borderRadius: 8,
                    background: isActive ? activeBackground : (hover ? 'rgba(255,255,255,0.03)' : 'transparent'),
                    color: isActive ? '#fff' : inactiveColor,
                    margin: '0.25rem 0',
                    transition: 'background-color 120ms ease'
                }}
            >
                <span className={collapsed ? '' : 'me-2'} style={{ color: isActive ? '#fff' : (hover ? '#fff' : inactiveColorSub), fontSize: collapsed ? 20 : undefined }}>{icon}</span>
                {!collapsed && <span style={{ fontWeight: 500 }}>{label}</span>}
            </NavLink>
        </li>
    );
};

type SidebarProps = {
    collapsed?: boolean;
    isMobile?: boolean;
    mobileMenuOpen?: boolean;
    onCloseMobile?: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ 
    collapsed = false, 
    isMobile = false,
    mobileMenuOpen = false,
    onCloseMobile
}) => {
    const { user } = useAuth();

    const navLinks = [
        { to: "/", label: "Dashboard", icon: <DashboardIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/visits", label: "Visitas", icon: <ClipboardList className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/users", label: "Usuarios", icon: <Users className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/access-codes", label: "Accesos/Eventos", icon: <AccessIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/public-registration", label: "Auto-registro", icon: <UserPlus className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/blacklist", label: "Lista Negra", icon: <BlacklistIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/reports", label: "Reportes", icon: <BarChart3 className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/settings", label: "Configuración", icon: <Settings className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    ];

    return (
        <nav
            className={`sidebar d-flex flex-column${collapsed ? ' align-items-center' : ' align-items-start'}`}
            style={{
                minWidth: isMobile ? 0 : (collapsed ? 64 : 220),
                width: isMobile ? 280 : (collapsed ? 64 : 220),
                maxWidth: isMobile ? 280 : undefined,
                transition: isMobile ? 'transform 0.3s ease' : 'min-width 0.2s, width 0.2s',
                overflowX: 'hidden',
                overflowY: 'auto',
                zIndex: isMobile ? 1050 : 10,
                background: 'linear-gradient(180deg, var(--sidebar-gradient-start) 0%, var(--sidebar-gradient-end) 100%)',
                color: '#ffffff',
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                height: '100vh',
                transform: isMobile ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
                boxShadow: isMobile && mobileMenuOpen ? '2px 0 10px rgba(0,0,0,0.3)' : 'none',
                visibility: isMobile && !mobileMenuOpen ? 'hidden' : 'visible'
            }}
        >
            {/* Top: logo + name (shows full when expanded, only avatar when collapsed) */}
            <div className={`d-flex w-100 ${collapsed ? 'justify-content-center' : 'align-items-center'} px-3`} style={{ height: 72 }}>
                {!collapsed ? (
                    <div className="d-flex align-items-center w-100">
                        <div style={{ width: 44, height: 44 }} className="me-3 d-inline-flex align-items-center justify-content-center overflow-hidden">
                            <img src="/logo_blanco.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        </div>
                        <div>
                            <div 
                                className="fw-bold" 
                                style={{ 
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #e5e7eb 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    letterSpacing: 1.8,
                                    fontSize: '1.15rem',
                                    fontWeight: 800,
                                    filter: 'brightness(1.2) contrast(1.1)',
                                    textShadow: '0 0 10px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                                    position: 'relative' as const,
                                    WebkitFilter: 'brightness(1.2) contrast(1.1)'
                                }}
                            >
                                VISITAS
                            </div>
                            <div 
                                className="small" 
                                style={{ 
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(229,231,235,0.75) 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    letterSpacing: 2.5,
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    filter: 'brightness(1.15)',
                                    textShadow: '0 0 8px rgba(255,255,255,0.2), 0 1px 4px rgba(0,0,0,0.2)',
                                    WebkitFilter: 'brightness(1.15)'
                                }}
                            >
                                SECURITI
                            </div>
                        </div>
                    </div>
                ) : (
                        <div style={{ width: 56, height: 56 }} className="d-inline-flex align-items-center justify-content-center overflow-hidden">
                            <img src="/logo_blanco.png" alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    </div>
                )}
            </div>

            <ul
                className={`nav flex-column mt-3 w-100 d-flex${collapsed ? ' align-items-center' : ' align-items-start'}`}
                style={{ paddingLeft: 0 }}
            >
                {navLinks.filter(link => user && link.roles.includes(user.role)).map((link) => (
                    <NavItem key={link.to} {...link} collapsed={collapsed} onClick={onCloseMobile} />
                ))}
            </ul>
            <div style={{ flex: 1 }} />
            {/* optional footer could go here */}
        </nav>
    );
};
