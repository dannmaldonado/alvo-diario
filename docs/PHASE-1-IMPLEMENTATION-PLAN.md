# Phase 1 Implementation Plan — TypeScript Migration & Service Layer

**Project:** alvo-diario (Hostinger Horizons)
**Phase:** 1 of 4
**Duration:** 2-3 weeks
**Target Date:** 2026-04-09 (estimated)
**Status:** 📋 Planning

---

## Executive Summary

Phase 1 establishes the foundation for production-ready code by introducing TypeScript, automated testing infrastructure, and a clean service layer architecture. This phase removes technical debt and enables faster development in subsequent phases.

**Expected Outcomes:**
- ✅ 100% of application code converted to TypeScript
- ✅ Service layer abstracts all PocketBase API calls
- ✅ Testing infrastructure (Vitest + React Testing Library)
- ✅ 60%+ test coverage for utilities, hooks, services
- ✅ Zero breaking changes to user-facing functionality

**Effort:** 80-120 development hours (2-3 weeks solo, 1 week team)

---

## Phase Breakdown

### Stage 1: Infrastructure & Setup (Days 1-2)

**Goal:** Prepare development environment for TypeScript and testing

#### Task 1.1: Install Dependencies
**Effort:** 2 hours | **Owner:** @dev

**Subtasks:**
- [ ] Install TypeScript compiler
  ```bash
  npm install --save-dev typescript
  ```
- [ ] Install type definitions
  ```bash
  npm install --save-dev @types/react @types/react-dom @types/node
  ```
- [ ] Install testing framework
  ```bash
  npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
  ```
- [ ] Install code quality tools
  ```bash
  npm install --save-dev prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
  ```
- [ ] Verify installations
  ```bash
  npm list typescript vitest prettier
  ```

**Definition of Done:**
- All dependencies installed and listed in package.json
- No version conflicts
- `npx tsc --version` shows installed version
- `npx vitest --version` works

---

#### Task 1.2: Create TypeScript Configuration
**Effort:** 3 hours | **Owner:** @dev

**Subtasks:**
- [ ] Create `tsconfig.json`
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "jsx": "react-jsx",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    },
    "include": ["src"],
    "exclude": ["node_modules"]
  }
  ```

- [ ] Convert `vite.config.js` → `vite.config.ts`
  - Rename file
  - Add type annotations
  - Update import: `import { defineConfig } from 'vite'`

- [ ] Create `vitest.config.ts`
  ```typescript
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  });
  ```

- [ ] Create `vitest.setup.ts`
  ```typescript
  import { expect, afterEach } from 'vitest';
  import { cleanup } from '@testing-library/react';
  import '@testing-library/jest-dom';

  afterEach(() => {
    cleanup();
  });
  ```

- [ ] Create `.prettierrc.json`
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2
  }
  ```

- [ ] Update `eslint.config.mjs` for TypeScript
  - Add `@typescript-eslint` parser
  - Add TypeScript-specific rules
  - Configure for `.ts` and `.tsx` files

