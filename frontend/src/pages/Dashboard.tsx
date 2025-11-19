import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Building2, Eye } from 'lucide-react';
import { MdOutlinePendingActions } from 'react-icons/md';
import { TbClipboardCheck } from 'react-icons/tb';
import { LuDoorOpen } from 'react-icons/lu';
import { AiOutlineThunderbolt } from 'react-icons/ai';
import { LuClipboardPen, LuClipboardCheck, LuClipboardList, LuClipboardX } from 'react-icons/lu';
import { FaRegUser } from 'react-icons/fa';
import { FaPersonWalkingArrowRight } from 'react-icons/fa6';
import { LiaUserTieSolid } from 'react-icons/lia';
import { RiFileList2Line } from 'react-icons/ri';
import { UserPlus, Shield, CheckCircle, Activity, Clock, TrendingUp, TrendingDown, ArrowRight, QrCode, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Visit, VisitStatus, Access, DashboardStats } from '../types';
import { InviteUserModal } from './users/UserManagementPage';
import { Calendar } from 'lucide-react';

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
}> = ({ title, value, icon, trend, color, onClick, sparklineData }) => {
  const [isHovered, setIsHovered] = useState(false);

  const sparkData = sparklineData?.map((val, idx) => ({ index: idx, value: val })) || [];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500 text-xs ml-1">últimos 7 días</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center shadow-lg transform transition-transform ${isHovered ? 'scale-110' : 'scale-100'}`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
      {sparkData.length > 0 && (
        <div className="h-14 -mx-2 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#9ca3af" 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
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
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
          {visit.visitorPhoto ? (
            <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-full h-full object-cover" />
          ) : (
            <FaRegUser className="w-5 h-5 text-gray-400" />
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
  const recent = list
    .filter(u => u.status === 'new' || u.activityType === 'roleChange')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 px-4 py-5 flex flex-col items-center gap-4 mb-4 max-w-full md:max-w-[420px] mx-auto w-full min-w-0">
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
              {item.status === 'new' ? (
                <UserPlus className="w-4 h-4 text-emerald-600" />
              ) : (
                <Shield className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-medium">{item.firstName} {item.lastName}</span>
              <span className="text-gray-400">{new Date(item.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
              {item.activityType === 'roleChange' && (
                <span className="italic text-blue-600">Rol: {item.newRole}</span>
              )}
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
      const fetchInvitations = async () => {
        try {
          setLoadingInvitations(true);
          const data = await api.getInvitations();
          setUserInvitations(Array.isArray(data) ? data : (data?.invitations || []));
        } catch (e) {
          setUserInvitations([]);
        } finally {
          setLoadingInvitations(false);
        }
      };
      fetchInvitations();
    }, []);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  // Estado para modal de invitación de usuario
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  // Handler para invitar usuario (puedes ajustar la lógica según tu API)
  const handleInviteUser = async (userData: any) => {
    try {
      setInviteLoading(true);
      // Aquí deberías llamar a tu API real para invitar usuario
      // await api.sendInvitation(userData);
      setNotification({ message: '✅ Invitación enviada exitosamente.', type: 'success' });
      setInviteModalOpen(false);
    } catch (error) {
      setNotification({ message: '❌ Error al enviar invitación.', type: 'error' });
    } finally {
      setInviteLoading(false);
    }
  };

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
  const allVisits = allVisitsQuery.data || [];

  const upcomingVisits = upcomingVisitsQuery.data || [];
  const upcomingAccesses = (upcomingAccessesQuery.data || [])
    .filter(a => a.status === 'active')
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

  // Sparkline data for each stat card (últimos 7 días)
  const chartData = analytics.map((item: any) => {
    const d = new Date(item.date || item._id || new Date());
    return {
      name: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      completadas: item.completed || 0,
      pendientes: item.pending || 0,
      aprobadas: item.approved || 0,
      activas: item.checkedIn || 0
    };
  });
  const sparklineActive = chartData.slice(-7).map(d => d.activas);
  const sparklinePending = chartData.slice(-7).map(d => d.pendientes);
  const sparklineApproved = chartData.slice(-7).map(d => d.aprobadas);
  const sparklineCompleted = chartData.slice(-7).map(d => d.completadas);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>

              <h1
                className="flex items-center gap-3 text-3xl md:text-4xl font-bold mb-2 text-black drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent animate-pulse"
                style={{
                  textShadow: '0 0 8px #fff, 0 0 16px #fff, 0 0 32px #e0e7ff, 0 0 48px #fff',
                  WebkitTextStroke: '1px #fff',
                }}
              >
                <span
                  style={{
                    textShadow: '0 0 8px #fff, 0 0 16px #fff, 0 0 32px #e0e7ff, 0 0 48px #fff',
                    WebkitTextStroke: '1px #fff',
                  }}
                >
                  Bienvenido, {user?.firstName}
                </span>
                {/* Removed PiHandPalmBold icon as requested */}
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
            trend={calculateTrend(sparklinePending)}
          />
          <StatCard
            title="Pre-aprobadas"
            value={stats.approved}
            icon={<TbClipboardCheck className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
            onClick={() => navigate('/visits?status=approved')}
            sparklineData={sparklineApproved}
            trend={calculateTrend(sparklineApproved)}
          />
          <StatCard
            title="Visitas Activas"
            value={stats.checkedIn}
            icon={<LuDoorOpen className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-emerald-500 to-green-600"
            onClick={() => navigate('/visits?status=checkedIn')}
            sparklineData={sparklineActive}
            trend={calculateTrend(sparklineActive)}
          />
          <StatCard
            title="Completadas Hoy"
            value={stats.completed}
            icon={<BarChart3 className="w-7 h-7 text-white" />}
            color="bg-gradient-to-br from-gray-400 to-gray-800"
            onClick={() => navigate('/reports')}
            sparklineData={sparklineCompleted}
            trend={calculateTrend(sparklineCompleted)}
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
              icon={<Users className="w-6 h-6 text-white" />}
              title="Invitar usuario"
              subtitle="Acceso rápido a invitación"
              onClick={() => navigate('/visits?openPanel=true')}
            />
            <QuickAction
              icon={<QrCode className="w-6 h-6 text-white" />}
              title="Crear acceso"
              subtitle="Generar código de acceso"
              onClick={() => navigate('/access-codes?openPanel=true')}
            />
            <QuickAction
              icon={<Calendar className="w-6 h-6 text-white" />}
              title="Ver agenda"
              subtitle="Próximas llegadas"
              onClick={() => navigate('/agenda')}
            />
          </div>
        </div>
      {/* Modal de invitación de usuario */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteUser}
        loading={inviteLoading}
      />



        {/* Charts Row - Modern Daily Stats as Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Modern Daily Stats Bar Chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 flex flex-col justify-center">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Resumen de Visitas Hoy
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeriod('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    period === 'week'
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  7 días
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
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
            <div className="flex flex-wrap gap-6 mb-4 justify-center">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-900">{totalToday}</span>
                <span className="text-xs text-gray-500">Total hoy</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-emerald-600">{approvedToday}</span>
                <span className="text-xs text-gray-500">Aprobadas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-500">{rejectedToday}</span>
                <span className="text-xs text-gray-500">Rechazadas</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[{ name: 'Hoy', Total: totalToday, Aprobadas: approvedToday, Rechazadas: rejectedToday }]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                barCategoryGap={40}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 14, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 14, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 600, color: '#111827' }}
                  formatter={(value: any, name: string) => [value, name]}
                />
                <Bar dataKey="Total" fill="#111827" radius={[8, 8, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Aprobadas" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Rechazadas" fill="#ef4444" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-[#111827]"></span>
                <span className="text-sm text-gray-700">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-[#10b981]"></span>
                <span className="text-sm text-gray-700">Aprobadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-[#ef4444]"></span>
                <span className="text-sm text-gray-700">Rechazadas</span>
              </div>
            </div>
          </div>

          {/* Company Distribution */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Empresas Frecuentes
            </h2>
            {companyData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={companyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
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
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-gray-700 truncate max-w-[120px]">{item.name}</span>
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
              <Eye className="w-6 h-6 text-black" />
              Actividad Reciente
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentVisits.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Eye className="w-10 h-10 mx-auto mb-2 opacity-50 text-black" />
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

        {/* Admin Only Stats */}
        {/* StatCard de Total Usuarios eliminado, ya que está en la card de Usuarios */}
      </div>

      {/* Toast */}
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
