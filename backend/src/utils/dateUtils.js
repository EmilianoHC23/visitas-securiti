/**
 * Utilidades para manejo de fechas con zona horaria de México
 * Todas las fechas se formatean en America/Mexico_City
 */

const TIMEZONE = 'America/Mexico_City';

/**
 * Formatea una fecha a string legible en español de México
 * @param {Date|string} date - Fecha a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
function formatDate(date, options = {}) {
  const d = new Date(date);
  const defaultOptions = {
    timeZone: TIMEZONE,
    ...options
  };
  return d.toLocaleString('es-MX', defaultOptions);
}

/**
 * Formatea una fecha con día, mes, año y hora
 * Ej: "lunes, 16 de octubre de 2025, 10:30"
 */
function formatFullDate(date) {
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
function formatShortDate(date) {
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
function formatTime(date) {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea fecha y hora en formato corto
 * Ej: "16/10/2025 10:30"
 */
function formatDateTime(date) {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtiene la fecha actual en zona horaria de México
 */
function getCurrentDate() {
  return new Date();
}

/**
 * Convierte una fecha a inicio del día (00:00:00) en zona horaria de México
 */
function getStartOfDay(date) {
  const d = new Date(date);
  // Obtener componentes en zona horaria de México
  const options = { timeZone: TIMEZONE };
  const mexicoDate = new Date(d.toLocaleString('en-US', options));
  mexicoDate.setHours(0, 0, 0, 0);
  return mexicoDate;
}

/**
 * Convierte una fecha a fin del día (23:59:59) en zona horaria de México
 */
function getEndOfDay(date) {
  const d = new Date(date);
  const options = { timeZone: TIMEZONE };
  const mexicoDate = new Date(d.toLocaleString('en-US', options));
  mexicoDate.setHours(23, 59, 59, 999);
  return mexicoDate;
}

module.exports = {
  TIMEZONE,
  formatDate,
  formatFullDate,
  formatShortDate,
  formatTime,
  formatDateTime,
  getCurrentDate,
  getStartOfDay,
  getEndOfDay
};
