import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Visit, VisitStatus, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, LoginIcon } from '../components/common/icons';
import * as api from '../services/api';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
    // If color is a hex value (starts with #), apply it as backgroundColor style
    const isHex = color && color.startsWith && color.startsWith('#');
    const bgStyle: React.CSSProperties = isHex
        ? { backgroundColor: color }
        : {};

    const classNames = isHex ? 'd-flex align-items-center justify-content-center' : `d-flex align-items-center justify-content-center ${color}`;

    return (
        <div className="card shadow-sm border-0 mb-3">
            <div className="card-body d-flex align-items-center">
                {/* Icon square with rounded corners to match design sample */}
                <div
                    className={classNames}
                    style={{ width: 56, height: 56, borderRadius: 12, boxShadow: '0 6px 18px rgba(2,6,23,0.06)', ...bgStyle }}
                >
                    <span style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icon}
                    </span>
                </div>
                <div className="ms-3">
                    <div className="h3 mb-0 fw-bold text-dark">{value}</div>
                    <div className="text-muted small">{title}</div>
                </div>
            </div>
        </div>
    );
};

const RecentActivityItem: React.FC<{ visit: Visit }> = ({ visit }) => {
    const getStatusInfo = () => {
        switch (visit.status) {
            case VisitStatus.CHECKED_IN: return { text: "hizo check-in.", color: "text-green-500" };
            case VisitStatus.APPROVED: return { text: "fue aprobada.", color: "text-blue-500" };
            case VisitStatus.PENDING: return { text: "está pendiente de aprobación.", color: "text-yellow-500" };
            case VisitStatus.COMPLETED: return { text: "ha finalizado.", color: "text-gray-500" };
            default: return { text: "ha finalizado.", color: "text-gray-500" };
        }
    };
    const statusInfo = getStatusInfo();
    const timeAgo = new Date(visit.createdAt || visit.scheduledDate).toLocaleDateString();

    return (
        <li className="flex items-center space-x-3 py-3 border-b last:border-b-0">
            <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {visit.visitorPhoto ? (
                    <img 
                        className="w-10 h-10 object-cover" 
                        src={visit.visitorPhoto} 
                        alt={visit.visitorName}
                        onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'inline';
                        }}
                    />
                ) : null}
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-7 h-7 text-gray-400" 
                    style={{ display: visit.visitorPhoto ? 'none' : 'inline' }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            </span>
            <div className="flex-1">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold">{visit.visitorName}</span> de {visit.visitorCompany}
                </p>
                <p className={`text-xs ${statusInfo.color}`}>La visita {statusInfo.text}</p>
                <p className="text-xs text-gray-400">{timeAgo}</p>
            </div>
        </li>
    );
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({ 
        active: 0, 
        pending: 0, 
        approved: 0, 
        checkedIn: 0, 
        completed: 0, 
        totalUsers: 0, 
        totalHosts: 0 
    });
    const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const [statsData, recentVisitsData, analytics] = await Promise.all([
                    api.getDashboardStats(),
                    api.getRecentVisits(5),
                    api.getAnalytics('week')
                ]);
                
                if (statsData) setStats(statsData);
                if (recentVisitsData) setRecentVisits(recentVisitsData);
                if (analytics) {
                    // Transform analytics data for chart
                    const chartData = analytics.map((item: any) => ({
                        day: new Date(item._id).toLocaleDateString('es-ES', { weekday: 'short' }),
                        visits: item.total
                    }));
                    setAnalyticsData(chartData);
                }
            } catch (error: any) {
                console.error('Error fetching dashboard data:', error);
                setError(error.message || 'Error al cargar los datos del dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading && stats.active === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-securiti-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando datos del dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid px-0">
            {error && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="btn-close" aria-label="Cerrar"></button>
                </div>
            )}

            <div className="mb-4">
                <h2 className="h2 fw-semibold text-dark mb-1">
                    Bienvenido de nuevo, {user?.firstName}!
                </h2>
                <div className="text-muted">
                    Aquí tienes un resumen de la actividad de hoy
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/visits')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/visits'); }}
                    aria-label="Ir a Visitas - Visitas Activas"
                    style={{ cursor: 'pointer' }}
                >
                <StatCard 
                    title="Visitas Activas" 
                    value={stats.checkedIn} 
                    icon={
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 20v-2a4 4 0 0 0-3-3.87" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    }
                    color="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white"
                />
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/visits')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/visits'); }}
                    aria-label="Ir a Visitas - Pendientes"
                    style={{ cursor: 'pointer' }}
                >
                <StatCard 
                    title="Pendientes" 
                    value={stats.pending} 
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" /></svg>
                    }
                    color="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white"
                />
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/visits')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/visits'); }}
                    aria-label="Ir a Visitas - Pre-aprobadas"
                    style={{ cursor: 'pointer' }}
                >
                <StatCard 
                    title="Pre-aprobadas" 
                    value={stats.approved} 
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    }
                    color="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white"
                />
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/reports')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/reports'); }}
                    aria-label="Ir a Reportes - Completadas Hoy"
                    style={{ cursor: 'pointer' }}
                >
                <StatCard 
                    title="Completadas Hoy" 
                    value={stats.completed} 
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" /></svg>
                    }
                    color="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white"
                />
                </div>
            </div>

            {user?.role === 'admin' && (
                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                         <div
                             role="button"
                             tabIndex={0}
                             onClick={() => navigate('/users')}
                             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/users'); }}
                             aria-label="Ir a Usuarios - Total Usuarios"
                             style={{ cursor: 'pointer' }}
                         >
                         <StatCard 
                             title="Total Usuarios" 
                             value={stats.totalUsers} 
                             icon={
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" className="w-8 h-8 text-white">
                             <path strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                             </svg>
                }
                    color="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white"
                        />
                        </div>
                    </div>
                    <div className="col-12 col-md-6">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate('/users')}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/users'); }}
                            aria-label="Ir a Usuarios - Hosts Disponibles"
                            style={{ cursor: 'pointer' }}
                        >
                        <StatCard 
                            title="Hosts Disponibles" 
                            value={stats.totalHosts} 
                            icon={
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="7" width="18" height="13" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3v4M8 3v4" /></svg>
                            }
                            color="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white"
                        />
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title fw-semibold mb-3">Visitas Esta Semana</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={analyticsData.length > 0 ? analyticsData : [
                                        { day: 'Lun', visits: 0 },
                                        { day: 'Mar', visits: 0 },
                                        { day: 'Mié', visits: 0 },
                                        { day: 'Jue', visits: 0 },
                                        { day: 'Vie', visits: 0 },
                                        { day: 'Sáb', visits: 0 },
                                        { day: 'Dom', visits: 0 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="day" tick={{fontSize: 12}}/>
                                        <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                                        <Tooltip 
                                            wrapperClassName="shadow rounded border" 
                                            cursor={{fill: 'rgba(34, 131, 229, 0.1)'}} 
                                            labelFormatter={(label) => `${label}`}
                                            formatter={(value) => [value, 'Visitas']}
                                        />
                                        <Bar dataKey="visits" fill="#2283e5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title fw-semibold mb-3">Actividad Reciente</h5>
                            {recentVisits.length > 0 ? (
                                <ul className="list-unstyled mb-0">
                                    {recentVisits.map(visit => (
                                        <RecentActivityItem key={visit._id} visit={visit} />
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-5">
                                    <div className="text-muted mb-2">No hay actividad reciente</div>
                                    <div className="small text-secondary">Las visitas aparecerán aquí cuando se registren</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
