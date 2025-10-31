import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Visit, VisitStatus, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, LoginIcon } from '../components/common/icons';
import { FaRegUser } from 'react-icons/fa';
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
                <FaRegUser className="w-7 h-7 text-gray-400" style={{ display: visit.visitorPhoto ? 'none' : 'inline' }} />
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
    const [frequentCompanies, setFrequentCompanies] = useState<Array<{ company: string; count: number }>>([]);
    const [frequentVisitors, setFrequentVisitors] = useState<Array<{ id: string; name: string; company?: string; photo?: string; count: number }>>([]);
    const [analyticsData, setAnalyticsData] = useState<any[]>([]);
    const [analyticsStatusData, setAnalyticsStatusData] = useState<any[]>([]);
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setChartLoading(true);
                setIsLoading(true);
                setError(null);
                
                const [statsData, recentVisitsData, largeRecentVisitsData, analytics] = await Promise.all([
                    api.getDashboardStats(),
                    api.getRecentVisits(5),
                    api.getRecentVisits(200), // fetch more to compute frequent companies
                    api.getAnalytics(period)
                ]);
                
                if (statsData) setStats(statsData);
                if (recentVisitsData) setRecentVisits(recentVisitsData);
                // Build frequent companies list from the larger recent visits sample
                try {
                    const visitsForCompanies = (largeRecentVisitsData && largeRecentVisitsData.length > 0) ? largeRecentVisitsData : (recentVisitsData || []);
                    const map = new Map<string, number>();
                    visitsForCompanies.forEach((v: Visit) => {
                        const name = (v.visitorCompany || 'Sin empresa').trim() || 'Sin empresa';
                        map.set(name, (map.get(name) || 0) + 1);
                    });
                    const arr = Array.from(map.entries()).map(([company, count]) => ({ company, count }));
                    arr.sort((a, b) => b.count - a.count);
                    setFrequentCompanies(arr.slice(0, 8));
                } catch (err) {
                    console.warn('Could not compute frequent companies:', err);
                }
                // Build frequent visitors list (top 5)
                try {
                    const visitsForVisitors = (largeRecentVisitsData && largeRecentVisitsData.length > 0) ? largeRecentVisitsData : (recentVisitsData || []);
                    const vmap = new Map<string, { id: string; name: string; company?: string; photo?: string; count: number }>();
                    visitsForVisitors.forEach((v: Visit) => {
                        const id = (v.visitorEmail || v.visitorName || v._id) as string;
                        const name = v.visitorName || (v.visitorEmail ? v.visitorEmail.split('@')[0] : 'Visitante');
                        const company = v.visitorCompany || '';
                        const photo = v.visitorPhoto || '';
                        if (!vmap.has(id)) {
                            vmap.set(id, { id, name, company, photo, count: 0 });
                        }
                        const cur = vmap.get(id)!;
                        cur.count = (cur.count || 0) + 1;
                    });
                    const varr = Array.from(vmap.values());
                    varr.sort((a, b) => b.count - a.count);
                    setFrequentVisitors(varr.slice(0, 5));
                } catch (err) {
                    console.warn('Could not compute frequent visitors:', err);
                }
                if (analytics) {
                    // Transform analytics data for simple visits chart (kept for compatibility)
                    const chartData = analytics.map((item: any) => ({
                        day: new Date(item._id).toLocaleDateString('es-ES', { weekday: 'short' }),
                        visits: item.total
                    }));
                    setAnalyticsData(chartData);
                }

                // Build time series aggregated by status from recent visits (client-side)
                try {
                    const visitsSource: Visit[] = (largeRecentVisitsData && largeRecentVisitsData.length > 0) ? largeRecentVisitsData : (recentVisitsData || []);
                    const days = period === 'week' ? 7 : 30;
                    const end = new Date();
                    end.setHours(0, 0, 0, 0);
                    const dateKeys: string[] = [];
                    for (let i = days - 1; i >= 0; i--) {
                        const d = new Date(end);
                        d.setDate(end.getDate() - i);
                        dateKeys.push(d.toISOString().slice(0, 10));
                    }

                    const seriesMap = new Map<string, any>();
                    dateKeys.forEach(k => {
                        const d = new Date(k + 'T00:00:00');
                        seriesMap.set(k, {
                            day: d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }),
                            pending: 0,
                            approved: 0,
                            checkedIn: 0,
                            completed: 0
                        });
                    });

                    visitsSource.forEach((v: Visit) => {
                        const d = new Date(v.scheduledDate || v.createdAt || v._id);
                        const key = d.toISOString().slice(0, 10);
                        if (!seriesMap.has(key)) return;
                        const obj = seriesMap.get(key);
                        switch (v.status) {
                            case VisitStatus.PENDING:
                                obj.pending = (obj.pending || 0) + 1;
                                break;
                            case VisitStatus.APPROVED:
                                obj.approved = (obj.approved || 0) + 1;
                                break;
                            case VisitStatus.CHECKED_IN:
                                obj.checkedIn = (obj.checkedIn || 0) + 1;
                                break;
                            case VisitStatus.COMPLETED:
                                obj.completed = (obj.completed || 0) + 1;
                                break;
                            default:
                                // treat unknown as completed for display purposes
                                obj.completed = (obj.completed || 0) + 1;
                                break;
                        }
                    });

                    const statusSeries = Array.from(seriesMap.values());
                    setAnalyticsStatusData(statusSeries);
                } catch (err) {
                    console.warn('Could not compute analyticsStatusData:', err);
                }
                setChartLoading(false);
            } catch (error: any) {
                console.error('Error fetching dashboard data:', error);
                setError(error.message || 'Error al cargar los datos del dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [period]);

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
                    <div className="d-flex align-items-center" style={{ gap: 12 }}>
                        {/* Error icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }} aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
                        </svg>
                        <span>{error}</span>
                    </div>
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
                            <div className="d-flex justify-content-between items-center mb-2">
                                <h5 className="card-title fw-semibold mb-0">Visitas</h5>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPeriod('week')} className={`px-3 py-1 rounded-lg text-sm ${period === 'week' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>7 días</button>
                                    <button onClick={() => setPeriod('month')} className={`px-3 py-1 rounded-lg text-sm ${period === 'month' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>30 días</button>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={analyticsStatusData.length > 0 ? analyticsStatusData : [
                                        { day: 'Lun', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Mar', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Mié', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Jue', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Vie', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Sáb', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Dom', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="day" tick={{fontSize: 12}}/>
                                        <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                                        <Tooltip 
                                            wrapperClassName="shadow rounded border" 
                                            cursor={{fill: 'rgba(34, 131, 229, 0.06)'}} 
                                            labelFormatter={(label) => `${label}`}
                                        />
                                        {/* Stacked bars: pending (orange), approved (blue), checkedIn (green), completed (gray) */}
                                        <Bar dataKey="pending" stackId="a" fill="#f6ad55" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="approved" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="checkedIn" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="completed" stackId="a" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Top visitors metric below the chart */}
                            <div className="mt-4">
                                <h6 className="mb-3 fw-semibold">Visitantes frecuentes</h6>
                                {frequentVisitors.length > 0 ? (
                                    (() => {
                                        const total = frequentVisitors.reduce((s, v) => s + v.count, 0) || 1;
                                        return (
                                            <div className="space-y-3">
                                                {frequentVisitors.map(v => {
                                                    const pct = Math.round((v.count / total) * 100);
                                                    return (
                                                        <div key={v.id} className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center me-3">
                                                                    {v.photo ? (
                                                                        <img src={v.photo} alt={v.name} className="w-10 h-10 object-cover" />
                                                                    ) : (
                                                                        <FaRegUser className="w-6 h-6 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div style={{ maxWidth: 220 }}>
                                                                    <div className="text-sm fw-medium text-gray-800 truncate">{v.name}</div>
                                                                    <div className="text-xs text-muted truncate">{v.company}</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ width: 140 }} className="text-end">
                                                                <div className="text-sm text-gray-600">{v.count} · {pct}%</div>
                                                                <div className="w-full bg-gray-100 rounded-full h-2 mt-1 overflow-hidden">
                                                                    <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600" style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="text-center text-muted">No hay visitantes frecuentes</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="mb-4">
                                <h5 className="card-title fw-semibold mb-3">Empresas frecuentes</h5>
                                {frequentCompanies.length > 0 ? (
                                    (() => {
                                        const total = frequentCompanies.reduce((s, c) => s + c.count, 0) || 1;
                                        return (
                                            <div className="space-y-3">
                                                {frequentCompanies.map(fc => {
                                                    const pct = Math.round((fc.count / total) * 100);
                                                    return (
                                                        <div key={fc.company} className="">
                                                            <div className="d-flex justify-content-between items-center mb-1">
                                                                <div className="text-sm text-gray-700 font-medium truncate" style={{maxWidth: '65%'}}>{fc.company}</div>
                                                                <div className="text-sm text-gray-600">{fc.count} · {pct}%</div>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="text-center py-3 text-sm text-muted">No hay datos de empresas frecuentes</div>
                                )}
                            </div>

                            <div>
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
        </div>
    );
};
