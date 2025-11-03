import React, { useEffect, useMemo, useState } from 'react';
import { User, Access } from '../../types';
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
  status?: string;
  endDate?: string;
}

export const AgendaPage: React.FC = () => {
  const [from, setFrom] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [to, setTo] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0,10);
  });
  const [hostId, setHostId] = useState('');
  const [q, setQ] = useState('');
  const [hosts, setHosts] = useState<User[]>([]);
  // visits are not shown in the agenda — only accesses/events
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  // Agenda should show only accesses/events by default
  const [filterType, setFilterType] = useState<'all' | 'visits' | 'accesses'>('accesses');
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
      
      // Fetch accesses using new API
      const accessesData = await api.getAccessesForAgenda(
        from ? new Date(from).toISOString() : undefined,
        to ? new Date(to).toISOString() : undefined
      );
      
      // Filter by search query first
      let filteredAccesses = (accessesData || []).filter((a: Access) => {
        if (q && !a.eventName.toLowerCase().includes(q.toLowerCase()) && 
            !a.location?.toLowerCase().includes(q.toLowerCase())) {
          return false;
        }
        return true;
      });

      // Remove events that have already finished (status 'finalized' or expired by endDate)
      try {
        const now = new Date();
        filteredAccesses = filteredAccesses.filter((a: Access) => {
          if (!a) return false;
          // Respect explicit status first
          if (a.status === 'finalized' || a.status === 'expired' || a.status === 'cancelled') return false;
          // If endDate exists and is in the past, exclude
          try {
            const end = a.endDate ? new Date(a.endDate) : null;
            if (end && !isNaN(end.getTime()) && end.getTime() < now.getTime()) return false;
          } catch (e) {
            // ignore parse errors and keep the event
          }
          return true;
        });
      } catch (e) {
        console.warn('Error filtering past accesses:', e);
      }

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
    
    // Note: visits are intentionally omitted — agenda shows only accesses/events
    
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
          , status: a.status, endDate: typeof a.endDate === 'string' ? a.endDate : (a.endDate ? new Date(a.endDate).toISOString() : undefined)
        });
      });
    }
    
    return items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [accesses, filterType]);

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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda de Visitas y Eventos</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md font-semibold ${viewMode === 'table' ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700'}`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-md font-semibold ${viewMode === 'calendar' ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700'}`}
          >
            Calendario
          </button>
        </div>
      </div>

      {/* Removed type filter UI: agenda shows only accesos/eventos */}

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
              {hosts.map(h => <option key={h._id} value={h._id}>{h.firstName} {h.lastName}{h.role === 'admin' ? ' (Administrador)' : ''}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Nombre, empresa, título o motivo" value={q} onChange={e => setQ(e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2" />
              <button onClick={fetchAgenda} className="px-6 py-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white rounded-lg shadow-sm">Buscar</button>
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
                            {/* Show active events with a green badge, otherwise color by accessType */}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : (item.type === 'visit'
                                    ? 'bg-gray-100 text-gray-800'
                                    : item.accessType === 'reunion'
                                      ? 'bg-blue-100 text-blue-800'
                                      : item.accessType === 'proyecto'
                                        ? 'bg-purple-100 text-purple-800'
                                        : item.accessType === 'evento'
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-gray-100 text-gray-800')
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
            events={agendaItems.map(it => ({
              id: it.id,
              title: it.title,
              // send full startDate so CalendarMonth can show time if present
              date: it.startDate,
              // active events -> green; otherwise color by accessType
              color: it.status === 'active' ? '#34d399' : (it.accessType === 'reunion' ? '#60a5fa' : (it.accessType === 'proyecto' ? '#a78bfa' : '#f97316')),
              description: it.reason,
              location: it.location,
              hostName: it.hostName,
              preRegLink: it.preRegLink,
              accessType: it.accessType,
            }))}
          />
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg">{toast}</div>
      )}
    </div>
  );
};