- [ ] Update `package.json` scripts
  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "typecheck": "tsc --noEmit",
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest --coverage",
      "lint": "eslint . --ext .ts,.tsx",
      "format": "prettier --write \"src/**/*.{ts,tsx}\""
    }
  }
  ```

**Definition of Done:**
- `npx tsc --noEmit` completes without errors
- `vitest --version` works
- `npm run typecheck` passes
- `npm run test` runs without errors
- All config files created and committed

---

#### Task 1.3: Create Mock Infrastructure
**Effort:** 4 hours | **Owner:** @dev

**Subtasks:**
- [ ] Create mock directory structure
  ```
  src/__mocks__/
  ├── pocketbaseClient.ts
  ├── sonner.ts
  ├── react-router-dom.ts
  └── setupTests.ts
  ```

- [ ] Create `src/__mocks__/pocketbaseClient.ts`
  ```typescript
  import { vi } from 'vitest';

  export const mockPB = {
    collection: vi.fn(() => ({
      getFullList: vi.fn(),
      getOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      subscribe: vi.fn(),
    })),
    authStore: {
      isValid: false,
      token: '',
      model: null,
      onChange: vi.fn(),
      clear: vi.fn(),
    },
    authRefresh: vi.fn(),
  };

  export default mockPB;
  ```

- [ ] Create `src/__mocks__/sonner.ts`
  ```typescript
  import { vi } from 'vitest';

  export const toast = {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    custom: vi.fn(),
  };

  export const Toaster = () => null;
  ```

- [ ] Create `src/__mocks__/react-router-dom.ts`
  ```typescript
  import { vi } from 'vitest';

  export const useNavigate = vi.fn();
  export const useLocation = vi.fn(() => ({
    pathname: '/',
    search: '',
    hash: '',
  }));
  export const useParams = vi.fn();
  export const Link = ({ children }: any) => children;
  export const Routes = ({ children }: any) => children;
  export const Route = () => null;
  export const BrowserRouter = ({ children }: any) => children;
  ```

- [ ] Update `vitest.config.ts` with mock aliases
  ```typescript
  define: {
    'import.meta.env.VITE_PB_URL': '"http://localhost:8090"',
  },
  ```

**Definition of Done:**
- All mock files created
- Mocks can be imported in tests
- Mock functions are properly typed with Vitest
- No console warnings when importing mocks

---

### Stage 2: Type Definitions & Service Layer (Days 3-5)

**Goal:** Create shared types and service abstractions

#### Task 2.1: Create Shared Type Definitions
**Effort:** 6 hours | **Owner:** @dev

**Subtasks:**
- [ ] Create `src/types/index.ts`

  **User Types:**
  ```typescript
  export type User = {
    id: string;
    email: string;
    nome: string;
    nivel_atual: number;
    pontos_totais: number;
    streak_atual: number;
    meta_diaria_horas: number;
    data_criacao: string;
    created: string;
    updated: string;
  };

  export type AuthResponse = {
    token: string;
    record: User;
  };

  export type LoginInput = {
    email: string;
    password: string;
  };

  export type SignupInput = {
    email: string;
    password: string;
    nome: string;
  };
  ```

  **Schedule Types:**
  ```typescript
  export type Materia = {
    nome: string;
    status: 'pendente' | 'em_progresso' | 'completo';
    horas_dedicadas?: number;
  };

  export type Cronograma = {
    id: string;
    user_id: string;
    edital: string;
    materias: Materia[];
    data_inicio: string;
    data_fim: string;
    criado_em: string;
    created: string;
    updated: string;
  };
  ```

  **Session Types:**
  ```typescript
  export type Sessao = {
    id: string;
    user_id: string;
    cronograma_id: string;
    materia: string;
    duracao_minutos: number;
    data_sessao: string;
    notas?: string;
    created: string;
    updated: string;
  };

  export type Meta = {
    id: string;
    user_id: string;
    data: string;
    horas_meta: number;
    horas_realizadas: number;
    status: 'pendente' | 'em_progresso' | 'completo';
    created: string;
    updated: string;
  };
  ```

  **Badge & Points:**
  ```typescript
  export type Badge = {
    id: string;
    nome: string;
    descricao: string;
    icone?: string;
    created: string;
  };

  export type HistoricoPontos = {
    id: string;
    user_id: string;
    pontos: number;
    motivo: string;
    data: string;
    created: string;
  };
  ```

  **API Response Types:**
  ```typescript
  export type PBListResponse<T> = {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    items: T[];
  };

  export type PBResponse<T> = T & {
    created: string;
    updated: string;
    id: string;
  };
  ```

- [ ] Create `src/types/errors.ts`
  ```typescript
  export class APIError extends Error {
    constructor(
      public status: number,
      public message: string,
      public field?: string,
      public code?: string
    ) {
      super(message);
      this.name = 'APIError';
    }
  }

  export class ValidationError extends APIError {
    constructor(field: string, message: string) {
      super(400, message, field, 'VALIDATION_ERROR');
      this.name = 'ValidationError';
    }
  }

  export class AuthenticationError extends APIError {
    constructor(message: string = 'Authentication failed') {
      super(401, message, undefined, 'AUTH_ERROR');
      this.name = 'AuthenticationError';
    }
  }

  export class NotFoundError extends APIError {
    constructor(resource: string) {
      super(404, `${resource} not found`, undefined, 'NOT_FOUND');
      this.name = 'NotFoundError';
    }
  }
  ```

- [ ] Create `src/types/audio.d.ts` (for AudioContext in StudySessionPage)
  ```typescript
  declare const AudioContext: AudioContextConstructor;
  declare const webkitAudioContext: AudioContextConstructor;
  ```

**Definition of Done:**
- All types compile without errors
- Types are exported from `src/types/index.ts`
- Error classes properly extend Error
- No circular type dependencies

---

#### Task 2.2: Create Error Handling Utilities
**Effort:** 3 hours | **Owner:** @dev

**Subtasks:**
- [ ] Create `src/utils/errors.ts`
  ```typescript
  import { APIError, ValidationError, AuthenticationError, NotFoundError } from '@/types/errors';

  export const ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'Email ou senha inválida.',
    USER_NOT_FOUND: 'Usuário não encontrado.',
    EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado.',
    NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
    UNKNOWN_ERROR: 'Algo deu errado. Tente novamente.',
    UNAUTHORIZED: 'Você não tem permissão para fazer isso.',
    FORBIDDEN: 'Acesso negado.',
    SCHEDULE_NOT_FOUND: 'Cronograma não encontrado.',
    SESSION_NOT_FOUND: 'Sessão não encontrada.',
  };

  export function handlePBError(error: any): APIError {
    // Handle PocketBase-specific errors
    if (error.status === 401) {
      return new AuthenticationError('Session expired. Please login again.');
    }

    if (error.status === 404) {
      return new NotFoundError(error.message || 'Resource');
    }

    if (error.data?.['email']) {
      return new ValidationError('email', ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    if (error.message) {
      return new APIError(error.status || 500, error.message);
    }

    return new APIError(500, ERROR_MESSAGES.UNKNOWN_ERROR);
  }

  export function getUserFriendlyMessage(error: APIError): string {
    return ERROR_MESSAGES[error.code || 'UNKNOWN_ERROR'] || error.message;
  }
  ```

- [ ] Create `src/utils/validators.ts`
  ```typescript
  export function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  export function isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  export function isValidName(name: string): boolean {
    return name.trim().length >= 2;
  }
  ```

**Definition of Done:**
- Error handling works for common PocketBase errors
- User-friendly messages defined
- Validators pass basic checks
- No console errors

---

#### Task 2.3: Create Service Layer
**Effort:** 10 hours | **Owner:** @dev

**Subtasks:**
- [ ] Create `src/services/api.ts` (HTTP wrapper)
  ```typescript
  import PocketBase from 'pocketbase';
  import { handlePBError } from '@/utils/errors';

  const pb = new PocketBase(
    import.meta.env.VITE_PB_URL || 'http://localhost:8090'
  );

  export async function apiCall<T>(
    fn: () => Promise<T>,
    errorContext?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`API Error (${errorContext}):`, error);
      throw handlePBError(error);
    }
  }

  export { pb };
  ```

- [ ] Create `src/services/auth.service.ts`
  ```typescript
  import { pb, apiCall } from './api';
  import {
    User,
    LoginInput,
    SignupInput,
    AuthResponse,
  } from '@/types';
  import { AuthenticationError } from '@/types/errors';

  export const AuthService = {
    async login(input: LoginInput): Promise<AuthResponse> {
      return apiCall(async () => {
        const authData = await pb
          .collection('users')
          .authWithPassword(input.email, input.password);

        return {
          token: pb.authStore.token,
          record: authData.record as User,
        };
      }, 'login');
    },

    async signup(input: SignupInput): Promise<User> {
      return apiCall(async () => {
        const response = await pb.collection('users').create({
          email: input.email,
          password: input.password,
          passwordConfirm: input.password,
          nome: input.nome,
        });

        // Auto-login after signup
        await pb.collection('users').authWithPassword(input.email, input.password);

        return response as User;
      }, 'signup');
    },

    async logout(): Promise<void> {
      pb.authStore.clear();
    },

    async getCurrentUser(): Promise<User | null> {
      if (!pb.authStore.isValid) {
        return null;
      }

      return apiCall(async () => {
        const user = pb.authStore.model as User;
        return user;
      }, 'getCurrentUser');
    },

    async updateUser(updates: Partial<User>): Promise<User> {
      if (!pb.authStore.model?.id) {
        throw new AuthenticationError('Not authenticated');
      }

      return apiCall(async () => {
        const updated = await pb
          .collection('users')
          .update(pb.authStore.model!.id, updates);

        return updated as User;
      }, 'updateUser');
    },

    onAuthStateChange(callback: (user: User | null) => void): () => void {
      return pb.authStore.onChange(() => {
        const user = pb.authStore.isValid ? (pb.authStore.model as User) : null;
        callback(user);
      });
    },
  };
  ```

- [ ] Create `src/services/cronograma.service.ts`
  ```typescript
  import { pb, apiCall } from './api';
  import { Cronograma } from '@/types';

  export const CronogramaService = {
    async getAll(userId: string): Promise<Cronograma[]> {
      return apiCall(async () => {
        const records = await pb.collection('cronogramas').getFullList({
          filter: `user_id = "${userId}"`,
          sort: '-created',
        });

        return records as Cronograma[];
      }, 'CronogramaService.getAll');
    },

    async getById(id: string): Promise<Cronograma> {
      return apiCall(async () => {
        const record = await pb.collection('cronogramas').getOne(id);
        return record as Cronograma;
      }, 'CronogramaService.getById');
    },

    async create(data: Partial<Cronograma>): Promise<Cronograma> {
      return apiCall(async () => {
        const record = await pb.collection('cronogramas').create(data);
        return record as Cronograma;
      }, 'CronogramaService.create');
    },

    async update(id: string, data: Partial<Cronograma>): Promise<Cronograma> {
      return apiCall(async () => {
        const record = await pb.collection('cronogramas').update(id, data);
        return record as Cronograma;
      }, 'CronogramaService.update');
    },

    async delete(id: string): Promise<void> {
      return apiCall(async () => {
        await pb.collection('cronogramas').delete(id);
      }, 'CronogramaService.delete');
    },
  };
  ```

- [ ] Create `src/services/sessoes.service.ts`
  ```typescript
  import { pb, apiCall } from './api';
  import { Sessao } from '@/types';

  export const SessoesService = {
    async getByUser(userId: string): Promise<Sessao[]> {
      return apiCall(async () => {
        const records = await pb.collection('sessoes_estudo').getFullList({
          filter: `user_id = "${userId}"`,
          sort: '-created',
        });

        return records as Sessao[];
      }, 'SessoesService.getByUser');
    },

    async getByDate(userId: string, date: string): Promise<Sessao[]> {
      return apiCall(async () => {
        const records = await pb.collection('sessoes_estudo').getFullList({
          filter: `user_id = "${userId}" && data_sessao = "${date}"`,
        });

        return records as Sessao[];
      }, 'SessoesService.getByDate');
    },

    async create(data: Partial<Sessao>): Promise<Sessao> {
      return apiCall(async () => {
        const record = await pb.collection('sessoes_estudo').create(data);
        return record as Sessao;
      }, 'SessoesService.create');
    },

    async update(id: string, data: Partial<Sessao>): Promise<Sessao> {
      return apiCall(async () => {
        const record = await pb.collection('sessoes_estudo').update(id, data);
        return record as Sessao;
      }, 'SessoesService.update');
    },

    async delete(id: string): Promise<void> {
      return apiCall(async () => {
        await pb.collection('sessoes_estudo').delete(id);
      }, 'SessoesService.delete');
    },
  };
  ```

- [ ] Create `src/services/metas.service.ts` (similar pattern)
- [ ] Create `src/services/index.ts` (export all services)
  ```typescript
  export * from './auth.service';
  export * from './cronograma.service';
  export * from './sessoes.service';
  export * from './metas.service';
  ```

**Definition of Done:**
- All services created with consistent patterns
- Error handling integrated
- Services can be imported and used
- Mocks work with services
- No direct pb imports in services (centralized in api.ts)

---

### Stage 3: Core File Migration (Days 6-10)

**Goal:** Convert existing files to TypeScript using new service layer

#### Task 3.1: Migrate Utility Files
**Effort:** 2 hours | **Owner:** @dev

**Files to migrate:**
- [ ] `lib/pocketbaseClient.js` → `lib/pocketbaseClient.ts`
  - Simplify: just re-export from services/api.ts

- [ ] `lib/utils.js` → `lib/utils.ts`
  - Add type annotations
  - Keep existing logic

**Definition of Done:**
- `npm run typecheck` passes for these files
- Imports work in other files
- No breaking changes

---

#### Task 3.2: Migrate Hooks
**Effort:** 3 hours | **Owner:** @dev

**Files to migrate:**
- [ ] `hooks/useScheduleCalculator.js` → `.ts`
  - Add parameter and return types
  - Test with unit tests

- [ ] `hooks/use-toast.js` → `.ts`
  - Type the toast options

- [ ] `hooks/use-mobile.jsx` → `.tsx`
  - Type the media query hook

**Definition of Done:**
- All hooks have proper TypeScript signatures
- Hooks can be imported in pages
- No type errors

---

#### Task 3.3: Migrate AuthContext
**Effort:** 4 hours | **Owner:** @dev

**Subtasks:**
- [ ] Convert `contexts/AuthContext.jsx` → `.tsx`
  - Type the context value
  - Update useAuth hook with proper return type
  - Integrate with AuthService
  - Update error handling

**Refactored pattern:**
```typescript
import { AuthService } from '@/services';
import { User, AuthenticationError } from '@/types';

