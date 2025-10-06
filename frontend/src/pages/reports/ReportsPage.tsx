import React, { useState, useEffect } from 'react';
import { Visit } from '../../types';
import * as api from '../../services/api';

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  averageStayTime: number;
  topHosts: Array<{ name: string; count: number }>;
  visitsByDay: Array<{ date: string; count: number }>;
  visitsByHour: Array<{ hour: number; count: number }>;
  topCompanies: Array<{ company: string; count: number }>;
  visitsByStatus: Array<{ status: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
}

export const ReportsPage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    
    loadData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [period, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load visits with error handling
      let visitsData: Visit[] = [];
      try {
        visitsData = await api.getVisits();
        if (!Array.isArray(visitsData)) {
          visitsData = [];
        }
        setVisits(visitsData);
      } catch (visitsError) {
        console.error('Error loading visits:', visitsError);
        setVisits([]);
        visitsData = [];
      }
      
      // Generate simple analytics from visits data instead of calling API
      const filteredVisits = visitsData.filter(visit => {
        if (!startDate || !endDate) return true;
        const visitDate = new Date(visit.scheduledDate || visit.createdAt);
        return visitDate >= new Date(startDate) && visitDate <= new Date(endDate);
      });

      // Create analytics from filtered visits
      const analyticsData = {
        totalVisits: filteredVisits.length,
        uniqueVisitors: new Set(filteredVisits.map(v => v.visitorName || 'Anónimo')).size,
        averageStayTime: 0, // Not calculated for now
        topHosts: getTopHosts(filteredVisits),
        visitsByDay: getVisitsByDay(filteredVisits),
        visitsByHour: getVisitsByHour(filteredVisits),
        topCompanies: getTopCompanies(filteredVisits),
        visitsByStatus: getVisitsByStatus(filteredVisits),
        monthlyTrend: getMonthlyTrend(filteredVisits)
      };

      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Error loading reports data:', error);
      setVisits([]);
      setAnalytics({
        totalVisits: 0,
        uniqueVisitors: 0,
        averageStayTime: 0,
        topHosts: [],
        visitsByDay: [],
        visitsByHour: [],
        topCompanies: [],
        visitsByStatus: [],
        monthlyTrend: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to generate analytics
  const getTopHosts = (visits: Visit[]) => {
    const hostCounts: { [key: string]: number } = {};
    visits.forEach(visit => {
      const host = visit.host?.firstName && visit.host?.lastName 
        ? `${visit.host.firstName} ${visit.host.lastName}` 
        : 'Sin host';
      hostCounts[host] = (hostCounts[host] || 0) + 1;
    });
    return Object.entries(hostCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getVisitsByDay = (visits: Visit[]) => {
    const dayCounts: { [key: string]: number } = {};
    visits.forEach(visit => {
      const date = new Date(visit.scheduledDate || visit.createdAt).toISOString().split('T')[0];
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    });
    return Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getVisitsByHour = (visits: Visit[]) => {
    const hourCounts: { [key: number]: number } = {};
    visits.forEach(visit => {
      const hour = new Date(visit.scheduledDate || visit.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts[hour] || 0
    }));
  };

  const getTopCompanies = (visits: Visit[]) => {
    const companyCounts: { [key: string]: number } = {};
    visits.forEach(visit => {
      const company = visit.visitorCompany || 'Sin empresa';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
    return Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getVisitsByStatus = (visits: Visit[]) => {
    const statusCounts: { [key: string]: number } = {};
    visits.forEach(visit => {
      const status = visit.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }));
  };

  const getMonthlyTrend = (visits: Visit[]) => {
    const monthCounts: { [key: string]: number } = {};
    visits.forEach(visit => {
      const month = new Date(visit.scheduledDate || visit.createdAt).toISOString().slice(0, 7);
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await api.exportReports(format, { startDate, endDate });
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visitas-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting reports:', error);
      alert('Error al exportar el reporte');
    }
  };

  if (loading) {
    return <div className="p-6">Cargando reportes...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <h2 className="text-2xl font-bold text-gray-800">Reportes y Analytics</h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Exportar JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Visitas</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.totalVisits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Visitantes Únicos</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.uniqueVisitors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                  <p className="text-2xl font-semibold text-gray-900">{Math.round(analytics.averageStayTime)}m</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Empresas Diferentes</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.topCompanies ? analytics.topCompanies.length : 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y Tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Anfitriones */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Anfitriones Más Activos</h3>
              <div className="space-y-3">
                {(analytics.topHosts || []).slice(0, 5).map((host, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{host.name}</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${analytics.topHosts && analytics.topHosts[0] ? (host.count / analytics.topHosts[0].count) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{host.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Empresas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Empresas Más Frecuentes</h3>
              <div className="space-y-3">
                {(analytics.topCompanies || []).slice(0, 5).map((company, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{company.company || 'Sin empresa'}</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(company.count / analytics.topCompanies[0].count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{company.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visitas por Estado */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Estado</h3>
              <div className="space-y-3">
                {(analytics.visitsByStatus || []).map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{status.status}</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(status.count / analytics.totalVisits) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visitas por Hora */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Horarios Más Concurridos</h3>
              <div className="space-y-2">
                {analytics.visitsByHour
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((hour, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${analytics.visitsByHour && analytics.visitsByHour.length > 0 ? (hour.count / Math.max(...analytics.visitsByHour.map(h => h.count))) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{hour.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de Visitas Recientes */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Visitas Recientes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anfitrión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits && visits.length > 0 ? visits.slice(0, 10).map((visit) => (
                    <tr key={visit._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{visit.visitorName}</div>
                        <div className="text-sm text-gray-500">{visit.visitorEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.visitorCompany || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof visit.hostId === 'object' ? visit.hostId.name : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${visit.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            visit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            visit.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {visit.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No hay visitas para mostrar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};