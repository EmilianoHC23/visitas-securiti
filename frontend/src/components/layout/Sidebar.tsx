
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardIcon, VisitsIcon, UsersIcon, ReportsIcon, SettingsIcon } from '../common/icons';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    return (
        <li className="nav-item">
            <NavLink
                to={to}
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
        { to: "/agenda", label: "Agenda", icon: <VisitsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
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
