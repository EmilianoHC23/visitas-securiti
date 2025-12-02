const mongoose = require('mongoose');
const User = require('../src/models/User');
const Visit = require('../src/models/Visit');
const Access = require('../src/models/Access');
const Blacklist = require('../src/models/Blacklist');
const Invitation = require('../src/models/Invitation');
const VisitEvent = require('../src/models/VisitEvent');
const Approval = require('../src/models/Approval');
const Company = require('../src/models/Company');
require('dotenv').config();

/**
 * Script para resetear la base de datos a un estado inicial
 * - Elimina TODOS los registros (visitas, accesos, lista negra, invitaciones, eventos, aprobaciones)
 * - MANTIENE TODOS LOS USUARIOS (no se eliminan usuarios)
 * - Preserva la configuración de la empresa (Company)
 * 
 * Uso: node backend/scripts/reset-database.js
 */

const resetDatabase = async () => {
  try {
    console.log('\n🔄 INICIANDO RESET DE BASE DE DATOS...\n');

    // Conectar a MongoDB
    const mongoURI = process.env.DATABASE_URL || 
      'mongodb+srv://visitantes_db_user:terCgnmhxQNFSlGl@visitas-securiti.gjgocbm.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // ========================================
    // PASO 1: Verificar usuarios existentes
    // ========================================
    console.log('📋 PASO 1: Verificando usuarios existentes...');
    
    const userCount = await User.countDocuments();
    console.log(`✅ Total de usuarios en la base de datos: ${userCount}`);
    console.log('   → Los usuarios NO serán eliminados\n');

    // ========================================
    // PASO 2: Eliminar TODOS los registros operativos
    // ========================================
    console.log('🗑️  PASO 2: Eliminando todos los registros...\n');

    // Eliminar eventos de visitas
    const visitEventsDeleted = await VisitEvent.deleteMany({});
    console.log(`   ✓ Eventos eliminados: ${visitEventsDeleted.deletedCount}`);

    // Eliminar visitas
    const visitsDeleted = await Visit.deleteMany({});
    console.log(`   ✓ Visitas eliminadas: ${visitsDeleted.deletedCount}`);

    // Eliminar accesos/eventos
    const accessesDeleted = await Access.deleteMany({});
    console.log(`   ✓ Accesos eliminados: ${accessesDeleted.deletedCount}`);

    // Eliminar lista negra
    const blacklistDeleted = await Blacklist.deleteMany({});
    console.log(`   ✓ Lista negra eliminada: ${blacklistDeleted.deletedCount}`);

    // Eliminar aprobaciones
    const approvalsDeleted = await Approval.deleteMany({});
    console.log(`   ✓ Aprobaciones eliminadas: ${approvalsDeleted.deletedCount}`);

    // Eliminar invitaciones
    const invitationsDeleted = await Invitation.deleteMany({});
    console.log(`   ✓ Invitaciones eliminadas: ${invitationsDeleted.deletedCount}`);

    // ========================================
    // PASO 3: Verificar configuración de empresa
    // ========================================
    console.log('\n🏢 PASO 3: Verificando configuración de empresa...');
    
    const company = await Company.findOne({});
    if (company) {
      console.log(`   ✓ Empresa configurada: ${company.name || 'SecuriTI'}`);
    } else {
      console.log('   ⚠️  No hay empresa configurada. Puedes configurarla en Settings.');
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ RESET COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📊 Resumen de eliminaciones:');
    console.log(`   • Visitas: ${visitsDeleted.deletedCount}`);
    console.log(`   • Eventos de visitas: ${visitEventsDeleted.deletedCount}`);
    console.log(`   • Accesos: ${accessesDeleted.deletedCount}`);
    console.log(`   • Lista negra: ${blacklistDeleted.deletedCount}`);
    console.log(`   • Aprobaciones: ${approvalsDeleted.deletedCount}`);
    console.log(`   • Invitaciones: ${invitationsDeleted.deletedCount}`);
    
    console.log('\n👥 Usuarios preservados:');
    console.log(`   • Total de usuarios mantenidos: ${userCount}`);
    
    console.log('\n💡 La base de datos está lista para recibir nuevos registros.');
    console.log('   Todos los usuarios se mantuvieron sin cambios.\n');

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada.\n');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR durante el reset:', error);
    console.error('\nDetalles del error:', error.message);
    
    // Cerrar conexión en caso de error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
};

// Ejecutar el script
resetDatabase();
