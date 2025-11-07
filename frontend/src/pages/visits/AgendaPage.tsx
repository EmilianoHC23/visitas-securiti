import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { User, Access } from '../../types';
import * as api from '../../services/api';
import CalendarMonth from '../../components/visits/CalendarMonth';
import { DateRangePicker } from '../../components/common/DatePicker';

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

  // Estado para detectar móvil
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Animated host dropdown component (replaces native select)
  const HostDropdown: React.FC<{ hosts: User[]; value: string; onChange: (id: string) => void }> = ({ hosts, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = hosts.find(h => h._id === value) || null;

    const sortedHosts = useMemo(() => {
      return [...hosts].sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }, [hosts]);

    const renderAvatar = (host: User, sizeClass = 'w-8 h-8') => {
      const src = (host as any).profileImage || (host as any).photo || '';
      const initials = `${host.firstName?.[0] || ''}${host.lastName?.[0] || ''}`.toUpperCase();
      if (src) return <img src={src} alt={`${host.firstName} ${host.lastName}`} className={`${sizeClass} rounded-full object-cover`} />;
      return <div className={`${sizeClass} rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold`}>{initials}</div>;
    };

    const wrapper: Variants = {
      open: { scaleY: 1, opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.06 } },
      closed: { scaleY: 0, opacity: 0, transition: { when: 'afterChildren', staggerChildren: 0.04 } },
    };

    const item: Variants = {
      open: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
      closed: { opacity: 0, y: -6, transition: { duration: 0.12 } },
    };

    const chevron: Variants = { open: { rotate: 180 }, closed: { rotate: 0 } };

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg flex items-center gap-3 bg-white"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3">
            {selected ? renderAvatar(selected, 'w-6 h-6') : (
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" /><path d="M3 21a9 9 0 0118 0" fill="currentColor" /></svg>
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{selected ? `${selected.firstName} ${selected.lastName}` : 'Todos'}</div>
            </div>
          </div>
          <motion.span className="ml-auto inline-block" variants={chevron} animate={open ? 'open' : 'closed'}>
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
          </motion.span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div initial="closed" animate="open" exit="closed" variants={wrapper} style={{ transformOrigin: 'top' }} className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-56 overflow-auto">
              {sortedHosts.length > 0 ? sortedHosts.map(h => (
                <motion.button key={h._id} type="button" variants={item} onClick={() => { onChange(h._id); setOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left">
                  {renderAvatar(h)}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{h.firstName} {h.lastName}</div>
                    <div className="text-xs text-gray-500 truncate">{(h as any).email || ''}</div>
                  </div>
                </motion.button>
              )) : (
                <div className="p-3 text-sm text-gray-500">No hay anfitriones disponibles</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'p-3' : 'p-4 sm:p-6 lg:p-8'}`}>
        {/* Header moderno */}
        <div className={isMobile ? 'mb-4' : 'mb-8'}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg`}>
                <svg className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent`}>
                  Agenda de Eventos
                </h1>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>Gestiona y visualiza tus eventos programados</p>
              </div>
            </div>
            
            {/* Toggle de vista */}
            <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-md border border-gray-200">
              <button
                onClick={() => setViewMode('table')}
                className={`${isMobile ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-lg font-semibold text-sm transition-all duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {!isMobile && <span className="hidden sm:inline">Tabla</span>}
                </div>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`${isMobile ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-lg font-semibold text-sm transition-all duration-200 ${
                  viewMode === 'calendar' 
                    ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {!isMobile && <span className="hidden sm:inline">Calendario</span>}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros modernos */}
        <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 ${isMobile ? 'p-4 mb-4' : 'p-6 mb-6'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-${isMobile ? '3' : '6'}`}>
            {/* DateRangePicker - 6 columnas en lg, 5 en xl */}
            <div className={isMobile ? '' : 'lg:col-span-6 xl:col-span-5'}>
              <DateRangePicker
                startValue={from}
                endValue={to}
                onStartChange={setFrom}
                onEndChange={setTo}
              />
            </div>
            
            {/* Anfitrión - 3 columnas en lg, 3 en xl */}
            <div className={isMobile ? '' : 'lg:col-span-3 xl:col-span-3'}>
              <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2 flex items-center`}>
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Anfitrión
              </label>
              <HostDropdown hosts={hosts} value={hostId} onChange={setHostId} />
            </div>
            
            {/* Buscar - 3 columnas en lg, 4 en xl */}
            <div className={isMobile ? '' : 'lg:col-span-3 xl:col-span-4'}>
              <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2 flex items-center`}>
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={isMobile ? "Buscar..." : "Nombre, empresa, título..."} 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  className={`flex-1 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2.5'} border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all text-sm`}
                />
                <button 
                  onClick={fetchAgenda} 
                  className={`${isMobile ? 'px-4 py-2' : 'px-6 py-2.5'} bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold text-sm hover:scale-105`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div className={`text-center ${isMobile ? 'py-12' : 'py-20'} bg-white rounded-2xl shadow-xl border border-gray-200`}>
            <div className={`inline-block animate-spin rounded-full ${isMobile ? 'h-12 w-12 border-4' : 'h-16 w-16 border-4'} border-gray-200 border-t-gray-900`}></div>
            <p className={`${isMobile ? 'mt-4 text-base' : 'mt-6 text-lg'} text-gray-600 font-medium`}>Cargando agenda...</p>
          </div>
        ) : viewMode === 'table' ? (
          isMobile ? (
            // Vista de tarjetas para móvil
            <div className="space-y-3">
              {agendaItems.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">No hay eventos</p>
                      <p className="text-gray-500 text-xs mt-1">No se encontraron eventos</p>
                    </div>
                  </div>
                </div>
              ) : (
                agendaItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${
                        item.status === 'active'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : item.accessType === 'reunion'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                            : item.accessType === 'proyecto'
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              : item.accessType === 'evento'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                                : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                      }`}>
                        {item.type === 'visit' ? '👤 Visita' : item.accessType === 'reunion' ? '💼 Reunión' : item.accessType === 'proyecto' ? '🚀 Proyecto' : item.accessType === 'evento' ? '🎉 Evento' : '📋 Otro'}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(item.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                    {item.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{item.location}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.reason}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">{item.company || 'Sin empresa'}</div>
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{item.hostName}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Vista de tabla para desktop
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Evento</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Anfitrión</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {agendaItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-900 font-semibold text-lg">No hay eventos programados</p>
                            <p className="text-gray-500 text-sm mt-1">No se encontraron eventos en el rango seleccionado</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    agendaItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                            item.status === 'active'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : item.accessType === 'reunion'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                : item.accessType === 'proyecto'
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                  : item.accessType === 'evento'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                                    : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                          }`}>
                            {item.type === 'visit' ? '👤 Visita' : item.accessType === 'reunion' ? '💼 Reunión' : item.accessType === 'proyecto' ? '🚀 Proyecto' : item.accessType === 'evento' ? '🎉 Evento' : '📋 Otro'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(item.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                            {item.location && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {item.location}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{item.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.company || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                              {item.hostName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.hostName}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )
        ) : (
          <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 ${isMobile ? 'p-3' : 'p-6'}`}>
            <CalendarMonth
              year={new Date().getFullYear()}
              month={new Date().getMonth()}
              events={agendaItems.map(it => ({
                id: it.id,
                title: it.title,
                date: it.startDate,
                color: it.status === 'active' ? '#10b981' : (it.accessType === 'reunion' ? '#3b82f6' : (it.accessType === 'proyecto' ? '#a855f7' : '#f97316')),
                description: it.reason,
                location: it.location,
                hostName: it.hostName,
                preRegLink: it.preRegLink,
                accessType: it.accessType,
              }))}
            />
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
};


