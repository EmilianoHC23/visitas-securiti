const mongoose = require('mongoose');
require('dotenv').config();

const testDatabaseConnection = async () => {
  const testConfigs = [
    {
      name: "Configuración del .env",
      uri: process.env.DATABASE_URL
    },
    {
      name: "URL con credenciales básicas",
      uri: "mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti"
    },
    {
      name: "URL sin especificar base de datos",
      uri: "mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/?retryWrites=true&w=majority&appName=visitas-securiti"
    },
    {
      name: "URL con diferentes credenciales (emilianohercha23)",
      uri: "mongodb+srv://emilianohercha23:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti"
    }
  ];

  for (const config of testConfigs) {
    console.log(`\n🔍 Probando: ${config.name}`);
    console.log(`📝 URI: ${config.uri?.substring(0, 50)}...`);
    
    try {
      if (!config.uri) {
        console.log('❌ URI no definida');
        continue;
      }

      await mongoose.connect(config.uri);
      console.log('✅ Conexión exitosa!');
      console.log('📊 Database:', mongoose.connection.db.databaseName);
      
      // Desconectar para la siguiente prueba
      await mongoose.disconnect();
      console.log('📡 Desconectado');
      break; // Si una conexión funciona, salir del loop
      
    } catch (error) {
      console.log('❌ Error de conexión:', error.message);
      try {
        await mongoose.disconnect();
      } catch (e) {
        // Ignorar errores de desconexión
      }
    }
  }
};

console.log('🔍 Iniciando pruebas de conexión a base de datos...');
testDatabaseConnection()
  .then(() => {
    console.log('\n✅ Pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error general:', error);
    process.exit(1);
  });