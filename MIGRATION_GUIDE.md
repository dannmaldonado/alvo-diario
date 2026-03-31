# Guia de Migração: PocketBase → MySQL + Node.js API

## Sumário da Mudança

- **Antes**: Frontend (React) + PocketBase (backend all-in-one)
- **Depois**: Frontend (React) + API Node.js + MySQL

## Etapas de Migração

### 1. Setup do Banco de Dados MySQL

#### No Hostinger cPanel:

1. Acesse **cPanel → MySQL Database**
2. Crie um novo banco de dados:
   - **Database name**: `alvo_diario`
   - **Username**: Crie um novo usuário
   - **Password**: Gere uma senha segura
3. Anote as credenciais

#### Ativar Acesso Remoto (se necessário):

1. Em cPanel, vá para **MySQL Remote**
2. Adicione `%` para permitir conexão remota

### 2. Configurar a API Node.js

#### 2.1 Copiar variáveis de ambiente:

```bash
cd apps/api
cp .env.example .env
```

#### 2.2 Editar `.env` com credenciais do MySQL:

```env
DB_HOST=seu-host-mysql.hostinger.com
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_muito_segura
DB_NAME=alvo_diario
DB_PORT=3306

JWT_SECRET=gere-uma-chave-aleatoria-muito-segura

FRONTEND_URL=https://alvodiario.com.br
NODE_ENV=production
```

#### 2.3 Instalar dependências:

```bash
cd apps/api
npm install
```

#### 2.4 Executar migrations (criar tabelas):

```bash
npm run migrate
```

### 3. Atualizar o Frontend

#### 3.1 Trocar variável de ambiente:

**Arquivo**: `apps/web/.env`

**Antes**:
```
VITE_PB_URL=http://localhost:8090
```

**Depois**:
```
VITE_PB_URL=  # Remove esta variável
VITE_API_URL=http://localhost:3001
```

#### 3.2 Atualizar o serviço de API:

**Arquivo**: `apps/web/src/services/api.ts`

**Antes**:
```typescript
import PocketBase from 'pocketbase';
export const pb = new PocketBase(
  (import.meta.env.VITE_PB_URL as string | undefined) || 'http://localhost:8090'
);
```

**Depois**:
```typescript
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

export const apiClient = {
  async request(method: string, path: string, data?: any, options?: any) {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  },

  get: (path: string, options?: any) => apiClient.request('GET', path, undefined, options),
  post: (path: string, data: any, options?: any) => apiClient.request('POST', path, data, options),
  patch: (path: string, data: any, options?: any) => apiClient.request('PATCH', path, data, options),
  delete: (path: string, options?: any) => apiClient.request('DELETE', path, undefined, options)
};
```

#### 3.3 Atualizar o serviço de autenticação:

**Arquivo**: `apps/web/src/services/auth.service.ts`

```typescript
import { apiClient } from './api';

export const AuthService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  async signup(email: string, password: string, passwordConfirm: string, nome: string) {
    const response = await apiClient.post('/api/auth/signup', {
      email,
      password,
      passwordConfirm,
      nome
    });
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async getCurrentUser() {
    try {
      return await apiClient.get('/api/auth/me');
    } catch (error) {
      return null;
    }
  },

  async updateUser(updates: any) {
    const response = await apiClient.patch('/api/auth/me', updates);
    localStorage.setItem('user', JSON.stringify(response));
    return response;
  },

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  getToken() {
    return localStorage.getItem('auth_token');
  }
};
```

#### 3.4 Atualizar serviços de dados:

**Padrão para cada serviço** (cronogramas, sessões, metas, etc.):

```typescript
import { apiClient } from './api';

export const CronogramasService = {
  getAll: (userId: string) => apiClient.get(`/api/cronogramas`),
  getById: (id: string) => apiClient.get(`/api/cronogramas/${id}`),
  create: (data: any) => apiClient.post(`/api/cronogramas`, data),
  update: (id: string, data: any) => apiClient.patch(`/api/cronogramas/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/cronogramas/${id}`)
};
```

### 4. Testar Localmente

```bash
# Terminal 1: Inicia a API
npm run dev --prefix apps/api

# Terminal 2: Inicia o frontend
npm run dev --prefix apps/web
```

Acesse: `http://localhost:3000`

### 5. Deploy na Hostinger

#### 5.1 Push para GitHub:

```bash
git add .
git commit -m "Migration: PocketBase to MySQL + Node.js API"
git push origin main
```

#### 5.2 O Hostinger deploiará automaticamente:

1. Cria as tabelas (migrations)
2. Inicia a API na porta 3001
3. Constrói o frontend
4. Publica no servidor

#### 5.3 Configurar variáveis de ambiente no painel Hostinger:

No painel do Hostinger → Configurações → Variáveis de ambiente:

```
VITE_API_URL=https://alvodiario.com.br/api
DB_HOST=seu-host-mysql
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=alvo_diario
JWT_SECRET=sua-chave-secreta
NODE_ENV=production
```

### 6. Verificar Deploy

- Frontend: `https://alvodiario.com.br`
- API Health: `https://alvodiario.com.br/api/health` (deve retornar `{"status":"ok"}`)

## Rollback (Se Necessário)

```bash
git reset --hard <commit-anterior>
git push --force origin main
```

## Checklist de Migração

- [ ] Criar banco de dados MySQL no Hostinger
- [ ] Configurar credenciais do MySQL
- [ ] Instalar dependências da API
- [ ] Executar migrations
- [ ] Atualizar variáveis de ambiente do frontend
- [ ] Atualizar serviço `api.ts` do frontend
- [ ] Atualizar serviço `auth.service.ts`
- [ ] Atualizar todos os serviços de dados
- [ ] Testar localmente
- [ ] Push para GitHub
- [ ] Verificar deploy no Hostinger
- [ ] Testar funcionalidades no ambiente de produção
