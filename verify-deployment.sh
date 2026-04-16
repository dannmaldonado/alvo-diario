#!/bin/bash

echo "🔍 Verificando configuração de deployment..."
echo ""

# Check Node.js
echo "✓ Node.js version:"
node --version
echo ""

# Check npm
echo "✓ npm version:"
npm --version
echo ""

# Check build output
echo "✓ Verificando build output..."
if [ -d "dist/apps/web" ]; then
    echo "  ✅ dist/apps/web/ existe"
    echo "  Files:"
    ls -lah dist/apps/web/ | head -10
else
    echo "  ❌ dist/apps/web/ NÃO existe"
    echo "  Execute: npm run build"
    exit 1
fi
echo ""

# Check entry point
echo "✓ Verificando entry point..."
if [ -f "apps/api/src/index.js" ]; then
    echo "  ✅ apps/api/src/index.js existe"
    echo "  Primeiras linhas:"
    head -5 apps/api/src/index.js
else
    echo "  ❌ apps/api/src/index.js NÃO existe"
    exit 1
fi
echo ""

# Check if static files are being served
echo "✓ Verificando se static files são servidos..."
if grep -q "express.static" apps/api/src/index.js; then
    echo "  ✅ Backend serve static files"
    grep "express.static" apps/api/src/index.js
else
    echo "  ⚠️  Backend pode NÃO estar servindo static files"
fi
echo ""

# Check environment variables
echo "✓ Verificando se .env existe em apps/api..."
if [ -f "apps/api/.env" ]; then
    echo "  ✅ apps/api/.env existe"
    echo "  Variáveis (mascaradas):"
    cat apps/api/.env | sed 's/=.*/=***/'
else
    echo "  ⚠️  apps/api/.env NÃO existe (use Hostinger control panel)"
fi
echo ""

echo "✅ Verificação completa!"
echo ""
echo "📋 Próximos passos no Hostinger:"
echo "1. Build Command: npm install && npm run build"
echo "2. Entry Point: apps/api/src/index.js"
echo "3. Start Command: npm start"
echo "4. Node.js Version: 18 or higher"
echo "5. Environment Variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET"
echo ""
echo "🚀 Após deployment, teste:"
echo "   curl https://yourdomain.com/estudo"
echo "   curl https://yourdomain.com/api/health"