type AuthContextType = {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nome: string) => Promise<void>;
  logout: () => void;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Use AuthService.onAuthStateChange instead of direct pb.authStore
    const unsubscribe = AuthService.onAuthStateChange(setCurrentUser);
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const response = await AuthService.login({ email, password });
    setCurrentUser(response.record);
  };

  // ... other methods
};
```

**Definition of Done:**
- AuthContext uses AuthService
- No direct pb calls in AuthContext
- useAuth hook has proper types
- Protected routes work

---

#### Task 3.4: Migrate Components
**Effort:** 3 hours | **Owner:** @dev

**Files to migrate:**
- [ ] `components/ProtectedRoute.jsx` → `.tsx`
  - Add route type definitions

- [ ] `components/Header.jsx` → `.tsx`
  - Type props and children

- [ ] `components/ScrollToTop.jsx` → `.tsx`
  - Simplify types

- [ ] `components/SubjectBadge.jsx` → `.tsx`
  - Type props

**Definition of Done:**
- All components type-safe
- No implicit `any` types
- Props fully documented

---

#### Task 3.5: Migrate App & Main
**Effort:** 2 hours | **Owner:** @dev

**Files:**
- [ ] `App.jsx` → `App.tsx`
  - Update routing types
  - Add proper component typing

- [ ] `main.jsx` → `main.ts`
  - Update entry point
  - No type errors

**Definition of Done:**
- App.tsx renders without errors
- All routes work
- No TypeScript errors

---

### Stage 4: Page Migration (Days 11-14)

**Goal:** Convert pages to TypeScript with service layer integration

#### Task 4.1: Migrate LoginPage & SignupPage
**Effort:** 4 hours | **Owner:** @dev

**LoginPage.tsx refactor:**
```typescript
import { AuthService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { ValidationError } from '@/types/errors';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  // Rest of component...
};
```

**Definition of Done:**
- LoginPage uses AuthService
- Error handling works
- Form validation with Zod
- Tests pass (see Stage 5)

---

#### Task 4.2: Migrate HomePage
**Effort:** 2 hours | **Owner:** @dev

**Definition of Done:**
- Renders without errors
- Navigation works
- No type errors

---

#### Task 4.3: Migrate DashboardPage
**Effort:** 5 hours | **Owner:** @dev

**Key changes:**
- Use CronogramaService instead of direct pb calls
- Use MetasService for goals
- Add proper error handling with ErrorBoundary

**Definition of Done:**
- Dashboard loads cronogramas via service
- Data displays correctly
- Error handling integrated

---

#### Task 4.4: Migrate Other Pages
**Effort:** 6 hours | **Owner:** @dev

- [ ] CronogramaPage → use CronogramaService
- [ ] StudySessionPage → use SessoesService, handle AudioContext types
- [ ] ProgressAnalysisPage → use SessoesService
- [ ] ProfilePage → use AuthService for updates

**Definition of Done:**
- All pages migrated
- All services integrated
- No direct pb imports in pages
- `npm run typecheck` passes

---

### Stage 5: Testing Infrastructure (Days 11-16, parallel with pages)

**Goal:** Write tests for critical paths

#### Task 5.1: Setup Test Files & Patterns
**Effort:** 2 hours | **Owner:** @dev

**Subtasks:**
- [ ] Create test directory structure
  ```
  src/__tests__/
  ├── hooks/
  ├── services/
  ├── components/
  └── utils/
  ```

- [ ] Create test helper utilities
  ```typescript
  // src/__tests__/helpers.ts
  import { render, RenderOptions } from '@testing-library/react';
  import { ReactElement } from 'react';

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  export const renderWithProviders = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ) => render(ui, { wrapper: AllTheProviders, ...options });
  ```

**Definition of Done:**
- Test helper utilities created
- Can import in test files
- Provider setup works

---

#### Task 5.2: Write Utility Tests
**Effort:** 2 hours | **Owner:** @dev

**Test files:**
- [ ] `src/__tests__/utils/validators.test.ts`
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { isValidEmail, isValidPassword } from '@/utils/validators';

  describe('validators', () => {
    describe('isValidEmail', () => {
      it('should validate correct email', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
      });

      it('should reject invalid email', () => {
        expect(isValidEmail('invalid-email')).toBe(false);
      });
    });

    describe('isValidPassword', () => {
      it('should accept password >= 6 chars', () => {
        expect(isValidPassword('password123')).toBe(true);
      });

      it('should reject password < 6 chars', () => {
        expect(isValidPassword('pass')).toBe(false);
      });
    });
  });
  ```

