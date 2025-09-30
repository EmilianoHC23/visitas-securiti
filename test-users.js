// Test simple para CRUD de usuarios
const http = require('http');

const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

const testUserCRUD = async () => {
  console.log('🧪 Probando CRUD de usuarios...\n');
  
  try {
    // 1. Health check
    console.log('1. ⚡ Probando health check...');
    const healthOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    };
    
    const healthResult = await makeRequest(healthOptions);
    if (healthResult.status === 200) {
      console.log('   ✅ Health check OK:', healthResult.data?.status);
    } else {
      console.log('   ❌ Health check failed:', healthResult.status);
      return;
    }
    
    // 2. Login como admin
    console.log('\n2. 🔐 Login como admin...');
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      email: 'admin@securiti.com',
      password: 'password'
    };
    
    const loginResult = await makeRequest(loginOptions, loginData);
    if (loginResult.status !== 200) {
      console.log('   ❌ Login failed:', loginResult.status, loginResult.data);
      return;
    }
    
    const token = loginResult.data.token;
    console.log('   ✅ Login exitoso, token obtenido');
    
    // 3. Obtener lista de usuarios
    console.log('\n3. 👥 Obteniendo lista de usuarios...');
    const getUsersOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const usersResult = await makeRequest(getUsersOptions);
    if (usersResult.status === 200) {
      console.log(`   ✅ ${usersResult.data.length} usuarios encontrados`);
      console.log('   👤 Usuarios:', usersResult.data.map(u => `${u.firstName} ${u.lastName} (${u.role})`));
    } else {
      console.log('   ❌ Error obteniendo usuarios:', usersResult.status, usersResult.data);
      return;
    }
    
    // 4. Crear nuevo usuario
    console.log('\n4. ➕ Creando nuevo usuario...');
    const createUserOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const newUserData = {
      email: 'test.user@securiti.com',
      password: 'password123',
      firstName: 'Usuario',
      lastName: 'Prueba',
      role: 'host'
    };
    
    const createResult = await makeRequest(createUserOptions, newUserData);
    if (createResult.status === 201) {
      console.log('   ✅ Usuario creado exitosamente:', createResult.data.firstName, createResult.data.lastName);
      
      // 5. Actualizar usuario
      console.log('\n5. ✏️ Actualizando usuario...');
      const updateUserOptions = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/users/${createResult.data._id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const updateData = {
        firstName: 'Usuario Actualizado',
        lastName: 'Prueba Modificado'
      };
      
      const updateResult = await makeRequest(updateUserOptions, updateData);
      if (updateResult.status === 200) {
        console.log('   ✅ Usuario actualizado:', updateResult.data.firstName, updateResult.data.lastName);
        
        // 6. Desactivar usuario
        console.log('\n6. 🗑️ Desactivando usuario...');
        const deleteUserOptions = {
          hostname: 'localhost',
          port: 3001,
          path: `/api/users/${createResult.data._id}`,
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        const deleteResult = await makeRequest(deleteUserOptions);
        if (deleteResult.status === 200) {
          console.log('   ✅ Usuario desactivado exitosamente');
        } else {
          console.log('   ❌ Error desactivando usuario:', deleteResult.status, deleteResult.data);
        }
        
      } else {
        console.log('   ❌ Error actualizando usuario:', updateResult.status, updateResult.data);
      }
      
    } else {
      console.log('   ❌ Error creando usuario:', createResult.status, createResult.data);
    }
    
    console.log('\n🎉 ¡Tests de CRUD de usuarios completados!');
    
  } catch (error) {
    console.error('\n❌ Error en tests:', error.message);
    console.log('\n🔍 Posibles causas:');
    console.log('   - El servidor no está corriendo en puerto 3001');
    console.log('   - MongoDB no está conectado');
    console.log('   - Problemas de autenticación');
  }
};

testUserCRUD();