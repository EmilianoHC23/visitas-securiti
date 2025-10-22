// Script para eliminar el índice qrCode_1 obsoleto de la colección accesses
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function removeQrCodeIndex() {
  try {
    // Conectar a MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI no está definida en las variables de entorno');
      process.exit(1);
    }

    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('accesses');

    // Obtener todos los índices
    console.log('\n📋 Índices actuales:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Verificar si existe el índice qrCode_1
    const qrCodeIndex = indexes.find(idx => idx.name === 'qrCode_1');
    
    if (qrCodeIndex) {
      console.log('\n🗑️  Eliminando índice qrCode_1...');
      await collection.dropIndex('qrCode_1');
      console.log('✅ Índice qrCode_1 eliminado exitosamente');
    } else {
      console.log('\n⚠️  El índice qrCode_1 no existe');
    }

    // Mostrar índices después de la eliminación
    console.log('\n📋 Índices después de la eliminación:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    await mongoose.connection.close();
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeQrCodeIndex();
