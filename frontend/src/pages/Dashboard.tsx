import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Visit, VisitStatus, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircleIcon, ClockIcon, LoginIcon } from '../components/common/icons';
import * as api from '../services/api';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="card shadow-sm border-0 mb-3">
        <div className="card-body d-flex align-items-center">
            <div className={`d-flex align-items-center justify-content-center rounded-circle ${color}`} style={{ width: 48, height: 48 }}>
                {icon}
            </div>
            <div className="ms-3">
                <div className="h3 mb-0 fw-bold text-dark">{value}</div>
                <div className="text-muted small">{title}</div>
            </div>
        </div>
    </div>
);

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
            <img className="w-10 h-10 rounded-full" src={visit.visitorPhoto || `https://i.pravatar.cc/100?u=${visit._id}`} alt={visit.visitorName} />
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

            <div className="row g-3 mb-3">
                <div className="col-12 col-md-6 col-lg-3">
                    <StatCard 
                        title="Visitas Activas" 
                        value={stats.checkedIn} 
                        icon={<LoginIcon className="text-white" />} 
                        color="bg-success"
                    />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <StatCard 
                        title="Pendientes" 
                        value={stats.pending} 
                        icon={<ClockIcon className="text-white" />} 
                        color="bg-warning"
                    />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <StatCard 
                        title="Pre-aprobadas" 
                        value={stats.approved} 
                        icon={<CheckCircleIcon className="text-white" />} 
                        color="bg-primary"
                    />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <StatCard 
                        title="Completadas Hoy" 
                        value={stats.completed} 
                        icon={<CheckCircleIcon className="text-white" />}
                        color="bg-secondary"
                    />
                </div>
            </div>

            {user?.role === 'admin' && (
                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                        <StatCard 
                            title="Total Usuarios" 
                            value={stats.totalUsers} 
                            icon={<div className="text-white" style={{ fontSize: 24 }}>👥</div>} 
                            color="bg-purple"
                        />
                    </div>
                    <div className="col-12 col-md-6">
                        <StatCard 
                            title="Hosts Disponibles" 
                            value={stats.totalHosts} 
                            icon={<div className="text-white" style={{ fontSize: 24 }}>🏢</div>} 
                            color="bg-info"
                        />
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
