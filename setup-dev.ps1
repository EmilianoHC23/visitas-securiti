# 🚀 Script de configuración rápida para desarrollo (Windows)
# Ejecutar desde PowerShell en el directorio raíz del proyecto

Write-Host "🚀 Configurando Visitas SecuriTI para desarrollo..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json") -or -not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: Ejecutar desde el directorio raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm run install:all

Write-Host "📝 Configurando archivos de entorno..." -ForegroundColor Yellow

# Configurar .env principal si no existe
if (-not (Test-Path ".env")) {
    "NODE_ENV=development" | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
}

# Configurar frontend/.env si no existe  
if (-not (Test-Path "frontend\.env")) {
    @"
VITE_ENVIRONMENT=development
VITE_API_URL=http://localhost:3001/api
VITE_EMAILJS_SERVICE_ID=service_vxjzajn
VITE_EMAILJS_TEMPLATE_ID=template_5oieypb
VITE_EMAILJS_PUBLIC_KEY=vvtUk70Pk2tlCBQ52
"@ | Out-File -FilePath "frontend\.env" -Encoding UTF8
    Write-Host "✅ Archivo frontend/.env creado con configuración EmailJS" -ForegroundColor Green
}

# Configurar backend/.env si no existe
if (-not (Test-Path "backend\.env")) {
    @"
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/visitas-securiti
JWT_SECRET=desarrollo_jwt_secret_super_largo_y_seguro_para_desarrollo_local_2024
EMAILJS_SERVICE_ID=service_vxjzajn
EMAILJS_TEMPLATE_ID=template_5oieypb
VITE_EMAILJS_PUBLIC_KEY=vvtUk70Pk2tlCBQ52
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Archivo backend/.env creado" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Configurar MongoDB (local o Atlas)" -ForegroundColor White
Write-Host "2. Ejecutar: npm run dev" -ForegroundColor White
Write-Host "3. Abrir: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📚 Ver DESARROLLO.md para más detalles" -ForegroundColor Cyan

Write-Host ""
Write-Host "🚀 ¿Quieres ejecutar el proyecto ahora? (s/n): " -ForegroundColor Yellow -NoNewline
$response = Read-Host
if ($response -eq "s" -or $response -eq "S" -or $response -eq "y" -or $response -eq "Y") {
    Write-Host "🚀 Iniciando proyecto..." -ForegroundColor Green
    npm run dev
}