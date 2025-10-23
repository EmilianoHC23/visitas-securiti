import React, { useEffect, useRef, useState, useCallback } from 'react';
import { computePosition, offset, flip, shift, autoUpdate } from '@floating-ui/dom';
import { createPortal } from 'react-dom';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  color?: string;
}

interface Props {
  year: number;
  month: number; // 0-based (0 = January)
  events?: CalendarEvent[];
}

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (n: number) => n.toString().padStart(2, '0');

export const CalendarMonth: React.FC<Props> = ({ year, month, events = [] }) => {
  const [currentYear, setCurrentYear] = useState(year);
  const [currentMonth, setCurrentMonth] = useState(month);

  useEffect(() => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, [year, month]);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const headerButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstMonthButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverOpen) {
        if (
          popoverRef.current && !popoverRef.current.contains(target) &&
          headerButtonRef.current && !headerButtonRef.current.contains(target)
        ) {
          setPopoverOpen(false);
        }
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [popoverOpen]);

  // Position popover using Floating UI when open
  useEffect(() => {
    if (!popoverOpen) return;
    if (!headerButtonRef.current || !popoverRef.current) return;
    const reference = headerButtonRef.current;
    const floating = popoverRef.current;
    const cleanup = autoUpdate(reference, floating, async () => {
      const { x, y } = await computePosition(reference, floating, {
        middleware: [offset(8), flip(), shift({ padding: 8 })],
        placement: 'bottom-start',
      });
      Object.assign(floating.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
    return () => cleanup();
  }, [popoverOpen, currentMonth, currentYear]);

  // Close on Escape and manage focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!popoverOpen) return;
      if (e.key === 'Escape') {
        setPopoverOpen(false);
        headerButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [popoverOpen]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const firstDay = new Date(currentYear, currentMonth, 1);
  // get weekday index where Monday = 0
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number | null; iso?: string }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: `${year}-${pad(month + 1)}-${pad(d)}` });
  }
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = ev.date.slice(0, 10);
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push(ev);
  }

  // If no events provided and we're in dev mode, show example events
  // These are only for UI preview and should NOT be sent to the backend.
  if (events.length === 0 && import.meta.env.DEV) {
    const sample: CalendarEvent[] = [
      {
        id: 'sample-1',
        title: 'Reunión con ACME Corp.',
        date: `${currentYear}-${pad(currentMonth+1)}-10`,
        color: '#f97316',
      },
      {
        id: 'sample-2',
        title: 'Acceso: Visitante pre-registrado',
        date: `${currentYear}-${pad(currentMonth+1)}-15`,
        color: '#06b6d4',
      },
    ];
    for (const ev of sample) {
      const key = ev.date.slice(0,10);
      if (!eventsByDate.has(key)) eventsByDate.set(key, []);
      eventsByDate.get(key)!.push(ev);
    }
  }

  const todayIso = new Date().toISOString().slice(0,10);

  // Event detail modal state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const closeDetail = () => setSelectedEvent(null);

  const selectedDayIso = selectedEvent ? selectedEvent.date.slice(0,10) : null;

  // Refs to calendar cells and modal positioning
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalPos, setModalPos] = useState<{ left: number; top: number } | null>(null);

  // When selectedEvent changes, compute modal position relative to the cell using Floating UI
  useEffect(() => {
    if (!selectedEvent) {
      setModalPos(null);
      return;
    }
    const iso = selectedEvent.date.slice(0,10);
    const reference = cellRefs.current[iso];
    const floating = modalRef.current;
    if (!reference || !floating) {
      setModalPos(null);
      return;
    }

    let cleanup: (() => void) | undefined;
    const update = async () => {
      const { x, y } = await computePosition(reference, floating, {
        placement: 'top',
        middleware: [offset(8), flip(), shift({ padding: 8 })],
      });
      setModalPos({ left: x, top: y });
    };

    cleanup = autoUpdate(reference, floating, update);
    update();
    return () => cleanup && cleanup();
  }, [selectedEvent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEvent) {
        closeDetail();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedEvent]);

  // focus first month when opening
  useEffect(() => {
    if (popoverOpen) {
      setTimeout(() => firstMonthButtonRef.current?.focus(), 0);
    }
  }, [popoverOpen]);

  const focusMonthByIndex = useCallback((idx: number) => {
    const el = document.querySelector<HTMLButtonElement>(`[data-month-button='${idx}']`);
    el?.focus();
  }, []);

  const handleMonthKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusMonthByIndex((idx + 1) % 12);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusMonthByIndex((idx + 11) % 12);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusMonthByIndex((idx + 3) % 12);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusMonthByIndex((idx + 9) % 12);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCurrentMonth(idx);
      setPopoverOpen(false);
      headerButtonRef.current?.focus();
    }
  }, [focusMonthByIndex]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 rounded-md hover:bg-gray-100 text-gray-600" aria-label="Previous month">◀</button>
            <button ref={headerButtonRef} onClick={() => setPopoverOpen(open => !open)} className="px-3 py-1 rounded-md hover:bg-gray-100 text-left" aria-label="Open month selector">
              <h2 className="text-lg font-semibold">{new Date(currentYear, currentMonth).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            </button>
            <button onClick={nextMonth} className="p-2 rounded-md hover:bg-gray-100 text-gray-600" aria-label="Next month">▶</button>
            <button
              onClick={() => { setCurrentYear(new Date().getFullYear()); setCurrentMonth(new Date().getMonth()); }}
              className="ml-3 px-3 py-1 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white rounded shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40"
              aria-label="Ir a hoy"
            >
              Hoy
            </button>

            {popoverOpen && createPortal(
              <div ref={popoverRef} role="dialog" aria-modal="false" aria-labelledby="month-picker-label" className="absolute mt-2 bg-white border rounded shadow-lg p-4 z-50 transform transition duration-150 ease-out opacity-100 scale-100 motion-reduce:transition-none">
                <div id="month-picker-label" className="sr-only">Selector de mes y año</div>
                <div className="grid grid-cols-3 gap-2">
                  {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((mLabel, mIdx) => (
                    <button data-month-button={mIdx} ref={mIdx === 0 ? firstMonthButtonRef : undefined} key={mIdx} onKeyDown={(e) => handleMonthKeyDown(e, mIdx)} onClick={() => { setCurrentMonth(mIdx); setPopoverOpen(false); headerButtonRef.current?.focus(); }} className={`p-2 rounded ${mIdx === currentMonth ? 'bg-securiti-blue-100' : 'hover:bg-gray-100'}`}>
                      {mLabel}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setCurrentYear(y => y - 1)} className="px-2 py-1 rounded hover:bg-gray-100">«</button>
                  <input aria-label="Año" type="number" value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value) || currentYear)} className="w-24 p-1 border rounded text-sm" />
                  <button onClick={() => setCurrentYear(y => y + 1)} className="px-2 py-1 rounded hover:bg-gray-100">»</button>
                  <button
                    onClick={() => { setCurrentYear(new Date().getFullYear()); setCurrentMonth(new Date().getMonth()); setPopoverOpen(false); headerButtonRef.current?.focus(); }}
                    className="ml-3 px-3 py-1 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white rounded shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40"
                  >
                    Ir a hoy
                  </button>
                </div>
              </div>, document.body)
            }
          </div>
          <div className="text-sm text-gray-500">Month view</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 mb-2">
            {weekdayNames.map(w => (
              <div key={w} className="py-2">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((c, idx) => {
              const dayEvents = c.iso ? eventsByDate.get(c.iso) || [] : [];
              const isEmpty = c.day === null;
              const isToday = c.iso === todayIso;
              const isSelectedDay = c.iso === selectedDayIso;
              return (
                <div ref={el => { if (c.iso) cellRefs.current[c.iso] = el; }} key={idx} className={`min-h-[96px] border rounded-lg p-2 ${isEmpty ? 'bg-gray-50' : 'bg-white'} ${isSelectedDay ? 'ring-4 ring-blue-500 bg-blue-50 animate-pulse' : ''} ${isToday ? 'ring-2 ring-blue-400' : ''}`}>
                  {c.day && (
                    <div className="flex items-start justify-between">
                      <div className={`text-sm font-medium ${isToday ? 'text-securiti-blue-700' : 'text-gray-700'}`}>{c.day}</div>
                      <div className="text-xs text-gray-400">{dayEvents.length}</div>
                    </div>
                  )}

                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button key={ev.id} onClick={() => setSelectedEvent(ev)} className="flex items-center gap-2 text-xs w-full text-left">
                        <span style={{ background: ev.color || '#60a5fa' }} className="w-2 h-2 rounded-full inline-block" />
                        <span className="truncate">{ev.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400">+{dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedEvent && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={closeDetail} />
          <div ref={modalRef} style={modalPos ? { position: 'absolute', left: modalPos.left, top: modalPos.top } : { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} role="dialog" aria-modal="true" aria-labelledby="event-detail-title" className="z-50 w-full max-w-md mx-4 shadow-lg">
            <div className="bg-white rounded-lg p-6">
              <h3 id="event-detail-title" className="text-lg font-semibold">{selectedEvent.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{selectedEvent.date}</p>
              <div className="mt-4 flex items-center gap-2">
                <span style={{ background: selectedEvent.color || '#60a5fa' }} className="w-3 h-3 rounded-full inline-block" />
                <span className="text-sm text-gray-700">ID: {selectedEvent.id}</span>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={closeDetail} className="px-3 py-1 bg-gray-200 rounded">Cerrar</button>
              </div>
            </div>
          </div>
        </>, document.body)
      }
    </>
  );
};

export default CalendarMonth;
