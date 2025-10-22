import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Edit2, CheckCircle, RefreshCw, Trash2, QrCode, Link as LinkIcon } from 'lucide-react';
import { 
  getAccesses, 
  createAccess as apiCreateAccess, 
  updateAccess as apiUpdateAccess, 
  deleteAccess as apiDeleteAccess, 
  updateAccessStatus as apiUpdateAccessStatus 
} from '../../services/api';

type Visitor = { email: string; name: string };
type AccessItem = {
  id: string;
  reason: string;
  title: string;
  start: string; // ISO
  end?: string | null; // ISO or null
  noExpiry: boolean;
  preRegLink?: string | null;
  visitors: Visitor[];
  invitedEmails?: string[];
  invitedCount?: number;
  host?: string;
  location?: string;
  notes?: string;
  preApprove: boolean;
  sendAccess: boolean;
  status: 'activo' | 'finalizado';
  createdAt: string; // ISO
};

export const AccessCodesPage: React.FC = () => {
  // Helpers to safely build ISO strings from possibly-varied backend values
  const getDatePart = (dateLike: any): string | null => {
    if (!dateLike) return null;
    try {
      if (typeof dateLike === 'string') {
        // If it's already an ISO string (contains 'T'), only take the date component
        const onlyDate = dateLike.includes('T') ? dateLike.split('T')[0] : dateLike;
        if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) return onlyDate;
        const d = new Date(dateLike);
        if (isFinite(d.getTime())) return d.toISOString().slice(0, 10);
        return null;
      }
      const d = new Date(dateLike);
      if (isFinite(d.getTime())) return d.toISOString().slice(0, 10);
      return null;
    } catch {
      return null;
    }
  };

  const getTimePart = (timeLike: any): string => {
    if (!timeLike || typeof timeLike !== 'string') return '00:00:00';
    const m = timeLike.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) return `${m[1]}:${m[2]}:${m[3] ?? '00'}`;
    return '00:00:00';
  };

  const combineToISO = (dateLike: any, timeLike: any): string | null => {
    const datePart = getDatePart(dateLike);
    if (!datePart) return null;
    const timePart = getTimePart(timeLike);
    const d = new Date(`${datePart}T${timePart}Z`);
    return isFinite(d.getTime()) ? d.toISOString() : null;
  };

  // Safe conversion to ISO with fallback to "now" when invalid
  const toISOOrNow = (dateLike: any): string => {
    try {
      const d = new Date(dateLike);
      return isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const [tab, setTab] = useState<'activos' | 'finalizados'>('activos');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lista dinámica de accesos/eventos
  const [items, setItems] = useState<AccessItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Estado del formulario
  const [reason, setReason] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [noExpiry, setNoExpiry] = useState(false);
  const [createLink, setCreateLink] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([{ email: '', name: '' }]);

  // Avanzados
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [host, setHost] = useState('');
  const [location, setLocation] = useState('');
  const [preApprove, setPreApprove] = useState(true);
  const [sendAccess, setSendAccess] = useState(true);
  const [notes, setNotes] = useState('');
  // Imagen opcional (no se sube aún)
  const [imageFile, setImageFile] = useState<File | null>(null);

  // UI feedback
  const [toast, setToast] = useState<string | null>(null);

  const accessList = useMemo(() => (tab === 'activos' ? items.filter(i => i.status === 'activo') : items.filter(i => i.status === 'finalizado')), [items, tab]);

  // Cargar accesos desde el backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAccesses();
        // Mapear a nuestro modelo local
        const mapped: AccessItem[] = (data || []).map((a: any) => {
          const start = combineToISO(a?.schedule?.startDate, a?.schedule?.startTime)
            || (a?.createdAt ? toISOOrNow(a.createdAt) : new Date().toISOString());
          const end = combineToISO(a?.schedule?.endDate, a?.schedule?.endTime);
          const status: AccessItem['status'] = a?.status === 'active' ? 'activo' : 'finalizado';
          const preRegLink = a?.accessCode ? `${window.location.origin}/redeem/${a.accessCode}` : null;
          const invitedEmails = Array.isArray(a?.invitedEmails) ? a.invitedEmails.map((ie: any) => ie?.email || '').filter(Boolean) : undefined;
          return {
            id: a?._id || a?.id || Math.random().toString(36).slice(2,10),
            reason: a?.description || 'evento',
            title: a?.title || 'Acceso',
            start,
            end,
            noExpiry: !end,
            preRegLink,
            visitors: [], // Backend aún no soporta nombres; emails van en invitedEmails
            invitedEmails,
            invitedCount: invitedEmails?.length,
            host: undefined,
            location: undefined,
            notes: undefined,
            preApprove: !!a?.settings?.autoApproval,
            sendAccess: true,
            status,
            createdAt: a?.createdAt ? toISOOrNow(a.createdAt) : new Date().toISOString(),
          } as AccessItem;
        });
        setItems(mapped);
      } catch (err: any) {
        console.error('Error cargando accesos:', err);
        setToast(err?.message || 'No se pudieron cargar los accesos');
        setTimeout(() => setToast(null), 2500);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setReason('');
    setTitle('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setNoExpiry(false);
    setCreateLink(true);
    setVisitors([{ email: '', name: '' }]);
    setHost('');
    setLocation('');
    setPreApprove(true);
    setSendAccess(true);
    setNotes('');
    setImageFile(null);
  };

  const makeId = () => Math.random().toString(36).slice(2, 10);

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    // Validaciones mínimas
    if (!reason || !title || !startDate || !startTime) {
      setToast('Completa motivo, título y fecha/hora de inicio.');
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const startISO = combineToISO(startDate, `${startTime}:00`);
    if (!startISO) {
      setToast('Fecha/hora de inicio inválida.');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    let endISO: string | null = null;
    if (!noExpiry && endDate && endTime) {
      endISO = combineToISO(endDate, `${endTime}:00`);
      if (!endISO) {
        setToast('Fecha/hora de fin inválida.');
        setTimeout(() => setToast(null), 2500);
        return;
      }
    }
    try {
      // Preparar payload para API
      const schedule = {
        startDate: startDate,
        endDate: endISO ? endDate : startDate, // si no hay fin, usar inicio
        startTime: startTime,
        endTime: endISO ? endTime : startTime,
      } as any;
      const settings = {
        autoApproval: preApprove,
        requireApproval: !preApprove,
        allowGuests: true,
        maxUses: visitors.length > 0 ? visitors.length : 100,
      };
      const invitedEmails = sendAccess && createLink
        ? visitors.filter(v => v.email).map(v => v.email)
        : [];

      if (editingId) {
        const updates: any = {
          title,
          description: reason + (notes ? ` | ${notes}` : ''),
          schedule,
          settings,
          invitedEmails,
        };
        const updated = await apiUpdateAccess(editingId, updates);
        // Mapear respuesta a item local
        const preRegLink = updated?.accessCode ? `${window.location.origin}/redeem/${updated.accessCode}` : null;
        const start = combineToISO(updated?.schedule?.startDate, updated?.schedule?.startTime) || startISO;
        const end = combineToISO(updated?.schedule?.endDate, updated?.schedule?.endTime) || endISO;
        setItems(prev => prev.map(it => it.id === editingId ? {
          ...it,
          reason: updated?.description || reason,
          title: updated?.title || title,
          start,
          end,
          noExpiry: !end,
          preRegLink,
          preApprove: !!updated?.settings?.autoApproval,
          sendAccess,
        } : it));
        
        // Mostrar feedback de actualización con emails si se enviaron
        const updatedInvites = updated?.invitedEmails?.length || 0;
        if (sendAccess && updatedInvites > 0) {
          setToast(`Acceso actualizado. ${updatedInvites} invitación(es) actualizadas por email.`);
        } else {
          setToast('Acceso actualizado.');
        }
      } else {
        const created = await apiCreateAccess({
          title,
          description: reason + (notes ? ` | ${notes}` : ''),
          schedule,
          settings,
          invitedEmails,
        } as any);
        const preRegLink = created?.accessCode && createLink ? `${window.location.origin}/redeem/${created.accessCode}` : null;
        const start = combineToISO(created?.schedule?.startDate, created?.schedule?.startTime) || startISO;
        const end = combineToISO(created?.schedule?.endDate, created?.schedule?.endTime) || (endISO ?? null);
        const newItem: AccessItem = {
          id: created?._id || makeId(),
          reason: created?.description || reason,
          title: created?.title || title,
          start,
          end,
          noExpiry: !end,
          preRegLink,
          visitors: visitors.filter(v => v.email || v.name),
          host: host || undefined,
          location: location || undefined,
          notes: notes || undefined,
          preApprove: !!created?.settings?.autoApproval,
          sendAccess,
          status: created?.status === 'active' ? 'activo' : 'finalizado',
          createdAt: created?.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
        };
        setItems(prev => [newItem, ...prev]);
        
        // Mostrar feedback de envío de emails
        if (sendAccess && invitedEmails.length > 0) {
          setToast(`Acceso creado. ${invitedEmails.length} invitación(es) enviada(s) por email.`);
        } else {
          setToast('Acceso creado.');
        }
      }
      setShowCreateForm(false);
      setEditingId(null);
      resetForm();
      setTimeout(() => setToast(null), 2000);
    } catch (err: any) {
      console.error('Error guardando acceso:', err);
      setToast(err?.message || 'No se pudo guardar el acceso');
      setTimeout(() => setToast(null), 2500);
    }
  };

  const addVisitor = () => setVisitors(v => [...v, { email: '', name: '' }]);
  const removeVisitor = (idx: number) => setVisitors(v => v.filter((_, i) => i !== idx));
  const updateVisitor = (idx: number, patch: Partial<Visitor>) =>
    setVisitors(v => v.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const copyLink = async (link?: string | null) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setToast('Enlace copiado.');
      setTimeout(() => setToast(null), 1500);
    } catch {
      // Fallback simple
      window.prompt('Copia el enlace', link);
    }
  };

  // Acciones sobre filas
  const openCreate = () => { setEditingId(null); resetForm(); setShowCreateForm(true); };
  const openEdit = (it: AccessItem) => {
    setEditingId(it.id);
    setReason(it.reason);
    setTitle(it.title);
    const s = new Date(it.start);
    setStartDate(s.toISOString().slice(0,10));
    setStartTime(s.toISOString().slice(11,16));
    if (it.noExpiry || !it.end) {
      setNoExpiry(true);
      setEndDate('');
      setEndTime('');
    } else {
      const e = new Date(it.end);
      setNoExpiry(false);
      setEndDate(e.toISOString().slice(0,10));
      setEndTime(e.toISOString().slice(11,16));
    }
    setCreateLink(!!it.preRegLink);
    setVisitors(it.visitors.length ? it.visitors : [{ email: '', name: '' }]);
    setHost(it.host ?? '');
    setLocation(it.location ?? '');
    setPreApprove(it.preApprove);
    setSendAccess(it.sendAccess);
    setNotes(it.notes ?? '');
    setShowCreateForm(true);
  };

  const finalizeItem = async (id: string) => {
    try {
      await apiUpdateAccessStatus(id, 'expired');
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'finalizado' } : it));
      setToast('Acceso finalizado.');
      setTimeout(() => setToast(null), 1500);
    } catch (err: any) {
      console.error('Error finalizando acceso:', err);
      setToast(err?.message || 'No se pudo finalizar el acceso');
      setTimeout(() => setToast(null), 2000);
    }
  };
  const reactivateItem = async (id: string) => {
    try {
      await apiUpdateAccessStatus(id, 'active');
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'activo' } : it));
      setToast('Acceso reactivado.');
      setTimeout(() => setToast(null), 1500);
    } catch (err: any) {
      console.error('Error reactivando acceso:', err);
      setToast(err?.message || 'No se pudo reactivar el acceso');
      setTimeout(() => setToast(null), 2000);
    }
  };
  const deleteItem = async (id: string) => {
    try {
      await apiDeleteAccess(id);
      setItems(prev => prev.filter(it => it.id !== id));
      setConfirmDeleteId(null);
      setToast('Acceso eliminado.');
      setTimeout(() => setToast(null), 1500);
    } catch (err: any) {
      console.error('Error eliminando acceso:', err);
      setToast(err?.message || 'No se pudo eliminar el acceso');
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Accesos/Eventos</h2>
          <div className="flex gap-2">
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700 transition-colors"
            >
              Crear acceso
            </button>
            <button
              onClick={() => setTab('activos')}
              className={`px-4 py-2 rounded-md font-semibold ${tab === 'activos' ? 'bg-securiti-blue-100 text-securiti-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Activos
            </button>
            <button
              onClick={() => setTab('finalizados')}
              className={`px-4 py-2 rounded-md font-semibold ${tab === 'finalizados' ? 'bg-securiti-blue-100 text-securiti-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Finalizados
            </button>
          </div>
        </div>
        {/* Tabla de accesos/eventos */}
        <div className="p-6">
          {loading && (
            <div className="text-gray-500 text-sm mb-3">Cargando accesos...</div>
          )}
          {accessList.length === 0 ? (
            <div className="text-center text-gray-500">
              {tab === 'activos' ? 'Sin accesos activos.' : 'Sin accesos finalizados.'}
              {tab === 'activos' && (
                <>
                  <span className="block mt-2">Crea uno y agiliza la entrada de tus visitantes.</span>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 px-4 py-2 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700"
                  >
                    Crear acceso
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-3 pr-4">Título</th>
                    <th className="py-3 pr-4">Motivo</th>
                    <th className="py-3 pr-4">Inicio</th>
                    <th className="py-3 pr-4">Fin</th>
                    <th className="py-3 pr-4">Visitantes</th>
                    <th className="py-3 pr-4">Enlace</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3 pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {accessList.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{item.title}</td>
                      <td className="py-3 pr-4 capitalize">{item.reason}</td>
                      <td className="py-3 pr-4">{new Date(item.start).toLocaleString()}</td>
                      <td className="py-3 pr-4">{item.noExpiry ? '—' : (item.end ? new Date(item.end).toLocaleString() : '—')}</td>
                      <td className="py-3 pr-4">{typeof item.invitedCount === 'number' ? item.invitedCount : item.visitors.length}</td>
                      <td className="py-3 pr-4">
                        {item.preRegLink ? (
                          <button
                            title="Copiar enlace"
                            aria-label={`Copiar enlace ${item.title}`}
                            className="w-8 h-8 flex items-center justify-center bg-securiti-blue-100 text-securiti-blue-700 rounded hover:bg-securiti-blue-200"
                            onClick={() => copyLink(item.preRegLink)}
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 capitalize">{item.status}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            title="Ver"
                            aria-label={`Ver ${item.title}`}
                            className="w-8 h-8 flex items-center justify-center bg-securiti-blue-100 text-securiti-blue-700 rounded hover:bg-securiti-blue-200"
                            onClick={() => setViewId(item.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="Editar"
                            aria-label={`Editar ${item.title}`}
                            className="w-8 h-8 flex items-center justify-center bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200"
                            onClick={() => openEdit(item)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {item.status === 'activo' ? (
                            <button
                              title="Finalizar"
                              aria-label={`Finalizar ${item.title}`}
                              className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                              onClick={() => finalizeItem(item.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              title="Activar"
                              aria-label={`Activar ${item.title}`}
                              className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded hover:bg-green-200"
                              onClick={() => reactivateItem(item.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            title="Eliminar"
                            aria-label={`Eliminar ${item.title}`}
                            className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-700 rounded hover:bg-red-200"
                            onClick={() => setConfirmDeleteId(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            title="QR"
                            aria-label={`QR ${item.title}`}
                            className={`w-8 h-8 flex items-center justify-center rounded ${item.preRegLink ? 'bg-securiti-blue-100 text-securiti-blue-700 hover:bg-securiti-blue-200' : 'bg-gray-100 text-gray-300'}`}
                            disabled={!item.preRegLink}
                            onClick={() => item.preRegLink && setQrId(item.id)}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear acceso/evento */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear acceso/evento</h3>
            <form className="space-y-4" onSubmit={onSubmit}>
              {/* Razón del acceso */}
              <div>
                <label className="block text-sm font-medium mb-2">Razón del acceso</label>
                <select className="w-full p-2 border rounded" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="" disabled>Selecciona una razón</option>
                  <option value="reunion">Reunión</option>
                  <option value="empleado">Empleado</option>
                  <option value="entrega">Entrega</option>
                  <option value="evento">Evento</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              {/* Título */}
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Ej: Reunión semanal, Entrega de equipo, etc." value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              {/* Fecha y hora inicio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de inicio</label>
                  <input type="date" className="w-full p-2 border rounded" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hora de inicio</label>
                  <input type="time" className="w-full p-2 border rounded" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              {/* Fecha y hora fin + toggle sin vencimiento */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de finalización</label>
                  <input type="date" className="w-full p-2 border rounded" disabled={noExpiry} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hora de finalización</label>
                  <input type="time" className="w-full p-2 border rounded" disabled={noExpiry} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="sin-vencimiento" checked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)} />
                <label htmlFor="sin-vencimiento" className="text-sm">Sin vencimiento</label>
              </div>
              {/* Toggle crear enlace de pre-registro */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="crear-enlace" checked={createLink} onChange={(e) => setCreateLink(e.target.checked)} />
                <label htmlFor="crear-enlace" className="text-sm">Crear enlace de pre-registro</label>
              </div>
              <div className="text-xs text-gray-500 mb-2">El enlace se genera al finalizar la configuración y clicar "Enviar". Compártelo para que tus invitados registren sus datos y generen su código QR.</div>
              {/* Sección agregar visitantes */}
              <div>
                <label className="block text-sm font-medium mb-2">Agregar visitantes</label>
                <div className="space-y-2">
                  {visitors.map((v, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="email" className="w-1/2 p-2 border rounded" placeholder="Correo electrónico" value={v.email} onChange={(e) => updateVisitor(idx, { email: e.target.value })} />
                      <input type="text" className="w-1/2 p-2 border rounded" placeholder="Nombre completo" value={v.name} onChange={(e) => updateVisitor(idx, { name: e.target.value })} />
                      <button type="button" className="px-2 py-1 bg-red-100 text-red-600 rounded" onClick={() => removeVisitor(idx)} disabled={visitors.length === 1}>Eliminar</button>
                    </div>
                  ))}
                  <button type="button" className="px-3 py-1 bg-securiti-blue-100 text-securiti-blue-700 rounded" onClick={addVisitor}>Agregar otro visitante</button>
                </div>
              </div>
              {/* Opciones avanzadas */}
              <div className="border-t pt-4 mt-4">
                <button type="button" className="text-securiti-blue-700 underline mb-2" onClick={() => setShowAdvanced(s => !s)}>
                  {showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas'}
                </button>
                {showAdvanced && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Imagen del acceso (opcional)</label>
                      <input type="file" className="w-full" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Anfitrión</label>
                      <input type="text" className="w-full p-2 border rounded" placeholder="Nombre del anfitrión" value={host} onChange={(e) => setHost(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Lugar</label>
                      <input type="text" className="w-full p-2 border rounded" placeholder="Sala de juntas, piso, salón, etc." value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="pre-aprobar" checked={preApprove} onChange={(e) => setPreApprove(e.target.checked)} />
                      <label htmlFor="pre-aprobar" className="text-sm">Pre-aprobar acceso</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="enviar-accesos" checked={sendAccess} onChange={(e) => setSendAccess(e.target.checked)} />
                      <label htmlFor="enviar-accesos" className="text-sm">Enviar accesos</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Información adicional</label>
                      <textarea className="w-full p-2 border rounded" placeholder="Nota adicional del acceso" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400" onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700">{editingId ? 'Guardar' : 'Enviar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {viewId && (() => {
        const it = items.find(x => x.id === viewId);
        if (!it) return null;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Detalles del acceso</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setViewId(null)}>Cerrar</button>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Título:</span> {it.title}</div>
                <div><span className="font-medium">Motivo:</span> {it.reason}</div>
                <div><span className="font-medium">Inicio:</span> {new Date(it.start).toLocaleString()}</div>
                <div><span className="font-medium">Fin:</span> {it.noExpiry ? '—' : (it.end ? new Date(it.end).toLocaleString() : '—')}</div>
                <div><span className="font-medium">Anfitrión:</span> {it.host || '—'}</div>
                <div><span className="font-medium">Lugar:</span> {it.location || '—'}</div>
                <div><span className="font-medium">Pre-aprobado:</span> {it.preApprove ? 'Sí' : 'No'}</div>
                <div><span className="font-medium">Enviar accesos:</span> {it.sendAccess ? 'Sí' : 'No'}</div>
                <div><span className="font-medium">Notas:</span> {it.notes || '—'}</div>
                <div className="mt-4">
                  <div className="font-medium mb-1">Visitantes ({typeof it.invitedCount === 'number' ? it.invitedCount : it.visitors.length}):</div>
                  {it.invitedEmails && it.invitedEmails.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {it.invitedEmails.map((email, i) => (
                        <li key={i}>{email}</li>
                      ))}
                    </ul>
                  ) : it.visitors.length ? (
                    <ul className="list-disc pl-5">
                      {it.visitors.map((v, i) => (
                        <li key={i}>{v.name || 'Sin nombre'} — {v.email || 'Sin email'}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500">Sin visitantes.</div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="font-medium mb-1">Enlace:</div>
                  {it.preRegLink ? (
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[320px] text-securiti-blue-700">{it.preRegLink}</span>
                      <button className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => copyLink(it.preRegLink!)}>Copiar</button>
                      <button className="px-2 py-1 bg-securiti-blue-100 text-securiti-blue-700 rounded hover:bg-securiti-blue-200" onClick={() => setQrId(it.id)}>QR</button>
                    </div>
                  ) : (
                    <div className="text-gray-500">—</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal QR */}
      {qrId && (() => {
        const it = items.find(x => x.id === qrId);
        if (!it || !it.preRegLink) return null;
        const src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(it.preRegLink)}`;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Código QR</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setQrId(null)}>Cerrar</button>
              </div>
              <div className="flex flex-col items-center gap-3">
                <img src={src} alt="QR" className="w-[220px] h-[220px]" />
                <button className="px-3 py-1 bg-securiti-blue-600 text-white rounded-md hover:bg-securiti-blue-700" onClick={() => copyLink(it.preRegLink!)}>Copiar enlace</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmación eliminar */}
      {confirmDeleteId && (() => {
        const it = items.find(x => x.id === confirmDeleteId);
        if (!it) return null;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800">Eliminar acceso</h3>
              <p className="text-sm text-gray-600 mt-2">¿Seguro que deseas eliminar "{it.title}"? Esta acción no se puede deshacer.</p>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => deleteItem(it.id)}>Eliminar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-sm px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default AccessCodesPage;