- [ ] `src/__tests__/utils/errors.test.ts`
  - Test error creation and messages
  - Test handlePBError function

**Definition of Done:**
- Utility tests pass
- 100% coverage for utils/
- Run: `npm test -- utils`

---

#### Task 5.3: Write Hook Tests
**Effort:** 3 hours | **Owner:** @dev

**Test files:**
- [ ] `src/__tests__/hooks/useScheduleCalculator.test.ts`
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { renderHook } from '@testing-library/react';
  import { useScheduleCalculator } from '@/hooks';

  describe('useScheduleCalculator', () => {
    it('should calculate hours correctly', () => {
      const { result } = renderHook(() => useScheduleCalculator(/* params */));
      expect(result.current.totalHours).toBeGreaterThan(0);
    });
  });
  ```

- [ ] `src/__tests__/hooks/useAuth.test.ts`
  - Test authentication state
  - Test login/logout flow

**Definition of Done:**
- Hook tests pass
- 60%+ coverage for hooks
- Run: `npm test -- hooks`

---

#### Task 5.4: Write Service Tests
**Effort:** 6 hours | **Owner:** @dev

**Test files:**
- [ ] `src/__tests__/services/auth.service.test.ts`
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { AuthService } from '@/services';
  import { mockPB } from '@/__mocks__/pocketbaseClient';

  vi.mock('@/services/api', () => ({
    pb: mockPB,
    apiCall: vi.fn((fn) => fn()),
  }));

  describe('AuthService', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('login', () => {
      it('should login with valid credentials', async () => {
        mockPB.collection('users').authWithPassword.mockResolvedValue({
          record: { id: '1', email: 'user@test.com' },
        });

        const result = await AuthService.login({
          email: 'user@test.com',
          password: 'password',
        });

        expect(result.record.email).toBe('user@test.com');
      });

      it('should throw AuthenticationError on invalid credentials', async () => {
        mockPB.collection('users').authWithPassword.mockRejectedValue({
          status: 401,
          message: 'Invalid credentials',
        });

        await expect(
          AuthService.login({ email: 'user@test.com', password: 'wrong' })
        ).rejects.toThrow('AuthenticationError');
      });
    });

    describe('signup', () => {
      it('should create new user', async () => {
        mockPB.collection('users').create.mockResolvedValue({
          id: '1',
          email: 'new@test.com',
          nome: 'New User',
        });

        const result = await AuthService.signup({
          email: 'new@test.com',
          password: 'password',
          nome: 'New User',
        });

        expect(result.email).toBe('new@test.com');
      });
    });

    describe('logout', () => {
      it('should clear auth store', () => {
        AuthService.logout();
        expect(mockPB.authStore.clear).toHaveBeenCalled();
      });
    });
  });
  ```

