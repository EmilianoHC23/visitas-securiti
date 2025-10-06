import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Visit, VisitStatus, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircleIcon, ClockIcon, LoginIcon } from '../components/common/icons';
import * as api from '../services/api';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500">{title}</p>
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
        <div className="container mx-auto">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
                        ×
                    </button>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                    Bienvenido de nuevo, {user?.firstName}!
                </h2>
                <p className="text-gray-500">
                    Aquí tienes un resumen de la actividad de hoy
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard 
                    title="Visitas Activas" 
                    value={stats.checkedIn} 
                    icon={<LoginIcon className="w-6 h-6 text-white"/>} 
                    color="bg-green-500" 
                />
                <StatCard 
                    title="Pendientes" 
                    value={stats.pending} 
                    icon={<ClockIcon className="w-6 h-6 text-white"/>} 
                    color="bg-yellow-500" 
                />
                <StatCard 
                    title="Pre-aprobadas" 
                    value={stats.approved} 
                    icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Completadas Hoy" 
                    value={stats.completed} 
                    icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} 
                    color="bg-gray-500" 
                />
            </div>

            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <StatCard 
                        title="Total Usuarios" 
                        value={stats.totalUsers} 
                        icon={<div className="w-6 h-6 text-white">👥</div>} 
                        color="bg-purple-500" 
                    />
                    <StatCard 
                        title="Hosts Disponibles" 
                        value={stats.totalHosts} 
                        icon={<div className="w-6 h-6 text-white">🏢</div>} 
                        color="bg-indigo-500" 
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-gray-800 mb-4">Visitas Esta Semana</h3>
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
                                    wrapperClassName="shadow-lg rounded-md border" 
                                    cursor={{fill: 'rgba(34, 131, 229, 0.1)'}} 
                                    labelFormatter={(label) => `${label}`}
                                    formatter={(value) => [value, 'Visitas']}
                                />
                                <Bar dataKey="visits" fill="#2283e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
                    {recentVisits.length > 0 ? (
                        <ul className="space-y-2">
                            {recentVisits.map(visit => (
                                <RecentActivityItem key={visit._id} visit={visit} />
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500 mb-2">No hay actividad reciente</p>
                            <p className="text-xs text-gray-400">Las visitas aparecerán aquí cuando se registren</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
