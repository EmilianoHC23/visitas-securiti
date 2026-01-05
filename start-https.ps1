# Script para iniciar el sistema con HTTPS
# Visitas SecuriTI - Desarrollo Local con SSL

Write-Host "`n🔒 Iniciando Visitas SecuriTI con HTTPS`n" -ForegroundColor Cyan

# Verificar que los certificados existen
if (-not (Test-Path ".\certs\13.0.0.87+2.pem")) {
    Write-Host "❌ Error: Certificados SSL no encontrados" -ForegroundColor Red
    Write-Host "Por favor ejecuta el siguiente comando primero:" -ForegroundColor Yellow
    Write-Host "cd certs; ..\mkcert.exe 13.0.0.87 localhost 127.0.0.1`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Certificados SSL encontrados" -ForegroundColor Green
Write-Host ""

# Iniciar Backend
Write-Host "🚀 Iniciando Backend (HTTPS)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '📦 Backend Server' -ForegroundColor Green; npm start"

# Esperar 3 segundos para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "🎨 Iniciando Frontend (HTTPS)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '⚛️ Frontend Vite' -ForegroundColor Blue; npm run dev"

# Esperar 2 segundos
Start-Sleep -Seconds 2

Write-Host "`n✨ Sistema iniciado!`n" -ForegroundColor Green
Write-Host "📱 Accede desde:" -ForegroundColor Cyan
Write-Host "   • Frontend: https://13.0.0.87:3001" -ForegroundColor White
Write-Host "   • Backend:  https://13.0.0.87:3002/api" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Importante - Acepta 2 certificados:" -ForegroundColor Yellow
Write-Host "   1. Primero abre: https://13.0.0.87:3002/api/health" -ForegroundColor Yellow
Write-Host "      → Acepta el certificado del backend" -ForegroundColor Yellow
Write-Host "   2. Luego abre: https://13.0.0.87:3001" -ForegroundColor Yellow
Write-Host "      → Acepta el certificado del frontend" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔑 Credenciales de acceso:" -ForegroundColor Cyan
Write-Host "   • Usuario: admin@securiti.com" -ForegroundColor White
Write-Host "   • Contraseña: Admin2025!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Para más información, consulta HTTPS_SETUP.md o ACEPTAR_CERTIFICADO.md`n" -ForegroundColor Cyan
