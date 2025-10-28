// Schedulers removidos. Mantener API estable con stubs no operativos.
function startScheduler() { console.log('ℹ️ accessScheduler deshabilitado.'); }
function stopScheduler() { console.log('ℹ️ accessScheduler deshabilitado.'); }

module.exports = {
  startScheduler,
  stopScheduler
};
