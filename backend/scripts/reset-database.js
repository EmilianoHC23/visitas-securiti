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
 * - Mantiene o crea un único usuario administrador
 * - Preserva la configuración de la empresa (Company)
 * 
 * Uso: node backend/scripts/reset-database.js [email-admin]
 * Ejemplo: node backend/scripts/reset-database.js admin@securiti.com
 */

const resetDatabase = async () => {
  try {
    // Obtener email del admin desde argumentos o usar default
    const adminEmail = process.argv[2] || 'admin@securiti.com';
    const adminPassword = 'Admin2025!'; // Contraseña por defecto

    console.log('\n🔄 INICIANDO RESET DE BASE DE DATOS...\n');

    // Conectar a MongoDB
    const mongoURI = process.env.DATABASE_URL || 
      'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // ========================================
    // PASO 1: Verificar/Guardar usuario admin
    // ========================================
    console.log('📋 PASO 1: Verificar usuario administrador...');
    
    let adminUser = await User.findOne({ email: adminEmail });
    let adminId = null;

    if (adminUser) {
      console.log(`✅ Usuario admin encontrado: ${adminEmail}`);
      adminId = adminUser._id;
    } else {
      console.log(`⚠️  Usuario admin no encontrado. Creando nuevo admin: ${adminEmail}`);
      adminUser = new User({
        email: adminEmail,
        password: adminPassword, // Se hasheará automáticamente por el pre-save hook
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'admin',
        status: 'registered',
        companyId: 'comp-1'
      });
      await adminUser.save();
      adminId = adminUser._id;
      console.log(`✅ Usuario admin creado exitosamente`);
    }

    console.log(`   → ID del admin: ${adminId}\n`);

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
    // PASO 3: Eliminar todos los usuarios EXCEPTO el admin
    // ========================================
    console.log('\n👥 PASO 3: Limpiando usuarios...');
    
    const usersDeleted = await User.deleteMany({ 
      _id: { $ne: adminId } // $ne = "not equal" - borra todos excepto el admin
    });
    console.log(`   ✓ Usuarios eliminados: ${usersDeleted.deletedCount}`);
    console.log(`   ✓ Usuario admin preservado: ${adminEmail}\n`);

    // ========================================
    // PASO 4: Verificar configuración de empresa
    // ========================================
    console.log('🏢 PASO 4: Verificando configuración de empresa...');
    
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
    console.log(`   • Usuarios: ${usersDeleted.deletedCount}`);
    
    console.log('\n👤 Usuario administrador:');
    console.log(`   • Email: ${adminEmail}`);
    console.log(`   • Contraseña: ${adminPassword}`);
    console.log(`   • ID: ${adminId}`);
    
    console.log('\n💡 Ahora puedes iniciar sesión con las credenciales del admin.');
    console.log('   La base de datos está lista para recibir nuevos registros.\n');

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
