const mongoose = require('mongoose');

const testCommonPasswords = async () => {
  const commonPasswords = [
    'admin123',
    'password',
    'admin',
    '123456',
    'Admin123',
    'admin2025',
    'visitassecuriti',
    'securiti2025'
  ];

  console.log('🔍 Probando contraseñas comunes para el usuario admin...\n');

  for (const password of commonPasswords) {
    const uri = `mongodb+srv://admin:${password}@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority`;
    
    console.log(`🔑 Probando password: "${password}"`);
    
    try {
      await mongoose.connect(uri);
      console.log('✅ ¡ÉXITO! La contraseña correcta es:', password);
      console.log('📊 Database:', mongoose.connection.db.databaseName);
      await mongoose.disconnect();
      
      console.log('\n🎯 URL completa que funciona:');
      console.log(uri);
      
      return password;
    } catch (error) {
      console.log('❌ No funciona');
      try {
        await mongoose.disconnect();
      } catch (e) {}
    }
  }
  
  console.log('\n❌ Ninguna contraseña común funcionó');
  console.log('💡 Necesitas resetear la contraseña del usuario admin en MongoDB Atlas');
};

testCommonPasswords()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });