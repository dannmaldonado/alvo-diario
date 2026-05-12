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
  status: 'nao_iniciada' | 'em_progresso' | 'concluida';
  horas_dedicadas?: number;
  topicos?: string[];
};

export type Cronograma = {
  id: string;
  user_id: string;
  edital: string;
  banca?: string | null;
  materias: Materia[];
  data_alvo: string;
  data_inicio?: string;
  status?: 'ativo' | 'concluido' | 'pausado';
  verticalizacao?: EditalVerticalizado | null;
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
  material_id?: string;
  material_nome?: string;
  paginas_lidas?: number;
  videoaulas?: number;
  created: string;
  updated: string;
};

// ============================================================================
// STUDY MATERIAL TYPES
// ============================================================================

export type MaterialTipo = 'curso_online' | 'livro' | 'apostila' | 'outro';

export type Material = {
  id: string;
  user_id: string;
  nome: string;
  tipo: MaterialTipo;
  descricao?: string;
  ativo: number;
  created: string;
  updated: string;
};

export type CreateMaterialInput = {
  nome: string;
  tipo: MaterialTipo;
  descricao?: string;
};

export type UpdateMaterialInput = Partial<CreateMaterialInput> & { ativo?: number };

export type CreateSessaoInput = Omit<Sessao, 'id' | 'created' | 'updated'> & {
  notas?: string;
  material_id?: string;
  material_nome?: string;
  paginas_lidas?: number;
  videoaulas?: number;
};

export type UpdateSessaoInput = Partial<CreateSessaoInput>;

// ============================================================================
// DAILY GOALS TYPES
// ============================================================================

export type DailyRatingValue = 1 | 2 | 3 | 4 | 5;

export type Meta = {
  id: string;
  user_id: string;
  data: string;
  horas_meta: number;
  horas_realizadas: number;
  status: 'nao_iniciada' | 'em_progresso' | 'concluida';
  avaliacao_diaria?: DailyRatingValue;
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
  rating_multiplier?: number;
  created: string;
  updated: string;
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

// ============================================================================
// AI QUESTION TYPES
// ============================================================================

export type QuestaoQualidade = 'facil' | 'media' | 'dificil';

export type Questao = {
  id: string;
  user_id: string;
  sessao_id: string | null;
  materia: string;
  banca: string | null;
  enunciado: string;
  opcoes: string[];           // 4 items: ["A) ...", "B) ...", ...]
  resposta_correta: number;  // index 0-3
  explicacao: string | null;
  dificuldade: QuestaoQualidade;
  ease_factor: number;
  interval_days: number;
  next_review: string | null;
  review_count: number;
  status: string;
  created: string;
};

export type RespostaQuestao = {
  id: string;
  questao_id: string;
  resposta: number;
  correta: boolean;
  resposta_correta: number;
  explicacao: string | null;
  next_review: string;
  criada?: string;
};

export type GerarQuestoesInput = {
  sessao_id?: string;
  materia: string;
  banca?: string | null;
  material_nome?: string;
  quantidade?: number;
  dificuldade?: QuestaoQualidade;
};

export type ResponderQuestaoInput = {
  sessao_id?: string;
  resposta: number;
  tempo_resposta_s?: number;
};

export type AccuracyByMateria = {
  materia: string;
  total: number;
  acertos: number;
  taxa: number;  // 0.0–1.0
};

// ============================================================================
// EXTERNAL QUESTIONS LOG
// ============================================================================

export type QuestaoExterna = {
  id: string;
  user_id: string;
  data: string;           // YYYY-MM-DD
  fonte: string;          // 'Gran Concurso' | 'Tec Concurso' | 'Simulado' | 'Outro'
  materia: string;
  total_questoes: number;
  acertos: number;
  erros: number;
  created: string;
};

export type CreateQuestaoExternaInput = {
  data: string;
  fonte: string;
  materia: string;
  total_questoes: number;
  acertos: number;
};

// ============================================================================
// MISSIONS TYPES
// ============================================================================

export type MissaoTipo = 'study' | 'review' | 'accuracy' | 'streak';
export type MissaoStatus = 'pendente' | 'concluida' | 'ignorada';

export type Missao = {
  id: string;
  user_id: string;
  tipo: MissaoTipo;
  titulo: string;
  descricao: string;
  materia: string | null;
  meta_minutos: number | null;
  meta_questoes: number | null;
  status: MissaoStatus;
  expires_at: string;
  created_at: string;
};

// ============================================================================
// MAPA DA BANCA TYPES
// ============================================================================

export type MapaBancaArea = {
  area: string;
  peso: number;       // 0–100
  dica: string;
};

export type MapaBanca = {
  banca: string;
  perfil: string;
  estilo_questoes: string;
  distribuicao: MapaBancaArea[];
  pontos_criticos: string[];
  dicas_estrategicas: string[];
  cached?: boolean;
};

// ============================================================================
// EDITAL TYPES
// ============================================================================

export type EditalMateria = {
  nome: string;
  topicos: string[];
};

export type EditalParseResult = {
  concurso: string;
  banca: string | null;
  materias: EditalMateria[];
};

// ============================================================================
// EDITAL VERTICALIZADO TYPES
// ============================================================================

export type IncidenciaLevel = 'alta' | 'media' | 'baixa';
export type PrioridadeLevel = 'alta' | 'media' | 'baixa';

export type EditalVerticalizado_Topico = {
  nome: string;
  incidencia: IncidenciaLevel;
  dica?: string;
};

export type EditalVerticalizado_Materia = {
  nome: string;
  peso_historico: number;   // % of questions historically dedicated to this subject
  prioridade: PrioridadeLevel;
  observacao?: string;
  topicos: EditalVerticalizado_Topico[];
};

export type EditalVerticalizado = {
  banca: string;
  concurso?: string;
  resumo_estrategico?: string;
  materias: EditalVerticalizado_Materia[];
};

// All types are exported directly from this file
