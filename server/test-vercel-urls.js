const mongoose = require('mongoose');

const testVercelCompatibleURLs = async () => {
  const testConfigs = [
    {
      name: "URL actual con admin:admin123",
      uri: "mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti"
    },
    {
      name: "URL con password URL encoded",
      uri: "mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority"
    },
    {
      name: "URL sin appName",
      uri: "mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority"
    },
    {
      name: "URL simple",
      uri: "mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti"
    }
  ];

  console.log('🔍 Probando URLs compatibles con Vercel...\n');

  for (const config of testConfigs) {
    console.log(`📝 ${config.name}:`);
    console.log(`🔗 ${config.uri}`);
    
    try {
      await mongoose.connect(config.uri);
      console.log('✅ Conexión exitosa!');
      console.log('📊 Database:', mongoose.connection.db.databaseName);
      await mongoose.disconnect();
      console.log('✅ Esta URL funciona correctamente\n');
    } catch (error) {
      console.log('❌ Error:', error.message);
      console.log('❌ Esta URL NO funciona\n');
      try {
        await mongoose.disconnect();
      } catch (e) {}
    }
  }
};

testVercelCompatibleURLs()
  .then(() => {
    console.log('✅ Pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error general:', error);
    process.exit(1);
  });