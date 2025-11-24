import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart3, Building2, Eye, UserPlus, Shield, CheckCircle, Activity, Clock, TrendingUp, TrendingDown, ArrowRight, QrCode, Users, AlertCircle, Calendar } from 'lucide-react';
import { MdOutlinePendingActions } from 'react-icons/md';
import { TbClipboardCheck } from 'react-icons/tb';
import { LuDoorOpen } from 'react-icons/lu';
import { AiOutlineThunderbolt } from 'react-icons/ai';
import { LuClipboardPen, LuClipboardCheck, LuClipboardList, LuClipboardX } from 'react-icons/lu';
import { FaRegUser } from 'react-icons/fa';
import { FaPersonWalkingArrowRight } from 'react-icons/fa6';
import { LiaUserTieSolid } from 'react-icons/lia';
import { RiFileList2Line, RiFileList3Line } from 'react-icons/ri';
import { PiHandWavingBold } from 'react-icons/pi';
import { motion, AnimatePresence } from 'framer-motion';
import { Visit, VisitStatus, Access, DashboardStats } from '../types';

// Toast notification component
const Toast: React.FC<{ 
    message: string; 
    type: 'success' | 'error' | 'warning' | 'info'; 
    onClose: () => void;
}> = ({ message, type, onClose }) => {
    const config = {
        success: { bg: 'from-emerald-500 to-green-600', icon: <CheckCircle className="w-5 h-5" /> },
        error: { bg: 'from-red-500 to-red-600', icon: <Activity className="w-5 h-5" /> },
        warning: { bg: 'from-yellow-500 to-amber-600', icon: <Clock className="w-5 h-5" /> },
        info: { bg: 'from-blue-500 to-cyan-600', icon: <Activity className="w-5 h-5" /> }
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
                <div className={`bg-gradient-to-r ${bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border-2 border-white/20`}>
                    <div className="flex-shrink-0">{icon}</div>
                    <span className="font-medium flex-1">{message}</span>
                    <button onClick={onClose} className="flex-shrink-0 text-white/80 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

// Modern Stat Card Component with Sparkline
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean } | null;
  color: string;
  onClick?: () => void;
  sparklineData?: number[];
  sparklineColor?: string;
  description?: string;
}> = ({ title, value, icon, trend, color, onClick, sparklineData, sparklineColor = '#6b7280', description }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Generar datos de sparkline con valores por defecto si no hay datos
  const sparkData = sparklineData && sparklineData.length > 0
    ? sparklineData.map((val, idx) => ({ index: idx, value: val, day: `Día ${idx + 1}` }))
    : [];

  const hasData = sparkData.length > 0 && sparkData.some(d => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
            {onClick && (
              <ArrowRight className={`w-4 h-4 text-gray-400 transition-all ${isHovered ? 'translate-x-1 text-gray-600' : ''}`} />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {typeof value === 'number' && value === 0 && (
              <span className="text-xs text-gray-400 font-medium">sin registros</span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-400 text-xs ml-1">vs. semana anterior</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center shadow-lg transform transition-transform ${isHovered ? 'scale-110 rotate-3' : 'scale-100'}`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
      
      {/* Sparkline */}
      {hasData ? (
        <div className="h-20 -mx-2 mt-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`sparkGradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={sparklineColor} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: 'none', 
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}
                itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                formatter={(value: any) => [value, title]}
                labelFormatter={(label: any) => `${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={sparklineColor} 
                strokeWidth={2.5} 
                fill={`url(#sparkGradient-${title.replace(/\s+/g, '-')})`}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 right-0 text-xs text-gray-400">
            últimos 7 días
          </div>
        </div>
      ) : (
        <div className="h-20 -mx-2 mt-4 flex items-center justify-center border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 italic">Sin datos de tendencia disponibles</p>
        </div>
      )}
    </motion.div>
  );
};

// Quick Action Button
const QuickAction: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}> = ({ icon, title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all group"
  >
    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <div className="font-semibold text-gray-900 group-hover:text-gray-900">{title}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
  </button>
);

// Activity Item Component
const ActivityItem: React.FC<{ visit: Visit }> = ({ visit }) => {
  const getStatusConfig = () => {
    switch (visit.status) {
      case VisitStatus.CHECKED_IN:
        return { text: 'hizo check-in', color: 'text-emerald-600', bg: 'bg-emerald-100', dot: 'bg-emerald-500' };
      case VisitStatus.APPROVED:
        return { text: 'fue aprobada', color: 'text-blue-600', bg: 'bg-blue-100', dot: 'bg-blue-500' };
      case VisitStatus.PENDING:
        return { text: 'pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100', dot: 'bg-yellow-500' };
      case VisitStatus.COMPLETED:
        return { text: 'completada', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' };
      default:
        return { text: 'finalizada', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' };
    }
  };

  const statusConfig = getStatusConfig();
  const timeAgo = new Date(visit.createdAt || visit.scheduledDate).toLocaleString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all group">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
          {visit.visitorPhoto ? (
            <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
          ) : (
            <FaRegUser className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusConfig.dot}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{visit.visitorName}</p>
        <p className="text-xs text-gray-500 truncate">{visit.visitorCompany || 'Sin empresa'}</p>
        <p className={`text-xs ${statusConfig.color} font-medium`}>{statusConfig.text}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400">{timeAgo}</p>
      </div>
    </div>
  );
};



// Upcoming Item Component  
const UpcomingItem: React.FC<{ item: Visit | Access; type: 'visit' | 'access' }> = ({ item, type }) => {
  if (type === 'visit') {
    const visit = item as Visit;
    const time = new Date(visit.scheduledDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const hostName = (visit as any)?.host?.firstName ? `${(visit as any).host.firstName} ${(visit as any).host.lastName || ''}` : '';

    return (
      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
          <Calendar className="w-5 h-5 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{visit.visitorName}</p>
            <span className="text-xs font-medium text-blue-600">{time}</span>
          </div>
          <p className="text-xs text-gray-500">{visit.visitorCompany || 'Sin empresa'}</p>
          {hostName && <p className="text-xs text-gray-400">Host: {hostName}</p>}
        </div>
      </div>
    );
  } else {
    const access = item as Access;
    const time = new Date(access.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const creatorName = access.creatorId ? `${(access.creatorId as any).firstName} ${(access.creatorId as any).lastName || ''}`.trim() : '';
    const invitedCount = access.invitedUsers?.length || 0;

    return (
      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm">
          <QrCode className="w-5 h-5 text-purple-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{access.eventName}</p>
            <span className="text-xs font-medium text-purple-600">{time}</span>
          </div>
          <p className="text-xs text-gray-500">{access.location || 'Sin ubicación'}</p>
          {creatorName && <p className="text-xs text-gray-400">Host: {creatorName}</p>}
          {invitedCount > 0 && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              <Users className="w-3 h-3" />
              {invitedCount} invitado{invitedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }
};

const UsersSummary: React.FC<{ userInvitations?: any[]; totalUsers?: number }> = ({ userInvitations, totalUsers }) => {
  const list = Array.isArray(userInvitations) ? userInvitations : [];
  
  // Obtener actividad reciente de usuarios: invitados, registrados, eliminados
  const recent = list
    .map(u => {
      // Determinar el tipo de actividad
      let activityType = 'unknown';
      let activityText = '';
      let icon = null;
      let iconColor = '';
      let displayDate = u.updatedAt || u.createdAt;
      
      // Prioridad: pendiente > registrado > eliminado
      // Verificar primero invitationStatus para distinguir invitaciones pendientes de usuarios eliminados
      if (u.invitationStatus === 'pending') {
        activityType = 'invited';
        activityText = 'Invitado';
        icon = <UserPlus className="w-4 h-4" />;
        iconColor = 'text-blue-600';
        displayDate = u.createdAt; // Fecha de invitación
      } else if (u.invitationStatus === 'registered' && u.isActive === true) {
        activityType = 'registered';
        activityText = 'Registrado';
        icon = <CheckCircle className="w-4 h-4" />;
        iconColor = 'text-emerald-600';
        displayDate = u.updatedAt; // Fecha de registro
      } else if (u.isActive === false && u.invitationStatus === 'registered') {
        // Solo mostrar como eliminado si estaba registrado y luego fue desactivado
        activityType = 'deleted';
        activityText = 'Eliminado';
        icon = <AlertCircle className="w-4 h-4" />;
        iconColor = 'text-red-600';
        displayDate = u.updatedAt; // Fecha de eliminación
      } else {
        return null;
      }
      
      return { ...u, activityType, activityText, icon, iconColor, displayDate };
    })
    .filter(u => u !== null)
    .sort((a, b) => {
      const dateA = new Date(a.displayDate || a.createdAt).getTime();
      const dateB = new Date(b.displayDate || b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 flex flex-col gap-4 h-full">
      <div className="w-full flex flex-col gap-2 items-center">
        <div className="flex items-center gap-3 mb-2">
          <LiaUserTieSolid className="w-8 h-8 text-black" />
          <div>
            <div className="text-lg font-bold text-black">Usuarios</div>
            <div className="text-xs text-gray-500">Total: <span className="font-bold text-black">{totalUsers ?? '-'}</span></div>
          </div>
        </div>
        <div className="w-full">
          <div className="text-xs text-black font-semibold mb-1">Actividad reciente:</div>
          {recent.length === 0 ? (
            <div className="text-xs text-gray-400">Sin actividad reciente</div>
          ) : recent.map((item, idx) => (
            <div key={item._id || idx} className="flex items-center gap-2 text-xs text-black mb-1">
              <span className={item.iconColor}>{item.icon}</span>
              <span className="font-medium truncate">{item.firstName} {item.lastName}</span>
              <span className="text-gray-400 flex-shrink-0">{new Date(item.displayDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
              <span className={`italic ${item.iconColor} flex-shrink-0`}>{item.activityText}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
    // Estado para actividad reciente de usuarios
    const [userInvitations, setUserInvitations] = useState<any[]>([]);
    const [loadingInvitations, setLoadingInvitations] = useState(true);

    useEffect(() => {
      const fetchUsers = async () => {
        try {
          setLoadingInvitations(true);
          const data = await api.getUsers();
          setUserInvitations(Array.isArray(data) ? data : []);
        } catch (e) {
          setUserInvitations([]);
        } finally {
          setLoadingInvitations(false);
        }
      };
      fetchUsers();
    }, []);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  // Queries
  const statsQuery = useQuery<DashboardStats, Error>({ 
    queryKey: ['dashboardStats'], 
    queryFn: api.getDashboardStats 
  });

  const recentVisitsQuery = useQuery<Visit[], Error>({ 
    queryKey: ['recentVisits', 10], 
    queryFn: () => api.getRecentVisits(10) 
  });

  const allVisitsQuery = useQuery<Visit[], Error>({ 
    queryKey: ['recentVisits', 200], 
    queryFn: () => api.getRecentVisits(200) 
  });

  const analyticsQuery = useQuery<any[], Error>({ 
    queryKey: ['analytics', period], 
    queryFn: () => api.getAnalytics(period) 
  });

  // Query separada para sparklines (siempre 7 días)
  const sparklineQuery = useQuery<any[], Error>({ 
    queryKey: ['analytics', 'week'], 
    queryFn: () => api.getAnalytics('week') 
  });

  // Upcoming today
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const upcomingVisitsQuery = useQuery<Visit[], Error>({
    queryKey: ['upcomingToday'],
    queryFn: async () => {
      const res = await api.getAgenda({ from: start.toISOString(), to: end.toISOString() });
      return Array.isArray(res) ? res : (res?.events || []);
    }
  });

  const upcomingAccessesQuery = useQuery<Access[], Error>({
    queryKey: ['upcomingAccessesToday'],
    queryFn: async () => {
      const res = await api.getAccessesForAgenda(start.toISOString(), end.toISOString());
      return Array.isArray(res) ? res : [];
    }
  });

  const stats = statsQuery.data || { active: 0, pending: 0, approved: 0, checkedIn: 0, completed: 0, totalUsers: 0, totalHosts: 0 };
  const recentVisits = recentVisitsQuery.data || [];
  const analytics = analyticsQuery.data || [];
  const sparklineAnalytics = sparklineQuery.data || [];
  const allVisits = allVisitsQuery.data || [];

  const upcomingVisits = upcomingVisitsQuery.data || [];
  const upcomingAccesses = (upcomingAccessesQuery.data || [])
    .filter(a => {
      // Solo mostrar accesos activos
      if (a.status !== 'active') return false;
      // Filtrar por "Razón del acceso" que contenga "Visita" (case insensitive)
      const additionalInfoLower = (a.additionalInfo || '').toLowerCase();
      if (!additionalInfoLower.includes('visita')) return false;
      // Solo mostrar si hay invitados pendientes (no han asistido)
      const hasPendingGuests = a.invitedUsers?.some(u => u.attendanceStatus === 'pendiente');
      return hasPendingGuests;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);


  // Obtener visitas de hoy (igual que ReportsPage)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const visitsToday = allVisits.filter(v => {
    const visitDatetime = v.checkOutTime || v.checkInTime || v.scheduledDate;
    if (!visitDatetime) return false;
    const visitDate = new Date(visitDatetime);
    const visitDateStr = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}-${String(visitDate.getDate()).padStart(2, '0')}`;
    return visitDateStr === todayStr;
  });
  const totalToday = visitsToday.length;
  const approvedToday = visitsToday.filter(v => v.status === VisitStatus.COMPLETED).length;
  const rejectedToday = visitsToday.filter(v => v.status === VisitStatus.REJECTED).length;

  // Debug analytics data
  console.log('🔍 Analytics Raw Data:', {
    period,
    analyticsLength: analytics.length,
    analyticsData: analytics,
    sparklineAnalyticsLength: sparklineAnalytics.length,
    isLoading: analyticsQuery.isLoading,
    isError: analyticsQuery.isError
  });

  // Función para generar array de fechas completo
  const generateDateRange = (days: number) => {
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD
    }
    return dates;
  };

  // Función para transformar y rellenar datos de analytics
  const transformAnalyticsData = (data: any[], days: number) => {
    // Crear un mapa con los datos del backend
    const dataMap = new Map();
    data.forEach((item: any) => {
      const dateKey = item._id || item.date;
      const statusCounts: any = {};
      if (item.data && Array.isArray(item.data)) {
        item.data.forEach((s: any) => {
          statusCounts[s.status] = s.count;
        });
      }
      dataMap.set(dateKey, statusCounts);
    });

    // Generar array completo de fechas y rellenar con datos
    const dateRange = generateDateRange(days);
    return dateRange.map(dateStr => {
      const d = new Date(dateStr);
      const statusCounts = dataMap.get(dateStr) || {};
      
      return {
        date: dateStr,
        name: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        completadas: statusCounts['completed'] || 0,
        pendientes: statusCounts['pending'] || 0,
        aprobadas: statusCounts['approved'] || 0,
        activas: statusCounts['checked-in'] || 0,
        rechazadas: statusCounts['rejected'] || 0
      };
    });
  };

  // Chart data para la gráfica principal (usa el período seleccionado)
  const daysToShow = period === 'week' ? 7 : 30;
  const chartData = transformAnalyticsData(analytics, daysToShow);
  
  // Sparkline data para las stat cards (siempre últimos 7 días)
  const sparklineData = transformAnalyticsData(sparklineAnalytics, 7);
  
  const sparklineActive = sparklineData.map(d => d.activas);
  const sparklinePending = sparklineData.map(d => d.pendientes);
  const sparklineApproved = sparklineData.map(d => d.aprobadas);
  const sparklineCompleted = sparklineData.map(d => d.completadas);

  // Debug: Log sparkline data con detalles
  console.log('⚡ Sparkline Data Details:', {
    sparklineDataLength: sparklineData.length,
    sparklineData,
    sparklineActive,
    sparklinePending,
    sparklineApproved,
    sparklineCompleted,
    hasActiveData: sparklineActive.some(v => v > 0),
    hasPendingData: sparklinePending.some(v => v > 0),
    hasApprovedData: sparklineApproved.some(v => v > 0),
    hasCompletedData: sparklineCompleted.some(v => v > 0)
  });

  // Debug: Log chart data
  console.log('📊 Chart Data:', {
    chartDataLength: chartData.length,
    chartData,
    sparklines: {
      active: sparklineActive,
      pending: sparklinePending,
      approved: sparklineApproved,
      completed: sparklineCompleted
    }
  });

  // Calcular trends
  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return null;
    const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = data.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    if (previous === 0) return null;
    const change = ((recent - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change > 0 };
  };

  // Company distribution
  const companyMap = new Map<string, number>();
  allVisits.forEach(v => {
    const company = v.visitorCompany || 'Sin empresa';
    companyMap.set(company, (companyMap.get(company) || 0) + 1);
  });
  const companyData = Array.from(companyMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Frequent visitors para gráfico
  const visitorMap = new Map<string, { id: string; name: string; count: number }>();
  allVisits.forEach(v => {
    const id = v.visitorEmail || v.visitorName || v._id;
    const name = v.visitorName || 'Sin nombre';
    if (!visitorMap.has(id)) {
      visitorMap.set(id, { id, name, count: 0 });
    }
    const visitor = visitorMap.get(id)!;
    visitor.count++;
  });
  const frequentVisitorsData = Array.from(visitorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const COLORS = ['#111827', '#374151', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  const isLoading = statsQuery.isLoading || recentVisitsQuery.isLoading || analyticsQuery.isLoading;
  const hasError = statsQuery.isError || recentVisitsQuery.isError || analyticsQuery.isError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl border-2 border-red-200 p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">No se pudieron cargar los datos del dashboard. Por favor, intenta de nuevo.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 
                className="flex items-center gap-3 text-3xl md:text-4xl font-bold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #111827 0%, #374151 50%, #4b5563 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'brightness(1.2) contrast(1.1)',
                  textShadow: '0 0 10px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                  WebkitFilter: 'brightness(1.2) contrast(1.1)'
                }}
              >
                Bienvenido, {user?.firstName}
                <motion.div
                  animate={{ 
                    rotate: [0, 14, -8, 14, -4, 10, 0, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                  className="inline-flex items-center origin-bottom"
                >
                  <PiHandWavingBold 
                    className="w-9 h-9 md:w-11 md:h-11" 
                    style={{ 
                      background: 'linear-gradient(135deg, #111827 0%, #374151 50%, #4b5563 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'brightness(1.2) contrast(1.1)',
                      textShadow: '0 0 10px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                      WebkitFilter: 'brightness(1.2) contrast(1.1)'
                    }} 
                  />
                </motion.div>
              </h1>
              <p className="text-gray-600">Aquí tienes un resumen de la actividad de hoy</p>
            </div>
          </div>
        </div>



        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={<MdOutlinePendingActions className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-yellow-400 to-yellow-600"
            onClick={() => navigate('/visits?status=pending')}
            sparklineData={sparklinePending}
            sparklineColor="#eab308"
            trend={calculateTrend(sparklinePending)}
            description="Visitas esperando aprobación"
          />
          <StatCard
            title="Pre-aprobadas"
            value={stats.approved}
            icon={<TbClipboardCheck className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
            onClick={() => navigate('/visits?status=approved')}
            sparklineData={sparklineApproved}
            sparklineColor="#0ea5e9"
            trend={calculateTrend(sparklineApproved)}
            description="Aprobadas y listas para ingresar"
          />
          <StatCard
            title="Visitas Activas"
            value={stats.checkedIn}
            icon={<LuDoorOpen className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-emerald-500 to-green-600"
            onClick={() => navigate('/visits?status=checkedIn')}
            sparklineData={sparklineActive}
            sparklineColor="#10b981"
            trend={calculateTrend(sparklineActive)}
            description="Visitantes dentro de las instalaciones"
          />
          <StatCard
            title="Completadas Hoy"
            value={stats.completed}
            icon={<BarChart3 className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-gray-600 to-gray-800"
            onClick={() => navigate('/reports')}
            sparklineData={sparklineCompleted}
            sparklineColor="#4b5563"
            trend={calculateTrend(sparklineCompleted)}
            description="Visitas finalizadas exitosamente"
          />
        </div>

        {/* Access Codes & Blacklist Summary Cards (moved below stats) */}
        {/* Espacio para separación visual */}
        <div className="mb-8"></div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AiOutlineThunderbolt className="w-6 h-6 text-black" />
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              icon={<LuClipboardPen className="w-6 h-6 text-white" />}
              title="Registrar visita"
              subtitle="Crear nueva visita"
              onClick={() => navigate('/visits?openPanel=true')}
            />
            <QuickAction
              icon={<LiaUserTieSolid className="w-6 h-6 text-white" />}
              title="Invitar usuario"
              subtitle="Acceso rápido a invitación"
              onClick={() => navigate('/users?openInvite=true')}
            />
            <QuickAction
              icon={<QrCode className="w-6 h-6 text-white" />}
              title="Crear acceso"
              subtitle="Generar código de acceso"
              onClick={() => navigate('/access-codes?openCreate=true')}
            />
            <QuickAction
              icon={<Calendar className="w-6 h-6 text-white" />}
              title="Ver agenda"
              subtitle="Próximas llegadas"
              onClick={() => navigate('/agenda')}
            />
          </div>
        </div>

        {/* Charts Row - 3 gráficas principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Resumen de Visitas - Período seleccionado */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 flex flex-col">
            <div className="flex flex-col gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Resumen de Visitas
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPeriod('week')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                    period === 'week'
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  7 días
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                    period === 'month'
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  30 días
                </button>
              </div>
            </div>
            {/* KPIs de visitas del día */}
            <div className="flex flex-wrap gap-4 mb-4 justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-gray-900">{totalToday}</span>
                <span className="text-xs text-gray-500">Total hoy</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-emerald-600">{approvedToday}</span>
                <span className="text-xs text-gray-500">Aprobadas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-red-500">{rejectedToday}</span>
                <span className="text-xs text-gray-500">Rechazadas</span>
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    axisLine={false} 
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      fontSize: '12px'
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827' }}
                  />
                  <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="activas" name="Activas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendientes" name="Pendientes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay datos para el período seleccionado</p>
                  <p className="text-xs mt-1">Período: {period === 'week' ? '7 días' : '30 días'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Company Distribution */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Empresas Frecuentes
            </h2>
            {companyData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={companyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {companyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '12px' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {companyData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-gray-700 truncate">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No hay datos</p>
              </div>
            )}
          </div>

          {/* Visitantes Frecuentes */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Visitantes Frecuentes
            </h2>
            {frequentVisitorsData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={frequentVisitorsData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number" 
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ fontWeight: 600, color: '#111827' }}
                      formatter={(value: any) => [`${value} visitas`, 'Total']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#6366f1" 
                      radius={[0, 8, 8, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Mostrando los {frequentVisitorsData.length} visitantes más frecuentes
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No hay datos</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - 3 columns: Próximas Llegadas, Actividad Reciente, Usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Próximas Llegadas */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaPersonWalkingArrowRight className="w-6 h-6 text-black" />
              Próximas Llegadas
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcomingVisits.length === 0 && upcomingAccesses.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <FaPersonWalkingArrowRight className="w-10 h-10 mx-auto mb-2 opacity-50 text-black" />
                  <p className="text-sm">No hay llegadas pendientes</p>
                </div>
              ) : (
                <>
                  {upcomingVisits.slice(0, 3).map(v => (
                    <UpcomingItem key={v._id} item={v} type="visit" />
                  ))}
                  {upcomingAccesses.slice(0, 2).map(a => (
                    <UpcomingItem key={a._id} item={a} type="access" />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Actividad Reciente (visitas) */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RiFileList3Line className="w-6 h-6 text-black" />
              Actividad Reciente
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentVisits.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <RiFileList3Line className="w-10 h-10 mx-auto mb-2 opacity-50 text-black" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              ) : (
                recentVisits.slice(0, 8).map((visit, idx) => (
                  <ActivityItem key={visit._id || idx} visit={visit} />
                ))
              )}
            </div>
          </div>

          {/* Usuarios */}
          <div className="flex flex-col h-full">
            <UsersSummary userInvitations={userInvitations} totalUsers={stats.totalUsers} />
          </div>
        </div>
      </div>

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
