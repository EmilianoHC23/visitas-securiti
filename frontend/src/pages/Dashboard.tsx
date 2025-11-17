import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Visit, VisitStatus, DashboardStats, Access } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowRight,
  Eye,
  QrCode,
  Activity,
  BarChart3,
  Minus
} from 'lucide-react';
import { FaRegUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api';

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

// Modern Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean } | null;
  color: string;
  onClick?: () => void;
}> = ({ title, value, icon, trend, color, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500 text-xs ml-1">vs periodo anterior</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center shadow-lg transform transition-transform ${isHovered ? 'scale-110' : 'scale-100'}`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
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

// Frequent Visitor Component
const FrequentVisitorItem: React.FC<{
  visitor: { id: string; name: string; company: string; photo: string; count: number };
}> = ({ visitor }) => (
  <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all group">
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 group-hover:ring-gray-400 transition-all shadow-sm">
        {visitor.photo ? (
          <img src={visitor.photo} alt={visitor.name} className="w-full h-full object-cover" />
        ) : (
          <FaRegUser className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-white">
        {visitor.count}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate">{visitor.name}</p>
      <p className="text-xs text-gray-500 truncate">{visitor.company}</p>
    </div>
  </div>
);

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

export const Dashboard: React.FC = () => {
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

  const upcomingVisits = (upcomingVisitsQuery.data || [])
    .filter(v => v.status !== VisitStatus.COMPLETED)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const upcomingAccesses = (upcomingAccessesQuery.data || [])
    .filter(a => a.status === 'active')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  // Process analytics data
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

  // Frequent visitors
  const visitorMap = new Map<string, { id: string; name: string; company: string; photo: string; count: number }>();
  allVisits.forEach(v => {
    const id = v.visitorEmail || v.visitorName || v._id;
    if (!visitorMap.has(id)) {
      visitorMap.set(id, {
        id,
        name: v.visitorName || 'Sin nombre',
        company: v.visitorCompany || 'Sin empresa',
        photo: v.visitorPhoto || '',
        count: 0
      });
    }
    const visitor = visitorMap.get(id)!;
    visitor.count++;
  });
  const frequentVisitors = Array.from(visitorMap.values())
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
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Bienvenido, {user?.firstName} 👋
              </h1>
              <p className="text-gray-600">Aquí tienes un resumen de la actividad de hoy</p>
            </div>
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Visitas Activas"
            value={stats.checkedIn}
            icon={<UserCheck className="w-7 h-7" />}
            color="bg-gradient-to-br from-emerald-500 to-green-600"
            onClick={() => navigate('/visits?status=checkedIn')}
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={<Clock className="w-7 h-7" />}
            color="bg-gradient-to-br from-yellow-500 to-amber-600"
            onClick={() => navigate('/visits?status=pending')}
          />
          <StatCard
            title="Pre-aprobadas"
            value={stats.approved}
            icon={<CheckCircle className="w-7 h-7" />}
            color="bg-gradient-to-br from-blue-500 to-cyan-600"
            onClick={() => navigate('/visits?status=approved')}
          />
          <StatCard
            title="Completadas Hoy"
            value={stats.completed}
            icon={<BarChart3 className="w-7 h-7" />}
            color="bg-gradient-to-br from-gray-700 to-gray-900"
            onClick={() => navigate('/reports')}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              icon={<Calendar className="w-6 h-6" />}
              title="Registrar visita"
              subtitle="Crear nueva visita"
              onClick={() => navigate('/visits?openPanel=true')}
            />
            <QuickAction
              icon={<Eye className="w-6 h-6" />}
              title="Aprobar pendientes"
              subtitle="Revisar solicitudes"
              onClick={() => navigate('/visits?status=pending')}
            />
            <QuickAction
              icon={<QrCode className="w-6 h-6" />}
              title="Accesos & eventos"
              subtitle="Gestionar invitaciones"
              onClick={() => navigate('/access-codes')}
            />
            <QuickAction
              icon={<Calendar className="w-6 h-6" />}
              title="Ver agenda"
              subtitle="Próximas llegadas"
              onClick={() => navigate('/agenda')}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Actividad de Visitas
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="completadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="pendientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="aprobadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Area type="monotone" dataKey="completadas" stroke="#10b981" fillOpacity={1} fill="url(#completadas)" strokeWidth={2} />
                <Area type="monotone" dataKey="aprobadas" stroke="#3b82f6" fillOpacity={1} fill="url(#aprobadas)" strokeWidth={2} />
                <Area type="monotone" dataKey="pendientes" stroke="#f59e0b" fillOpacity={1} fill="url(#pendientes)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Completadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Aprobadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Pendientes</span>
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
                <ResponsiveContainer width="100%" height={220}>
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

        {/* Bottom Row - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Today */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Próximas Llegadas
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {upcomingVisits.length === 0 && upcomingAccesses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay llegadas pendientes</p>
                </div>
              ) : (
                <>
                  {upcomingVisits.map(v => (
                    <UpcomingItem key={v._id} item={v} type="visit" />
                  ))}
                  {upcomingAccesses.map(a => (
                    <UpcomingItem key={a._id} item={a} type="access" />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Frequent Visitors */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Visitantes Frecuentes
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {frequentVisitors.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay datos suficientes</p>
                </div>
              ) : (
                frequentVisitors.map(visitor => (
                  <FrequentVisitorItem key={visitor.id} visitor={visitor} />
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Actividad Reciente
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentVisits.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              ) : (
                recentVisits.map(visit => (
                  <ActivityItem key={visit._id} visit={visit} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Admin Only Stats */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Usuarios"
              value={stats.totalUsers}
              icon={<Users className="w-7 h-7" />}
              color="bg-gradient-to-br from-indigo-500 to-purple-600"
              onClick={() => navigate('/users')}
            />
            <StatCard
              title="Hosts Disponibles"
              value={stats.totalHosts}
              icon={<UserCheck className="w-7 h-7" />}
              color="bg-gradient-to-br from-pink-500 to-rose-600"
              onClick={() => navigate('/users')}
            />
          </div>
        )}
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