- [ ] `src/__tests__/services/cronograma.service.test.ts`
  - Test getAll, getById, create, update, delete

- [ ] `src/__tests__/services/sessoes.service.test.ts`
  - Test session CRUD operations

- [ ] `src/__tests__/services/metas.service.test.ts`
  - Test goals CRUD operations

**Definition of Done:**
- Service tests pass
- 70%+ coverage for services
- Run: `npm test -- services`

---

#### Task 5.5: Write Component Tests
**Effort:** 4 hours | **Owner:** @dev

**Test files:**
- [ ] `src/__tests__/components/ProtectedRoute.test.tsx`
  - Test protected routes with auth
  - Test redirect on unauthenticated

- [ ] `src/__tests__/components/Header.test.tsx`
  - Test navigation items
  - Test logout button

**Definition of Done:**
- Component tests pass
- 50%+ coverage for components
- Run: `npm test -- components`

---

### Stage 6: Testing & Validation (Days 15-16)

**Goal:** Ensure all changes work correctly

#### Task 6.1: Run Full Type Check
**Effort:** 1 hour | **Owner:** @dev

```bash
npm run typecheck
# Should output: "✓ 0 errors"
```

**Definition of Done:**
- Zero TypeScript errors
- Zero TypeScript warnings (target <10 total)

