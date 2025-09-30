const mongoose = require('mongoose');
const User = require('./models/User');
const Visit = require('./models/Visit');
const Company = require('./models/Company');
const Blacklist = require('./models/Blacklist');
require('dotenv').config();

const initializeProductionData = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Clear existing data only in development
    if (process.env.NODE_ENV !== 'production') {
      await User.deleteMany({});
      await Visit.deleteMany({});
      await Company.deleteMany({});
      await Blacklist.deleteMany({});
      console.log('🗑️ Cleared existing data');
    }

    // Create company configuration
    const company = new Company({
      _id: 'comp-1',
      name: 'SecuriTI Solutions',
      logo: null,
      settings: {
        autoApproval: false,
        requirePhoto: true,
        enableSelfRegister: true,
        notificationEmail: 'admin@securiti.com'
      },
      qrCode: 'QR_SECURITI_2025'
    });

    try {
      await company.save();
      console.log('🏢 Created company configuration');
    } catch (error) {
      if (error.code !== 11000) { // Ignore duplicate key error
        throw error;
      }
      console.log('🏢 Company already exists');
    }

    // Create realistic users
    const defaultUsers = [
      {
        email: 'admin@securiti.com',
        password: 'password',
        firstName: 'Carlos',
        lastName: 'Administrador',
        role: 'admin',
        companyId: 'comp-1'
      },
      {
        email: 'reception@securiti.com',
        password: 'password',
        firstName: 'María',
        lastName: 'Recepcionista',
        role: 'reception',
        companyId: 'comp-1'
      },
      {
        email: 'juan.perez@securiti.com',
        password: 'password',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'ana.garcia@securiti.com',
        password: 'password',
        firstName: 'Ana',
        lastName: 'García',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'carlos.rodriguez@securiti.com',
        password: 'password',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'sofia.lopez@securiti.com',
        password: 'password',
        firstName: 'Sofía',
        lastName: 'López',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'diego.martinez@securiti.com',
        password: 'password',
        firstName: 'Diego',
        lastName: 'Martínez',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'laura.fernandez@securiti.com',
        password: 'password',
        firstName: 'Laura',
        lastName: 'Fernández',
        role: 'host',
        companyId: 'comp-1'
      }
    ];

    // Create users one by one to trigger pre('save') middleware
    const createdUsers = [];
    for (const userData of defaultUsers) {
      try {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = new User(userData);
          await user.save(); // This will trigger the password hashing
          createdUsers.push(user);
          console.log(`✅ Created user: ${user.email}`);
        } else {
          createdUsers.push(existingUser);
          console.log(`👤 User already exists: ${existingUser.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
    
    console.log('👥 Created/verified users with hashed passwords');

    // Create realistic sample visits
    const hosts = createdUsers.filter(user => user.role === 'host');
    const sampleVisits = [
      {
        visitorName: 'Roberto Silva',
        visitorCompany: 'TechCorp Solutions',
        reason: 'Reunión estratégica de negocios',
        host: hosts[0]._id,
        status: 'approved',
        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // En 2 horas
        companyId: 'comp-1',
        visitorEmail: 'roberto.silva@techcorp.com',
        visitorPhone: '+521234567890',
        visitType: 'scheduled'
      },
      {
        visitorName: 'Isabel Méndez',
        visitorCompany: 'Innovación Digital SA',
        reason: 'Presentación de proyecto IoT',
        host: hosts[1]._id,
        status: 'pending',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
        companyId: 'comp-1',
        visitorEmail: 'isabel.mendez@innovacion.com',
        visitorPhone: '+521234567891',
        visitType: 'scheduled'
      },
      {
        visitorName: 'Fernando Gutiérrez',
        visitorCompany: 'Consultoría TI Avanzada',
        reason: 'Auditoría de seguridad informática',
        host: hosts[2]._id,
        status: 'checked-in',
        scheduledDate: new Date(Date.now() - 30 * 60 * 1000), // Hace 30 minutos
        checkInTime: new Date(Date.now() - 15 * 60 * 1000), // Hace 15 minutos
        companyId: 'comp-1',
        visitorEmail: 'fernando.gutierrez@consultoria.com',
        visitorPhone: '+521234567892',
        visitType: 'scheduled'
      },
      {
        visitorName: 'Patricia Vega',
        visitorCompany: 'Sistemas Empresariales México',
        reason: 'Capacitación en ciberseguridad',
        host: hosts[3]._id,
        status: 'completed',
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
        checkInTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
        checkOutTime: new Date(Date.now() - 22 * 60 * 60 * 1000), // Hace 22 horas
        companyId: 'comp-1',
        visitorEmail: 'patricia.vega@sistemasem.com',
        visitorPhone: '+521234567893',
        visitType: 'scheduled'
      },
      {
        visitorName: 'Alejandro Morales',
        visitorCompany: 'DataSecurity Pro',
        reason: 'Revisión de infraestructura de red',
        host: hosts[4]._id,
        status: 'approved',
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
        companyId: 'comp-1',
        visitorEmail: 'alejandro.morales@datasecurity.com',
        visitorPhone: '+521234567894',
        visitType: 'scheduled'
      },
      {
        visitorName: 'Carmen Herrera',
        visitorCompany: 'CloudTech Solutions',
        reason: 'Implementación de soluciones en la nube',
        host: hosts[5]._id,
        status: 'pending',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // En 5 días
        companyId: 'comp-1',
        visitorEmail: 'carmen.herrera@cloudtech.com',
        visitorPhone: '+521234567895',
        visitType: 'scheduled'
      },
      {
        visitorName: 'Eduardo Ramírez',
        visitorCompany: 'AI & Machine Learning Corp',
        reason: 'Demostración de inteligencia artificial',
        host: hosts[0]._id,
        status: 'completed',
        scheduledDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // Hace 2 días
        checkInTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        checkOutTime: new Date(Date.now() - 46 * 60 * 60 * 1000),
        companyId: 'comp-1',
        visitorEmail: 'eduardo.ramirez@aiml.com',
        visitorPhone: '+521234567896',
        visitType: 'scheduled'
      },
      {
        visitorName: 'Valeria Castro',
        visitorCompany: 'Blockchain Innovations',
        reason: 'Exploración de tecnologías blockchain',
        host: hosts[1]._id,
        status: 'approved',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En una semana
        companyId: 'comp-1',
        visitorEmail: 'valeria.castro@blockchain.com',
        visitorPhone: '+521234567897',
        visitType: 'scheduled'
      }
    ];

    // Only create visits if they don't exist
    for (const visitData of sampleVisits) {
      const existingVisit = await Visit.findOne({ 
        visitorEmail: visitData.visitorEmail,
        companyId: visitData.companyId
      });
      
      if (!existingVisit) {
        await Visit.create(visitData);
        console.log(`📋 Created visit for: ${visitData.visitorName}`);
      } else {
        console.log(`📋 Visit already exists for: ${visitData.visitorName}`);
      }
    }

    // Create sample blacklist entries
    const sampleBlacklistEntries = [
      {
        email: 'usuario.bloqueado@empresa.com',
        name: 'Usuario Bloqueado',
        reason: 'Comportamiento inapropiado en visita anterior',
        addedBy: createdUsers[0]._id, // Admin user
        companyId: 'comp-1'
      },
      {
        email: 'visitante.problematico@corp.com',
        name: 'Visitante Problemático',
        reason: 'No cumplió con protocolos de seguridad',
        addedBy: createdUsers[1]._id, // Reception user
        companyId: 'comp-1'
      }
    ];

    for (const blacklistData of sampleBlacklistEntries) {
      const existingEntry = await Blacklist.findOne({ 
        email: blacklistData.email,
        companyId: blacklistData.companyId 
      });
      
      if (!existingEntry) {
        await Blacklist.create(blacklistData);
        console.log(`🚫 Created blacklist entry for: ${blacklistData.email}`);
      } else {
        console.log(`🚫 Blacklist entry already exists for: ${blacklistData.email}`);
      }
    }

    console.log('\n✅ Production database initialized successfully!');
    console.log('\n📊 Sistema configurado con datos realistas');
    console.log('\n🔑 Credenciales de acceso:');
    console.log('👑 Admin: admin@securiti.com / password');
    console.log('📥 Recepción: reception@securiti.com / password');
    console.log('🏢 Hosts disponibles:');
    createdUsers.filter(u => u.role === 'host').forEach(host => {
      console.log(`   - ${host.firstName} ${host.lastName}: ${host.email} / password`);
    });

    console.log('\n📈 Estadísticas del sistema:');
    const totalUsers = await User.countDocuments({ companyId: 'comp-1' });
    const totalVisits = await Visit.countDocuments({ companyId: 'comp-1' });
    const totalBlacklist = await Blacklist.countDocuments({ companyId: 'comp-1', isActive: true });
    
    console.log(`   - Usuarios totales: ${totalUsers}`);
    console.log(`   - Visitas registradas: ${totalVisits}`);
    console.log(`   - Entradas en lista negra: ${totalBlacklist}`);

    console.log('\n🚀 El sistema está listo para usar en producción!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

// Solo ejecutar si el archivo se ejecuta directamente
if (require.main === module) {
  initializeProductionData();
}

module.exports = initializeProductionData;