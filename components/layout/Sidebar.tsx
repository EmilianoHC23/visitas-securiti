
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardIcon, VisitsIcon, UsersIcon, ReportsIcon, SettingsIcon } from '../common/icons';

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-securiti-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944L12 23l9-2.056A12.02 12.02 0 0021.618 7.984a11.955 11.955 0 01-4.016-4.016z" />
    </svg>
);


const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <NavLink
            to={to}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-securiti-blue-600 text-white'
                    : 'text-gray-200 hover:bg-securiti-blue-800 hover:text-white'
            }`}
        >
            {icon}
            <span className="ml-4">{label}</span>
        </NavLink>
    );
};


export const Sidebar: React.FC = () => {
    const { user } = useAuth();
    
    const navLinks = [
        { to: "/", label: "Dashboard", icon: <DashboardIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/visits", label: "Visitas", icon: <VisitsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.RECEPTION, UserRole.HOST] },
        { to: "/users", label: "Usuarios", icon: <UsersIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/reports", label: "Reportes", icon: <ReportsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
        { to: "/settings", label: "Configuración", icon: <SettingsIcon className="w-5 h-5" />, roles: [UserRole.ADMIN] },
    ];

    return (
        <div className="flex flex-col w-64 h-screen bg-securiti-blue-900 text-white">
            <div className="flex items-center justify-center h-20 border-b border-securiti-blue-800">
                <ShieldIcon />
                <h1 className="text-xl font-bold ml-2">Visitas SecuriTI</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navLinks.filter(link => user && link.roles.includes(user.role)).map((link) => (
                    <NavItem key={link.to} {...link} />
                ))}
            </nav>
        </div>
    );
};
