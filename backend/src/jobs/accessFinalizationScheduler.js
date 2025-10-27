const cron = require('node-cron');
const Access = require('../models/Access');

/**
 * Scheduler para finalizar automáticamente accesos vencidos
 * Se ejecuta cada hora para revisar accesos que han pasado su endDate
 */

// Ejecutar cada hora: '0 * * * *' (minuto 0 de cada hora)
const scheduleAccessFinalization = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔄 [ACCESS SCHEDULER] Ejecutando verificación de accesos vencidos...');
      
      const now = new Date();
      
      // Buscar todos los accesos activos que ya pasaron su endDate
      const expiredAccesses = await Access.find({
        status: 'active',
        endDate: { $lt: now }
      });

      if (expiredAccesses.length === 0) {
        console.log('✅ [ACCESS SCHEDULER] No hay accesos vencidos para finalizar');
        return;
      }

      console.log(`📋 [ACCESS SCHEDULER] Encontrados ${expiredAccesses.length} accesos vencidos`);
      
      let finalizedCount = 0;
      let noShowCount = 0;

      for (const access of expiredAccesses) {
        // Actualizar status del acceso a 'finalized'
        access.status = 'finalized';
        
        // Marcar todos los invitados pendientes como 'no-asistio'
        access.invitedUsers.forEach(user => {
          if (user.attendanceStatus === 'pendiente') {
            user.attendanceStatus = 'no-asistio';
            noShowCount++;
          }
        });

        await access.save();
        finalizedCount++;
        
        console.log(`  ✓ Finalizado: "${access.eventName}" (${access.accessCode})`);
      }

      console.log(`✅ [ACCESS SCHEDULER] Finalizados ${finalizedCount} accesos, ${noShowCount} invitados marcados como 'no-asistio'`);
      
    } catch (error) {
      console.error('❌ [ACCESS SCHEDULER] Error finalizando accesos:', error);
    }
  });

  console.log('✅ [ACCESS SCHEDULER] Scheduler de finalización iniciado (cada hora)');
};

module.exports = { scheduleAccessFinalization };
