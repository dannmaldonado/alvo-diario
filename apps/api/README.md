# Alvo Diário API

Backend Node.js + Express para Alvo Diário

## Setup

1. **Instalar dependências:**
```bash
npm install
```

2. **Criar arquivo `.env`** (copiar de `.env.example`):
```bash
cp .env.example .env
```

3. **Configurar variáveis de ambiente** no `.env`:
```
DB_HOST=seu-host
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=alvo_diario
DB_PORT=3306
JWT_SECRET=sua-chave-secreta-muito-segura
FRONTEND_URL=http://localhost:3000
```

4. **Criar banco de dados MySQL:**
```bash
mysql -u seu-usuario -p
CREATE DATABASE alvo_diario;
EXIT;
```

5. **Executar migrations:**
```bash
npm run migrate
```

6. **Iniciar servidor:**
```bash
npm run dev      # Desenvolvimento com hot-reload
npm start        # Produção
```

## Endpoints

### Autenticação

- `POST /api/auth/signup` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário autenticado
- `PATCH /api/auth/me` - Atualizar perfil

### Cronogramas

- `GET /api/cronogramas` - Listar cronogramas
- `GET /api/cronogramas/:id` - Obter cronograma
- `POST /api/cronogramas` - Criar cronograma
- `PATCH /api/cronogramas/:id` - Atualizar cronograma
- `DELETE /api/cronogramas/:id` - Deletar cronograma

### Sessões de Estudo

- `GET /api/sessoes` - Listar sessões (filtros: startDate, endDate, data)
- `GET /api/sessoes/:id` - Obter sessão
- `POST /api/sessoes` - Criar sessão
- `PATCH /api/sessoes/:id` - Atualizar sessão
- `DELETE /api/sessoes/:id` - Deletar sessão

### Metas Diárias

- `GET /api/metas` - Listar metas
- `GET /api/metas/by-date/:data` - Obter meta de um dia
- `GET /api/metas/:id` - Obter meta
- `POST /api/metas` - Criar meta
- `PATCH /api/metas/:id` - Atualizar meta
- `DELETE /api/metas/:id` - Deletar meta

### Badges

- `GET /api/badges` - Listar badges
- `GET /api/badges/:id` - Obter badge
- `POST /api/badges` - Criar badge (admin)

### Histórico de Pontos

- `GET /api/historico` - Listar histórico (filtros: startDate, endDate)
- `POST /api/historico` - Criar registro (admin)

## Autenticação

A API usa JWT. Após fazer login, inclua o token no header:

```bash
Authorization: Bearer <seu-token-jwt>
```

## Estrutura

```
apps/api/
├── src/
│   ├── index.js              # Arquivo principal
│   ├── db/
│   │   ├── connection.js      # Conexão MySQL
│   │   └── schema.sql         # Schema do banco
│   ├── middleware/
│   │   └── auth.js            # Middleware JWT
│   ├── services/              # Lógica de negócio
│   │   ├── auth.js
│   │   ├── cronogramas.js
│   │   ├── sessoes.js
│   │   ├── metas.js
│   │   ├── badges.js
│   │   └── historico.js
│   └── routes/                # Endpoints
│       ├── auth.js
│       ├── cronogramas.js
│       ├── sessoes.js
│       ├── metas.js
│       ├── badges.js
│       └── historico.js
├── .env.example
├── package.json
└── README.md
```
