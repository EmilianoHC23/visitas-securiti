/**
 * Vercel Cron Job: Finalizar accesos vencidos
 * Se ejecuta cada hora para revisar y finalizar accesos que pasaron su endDate
 */

const mongoose = require('mongoose');

// Handler para Vercel Cron
module.exports = async (req, res) => {
  // Verificar que sea una request de Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Conectar a MongoDB si no está conectado
    if (mongoose.connection.readyState !== 1) {
      const mongoURI = process.env.DATABASE_URL;
      await mongoose.connect(mongoURI);
      console.log('✅ MongoDB connected for cron job');
    }

    // Importar modelo Access
    const Access = require('../../backend/src/models/Access');
    
    console.log('🔄 [CRON] Ejecutando verificación de accesos vencidos...');
    
    const now = new Date();
    
    // Buscar todos los accesos activos que ya pasaron su endDate
    const expiredAccesses = await Access.find({
      status: 'active',
      endDate: { $lt: now }
    });

    if (expiredAccesses.length === 0) {
      console.log('✅ [CRON] No hay accesos vencidos para finalizar');
      return res.status(200).json({ 
        message: 'No expired accesses found',
        finalizedCount: 0,
        timestamp: now.toISOString()
      });
    }

    console.log(`📋 [CRON] Encontrados ${expiredAccesses.length} accesos vencidos`);
    
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

    console.log(`✅ [CRON] Finalizados ${finalizedCount} accesos, ${noShowCount} invitados marcados como no-asistio`);

    return res.status(200).json({
      message: 'Access finalization completed',
      finalizedCount,
      noShowCount,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('❌ [CRON] Error finalizando accesos:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
