
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

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    return (
        <li className="nav-item">
            <NavLink
                to={to}
                end
                className={({ isActive }) =>
                    `nav-link d-flex align-items-center px-3 py-2 rounded ${isActive ? 'active bg-primary text-white' : 'text-dark'} `
                }
            >
                <span className="me-2">{icon}</span>
                {label}
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

    return collapsed ? null : (
        <nav className="sidebar bg-white border-end" style={{ minWidth: 220, transition: 'min-width 0.2s' }}>
            {/* Logo y nombre movidos al header */}
            <ul className="nav flex-column mt-3">
                {navLinks.filter(link => user && link.roles.includes(user.role)).map((link) => (
                    <NavItem key={link.to} {...link} />
                ))}
            </ul>
        </nav>
    );
};
