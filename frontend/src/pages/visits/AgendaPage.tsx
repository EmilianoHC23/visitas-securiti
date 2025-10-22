import React, { useEffect, useMemo, useState } from 'react';
import { User, Visit, Access } from '../../types';
import * as api from '../../services/api';
import CalendarMonth from '../../components/visits/CalendarMonth';

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
  accessType?: string;
}

export const AgendaPage: React.FC = () => {
  const [from, setFrom] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [to, setTo] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0,10);
  });
  const [hostId, setHostId] = useState('');
  const [q, setQ] = useState('');
  const [hosts, setHosts] = useState<User[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [filterType, setFilterType] = useState<'all' | 'visits' | 'accesses'>('all');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { api.getHosts().then(setHosts).catch(console.error); }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(to).toISOString();
      if (hostId) params.hostId = hostId;
      if (q) params.q = q;
      
      // Fetch visits
      const visitsData = await api.getAgenda(params);
      setVisits(visitsData || []);

      // Fetch accesses using new API
      const accessesData = await api.getAccessesForAgenda(
        from ? new Date(from).toISOString() : undefined,
        to ? new Date(to).toISOString() : undefined
      );
      
      // Filter by search query
      const filteredAccesses = (accessesData || []).filter((a: Access) => {
        if (q && !a.eventName.toLowerCase().includes(q.toLowerCase()) && 
            !a.location?.toLowerCase().includes(q.toLowerCase())) {
          return false;
        }
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
    
    // Add visits if filter allows
    if (filterType === 'all' || filterType === 'visits') {
      visits.forEach(v => items.push({ 
        id: v._id, 
        type: 'visit', 
        title: v.visitorName, 
        startDate: v.scheduledDate, 
        reason: v.reason, 
        company: v.visitorCompany, 
        hostName: `${v.host.firstName} ${v.host.lastName}`, 
        visitorName: v.visitorName 
      }));
    }
    
    // Add accesses if filter allows
    if (filterType === 'all' || filterType === 'accesses') {
      accesses.forEach((a: Access) => {
        items.push({ 
          id: a._id, 
          type: 'access', 
          title: a.eventName, 
          startDate: typeof a.startDate === 'string' ? a.startDate : new Date(a.startDate).toISOString(), 
          reason: a.additionalInfo || 'Evento', 
          company: '', 
          hostName: a.creatorId ? `${a.creatorId.firstName} ${a.creatorId.lastName}` : 'N/A', 
          preRegLink: a.accessCode ? `${window.location.origin}/redeem/${a.accessCode}` : undefined, 
          location: a.location,
          accessType: a.type
        });
      });
    }
    
    return items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [visits, accesses, filterType]);

  const copyLink = async (link: string) => {
    try { await navigator.clipboard.writeText(link); setToast('Enlace copiado al portapapeles'); setTimeout(() => setToast(null), 2000); }
    catch { window.prompt('Copia este enlace:', link); }
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
          <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-md font-semibold ${viewMode === 'table' ? 'bg-securiti-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Tabla</button>
          <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-md font-semibold ${viewMode === 'calendar' ? 'bg-securiti-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Calendario</button>
        </div>
      </div>

      {/* Filtro de tipo */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Mostrar:</span>
          <button 
            onClick={() => setFilterType('all')} 
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('visits')} 
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${filterType === 'visits' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Solo Visitas
          </button>
          <button 
            onClick={() => setFilterType('accesses')} 
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${filterType === 'accesses' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Solo Accesos/Eventos
          </button>
          <span className="ml-auto text-sm text-gray-600">
            {agendaItems.length} {agendaItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anfitrión</label>
            <select value={hostId} onChange={e => setHostId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 bg-white">
              <option value="">Todos</option>
              {hosts.map(h => <option key={h._id} value={h._id}>{h.firstName} {h.lastName}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Nombre, empresa, título o motivo" value={q} onChange={e => setQ(e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2" />
              <button onClick={fetchAgenda} className="px-6 py-2 bg-securiti-blue-600 text-white rounded-lg">Buscar</button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">Cargando agenda...</div>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agendaItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-gray-500">No hay visitas ni eventos programados en el rango seleccionado.</td></tr>
                ) : (
                  agendaItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'visit' 
                            ? 'bg-green-100 text-green-800' 
                            : item.accessType === 'reunion' 
                              ? 'bg-blue-100 text-blue-800'
                              : item.accessType === 'proyecto'
                                ? 'bg-purple-100 text-purple-800'
                                : item.accessType === 'evento'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.type === 'visit' ? 'Visita' : item.accessType === 'reunion' ? 'Reunión' : item.accessType === 'proyecto' ? 'Proyecto' : item.accessType === 'evento' ? 'Evento' : 'Otro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.startDate).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        {item.location && <div className="text-xs text-gray-500 mt-1">📍 {item.location}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.company || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.hostName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {/* Mostrar calendario siempre; si no hay eventos se pasan events=[] al componente */}
          <CalendarMonth
            year={new Date().getFullYear()}
            month={new Date().getMonth()}
            events={agendaItems.map(it => ({ id: it.id, title: it.title, date: it.startDate.slice(0,10), color: it.type === 'visit' ? '#60a5fa' : '#34d399' }))}
          />
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg">{toast}</div>
      )}
    </div>
  );
};


