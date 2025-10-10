
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardIcon, VisitsIcon, UsersIcon, ReportsIcon, SettingsIcon, AgendaIcon, QrIcon, BlacklistIcon, CompanyIcon } from '../common/icons';

type NavItemProps = { to: string; icon: React.ReactNode; label: string; collapsed: boolean };
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
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
    { to: "/agenda", label: "Agenda", icon: <AgendaIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/users", label: "Usuarios", icon: <UsersIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    { to: "/access-codes", label: "Códigos de Acceso", icon: <QrIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
    { to: "/blacklist", label: "Lista Negra", icon: <BlacklistIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION] },
        { to: "/reports", label: "Reportes", icon: <ReportsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/settings", label: "Configuración", icon: <SettingsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    { to: "/settings/company", label: "Config. Empresa", icon: <CompanyIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    ];

    return (
        <nav
            className={`sidebar bg-white border-end d-flex flex-column${collapsed ? ' align-items-center' : ' align-items-start'}`}
            style={{
                minWidth: collapsed ? 64 : 220,
                width: collapsed ? 64 : 220,
                transition: 'min-width 0.2s, width 0.2s',
                overflowX: 'hidden',
                zIndex: 10,
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
