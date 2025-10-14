import React, { useEffect, useMemo, useState } from 'react';
import { User, Visit } from '../../types';
import * as api from '../../services/api';

interface AgendaItem {
  id: string;
  type: 'visit' | 'access';
  title: string;
  startDate: string;
  reason: string;
  company?: string;
  hostName: string;
  preRegLink?: string;
  visitorName?: string;
  location?: string;
}

export const AgendaPage: React.FC = () => {
  const [from, setFrom] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [to, setTo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0,10);
  });
  const [hostId, setHostId] = useState('');
  const [q, setQ] = useState('');
  const [hosts, setHosts] = useState<User[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [accesses, setAccesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api.getHosts().then(setHosts).catch(console.error);
  }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      // Cargar visitas
      const params: any = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(to).toISOString();
      if (hostId) params.hostId = hostId;
      if (q) params.q = q;
      const visitsData = await api.getAgenda(params);
      setVisits(visitsData);

      // Cargar accesos/eventos
      const accessesData = await api.getAccesses();
      // Filtrar accesos dentro del rango de fechas
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      const filteredAccesses = accessesData.filter((a: any) => {
        if (!a.schedule || !a.schedule.startDate) return false;
        const startDate = new Date(a.schedule.startDate);
        if (fromDate && startDate < fromDate) return false;
        if (toDate && startDate > toDate) return false;
        if (q && !a.title.toLowerCase().includes(q.toLowerCase()) && 
            !a.description?.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      });
      setAccesses(filteredAccesses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgenda(); }, []);

  const agendaItems: AgendaItem[] = useMemo(() => {
    const items: AgendaItem[] = [];
    
    // Agregar visitas
    visits.forEach(v => {
      items.push({
        id: v._id,
        type: 'visit',
        title: v.visitorName,
        startDate: v.scheduledDate,
        reason: v.reason,
        company: v.visitorCompany,
        hostName: `${v.host.firstName} ${v.host.lastName}`,
        visitorName: v.visitorName
      });
    });

    // Agregar accesos/eventos
    accesses.forEach((a: any) => {
      const startDateTime = a.schedule?.startDate && a.schedule?.startTime 
        ? `${a.schedule.startDate}T${a.schedule.startTime}:00`
        : a.schedule?.startDate || new Date().toISOString();
      
      items.push({
        id: a._id,
        type: 'access',
        title: a.title,
        startDate: startDateTime,
        reason: a.description || 'Evento',
        company: '',
        hostName: a.host ? `${a.host.firstName} ${a.host.lastName}` : 'N/A',
        preRegLink: a.accessCode ? `${window.location.origin}/redeem/${a.accessCode}` : undefined,
        location: a.location
      });
    });

    // Ordenar por fecha
    return items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [visits, accesses]);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setToast('Enlace copiado al portapapeles');
      setTimeout(() => setToast(null), 2000);
    } catch {
      window.prompt('Copia este enlace:', link);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of agendaItems) {
      const day = new Date(item.startDate).toISOString().slice(0,10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    }
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [agendaItems]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agenda de Visitas y Eventos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md font-semibold ${viewMode === 'table' ? 'bg-securiti-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-md font-semibold ${viewMode === 'calendar' ? 'bg-securiti-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Por Día
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input 
              type="date" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-securiti-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input 
              type="date" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-securiti-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anfitrión</label>
            <select 
              value={hostId} 
              onChange={e => setHostId(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-securiti-blue-500"
            >
              <option value="">Todos</option>
              {hosts.map(h => <option key={h._id} value={h._id}>{h.firstName} {h.lastName}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nombre, empresa, título o motivo" 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-securiti-blue-500"
              />
              <button 
                onClick={fetchAgenda} 
                className="px-6 py-2 bg-securiti-blue-600 text-white rounded-lg hover:bg-securiti-blue-700 font-semibold"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-securiti-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando agenda...</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anfitrión</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agendaItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No hay visitas ni eventos programados en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  agendaItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'visit' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 'visit' ? 'Visita' : 'Evento'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.startDate).toLocaleString('es-ES', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        {item.location && (
                          <div className="text-xs text-gray-500">📍 {item.location}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.company || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.hostName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.preRegLink && (
                          <button
                            onClick={() => copyLink(item.preRegLink!)}
                            className="inline-flex items-center px-3 py-1 bg-securiti-blue-100 text-securiti-blue-700 rounded-md hover:bg-securiti-blue-200 transition-colors"
                            title="Copiar enlace de pre-registro"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar URL
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              No hay visitas ni eventos programados en el rango seleccionado.
            </div>
          )}
          {grouped.map(([day, items]) => (
            <div key={day} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  {new Date(day).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 pt-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.type === 'visit' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {item.type === 'visit' ? (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>🕐 {new Date(item.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>👤 {item.hostName}</span>
                            {item.company && <span>🏢 {item.company}</span>}
                            {item.location && <span>📍 {item.location}</span>}
                          </div>
                        </div>
                        {item.preRegLink && (
                          <button
                            onClick={() => copyLink(item.preRegLink!)}
                            className="ml-4 px-3 py-1 text-xs bg-securiti-blue-100 text-securiti-blue-700 rounded-md hover:bg-securiti-blue-200"
                          >
                            Copiar URL
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
