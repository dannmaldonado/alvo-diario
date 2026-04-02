# Lovable Deployment Checklist

## Overview
Alvo Diário é um **monorepo** com frontend React + backend Express. Lovable agora está configurado para servir ambos corretamente.

## Configuração Necessária no Lovable Dashboard

### 1. Build Settings
Acesse: **Project Settings → Build & Deploy**

```
Build Command:        npm run build
Output Directory:     dist/apps/web
Start Command:        npm run start
Node Version:         18+ (recomendado 20)
```

### 2. Environment Variables
Acesse: **Project Settings → Environment Variables**

```
NODE_ENV              production
PORT                  3000 (ou deixe vazio para usar padrão)
DATABASE_URL          mysql://user:pass@host:port/dbname
JWT_SECRET            your-secret-key-here
FRONTEND_URL          https://seu-dominio.com (para CORS)
```

Contate o DevOps (@devops) para obter as credenciais do banco de dados.

## Como o Deploy Funciona

### Build Phase
```
$ npm run build
  ├─ Build frontend: vite build --outDir ../../dist/apps/web
  ├─ Saída: dist/apps/web/
  │   ├── index.html
  │   ├── assets/ (CSS, JS, fonts)
  │   └── llms.txt
  └─ ✓ Pronto para servir
```

### Runtime Phase
```
$ npm run start
  └─ Inicia Express.js
      ├─ Listen on PORT (default 3000)
      ├─ Serve static files: dist/apps/web/
      │   ├─ /assets/* → Cached 1 year
      │   ├─ /api/* → API routes
      │   └─ /* → SPA fallback (index.html)
      └─ ✓ Ready to accept requests
```

## Verificar Depois do Deploy

### 1. Frontend carrega?
```
https://seu-dominio.com
→ Deve mostrar a página do Alvo Diário
→ Sem white screen
→ Sem erros no console (F12 → Console)
```

### 2. Assets estão carregando?
```
DevTools (F12) → Network tab
→ Abrir GET request para /assets/index-*.css
→ Headers devem mostrar:
   Content-Type: text/css; charset=utf-8
   Cache-Control: public, max-age=31536000, immutable
→ Status: 200 (não 503, 404, ou 5xx)
```

### 3. API está respondendo?
```
curl https://seu-dominio.com/api/health
→ Resposta esperada: {"status":"ok"}
```

### 4. SPA routing funciona?
```
https://seu-dominio.com/cronogramas
→ Deve carregar a página corretamente
→ Não 404
→ Não redirect para homepage
```

## Troubleshooting

### Problema: White Screen / Assets 503

**Solução 1: Verificar build artifacts**
```bash
# Local
npm run build
ls -la dist/apps/web/assets/
# Deve listar arquivos CSS/JS
```

**Solução 2: Verificar Express logs**
- Abra o Lovable console/logs
- Procure por: `Server running on port 3000`
- Se não encontrar, o build falhou

**Solução 3: Force rebuild no Lovable**
1. Abra Project Settings
2. Clique "Trigger rebuild"
3. Aguarde conclusão
4. Acesse https://seu-dominio.com

### Problema: CORS errors na API

Se chamar API de domínio diferente:
```
Access-Control-Allow-Origin error
```

**Solução:**
1. Edite `apps/api/src/index.js` line 28
2. Atualize CORS origin para seu domínio:
   ```javascript
   origin: isProd ? 'https://seu-dominio.com' : ...
   ```
3. Faça push do commit
4. Lovable faz rebuild automaticamente

### Problema: 502 Bad Gateway

**Causas comuns:**
1. Porta errada configurada
2. Database não acessível
3. Server crash

**Solução:**
1. Abra Lovable logs
2. Procure por erro de conexão
3. Verifique DATABASE_URL está correto
4. Reinicie o app (restart button no Lovable)

## Estrutura Pós-Deploy

### No Lovable Server
```
/app/
├── dist/apps/web/          ← Frontend (servido)
├── node_modules/
├── apps/
│   ├── api/src/index.js    ← Express entry point
│   └── web/                ← Frontend code (não usado em runtime)
└── package.json
```

### Requests Flow
```
Browser → Lovable Server (Express.js)
  ├─ GET / → Serve dist/apps/web/index.html
  ├─ GET /assets/bundle.js → Serve dist/apps/web/assets/bundle.js
  ├─ GET /api/health → Route express API
  └─ GET /cronogramas → Fallback to index.html (React routing)
```

## Rollback

Se algo quebrar após deploy:

```bash
# Option 1: Via git
git revert <commit-hash>
git push
# Lovable faz rebuild automaticamente

# Option 2: Via Lovable UI
1. Project Settings → Deployments
2. Selecione deployment anterior
3. Clique "Revert"
```

## Monitoramento

### Health Check URL
```
curl https://seu-dominio.com/health
{"status":"ok"}
```

Use isto para monitoramento contínuo (uptime checks, alertas).

### Logs
- Lovable Dashboard → Logs
- Procure por `Server running on port`
- Qualquer erro será exibido em vermelho

## Problemas Conhecidos

### 1. Primeiro deploy demora
- Primeiro build pode levar 2-5 minutos
- npm install rodando
- Paciência!

### 2. Assets antigos sendo servidos
- Browser cache pode servir versões antigas
- Solução: Fazer hard refresh (Cmd+Shift+R ou Ctrl+Shift+R)
- Ou limpar cache do browser

### 3. Banco de dados não conecta
- DATABASE_URL precisa estar acessível de Lovable
- Se estiver em localhost, não vai funcionar
- Usar banco em nuvem (Railway, Render, AWS RDS, etc.)

## Próximos Passos

1. Feche este arquivo ✓
2. Copie as credenciais do banco (pergunte ao @devops)
3. Acesse Lovable Dashboard
4. Insira Build Settings e Environment Variables acima
5. Faça push de `main` ao GitHub
6. Lovable faz rebuild automaticamente
7. Teste https://seu-dominio.com

## Documentação Relacionada

- **PRODUCTION_SETUP.md** - Explicação técnica da fix
- **apps/api/src/index.js** - Código Express modificado
- **apps/web/vite.config.ts** - Build configuration
