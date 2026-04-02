# Alvo Diário 🎯

Um sistema web completo de planejamento e acompanhamento de estudos para preparação em concursos públicos, com ciclos de estudo otimizados e rastreamento de progresso em tempo real.

## 📋 Sumário

- [Quick Start](#quick-start)
- [Arquitetura](#arquitetura)
- [Desenvolvimento](#desenvolvimento)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+
- **npm** 8+
- **Git**
- **GitHub CLI** (gh) - para PR management

### Setup Inicial

```bash
# 1. Clone o repositório
git clone https://github.com/seu-repo/alvo-diario.git
cd alvo-diario

# 2. Instale dependências
npm install

# 3. Inicie ambos os servidores (web + backend)
npm run dev
```

### URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Web App** | http://localhost:3000 | React app com Vite HMR |
| **API Backend** | http://localhost:3001 | Express.js + MySQL |

---

## 📁 Arquitetura

```
alvo-diario/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── pages/          # Route pages (Dashboard, Cronograma, etc)
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API clients (Auth, Cronograma, etc)
│   │   │   ├── contexts/       # React Context providers
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── lib/            # Utilities (validators, formatters)
│   │   │   └── __tests__/      # Unit tests (Vitest)
│   │   ├── plugins/            # Custom Vite plugins (dev-only)
│   │   └── vite.config.js      # Vite configuration
│   │
│   └── api/                    # Node.js/Express backend
│       ├── src/
│       │   ├── index.js        # Server entry point
│       │   ├── routes/         # Express routers (auth, data endpoints)
│       │   ├── services/       # Business logic
│       │   ├── middleware/     # Auth & error handling
│       │   └── db/             # MySQL connection & schema
│       └── package.json        # API dependencies
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # System design & patterns
│   └── API.md                  # API reference
│
└── package.json               # Root workspace config
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript (strict mode)
- Vite (build tool)
- TailwindCSS + Shadcn/ui
- React Router + React Hook Form
- Vitest (testing)

**Backend:**
- Express.js (Node.js REST API)
- MySQL (database)
- JWT authentication

**Development:**
- ESLint + Prettier
- GitHub CLI for PR management
- Conventional commits

---

## 🛠️ Desenvolvimento

### Estrutura de Pastas - Web App

```
src/
├── pages/                      # Route-level components
│   ├── DashboardPage.tsx       # Main dashboard
│   ├── CronogramaPage.tsx      # Schedule management
│   ├── StudySessionPage.tsx    # Active study session
│   └── ...
│
├── components/                 # Reusable components
│   ├── ui/                     # Shadcn/ui components
│   ├── SubjectBadge.tsx        # Subject badge with colors
│   └── Header.tsx              # App header
│
├── hooks/                      # Custom hooks
│   └── useScheduleCalculator.ts # Schedule calculation logic
│
├── services/                   # API clients
│   ├── auth.service.ts         # Authentication
│   ├── cronograma.service.ts   # Schedule CRUD
│   ├── metas.service.ts        # Daily goals
│   └── sessoes.service.ts      # Study sessions
│
├── contexts/                   # React Context
│   └── AuthContext.tsx         # Auth state & methods
│
├── types/                      # TypeScript definitions
│   └── index.ts                # All app types
│
└── lib/                        # Utilities
    ├── validators.ts           # Input validation
    └── utils.ts                # Helper functions
```

### Comandos Principais

```bash
# Desenvolvimento
npm run dev              # Start web (3000) + API (3001)
npm run dev:web         # Start only web app

# Building
npm run build           # Production build
npm run build:web       # Build web only

# Testing
npm test                # Run Vitest
npm test -- --watch     # Watch mode

# Code Quality
npm run lint            # ESLint check
npm run lint:warn       # Show warnings
npm run typecheck       # TypeScript strict check
```

### Padrões de Código

#### 1. **Type Safety (Strict Mode)**

```typescript
// ✅ CORRETO: Use tipos explícitos
interface PageState {
  schedule: Cronograma | null;
  loading: boolean;
}

const [state, setState] = useState<PageState>({
  schedule: null,
  loading: false
});

// ❌ EVITAR: Casts 'as any'
const data = response.data as any;  // NO!
```

#### 2. **Service Layer**

Services encapsulam lógica de API:

```typescript
// services/cronograma.service.ts
export const CronogramaService = {
  getActive: async (userId: string): Promise<Cronograma | null> => {
    return apiCall(
      async () => {
        const records = await apiClient.get<Cronograma[]>(`/api/cronogramas?user_id=${userId}`);
        return records.length > 0 ? records[0] : null;
      },
      'CronogramaService.getActive'
    );
  },

  create: async (data: CreateCronogramaInput): Promise<Cronograma> => {
    return apiCall(
      async () => {
        return await apiClient.post<Cronograma>('/api/cronogramas', data);
      },
      'CronogramaService.create'
    );
  }
};

// No component:
const schedule = await CronogramaService.getActive(currentUser.id);
```

#### 3. **Error Handling**

```typescript
try {
  const result = await service.method();
  setData(result);
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('Erro ao carregar dados');
}
```

#### 4. **Component Structure**

```typescript
const MyPage: React.FC = () => {
  const [state, setState] = useState<State>(initialState);

  // Effects
  useEffect(() => { /* ... */ }, [dependencies]);

  // Handlers
  const handleAction = () => { /* ... */ };

  // Render
  return <div>{/* JSX */}</div>;
};

export default MyPage;
```

---

## ✅ Testing

### Rodando Testes

```bash
npm test                    # Run all tests once
npm test -- --watch         # Watch mode
npm test -- cronograma      # Run specific file
npm test -- --ui            # Visual UI
```

### Estrutura de Testes

```
__tests__/
├── services/
│   ├── auth.service.test.ts
│   ├── cronograma.service.test.ts
│   ├── metas.service.test.ts
│   └── sessoes.service.test.ts
├── hooks/
│   └── useScheduleCalculator.test.ts
├── components/
│   └── Header.test.tsx
└── utils/
    ├── validators.test.ts
    └── errors.test.ts
```

### Escrevendo Testes

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    expect(result).toBe(expected);
  });

  it('should handle errors', async () => {
    await expect(service.method()).rejects.toThrow();
  });
});
```

**Cobertura Atual:**
- ✅ 120+ testes
- ✅ Services: Auth, Cronograma, Metas, Sessões
- ✅ Hooks: Schedule Calculator
- ✅ Utils: Validators, Errors

---

## 🚀 Deployment

### Build para Produção

```bash
# Build web app
npm run build

# Output: dist/apps/web/
# Serve with: npm run start
```

### API em Produção

```bash
# Start API server
npm run start --prefix apps/api

# API será acessível em http://localhost:3001
```

### Environment Variables (apps/api/.env)

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=alvo_diario

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=your_jwt_secret_key
```

---

## 🔧 Troubleshooting

### Porta 3000 já em uso

```bash
# Kill processo na porta 3000
lsof -ti :3000 | xargs kill -9

# Ou use porta diferente
PORT=3001 npm run dev:web
```

### API não conecta

```bash
# Verificar se API está rodando
curl http://localhost:3001/api/health

# Reiniciar
npm run dev --prefix apps/api
```

### TypeScript errors

```bash
# Verificar tipos
npm run typecheck

# Solução: adicionar interface ou corrigir tipo
```

### Testes falhando

```bash
# Limpar cache Vitest
npm test -- --clearCache

# Rodar com debug
npm test -- --reporter=verbose
```

### Build falha

```bash
# Limpar dist
rm -rf dist/

# Rebuild
npm run build

# Check erros
npm run lint
npm run typecheck
```

---

## 📚 Documentação Adicional

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Design system, patterns, data flow
- **[API.md](./docs/API.md)** - PocketBase collections & endpoints
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Code standards, PR process

---

## 🤝 Contribuindo

1. **Crie uma branch** com seu nome: `git checkout -b feat/minha-feature`
2. **Commit com conventional commits**: `git commit -m "feat: adicione nova feature"`
3. **Teste tudo**: `npm test && npm run lint && npm run typecheck`
4. **Abra PR** com descrição clara

### Checklist antes de fazer PR

- [ ] Tests passando (`npm test`)
- [ ] Lint passando (`npm run lint`)
- [ ] TypeScript strict mode passando (`npm run typecheck`)
- [ ] Build passando (`npm run build`)
- [ ] Commits seguem conventional commits

---

## 📊 Métricas do Projeto

| Métrica | Status |
|---------|--------|
| TypeScript Strict | ✅ Ativo |
| Type Coverage | ✅ 100% |
| Test Coverage | ✅ 120+ testes |
| ESLint | ✅ Passing |
| Build | ✅ Passing |

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação em `/docs`
2. Procure issues existentes no GitHub
3. Abra uma nova issue com detalhes

---

**Última atualização:** 30/03/2026
**Versão:** 1.0.0
