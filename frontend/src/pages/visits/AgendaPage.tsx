import React, { useEffect, useMemo, useState } from 'react';
import { User, Visit } from '../../types';
import * as api from '../../services/api';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getHosts().then(setHosts).catch(console.error);
  }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(to).toISOString();
      if (hostId) params.hostId = hostId;
      if (q) params.q = q;
      const data = await api.getAgenda(params);
      setVisits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgenda(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Visit[]>();
    for (const v of visits) {
      const day = new Date(v.scheduledDate).toISOString().slice(0,10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(v);
    }
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [visits]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Agenda de visitas</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Anfitrión</label>
          <select value={hostId} onChange={e => setHostId(e.target.value)} className="w-full border rounded p-2 bg-white">
            <option value="">Todos</option>
            {hosts.map(h => <option key={h._id} value={h._id}>{h.firstName} {h.lastName}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Buscar</label>
          <input type="text" placeholder="Nombre, empresa o motivo" value={q} onChange={e => setQ(e.target.value)} className="w-full border rounded p-2" />
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <button onClick={fetchAgenda} className="px-4 py-2 bg-securiti-blue-600 text-white rounded-md">Actualizar</button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="space-y-6">
          {grouped.length === 0 && <div className="text-gray-500">Sin visitas en el rango seleccionado.</div>}
          {grouped.map(([day, items]) => (
            <div key={day}>
              <h2 className="text-lg font-semibold mb-2">{new Date(day).toLocaleDateString()}</h2>
              <div className="space-y-2">
                {items.map(v => (
                  <div key={v._id} className="bg-white rounded-md shadow p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{v.visitorName} {v.visitorCompany ? `- ${v.visitorCompany}` : ''}</div>
                      <div className="text-sm text-gray-600">{v.reason}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(v.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
