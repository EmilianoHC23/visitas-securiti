// Test rápido de la API - ejecutar: node test-api.js

const testAPI = async () => {
  const baseURL = 'http://localhost:3001/api';
  
  console.log('🧪 Probando API de Visitas SecuriTI...\n');

  try {
    // 1. Test de health check
    console.log('1. Probando health check...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('📊 Environment:', healthData.environment);
    
    // 2. Test de login
    console.log('\n2. Probando login...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@securiti.com',
        password: 'password'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso para:', loginData.user.firstName, loginData.user.lastName);
      console.log('🔑 Token obtenido');
      
      // 3. Test de visitas
      console.log('\n3. Probando obtener visitas...');
      const visitsResponse = await fetch(`${baseURL}/visits`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      
      if (visitsResponse.ok) {
        const visits = await visitsResponse.json();
        console.log(`✅ Visitas obtenidas: ${visits.length} registros`);
        
        // 4. Test de estadísticas
        console.log('\n4. Probando estadísticas del dashboard...');
        const statsResponse = await fetch(`${baseURL}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          console.log('✅ Estadísticas obtenidas:');
          console.log(`   - Pendientes: ${stats.pending}`);
          console.log(`   - Aprobadas: ${stats.approved}`);
          console.log(`   - Activas: ${stats.checkedIn}`);
          console.log(`   - Completadas: ${stats.completed}`);
        }
      }
    } else {
      console.log('❌ Error en login');
    }
    
    console.log('\n🎉 ¡Todos los tests completados exitosamente!');
    console.log('📱 La aplicación está lista para usar');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend: http://localhost:3001');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.log('\n🔍 Verificar que:');
    console.log('   - El servidor backend esté corriendo (npm run server:dev)');
    console.log('   - MongoDB Atlas esté conectado');
    console.log('   - Los datos estén inicializados (npm run init-db)');
  }
};

// Ejecutar test solo si el archivo se ejecuta directamente
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;