/**
 * Cron removido: la finalización ahora es perezosa en las rutas de Access.
 * Este endpoint queda deshabilitado intencionalmente.
 */
module.exports = async (req, res) => {
  return res.status(410).json({
    disabled: true,
    message: 'Cron eliminado: la finalización se realiza automáticamente al consultar accesos.'
  });
};
