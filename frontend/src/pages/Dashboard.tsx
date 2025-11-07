import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { Visit, VisitStatus, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QrIcon, VisitsIcon, AgendaIcon } from '../components/common/icons';
import { FaRegUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api';

// Floating toast notification component
const Toast: React.FC<{ 
    message: string; 
    type: 'success' | 'error' | 'warning' | 'info'; 
    onClose: () => void;
}> = ({ message, type, onClose }) => {
    const config = {
        success: { 
            bg: 'bg-gradient-to-r from-emerald-500 to-green-600', 
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )
        },
        error: { 
            bg: 'bg-gradient-to-r from-red-500 to-red-600', 
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )
        },
        warning: { 
            bg: 'bg-gradient-to-r from-yellow-500 to-amber-600', 
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        },
        info: { 
            bg: 'bg-gradient-to-r from-blue-500 to-cyan-600', 
            icon: (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    };

    const { bg, icon } = config[type];

    useEffect(() => {
        const timer = setTimeout(() => onClose(), 4500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                className="fixed top-4 right-4 z-[9999] max-w-md"
            >
                <div className={`${bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3`}>
                    <div className="flex-shrink-0">
                        {icon}
                    </div>
                    <span className="font-medium flex-1">{message}</span>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

const Sparkline: React.FC<{ data: number[]; color?: string; width?: number; height?: number; onClick?: () => void; title?: string }> = ({ data, color = '#6366f1', width = 120, height = 36, onClick, title }) => {
    if (!data || data.length === 0) return null;
    const chartData = data.map((v, i) => ({ name: i.toString(), value: v }));
    const [focused, setFocused] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : -1}
            aria-label={title}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ width, height, cursor: onClick ? 'pointer' : 'default', outline: focused ? '3px solid rgba(59,130,246,0.12)' : undefined, borderRadius: 6 }}
            title={title}
            onClick={onClick}
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 2, right: 6, left: 6, bottom: 2 }}>
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                    <Tooltip
                        wrapperStyle={{ borderRadius: 8 }}
                        formatter={(value: any) => [value, 'Visitas']}
                        labelFormatter={() => ''}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; sparkData?: number[]; sparkColor?: string; deltaPercent?: number | null | undefined; deltaTooltip?: string; onSparkClick?: () => void; sparkTitle?: string; isActive?: boolean }> = ({ title, value, icon, color, sparkData, sparkColor, deltaPercent, deltaTooltip, onSparkClick, sparkTitle, isActive }) => {
    // If color is a hex value (starts with #), apply it as backgroundColor style
    const isHex = color && color.startsWith && color.startsWith('#');
    const bgStyle: React.CSSProperties = isHex
        ? { backgroundColor: color }
        : {};

    const classNames = isHex ? 'd-flex align-items-center justify-content-center' : `d-flex align-items-center justify-content-center ${color}`;

    return (
        <div className="card shadow-sm border-0 mb-3 h-100" style={{ minHeight: 96, height: '100%', border: isActive ? '1px solid rgba(59,130,246,0.15)' : undefined, boxShadow: isActive ? '0 6px 18px rgba(59,130,246,0.06)' : undefined }}>
            <div className="card-body d-flex align-items-center justify-content-between" style={{ gap: 12, height: '100%' }}>
                {/* Icon square with rounded corners to match design sample */}
                <div
                    className={classNames}
                    style={{ width: 56, height: 56, borderRadius: 12, boxShadow: '0 6px 18px rgba(2,6,23,0.06)', ...bgStyle }}
                >
                    <span style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icon}
                    </span>
                </div>
                <div className="ms-3" style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-flex align-items-center justify-content-between">
                        {/* Left: number */}
                        <div style={{ minWidth: 0, flexShrink: 0 }}>
                            <div className="h3 mb-0 fw-bold text-dark" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {typeof value === 'number' ? (
                                    <AnimatedNumber value={value} duration={1.2} />
                                ) : (
                                    value
                                )}
                            </div>
                            {/* Delta percent / small badge */}
                            {deltaPercent !== undefined && (
                                <div className="small mt-1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {deltaPercent === null ? (
                                        <span className="badge bg-success" title={deltaTooltip || "No hubo datos en el periodo anterior"}>Nuevo</span>
                                    ) : (
                                        <span className={deltaPercent > 0 ? 'text-success' : (deltaPercent < 0 ? 'text-danger' : 'text-muted')} title={deltaTooltip || `Cambio respecto al periodo anterior`}>
                                            {deltaPercent > 0 ? '▲' : (deltaPercent < 0 ? '▼' : '–')} {Math.abs(deltaPercent)}%
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right (md+): sparkline on top, title below */}
                        <div className="ms-3 d-none d-md-flex" style={{ width: 140, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {sparkData && sparkData.length > 0 ? (
                                <Sparkline data={sparkData} color={sparkColor || '#6366f1'} width={120} height={36} onClick={onSparkClick} title={sparkTitle} />
                            ) : (
                                <div style={{ width: 120, height: 36 }} />
                            )}
                            <div className="small mt-2" style={{ color: '#6b7280', textAlign: 'center' }}>{title}</div>
                        </div>
                    </div>

                    {/* On small screens, show title under the number */}
                    <div className="d-md-none mt-2">
                        <div className="small" style={{ color: '#6b7280' }}>{title}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SkeletonStatCard: React.FC = () => {
    return (
        <div className="card shadow-sm border-0 mb-3" style={{ minHeight: 96 }}>
            <div className="card-body d-flex align-items-center justify-content-between">
                <div className="bg-gray-200 rounded" style={{ width: 56, height: 56, borderRadius: 12 }} />
                <div className="ms-3" style={{ flex: 1 }}>
                    <div className="bg-gray-200 rounded" style={{ width: 120, height: 20, marginBottom: 6 }} />
                    <div className="bg-gray-100 rounded" style={{ width: 80, height: 12 }} />
                </div>
                <div className="d-none d-md-flex" style={{ width: 140, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 120, height: 36, background: 'rgba(99,102,241,0.06)', borderRadius: 4 }} />
                    <div style={{ width: 80, height: 12, marginTop: 8, background: 'rgba(0,0,0,0.04)', borderRadius: 4 }} />
                </div>
            </div>
        </div>
    );
};

const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1.2 }) => {
    const [display, setDisplay] = useState<number>(0);
    const startRef = React.useRef<number | null>(null);
    const fromRef = React.useRef<number>(0);

    useEffect(() => {
        // animate from previous displayed value to new value
        const start = performance.now();
        startRef.current = start;
        const from = fromRef.current ?? 0;
        const to = value;

        let raf = 0;
        const tick = (now: number) => {
            const elapsed = (now - start) / 1000;
            const t = Math.min(1, elapsed / duration);
            const current = Math.round(from + (to - from) * t);
            setDisplay(current);
            if (t < 1) raf = requestAnimationFrame(tick);
            else fromRef.current = to;
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return <>{display.toLocaleString()}</>;
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

// Próximas llegadas de hoy
const UpcomingToday: React.FC = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const { data, isLoading, error } = useQuery<Visit[], Error>({
        queryKey: ['agenda', 'today', startIso, endIso],
        queryFn: async () => {
            const res = await api.getAgenda({ from: startIso, to: endIso });
            // Some implementations return array directly, others under { events }
            return Array.isArray(res) ? res as Visit[] : (res?.events || []);
        }
    });

    const upcoming = (data || [])
        .filter(v => v.status !== VisitStatus.COMPLETED)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 5);

    return (
        <div className="card shadow-sm border-0 mb-3">
            <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">Próximas llegadas de hoy</h5>
                {isLoading ? (
                    <div className="text-muted">Cargando...</div>
                ) : error ? (
                    <div className="text-danger small">No se pudo cargar la agenda</div>
                ) : upcoming.length === 0 ? (
                    <div className="text-muted small">No hay llegadas pendientes para hoy</div>
                ) : (
                    <ul className="list-unstyled mb-0">
                        {upcoming.map(v => {
                            const time = new Date(v.scheduledDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            const hostName = (v as any)?.host?.firstName ? `${(v as any).host.firstName} ${(v as any).host.lastName || ''}` : '';
                            return (
                                <li key={v._id} className="d-flex align-items-center py-2 border-bottom last:border-bottom-0">
                                    <span className="icon-tile me-3" style={{ width: 40, height: 40 }}>
                                        <VisitsIcon className="w-5 h-5" />
                                    </span>
                                    <div className="flex-1">
                                        <div className="fw-semibold text-dark" style={{ lineHeight: 1.2 }}>{v.visitorName} · <span className="text-muted fw-normal">{time}</span></div>
                                        <div className="small text-muted" style={{ lineHeight: 1.2 }}>{v.visitorCompany || 'Sin empresa'} {hostName ? `· Host: ${hostName}` : ''}</div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
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
    const [analyticsStatusData, setAnalyticsStatusData] = useState<any[]>([]);
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const [prevPeriodSums, setPrevPeriodSums] = useState<{ pending?: number | undefined | null; approved?: number | undefined | null; checkedIn?: number | undefined | null; completed?: number | undefined | null; }>({});
    const [sparkFilter, setSparkFilter] = useState<'pending' | 'approved' | 'checkedIn' | 'completed' | null>(null);
    const [visibleSeries, setVisibleSeries] = useState<{ pending: boolean; approved: boolean; checkedIn: boolean; completed: boolean }>({ pending: true, approved: true, checkedIn: true, completed: true });

    // Ensure at least one series remains visible. Prevent toggling off the last visible series.
    const toggleSeries = (key: keyof typeof visibleSeries) => {
        setVisibleSeries(s => {
            const next = { ...s, [key]: !s[key] };
            // if all would become false, ignore the toggle and keep current state
            if (!next.pending && !next.approved && !next.checkedIn && !next.completed) {
                return s;
            }
            return next;
        });
    };
    // Use React Query to fetch data and keep it cached/refetched in background
    const statsQuery = useQuery<DashboardStats, Error>({ queryKey: ['dashboardStats'], queryFn: api.getDashboardStats });
    const recent5Query = useQuery<Visit[], Error>({ queryKey: ['recentVisits', 5], queryFn: () => api.getRecentVisits(5) });
    const recentLargeQuery = useQuery<Visit[], Error>({ queryKey: ['recentVisits', 200], queryFn: () => api.getRecentVisits(200) });
    const analyticsQuery = useQuery<any[], Error>({ queryKey: ['analytics', period], queryFn: () => api.getAnalytics(period) });

    const prevAnalyticsQuery = useQuery<any[], Error>({ queryKey: ['prevAdvancedAnalytics', period], queryFn: async () => {
        const days = period === 'week' ? 7 : 30;
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - (days - 1));

        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(startDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevEndDate.getDate() - (days - 1));

        const prevStartIso = prevStartDate.toISOString().slice(0, 10);
        const prevEndIso = prevEndDate.toISOString().slice(0, 10);

        return api.getAdvancedAnalytics({ startDate: prevStartIso, endDate: prevEndIso });
    }, enabled: true });

    // Mirror query results into local state used by the component (keeps UI code stable)
    useEffect(() => {
        setIsLoading(statsQuery.isLoading || recent5Query.isLoading || recentLargeQuery.isLoading || analyticsQuery.isLoading || prevAnalyticsQuery.isLoading);
        if (statsQuery.data) setStats(statsQuery.data);
        if (recent5Query.data) setRecentVisits(recent5Query.data);

        // Build frequent companies & visitors from the larger sample when available
        try {
            const source = (recentLargeQuery.data && recentLargeQuery.data.length > 0) ? recentLargeQuery.data : (recent5Query.data || []);
            const map = new Map<string, number>();
            source.forEach((v: Visit) => {
                const name = (v.visitorCompany || 'Sin empresa').trim() || 'Sin empresa';
                map.set(name, (map.get(name) || 0) + 1);
            });
            const arr = Array.from(map.entries()).map(([company, count]) => ({ company, count }));
            arr.sort((a, b) => b.count - a.count);
            setFrequentCompanies(arr.slice(0, 8));

            const vmap = new Map<string, { id: string; name: string; company?: string; photo?: string; count: number }>();
            source.forEach((v: Visit) => {
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
            console.warn('Could not compute frequent lists from queries:', err);
            setNotification({ 
                message: 'No se pudieron calcular las listas de visitantes frecuentes', 
                type: 'warning' 
            });
        }

        // Build analyticsStatusData from the recent visits sample (client-side)
        try {
            const visitsSource: Visit[] = (recentLargeQuery.data && recentLargeQuery.data.length > 0) ? recentLargeQuery.data : (recent5Query.data || []);
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
                        obj.completed = (obj.completed || 0) + 1;
                        break;
                }
            });

            const statusSeries = Array.from(seriesMap.values());
            setAnalyticsStatusData(statusSeries);
        } catch (err) {
            console.warn('Could not compute analyticsStatusData from queries:', err);
            setNotification({ 
                message: 'No se pudieron procesar los datos de análisis de estatus', 
                type: 'warning' 
            });
        }

        // Compute prevPeriodSums from prevAnalyticsQuery
        try {
            const prevAnalytics = prevAnalyticsQuery.data;
            const computePrev = (key: string): number | undefined => {
                if (!prevAnalytics) return undefined;
                if (Array.isArray(prevAnalytics) && prevAnalytics.length > 0) {
                    const first = prevAnalytics[0] as any;
                    if (first && first[key] !== undefined) {
                        return prevAnalytics.reduce((s: number, a: any) => s + (a[key] || 0), 0);
                    }
                    if (first && (first.status !== undefined) && (first.total !== undefined || first.count !== undefined)) {
                        const map = new Map<string, number>();
                        (prevAnalytics as any[]).forEach(a => {
                            const st = String(a.status || a._id || '').toLowerCase();
                            map.set(st, (a.count || a.total || 0));
                        });
                        return map.get(key) || 0;
                    }
                }
                return undefined;
            };

            const prevPending = computePrev('pending');
            const prevApproved = computePrev('approved');
            const prevCheckedIn = computePrev('checkedIn');
            const prevCompleted = computePrev('completed');
            setPrevPeriodSums({ pending: prevPending, approved: prevApproved, checkedIn: prevCheckedIn, completed: prevCompleted });
        } catch (err) {
            console.warn('Could not map prev analytics to prevPeriodSums:', err);
            setNotification({ 
                message: 'No se pudieron calcular las estadísticas del periodo anterior', 
                type: 'info' 
            });
            setPrevPeriodSums({});
        }

    }, [statsQuery.data, recent5Query.data, recentLargeQuery.data, analyticsQuery.data, prevAnalyticsQuery.data, statsQuery.isLoading, recent5Query.isLoading, recentLargeQuery.isLoading, analyticsQuery.isLoading, prevAnalyticsQuery.isLoading, period]);

    // Current period sums (derived from analyticsStatusData)
    const currSums = {
        pending: analyticsStatusData.reduce((s, d) => s + (d.pending || 0), 0),
        approved: analyticsStatusData.reduce((s, d) => s + (d.approved || 0), 0),
        checkedIn: analyticsStatusData.reduce((s, d) => s + (d.checkedIn || 0), 0),
        completed: analyticsStatusData.reduce((s, d) => s + (d.completed || 0), 0),
    };

    const calcDelta = (curr: number, prev: number | undefined | null) : number | null | undefined => {
        if (prev === undefined) return undefined; // cannot compute
        if (prev === null) return undefined; // cannot compute
        if (prev === 0) {
            if (curr === 0) return 0;
            return null; // indicate "Nuevo" (no data previous period)
        }
        return Math.round(((curr - prev) / prev) * 100);
    };

    if (isLoading && stats.active === 0) {
        // Show modern loading spinner for initial load
        return (
            <div className="container-fluid px-0">
                <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-900"></div>
                    <p className="mt-6 text-lg text-gray-600 font-medium">Cargando dashboard...</p>
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

            {/* Hero banner: reemplaza el rectángulo de título por un banner grande y redondeado */}
            <div className="mb-4">
                <div
                    className="rounded-2xl p-3 p-md-4 mb-3"
                    style={{
                        background: 'linear-gradient(90deg, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.04) 100%)',
                        border: '1px solid rgba(99,102,241,0.06)'
                    }}
                >
                    <div className="d-flex justify-content-between align-items-start flex-column flex-md-row">
                        <div>
                            <h2 className="h2 fw-semibold text-dark mb-1" style={{ fontSize: 20 }}>
                                Bienvenido de nuevo, {user?.firstName}!
                            </h2>
                            <div className="text-muted" style={{ fontSize: 14 }}>
                                Aquí tienes un resumen de la actividad de hoy
                            </div>
                        </div>

                        {/* espacio para botones/avatares o indicadores (opcionales) */}
                        <div className="mt-2 mt-md-0 d-flex align-items-center">
                            {/* reservado para futuras acciones */}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-3" style={{ alignItems: 'stretch' }}>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/visits')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/visits'); }}
                    aria-label="Ir a Visitas - Visitas Activas"
                    style={{ cursor: 'pointer', height: '100%' }}
                >
                <StatCard
                    title="Visitas Activas"
                    value={stats.checkedIn}
                    sparkData={analyticsStatusData && analyticsStatusData.length > 0 ? analyticsStatusData.map(d => d.checkedIn || 0) : []}
                    sparkColor="#34d399"
                    deltaPercent={calcDelta(currSums.checkedIn, prevPeriodSums.checkedIn)}
                    deltaTooltip={`Cambio respecto al periodo anterior: ${period === 'week' ? '7 días previos' : '30 días previos'}`}
                    onSparkClick={() => setSparkFilter('checkedIn')}
                    sparkTitle="Haz clic para filtrar actividad: Visitas Activas"
                    isActive={sparkFilter === 'checkedIn'}
                    icon={
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 20v-2a4 4 0 0 0-3-3.87" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    }
                    color="icon-tile"
                />
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/visits')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/visits'); }}
                    aria-label="Ir a Visitas - Pendientes"
                    style={{ cursor: 'pointer', height: '100%' }}
                >
                <StatCard
                    title="Pendientes"
                    value={stats.pending}
                    sparkData={analyticsStatusData && analyticsStatusData.length > 0 ? analyticsStatusData.map(d => d.pending || 0) : []}
                    sparkColor="#f6ad55"
                    deltaPercent={calcDelta(currSums.pending, prevPeriodSums.pending)}
                    deltaTooltip={`Cambio respecto al periodo anterior: ${period === 'week' ? '7 días previos' : '30 días previos'}`}
                    onSparkClick={() => setSparkFilter('pending')}
                    sparkTitle="Haz clic para filtrar actividad: Pendientes"
                    isActive={sparkFilter === 'pending'}
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" /></svg>
                    }
                    color="icon-tile"
                />
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/visits')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/visits'); }}
                    aria-label="Ir a Visitas - Pre-aprobadas"
                    style={{ cursor: 'pointer', height: '100%' }}
                >
                <StatCard
                    title="Pre-aprobadas"
                    value={stats.approved}
                    sparkData={analyticsStatusData && analyticsStatusData.length > 0 ? analyticsStatusData.map(d => d.approved || 0) : []}
                    sparkColor="#60a5fa"
                    deltaPercent={calcDelta(currSums.approved, prevPeriodSums.approved)}
                    deltaTooltip={`Cambio respecto al periodo anterior: ${period === 'week' ? '7 días previos' : '30 días previos'}`}
                    onSparkClick={() => setSparkFilter('approved')}
                    sparkTitle="Haz clic para filtrar actividad: Pre-aprobadas"
                    isActive={sparkFilter === 'approved'}
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    }
                    color="icon-tile"
                />
                </div>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/reports')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/reports'); }}
                    aria-label="Ir a Reportes - Completadas Hoy"
                    style={{ cursor: 'pointer', height: '100%' }}
                >
                <StatCard
                    title="Completadas Hoy"
                    value={stats.completed}
                    sparkData={analyticsStatusData && analyticsStatusData.length > 0 ? analyticsStatusData.map(d => d.completed || 0) : []}
                    sparkColor="#9ca3af"
                    deltaPercent={calcDelta(currSums.completed, prevPeriodSums.completed)}
                    deltaTooltip={`Cambio respecto al periodo anterior: ${period === 'week' ? '7 días previos' : '30 días previos'}`}
                    onSparkClick={() => setSparkFilter('completed')}
                    sparkTitle="Haz clic para filtrar actividad: Completadas"
                    isActive={sparkFilter === 'completed'}
                    icon={
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" /></svg>
                    }
                    color="icon-tile"
                />
                </div>
            </div>

            {/* Quick actions */}
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body d-flex flex-wrap gap-3">
                            <button className="btn btn-light d-flex align-items-center px-3 py-2 border rounded-3 transition-smooth" onClick={() => navigate('/register')}>
                                <span className="icon-tile me-2" style={{ width: 40, height: 40 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                                </span>
                                <div className="text-start">
                                    <div className="fw-semibold">Registrar visita</div>
                                    <div className="small text-muted">Crear una nueva visita</div>
                                </div>
                            </button>

                            <button className="btn btn-light d-flex align-items-center px-3 py-2 border rounded-3 transition-smooth" onClick={() => navigate('/visits?status=pending')}>
                                <span className="icon-tile me-2" style={{ width: 40, height: 40 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                                </span>
                                <div className="text-start">
                                    <div className="fw-semibold">Aprobar pendientes</div>
                                    <div className="small text-muted">Revisar solicitudes</div>
                                </div>
                            </button>

                            <button className="btn btn-light d-flex align-items-center px-3 py-2 border rounded-3 transition-smooth" onClick={() => navigate('/access-codes')}>
                                <span className="icon-tile me-2" style={{ width: 40, height: 40 }}>
                                    <QrIcon className="w-5 h-5" />
                                </span>
                                <div className="text-start">
                                    <div className="fw-semibold">Accesos & eventos</div>
                                    <div className="small text-muted">Gestionar invitaciones</div>
                                </div>
                            </button>

                            <button className="btn btn-light d-flex align-items-center px-3 py-2 border rounded-3 transition-smooth" onClick={() => navigate('/agenda')}>
                                <span className="icon-tile me-2" style={{ width: 40, height: 40 }}>
                                    <AgendaIcon className="w-5 h-5" />
                                </span>
                                <div className="text-start">
                                    <div className="fw-semibold">Agenda de hoy</div>
                                    <div className="small text-muted">Ver próximas llegadas</div>
                                </div>
                            </button>
                        </div>
                    </div>
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
                    color="icon-tile"
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
                            color="icon-tile"
                        />
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    {/* Chart card */}
                    <div className="card shadow-sm border-0 mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between items-center mb-2">
                                <h5 className="card-title fw-semibold mb-0">Visitas</h5>
                            </div>

                            <div className="d-flex justify-content-end align-items-center gap-2 mb-2">
                                <div className="btn-group me-2" role="group" aria-label="Periodo">
                                    <button onClick={() => setPeriod('week')} className={`px-3 py-1 rounded-lg text-sm ${period === 'week' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>7 días</button>
                                    <button onClick={() => setPeriod('month')} className={`px-3 py-1 rounded-lg text-sm ${period === 'month' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>30 días</button>
                                </div>

                                {/* Series toggles */}
                                <div className="d-none d-sm-flex align-items-center gap-2 me-2" aria-hidden={false}>
                                    <button className={`btn btn-sm ${visibleSeries.pending ? 'btn-outline-warning' : 'btn-outline-secondary'}`} onClick={() => toggleSeries('pending')} aria-pressed={visibleSeries.pending} aria-label="Alternar pendientes" title="Mostrar/Ocultar Pendientes">
                                        <span style={{ width: 10, height: 10, background: '#f6ad55', display: 'inline-block', marginRight: 6, borderRadius: 2 }} />Pendientes
                                    </button>
                                    <button className={`btn btn-sm ${visibleSeries.approved ? 'btn-outline-primary' : 'btn-outline-secondary'}`} onClick={() => toggleSeries('approved')} aria-pressed={visibleSeries.approved} aria-label="Alternar aprobadas" title="Mostrar/Ocultar Aprobadas">
                                        <span style={{ width: 10, height: 10, background: '#60a5fa', display: 'inline-block', marginRight: 6, borderRadius: 2 }} />Aprobadas
                                    </button>
                                    <button className={`btn btn-sm ${visibleSeries.checkedIn ? 'btn-outline-success' : 'btn-outline-secondary'}`} onClick={() => toggleSeries('checkedIn')} aria-pressed={visibleSeries.checkedIn} aria-label="Alternar check-ins" title="Mostrar/Ocultar Check-ins">
                                        <span style={{ width: 10, height: 10, background: '#34d399', display: 'inline-block', marginRight: 6, borderRadius: 2 }} />Check-ins
                                    </button>
                                    <button className={`btn btn-sm ${visibleSeries.completed ? 'btn-outline-secondary' : 'btn-outline-light'}`} onClick={() => toggleSeries('completed')} aria-pressed={visibleSeries.completed} aria-label="Alternar completadas" title="Mostrar/Ocultar Completadas">
                                        <span style={{ width: 10, height: 10, background: '#9ca3af', display: 'inline-block', marginRight: 6, borderRadius: 2 }} />Completadas
                                    </button>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart
                                        data={analyticsStatusData.length > 0 ? analyticsStatusData : [
                                        { day: 'Lun', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Mar', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Mié', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Jue', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Vie', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Sáb', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                        { day: 'Dom', pending: 0, approved: 0, checkedIn: 0, completed: 0 },
                                    ]}
                                        // visual tweaks to improve bar appearance at different widths
                                        barCategoryGap="20%" // spacing between categories
                                        barGap={6} // gap between bars of same category
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis dataKey="day" tick={{fontSize: 12}}/>
                                        <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                                        <Tooltip 
                                            wrapperClassName="shadow rounded border p-2" 
                                            cursor={{fill: 'rgba(34, 131, 229, 0.06)'}} 
                                            labelFormatter={(label) => `${label}`}
                                            content={({ active, payload, label }: any) => {
                                                if (!active || !payload) return null;
                                                // payload contains items for each visible dataKey
                                                const items = payload.filter((p: any) => p && p.dataKey && visibleSeries[(p.dataKey as keyof typeof visibleSeries)]);
                                                if (!items || items.length === 0) return null;
                                                return (
                                                    <div className="shadow rounded bg-white p-2" style={{ minWidth: 140 }}>
                                                        <div className="fw-semibold mb-1">{label}</div>
                                                        {items.map((p: any) => (
                                                            <div key={p.dataKey} className="d-flex justify-content-between small" style={{ color: p.fill }}>
                                                                <div>{p.name || p.dataKey}</div>
                                                                <div className="fw-bold">{p.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }}
                                        />

                                        {/* Bars with visibility and stacked toggle */}
                                        <Bar dataKey="pending" name="Pendientes" hide={!visibleSeries.pending} fill="#f6ad55" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                        <Bar dataKey="approved" name="Aprobadas" hide={!visibleSeries.approved} fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                        <Bar dataKey="checkedIn" name="Check-ins" hide={!visibleSeries.checkedIn} fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                        <Bar dataKey="completed" name="Completadas" hide={!visibleSeries.completed} fill="#9ca3af" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Visitantes frecuentes card */}
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
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
                <div className="col-12 col-lg-4">
                    {/* Próximas llegadas hoy */}
                    <UpcomingToday />
                    {/* Empresas frecuentes card */}
                    <div className="card shadow-sm border-0 mb-3">
                        <div className="card-body">
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
                    </div>

                    {/* Actividad Reciente card */}
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <h5 className="card-title fw-semibold mb-3">Actividad Reciente</h5>

                            {/* Sparkline filter pill */}
                            {sparkFilter && (
                                <div className="mb-2 d-flex align-items-center gap-2">
                                    <span className="badge bg-primary">Filtrando: {sparkFilter}</span>
                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSparkFilter(null)}>Limpiar</button>
                                </div>
                            )}

                            {((sparkFilter ? recentVisits.filter(rv => {
                                const map: any = {
                                    pending: VisitStatus.PENDING,
                                    approved: VisitStatus.APPROVED,
                                    checkedIn: VisitStatus.CHECKED_IN,
                                    completed: VisitStatus.COMPLETED
                                };
                                return rv.status === map[sparkFilter as keyof typeof map];
                            }) : recentVisits).length > 0) ? (
                                <ul className="list-unstyled mb-0">
                                    {(sparkFilter ? recentVisits.filter(rv => {
                                        const map: any = {
                                            pending: VisitStatus.PENDING,
                                            approved: VisitStatus.APPROVED,
                                            checkedIn: VisitStatus.CHECKED_IN,
                                            completed: VisitStatus.COMPLETED
                                        };
                                        return rv.status === map[sparkFilter as keyof typeof map];
                                    }) : recentVisits).map(visit => (
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

            {/* Toast Notification */}
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};
