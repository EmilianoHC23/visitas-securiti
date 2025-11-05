
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

type NavItemProps = { to: string; icon: React.ReactNode; label: string; collapsed: boolean };
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed }) => {
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
};

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
    const { user } = useAuth();

    const navLinks = [
        { to: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/visits", label: "Visitas", icon: <ClipboardList className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/agenda", label: "Agenda", icon: <Calendar className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/users", label: "Usuarios", icon: <Users className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/access-codes", label: "Accesos/Eventos", icon: <IoQrCodeOutline className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/public-registration", label: "Auto-registro", icon: <UserPlus className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/blacklist", label: "Lista Negra", icon: <UserX className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/reports", label: "Reportes", icon: <BarChart3 className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/settings", label: "Configuración", icon: <Settings className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    ];

    return (
        <nav
            className={`sidebar d-flex flex-column${collapsed ? ' align-items-center' : ' align-items-start'}`}
                style={{
                minWidth: collapsed ? 64 : 220,
                width: collapsed ? 64 : 220,
                transition: 'min-width 0.2s, width 0.2s',
                overflowX: 'hidden',
                zIndex: 10,
                // grayscale gradient: black -> dark gray to contrast with white cards
                background: 'linear-gradient(180deg, var(--sidebar-gradient-start) 0%, var(--sidebar-gradient-end) 100%)',
                color: '#ffffff'
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
                            <div className="fw-bold" style={{ color: '#ffffff', letterSpacing: 1 }}>VISITAS</div>
                            <div className="small text-white-50" style={{ opacity: 0.85 }}>SECURITI</div>
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
                    <NavItem key={link.to} {...link} collapsed={collapsed} />
                ))}
            </ul>
            <div style={{ flex: 1 }} />
            {/* optional footer could go here */}
        </nav>
    );
};