---

#### Task 6.2: Run Full Test Suite
**Effort:** 1 hour | **Owner:** @dev

```bash
npm test
# Should show: >60% overall coverage
```

**Subtasks:**
- [ ] All tests pass
- [ ] Generate coverage report
  ```bash
  npm run test:coverage
  ```
- [ ] Coverage ≥60% for:
  - utils/: 100%
  - hooks/: 70%
  - services/: 70%
  - components/: 50%

**Definition of Done:**
- All tests passing
- No console warnings
- Coverage metrics documented

---

#### Task 6.3: Run Linting & Formatting
**Effort:** 1 hour | **Owner:** @dev

```bash
npm run lint
npm run format
```

**Definition of Done:**
- ESLint: 0 errors (< 10 warnings acceptable)
- Prettier: All files formatted
- No breaking lint changes

---

#### Task 6.4: Manual Testing Checklist
**Effort:** 2 hours | **Owner:** @dev

**Test scenarios:**
- [ ] Sign up works
  1. Go to /signup
  2. Enter email, password, name
  3. Submit form
  4. Redirected to dashboard
  5. Check localStorage for auth token

- [ ] Login works
  1. Go to /login
  2. Enter valid credentials
  3. Redirected to dashboard
  4. User name appears in header

- [ ] Logout works
  1. Click logout in header
  2. Redirected to home
  3. Token cleared from localStorage

- [ ] Dashboard loads
  1. Go to /dashboard
  2. Cronogramas load and display
  3. Daily goals visible
  4. Progress chart renders

