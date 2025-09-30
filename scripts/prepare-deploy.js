#!/usr/bin/env node

/**
 * Script para preparar el proyecto para deployment en Vercel
 * Ejecutar: node scripts/prepare-deploy.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparando proyecto para deployment...');

// 1. Verificar que existan los archivos necesarios
const requiredFiles = [
  'vercel.json',
  'package.json',
  'api/index.js',
  'server/index.js'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Faltan archivos requeridos:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

// 2. Verificar variables de entorno
const envFile = '.env.local';
if (!fs.existsSync(envFile)) {
  console.error('❌ No se encontró el archivo .env.local');
  console.log('💡 Crea el archivo con las variables necesarias:');
  console.log('   DATABASE_URL=mongodb+srv://...');
  console.log('   JWT_SECRET=tu-clave-secreta');
  console.log('   VITE_PROD_API_URL=https://tu-app.vercel.app/api');
  process.exit(1);
}

// 3. Verificar package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (!packageJson.scripts.build) {
  console.error('❌ Script de build no encontrado en package.json');
  process.exit(1);
}

// 4. Crear build
console.log('📦 Creando build de producción...');
const { exec } = require('child_process');

exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error en el build:', error);
    return;
  }
  
  console.log('✅ Build completado exitosamente');
  console.log('\n📋 Siguiente pasos para Vercel:');
  console.log('1. Instalar Vercel CLI: npm i -g vercel');
  console.log('2. Configurar variables de entorno en Vercel dashboard');
  console.log('3. Desplegar: vercel --prod');
  console.log('\n🔧 Variables de entorno requeridas en Vercel:');
  console.log('   - DATABASE_URL');
  console.log('   - JWT_SECRET');
  console.log('   - NODE_ENV=production');
  console.log('   - VITE_ENVIRONMENT=production');
});