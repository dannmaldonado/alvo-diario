# Arquitetura - Alvo Diário 🏗️

Documentação técnica detalhada sobre design, patterns, e fluxos de dados do projeto.

## 📑 Índice

- [Visão Geral](#visão-geral)
- [Componentes](#componentes)
- [Fluxo de Dados](#fluxo-de-dados)
- [Autenticação](#autenticação)
- [Modelo de Dados](#modelo-de-dados)
- [Patterns & Best Practices](#patterns--best-practices)
- [Performance](#performance)
- [Segurança](#segurança)

---

## 🎯 Visão Geral

### Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│            UI Layer (React Components)              │
├─────────────────────────────────────────────────────┤
│         Logic Layer (Hooks, Context)                │
├─────────────────────────────────────────────────────┤
│        Service Layer (API Clients)                  │
├─────────────────────────────────────────────────────┤
│     PocketBase SDK (REST API)                       │
├─────────────────────────────────────────────────────┤
│    PocketBase Server (Database, Auth)              │
└─────────────────────────────────────────────────────┘
```

### Características Principais

| Aspecto | Implementação |
|---------|---------------|
| **Type Safety** | TypeScript strict mode (100% coverage) |
| **State Management** | React Context + local state |
| **Data Persistence** | PocketBase (auto-sync) |
| **Authentication** | JWT tokens (PocketBase) |
| **UI Framework** | Shadcn/ui (Radix UI) + TailwindCSS |
| **Testing** | Vitest (unit tests) |
| **Build** | Vite (fast builds) |

---

## 🧩 Componentes

### Frontend Architecture

```
App (Root)
├── AuthContext (Auth state & methods)
│   ├── currentUser
│   ├── login(email, password)
│   ├── logout()
│   └── updateUser()
│
├── Layout
│   ├── Header (Navigation, User menu)
│   ├── Sidebar (Route links)
│   └── [Page Content]
│
└── Pages
    ├── DashboardPage
    │   ├── useScheduleCalculator (custom hook)
    │   ├── CronogramaService.getActive()
    │   ├── MetasService.getByDate()
    │   └── SessoesService.getByDateRange()
    │
    ├── CronogramaPage
    │   ├── CronogramaService (CRUD)
    │   └── generateSchedule()
    │
    ├── StudySessionPage
    │   ├── Timer logic
    │   └── SessoesService.create()
    │
    └── ...
```

### Component Hierarchy

```typescript
// High-level component
<DashboardPage>
  ├── <HeroCard>
  │   └── <SubjectBadge subject={materia} />
  ├── <ProgressCard>
  │   └── <CircularProgress />
  ├── <StatsSection>
  │   ├── <StatCard />
  │   ├── <StatCard />
  │   └── <StatCard />
  └── <MonthlyStats>
      └── <BarChart />
```

---

## 🔄 Fluxo de Dados

### 1. User Authentication Flow

```
User Input (Email/Password)
           ↓
  AuthContext.login()
           ↓
AuthService.login(pb)
           ↓
  PocketBase API
           ↓
JWT Token + User Data
           ↓
Store in Context
           ↓
Redirect to Dashboard
```

### 2. Schedule Loading Flow

```
User opens Dashboard
           ↓
loadDashboardData()
           ↓
CronogramaService.getActive()
           ↓
PocketBase API
           ↓
Cronograma (schedule) data
           ↓
useScheduleCalculator()
           ↓
Calculate: todaySubject, cycleInfo
           ↓
setState() + render
```

### 3. Study Session Flow

```
User starts session
           ↓
Timer begins (setInterval)
           ↓
User studies...
           ↓
Timer completes
           ↓
handleTimerComplete()
           ↓
SessoesService.create() [API call]
           ↓
Session saved in DB
           ↓
Update MetasService
           ↓
Refresh Dashboard
```

---

## 🔐 Autenticação

### PocketBase Auth

```typescript
// Login
const auth = await pb.collection('users').authWithPassword(email, password);
// Returns: { token, record }

// Auto-sync on app load
const auth = await pb.authRefresh();

// Logout
pb.authStore.clear();
```

### Context API Integration

```typescript
// AuthContext provides
{
  currentUser: User | null,
  isLoading: boolean,
  login: (email, password) => Promise<void>,
  logout: () => void,
  updateUser: (data) => Promise<void>,
  onAuthStateChange: (callback) => () => void
}
```

### Protected Routes

```typescript
// Routes protected by AuthContext
- /dashboard
- /cronograma
- /study-session
- /analise
- /perfil

// Public routes
- /login
- /signup
- /
```

---

## 📊 Modelo de Dados

### Core Collections

#### **users**
```typescript
{
  id: string;              // PocketBase auto-generated
  email: string;           // Unique identifier
  nome: string;            // User's name
  nivel_atual: number;     // Current difficulty level
  pontos_totais: number;   // Total points earned
  streak_atual: number;    // Current study streak (days)
  meta_diaria_horas: number; // Daily study goal (hours)
  created: string;         // ISO timestamp
  updated: string;         // ISO timestamp
}
```

#### **cronogramas** (Study Schedules)
```typescript
{
  id: string;
  user_id: string;         // Foreign key → users
  edital: string;          // "PC" | "PRF" | "PF"
  materias: Materia[];     // Array of subjects
  data_inicio: string;     // Schedule start date
  data_fim: string;        // Schedule end date
  data_alvo?: string;      // Target exam date (optional)
  created: string;
  updated: string;
}

// Nested Materia
{
  nome: string;            // Subject name
  status: string;          // "pendente" | "em_progresso" | "completo"
  horas_dedicadas?: number;
}
```

#### **metas** (Daily Goals)
```typescript
{
  id: string;
  user_id: string;         // Foreign key → users
  data: string;            // YYYY-MM-DD
  horas_meta: number;      // Goal hours
  horas_realizadas: number;// Completed hours
  status: string;          // "pendente" | "em_progresso" | "completo"
  created: string;
  updated: string;
}
```

#### **sessoes** (Study Sessions)
```typescript
{
  id: string;
  user_id: string;         // Foreign key → users
  cronograma_id: string;   // Foreign key → cronogramas
  materia: string;         // Subject name
  duracao_minutos: number; // Session duration
  data_sessao: string;     // YYYY-MM-DD
  notas?: string;          // Optional notes
  created: string;
  updated: string;
}
```

### Relationships

```
users (1) ─── (*) cronogramas
users (1) ─── (*) metas
users (1) ─── (*) sessoes
cronogramas (1) ─── (*) sessoes
```

---

## 🎨 Patterns & Best Practices

### 1. Service Layer Pattern

**Encapsula toda lógica de API:**

```typescript
// services/cronograma.service.ts
export const CronogramaService = {
  getActive: async (userId: string): Promise<Cronograma | null> => {
    try {
      const pb = getPocketBase();
      return await pb.collection('cronogramas')
        .getFirstListItem(`user_id = '${userId}'`);
    } catch (error) {
      return null;
    }
  },

  create: async (data: CreateCronogramaInput): Promise<Cronograma> => {
    // Validation
    if (!data.edital || data.materias.length === 0) {
      throw new ValidationError('Invalid schedule data');
    }

    const pb = getPocketBase();
    return await pb.collection('cronogramas').create(data);
  },

  // ... update, delete, getAll
};
```

**No component:**
```typescript
// ✅ Clean separation
const schedule = await CronogramaService.getActive(userId);

// ❌ Avoid direct API calls in components
const pb = getPocketBase();
const data = await pb.collection('cronogramas')...
```

### 2. Custom Hooks Pattern

**Encapsula lógica reutilizável:**

```typescript
// hooks/useScheduleCalculator.ts
export const useScheduleCalculator = () => {
  const getDaysSinceCreation = useCallback((schedule, date) => {
    // Logic to calculate days elapsed
  }, []);

  const getCurrentSubject = useCallback((schedule, date) => {
    // Get subject for current day
  }, [getDaysSinceCreation]);

  return { getDaysSinceCreation, getCurrentSubject, getCycleInfo };
};

// No component
const { getCurrentSubject } = useScheduleCalculator();
const todaySubject = getCurrentSubject(schedule, new Date());
```

### 3. Type-Safe Error Handling

```typescript
// types/index.ts
export class ValidationError extends APIError {
  constructor(field: string, message: string) {
    super(400, message, field, 'VALIDATION_ERROR');
  }
}

// Usage
try {
  await service.validate(data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Field ${error.field}: ${error.message}`);
  }
}
```

### 4. Component State Management

```typescript
// ✅ Use type-safe state
interface PageState {
  schedule: Cronograma | null;
  loading: boolean;
  error: string | null;
}

const [state, setState] = useState<PageState>(initialState);

// Update individual fields safely
const setSchedule = (schedule: Cronograma | null) =>
  setState(prev => ({ ...prev, schedule }));
```

### 5. Effect Dependencies

```typescript
// ✅ CORRECT: All dependencies listed
useEffect(() => {
  loadData();
}, [currentUser, getCurrentSubject, getCycleInfo]); // All deps

// ❌ WRONG: Missing dependencies
useEffect(() => {
  loadData();
}, [currentUser]); // Missing getCurrentSubject!
```

---

## ⚡ Performance

### Optimization Strategies

#### 1. **Lazy Loading Pages**
```typescript
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CronogramaPage = lazy(() => import('./pages/CronogramaPage'));

// In router
<Suspense fallback={<Skeleton />}>
  <DashboardPage />
</Suspense>
```

#### 2. **Memoization**
```typescript
// Memoize expensive calculations
const CurrentSubject = React.memo(({ subject }) => {
  return <SubjectBadge subject={subject} />;
});
```

#### 3. **Request Deduplication**
```typescript
// Don't make duplicate requests
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (loading) return; // Already loading

  setLoading(true);
  fetchData().finally(() => setLoading(false));
}, [dependency]);
```

#### 4. **Build Optimization**
- Tree-shaking enabled in Vite
- CSS minification
- JS minification with Terser
- Chunk splitting for large dependencies

---

## 🔒 Segurança

### 1. Authentication & Authorization

```typescript
// Check auth before loading protected data
const loadDashboardData = async () => {
  if (!currentUser?.id) {
    toast.error('Usuário não autenticado');
    return;
  }
  // ...
};
```

### 2. Data Validation

```typescript
// Always validate user input
const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// Validate on form submission
if (!isValidPassword(formData.password)) {
  setError('Senha deve ter no mínimo 8 caracteres');
}
```

### 3. Environment Variables

```bash
# Never commit secrets
# .env
PB_ENCRYPTION_KEY=secret_key_here

# In code
const encryptionKey = process.env.PB_ENCRYPTION_KEY;
```

### 4. HTTPS in Production

PocketBase should run behind HTTPS proxy:

```nginx
# nginx config
server {
  listen 443 ssl;
  server_name api.example.com;

  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  location / {
    proxy_pass http://localhost:8090;
  }
}
```

---

## 📈 Escalabilidade

### Current Limitations

| Aspecto | Limite Atual | Solução |
|---------|--------------|---------|
| DB Size | Single file | PostgreSQL migration |
| Concurrent Users | ~100 | Horizontal scaling |
| File Storage | Local disk | S3/Cloud storage |
| Caching | None | Redis layer |

### Future Improvements

1. **Database Migration** - Move from PocketBase SQLite to PostgreSQL
2. **Caching Layer** - Add Redis for session & query caching
3. **CDN** - Serve static assets via CDN
4. **Monitoring** - Add observability (logs, metrics, traces)
5. **Analytics** - Track user behavior & engagement

---

## 🧪 Testing Strategy

### Unit Tests (Current)
- ✅ Services (Auth, Cronograma, Metas, Sessões)
- ✅ Hooks (Schedule Calculator)
- ✅ Utils (Validators)
- Coverage: **120+ tests**

### Integration Tests (Planned)
- [ ] Full user flow (login → create schedule → start session)
- [ ] API integration with mocked PocketBase
- [ ] Error scenarios

### E2E Tests (Planned)
- [ ] Playwright/Cypress tests for critical flows
- [ ] Performance benchmarks

---

## 📚 Referências Internas

- **[README.md](../README.md)** - Setup & quick start
- **[Commit History](../.git/logs/HEAD)** - Development timeline
- **[Package.json](../package.json)** - Dependencies & scripts

---

**Última atualização:** 30/03/2026
**Versão da Arquitetura:** 1.0
