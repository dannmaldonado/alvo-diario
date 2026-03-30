/**
 * Shared Type Definitions for alvo-diario
 * Central location for all application types
 */

// ============================================================================
// USER TYPES
// ============================================================================

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
  passwordConfirm?: string;
  nome: string;
};

export type UpdateUserInput = Partial<
  Omit<User, 'id' | 'created' | 'updated' | 'email'>
>;

// ============================================================================
// SCHEDULE & SUBJECT TYPES
// ============================================================================

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
  data_alvo?: string;
  created: string;
  updated: string;
};

export type CreateCronogramaInput = Omit<
  Cronograma,
  'id' | 'created' | 'updated'
>;

export type UpdateCronogramaInput = Partial<CreateCronogramaInput>;

// ============================================================================
// STUDY SESSION TYPES
// ============================================================================

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

export type CreateSessaoInput = Omit<Sessao, 'id' | 'created' | 'updated'>;

export type UpdateSessaoInput = Partial<CreateSessaoInput>;

// ============================================================================
// DAILY GOALS TYPES
// ============================================================================

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

export type CreateMetaInput = Omit<Meta, 'id' | 'created' | 'updated'>;

export type UpdateMetaInput = Partial<CreateMetaInput>;

// ============================================================================
// BADGES & ACHIEVEMENTS TYPES
// ============================================================================

export type Badge = {
  id: string;
  nome: string;
  descricao: string;
  icone?: string;
  created: string;
  updated: string;
};

export type HistoricoPontos = {
  id: string;
  user_id: string;
  pontos: number;
  motivo: string;
  data: string;
  created: string;
  updated: string;
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

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

// ============================================================================
// ERROR TYPES
// ============================================================================

export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class ValidationError extends APIError {
  constructor(field: string, message: string) {
    super(400, message, field, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, undefined, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(403, message, undefined, 'AUTHZ_ERROR');
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(404, `${resource} not found`, undefined, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(409, message, undefined, 'CONFLICT');
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network error') {
    super(0, message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

// ============================================================================
// PAGINATION & QUERY TYPES
// ============================================================================

export type PaginationParams = {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
};

export type ListOptions = {
  sort?: string;
  filter?: string;
  expand?: string;
  fields?: string;
};

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<T, E = APIError> = {
  state: LoadingState;
  data: T | null;
  error: E | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
};

// ============================================================================
// FORM TYPES
// ============================================================================

export type FormError = {
  field: string;
  message: string;
};

export type FormErrors = Record<string, string>;

// All types are exported directly from this file
