
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardIcon, VisitsIcon, UsersIcon, ReportsIcon, SettingsIcon } from '../common/icons';

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-shield-lock text-primary" viewBox="0 0 16 16">
        <path d="M5.5 8a1.5 1.5 0 1 1 3 0v1a.5.5 0 0 1-1 0V8a.5.5 0 0 0-1 0v1a.5.5 0 0 1-1 0V8z"/>
        <path d="M8 0c-.69 0-1.342.132-1.972.378C3.668 1.07 2.5 2.522 2.5 4.118v2.09c0 3.1 2.5 5.482 5.5 7.292 3-1.81 5.5-4.192 5.5-7.292v-2.09c0-1.596-1.168-3.048-3.528-3.74A6.978 6.978 0 0 0 8 0z"/>
    </svg>
);

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; collapsed: boolean }> = ({ to, icon, label, collapsed }) => {
    return (
        <li className="nav-item w-100" style={{ listStyle: 'none' }}>
            <NavLink
                to={to}
                end
                className={({ isActive }) =>
                    `nav-link d-flex align-items-center ${collapsed ? 'justify-content-center' : ''} px-3 py-2 ${isActive ? 'active bg-primary text-white' : 'text-dark'} border-0 w-100`
                }
                style={collapsed ? { flexDirection: 'column', width: 56, height: 56, padding: 0, borderRadius: 8, margin: '0 auto' } : { borderRadius: 8 }}
            >
                <span className={collapsed ? '' : 'me-2'} style={collapsed ? { fontSize: 24 } : {}}>{icon}</span>
                {!collapsed && label}
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
        { to: "/", label: "Dashboard", icon: <DashboardIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/visits", label: "Visitas", icon: <VisitsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/users", label: "Usuarios", icon: <UsersIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/access-codes", label: "Códigos de Acceso", icon: <SettingsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/blacklist", label: "Lista Negra", icon: <UsersIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/reports", label: "Reportes", icon: <ReportsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/settings", label: "Configuración", icon: <SettingsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/settings/company", label: "Config. Empresa", icon: <SettingsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    ];

    return (
        <nav
            className={`sidebar bg-white border-end d-flex flex-column${collapsed ? ' align-items-center' : ' align-items-start'}`}
            style={{
                minWidth: collapsed ? 64 : 220,
                width: collapsed ? 64 : 220,
                transition: 'min-width 0.2s, width 0.2s',
                overflowX: 'hidden',
                zIndex: 100,
            }}
        >
            {/* Logo y nombre movidos al header */}
            <ul
                className={`nav flex-column mt-3 w-100 d-flex${collapsed ? ' align-items-center' : ' align-items-start'}`}
                style={{ paddingLeft: 0 }}
            >
                {navLinks.filter(link => user && link.roles.includes(user.role)).map((link) => (
                    <NavItem key={link.to} {...link} collapsed={collapsed} />
                ))}
            </ul>
        </nav>
    );
};
