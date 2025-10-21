/**
 * Utilidades para manejo de fechas con zona horaria de México
 * Todas las fechas se formatean en America/Mexico_City
 */

const TIMEZONE = 'America/Mexico_City';

/**
 * Formatea una fecha a string legible en español de México
 * @param date - Fecha a formatear
 * @param options - Opciones de formato
 * @returns Fecha formateada
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const d = new Date(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    ...options
  };
  return d.toLocaleString('es-MX', defaultOptions);
}

/**
 * Formatea una fecha con día, mes, año y hora
 * Ej: "lunes, 16 de octubre de 2025, 10:30"
 */
export function formatFullDate(date: Date | string): string {
  return formatDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea solo la fecha sin hora
 * Ej: "16/10/2025"
 */
export function formatShortDate(date: Date | string): string {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea solo la hora
 * Ej: "10:30"
 */
export function formatTime(date: Date | string): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea fecha y hora en formato corto
 * Ej: "16/10/2025 10:30"
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea fecha para el selector de fecha en español
 * Ej: "miércoles, 16 de octubre de 2025"
 */
export function formatLongDate(date: Date | string): string {
  return formatDate(date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Obtiene la fecha actual en zona horaria de México
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Convierte una fecha a inicio del día (00:00:00) en zona horaria de México
 */
export function getStartOfDay(date: Date | string): Date {
  const d = new Date(date);
  // Obtener componentes en zona horaria de México
  const options: Intl.DateTimeFormatOptions = { timeZone: TIMEZONE };
  const mexicoDate = new Date(d.toLocaleString('en-US', options));
  mexicoDate.setHours(0, 0, 0, 0);
  return mexicoDate;
}

/**
 * Convierte una fecha a fin del día (23:59:59) en zona horaria de México
 */
export function getEndOfDay(date: Date | string): Date {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = { timeZone: TIMEZONE };
  const mexicoDate = new Date(d.toLocaleString('en-US', options));
  mexicoDate.setHours(23, 59, 59, 999);
  return mexicoDate;
}

export { TIMEZONE };