- [ ] Page transitions
  1. Navigate between all pages
  2. No console errors
  3. Back/forward browser buttons work

- [ ] Error handling
  1. Try invalid login
  2. Error message displays
  3. Page doesn't crash

**Definition of Done:**
- All test scenarios pass
- No console errors
- No broken images/links
- Performance acceptable (< 3s load)

---

#### Task 6.5: Integration Testing (Optional, if time permits)
**Effort:** 4 hours | **Owner:** @dev

**E2E test framework:** Playwright or Cypress

**Test scenarios:**
- [ ] Complete signup → login → create schedule → add session → view progress flow
- [ ] Handle network errors gracefully
- [ ] Concurrent updates don't cause conflicts

**Definition of Done:**
- E2E tests pass (if implemented)
- Critical user paths verified

---

### Stage 7: Documentation & Cleanup (Days 16-17)

**Goal:** Document changes and prepare for Phase 2

#### Task 7.1: Update CLAUDE.md
**Effort:** 1 hour | **Owner:** @dev

**Updates:**
- [ ] Add TypeScript setup instructions
- [ ] Update test commands
- [ ] Document service layer usage
- [ ] Add testing guidelines

**Definition of Done:**
- CLAUDE.md updated and accurate
- Developers can follow instructions

---

#### Task 7.2: Create Migration Guide
**Effort:** 1 hour | **Owner:** @dev

**File: `docs/MIGRATION-NOTES.md`**
- Summary of Phase 1 changes
- Breaking changes (if any)
- How to use new service layer
- Testing guidelines

**Definition of Done:**
- Guide is comprehensive
- Code examples provided

---

#### Task 7.3: Code Cleanup
**Effort:** 1 hour | **Owner:** @dev

**Subtasks:**
- [ ] Remove old .js files (backup first)
- [ ] Update imports across project
- [ ] Remove unused dependencies
- [ ] Format all files consistently

**Definition of Done:**
- No old files remaining
- No unused imports
- Clean directory structure

---

#### Task 7.4: Commit & Push
**Effort:** 1 hour | **Owner:** @devops

**Git workflow:**
```bash
# Create feature branch
git checkout -b feat/phase-1-typescript

# Stage all changes
git add -A

# Create commits (suggested)
git commit -m "feat: add TypeScript configuration and build tools"
git commit -m "feat: create shared type definitions and service layer"
git commit -m "feat: migrate core files to TypeScript"
git commit -m "feat: add comprehensive test suite"
git commit -m "docs: update documentation for Phase 1"

# Push to GitHub
git push -u origin feat/phase-1-typescript

# Create PR via GitHub
gh pr create --title "Phase 1: TypeScript Migration & Service Layer" \
  --body "Complete TypeScript setup, service layer abstraction, and testing infrastructure"
```

**Definition of Done:**
- All commits pushed
- PR created on GitHub
- CI/CD checks passing

---

## Timeline & Schedule

