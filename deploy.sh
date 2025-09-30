#!/bin/bash

echo "🚀 Desplegando Visitas SecuriTI..."

# 1. Verificar que no hay cambios sin commitear
if ! git diff-index --quiet HEAD --; then
    echo "❌ Hay cambios sin commitear. Por favor, haz commit primero."
    exit 1
fi

# 2. Crear build
echo "📦 Creando build de producción..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build creado exitosamente"
else
    echo "❌ Error en el build"
    exit 1
fi

# 3. Verificar que tenemos Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI no está instalado. Instalando..."
    npm install -g vercel
fi

# 4. Desplegar
echo "🌐 Desplegando a Vercel..."
vercel --prod

echo "🎉 ¡Deployment completado!"
echo "📋 No olvides configurar las variables de entorno en Vercel Dashboard"