```
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 1 TIMELINE (2-3 WEEKS)                  │
└─────────────────────────────────────────────────────────────────┘

WEEK 1 (Mar 26 - Mar 29)
├─ Days 1-2: Infrastructure Setup
│  ├─ Task 1.1: Install Dependencies (2h)
│  ├─ Task 1.2: TypeScript Configuration (3h)
│  └─ Task 1.3: Mock Infrastructure (4h)
│  📊 Progress: Infrastructure ready for development
│
├─ Days 3-5: Type Definitions & Service Layer
│  ├─ Task 2.1: Shared Type Definitions (6h)
│  ├─ Task 2.2: Error Handling (3h)
│  └─ Task 2.3: Service Layer Creation (10h)
│  📊 Progress: Service layer complete, can migrate pages
│
└─ END OF WEEK 1: ~28 hours invested

WEEK 2 (Apr 2 - Apr 5)
├─ Days 6-10: Core File Migration
│  ├─ Task 3.1: Utility Files (2h)
│  ├─ Task 3.2: Hooks (3h)
│  ├─ Task 3.3: AuthContext (4h)
│  ├─ Task 3.4: Components (3h)
│  └─ Task 3.5: App & Main (2h)
│  📊 Progress: Foundation migrated, app still functional
│
├─ Days 11-14: Page Migration (Parallel with testing)
│  ├─ Task 4.1: LoginPage & SignupPage (4h)
│  ├─ Task 4.2: HomePage (2h)
│  ├─ Task 4.3: DashboardPage (5h)
│  └─ Task 4.4: Other Pages (6h)
│  📊 Progress: All pages migrated to TypeScript
│
└─ END OF WEEK 2: ~31 hours invested

WEEK 3 (Apr 8 - Apr 9)
├─ Days 11-16: Testing (Parallel with pages)
│  ├─ Task 5.1: Test Setup (2h)
│  ├─ Task 5.2: Utility Tests (2h)
│  ├─ Task 5.3: Hook Tests (3h)
│  ├─ Task 5.4: Service Tests (6h)
│  └─ Task 5.5: Component Tests (4h)
│  📊 Progress: >60% test coverage achieved
│
├─ Days 15-16: Testing & Validation
│  ├─ Task 6.1: Type Check (1h)
│  ├─ Task 6.2: Test Suite (1h)
│  ├─ Task 6.3: Linting (1h)
│  ├─ Task 6.4: Manual Testing (2h)
│  └─ Task 6.5: E2E Testing [OPTIONAL] (4h)
│  📊 Progress: All quality gates passing
│
├─ Days 16-17: Documentation & Cleanup
│  ├─ Task 7.1: Update CLAUDE.md (1h)
│  ├─ Task 7.2: Migration Guide (1h)
│  ├─ Task 7.3: Code Cleanup (1h)
│  └─ Task 7.4: Commit & Push (1h)
│  📊 Progress: Phase 1 COMPLETE ✅
│
└─ END OF WEEK 3: ~27 hours invested
   TOTAL PHASE 1: ~80-120 hours (solo), 40-60 hours (pair/team)

┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 1 MILESTONES                            │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Apr 1: Service layer operational                             │
│ ✓ Apr 3: Core files migrated                                   │
│ ✓ Apr 5: All pages migrated                                    │
│ ✓ Apr 7: >60% test coverage                                    │
│ ✓ Apr 9: Phase 1 complete, ready for Phase 2                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Resource Requirements

### Personnel
- **Primary Developer:** 1 full-time (80-120 hours)
- **DevOps (for commits/PRs):** @devops agent
- **Code Reviewer:** Optional, recommended

### Tools & Services
- GitHub (for PRs, CI/CD)
- VS Code with TypeScript extension
- Node.js 18+
- Vitest for testing
- Prettier for formatting
- ESLint for linting

### Dependencies to Install
```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "prettier": "^3.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

---

## Success Criteria

### Code Quality
- ✅ Zero TypeScript errors (`npm run typecheck` passes)
- ✅ ESLint: 0 errors (< 10 warnings)
- ✅ Prettier: All files formatted consistently
- ✅ No `any` types (explicit typing required)

### Test Coverage
- ✅ Overall: ≥60%
  - Utils: 100%
  - Hooks: 70%
  - Services: 70%
  - Components: 50%
- ✅ All critical paths tested (auth, CRUD operations)
- ✅ 0 failing tests

### Functionality
- ✅ All existing features work identically
- ✅ No breaking changes to user experience
- ✅ Performance unchanged or improved
- ✅ All routes accessible
- ✅ Auth flow works completely

### Documentation
- ✅ CLAUDE.md updated
- ✅ Migration guide created
- ✅ Code comments for complex logic
- ✅ Test examples provided

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| PocketBase type definitions incomplete | Medium | Medium | Create stub d.ts, test early |
| Complex pages take longer to migrate | Medium | Medium | Start with simple pages, pair program |
| Test coverage goals not met | Low | Low | Add tests incrementally, focus on services |
| Breaking changes in dependencies | Low | High | Pin versions in package.json, test thoroughly |
| Audio context typing issues | Low | Medium | Create audio.d.ts early, test StudySessionPage |

---

## Phase 1 → Phase 2 Handoff

**Deliverables to Phase 2:**
1. ✅ Fully typed application (TypeScript)
2. ✅ Service layer abstractions (no pb imports in components)
3. ✅ Test suite foundation (>60% coverage)
4. ✅ Error handling standardized
5. ✅ CI/CD pipelines automated
6. ✅ Documentation updated

**Phase 2 Focus:** State management, React Query, performance optimization

**Phase 2 Prerequisites:**
- Phase 1 merged to main
- CI/CD tests passing
- Code review approved

---

## Appendix: Command Reference

### Setup Commands
```bash
# Install dependencies
npm install
npm install --save-dev typescript vitest @testing-library/react

# Initial setup
npm run build
npm run typecheck
npm test
```

### Development Commands
```bash
npm run dev          # Start dev server
npm run typecheck    # Check types
npm run lint         # Check linting
npm run format       # Format code with Prettier
npm test             # Run tests
npm test:ui          # Run tests with UI
npm test:coverage    # Generate coverage report
```

### Git Workflow
```bash
git checkout -b feat/phase-1-typescript
git add .
git commit -m "message"
git push -u origin feat/phase-1-typescript
gh pr create
```

---

**Plan Created:** 2026-03-26
**Plan Status:** 📋 Ready for Execution
**Estimated Completion:** 2026-04-09

---

