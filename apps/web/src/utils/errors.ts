/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly messages
 */

import {
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  NetworkError,
} from '@/types';

/**
 * User-friendly error messages in Portuguese
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  INVALID_CREDENTIALS: 'Email ou senha inválida.',
  AUTH_FAILED: 'Falha na autenticação. Tente novamente.',
  AUTH_ERROR: 'Erro de autenticação.',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',

  // User
  USER_NOT_FOUND: 'Usuário não encontrado.',
  USER_EXISTS: 'Este usuário já existe.',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado.',

  // Validation
  INVALID_EMAIL: 'Email inválido.',
  INVALID_PASSWORD: 'Senha inválida (mínimo 8 caracteres).',
  INVALID_NAME: 'Nome inválido.',
  VALIDATION_ERROR: 'Erro de validação. Verifique os campos.',

  // Resources
  CRONOGRAMA_NOT_FOUND: 'Cronograma não encontrado.',
  SESSAO_NOT_FOUND: 'Sessão não encontrada.',
  META_NOT_FOUND: 'Meta não encontrada.',
  RESOURCE_NOT_FOUND: 'Recurso não encontrado.',

  // Permissions
  UNAUTHORIZED: 'Você não tem permissão para fazer isso.',
  FORBIDDEN: 'Acesso negado.',

  // Network
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  TIMEOUT: 'Requisição demorou muito. Tente novamente.',
  CONNECTION_REFUSED: 'Falha ao conectar com o servidor.',

  // Conflicts
  DUPLICATE_ENTRY: 'Este entrada já existe.',
  CONFLICT: 'Conflito ao salvar. Tente novamente.',

  // Generic
  UNKNOWN_ERROR: 'Algo deu errado. Tente novamente.',
  INTERNAL_SERVER_ERROR: 'Erro no servidor. Tente mais tarde.',

  // Form
  FORM_INVALID: 'Formulário inválido. Verifique os campos.',
  FORM_SUBMIT_ERROR: 'Erro ao enviar formulário.',
};

/**
 * Map PocketBase error responses to APIError instances
 * Handles various error formats from PocketBase
 */
export function handlePBError(error: any): APIError {
  // Handle network errors
  if (!error) {
    return new NetworkError(ERROR_MESSAGES.UNKNOWN_ERROR);
  }

  // Handle string errors (simple error messages)
  if (typeof error === 'string') {
    return new APIError(500, error);
  }

  // Handle PocketBase API errors (with status and message)
  const status = error.status || error.code || 500;
  const message = error.message || error.msg || '';

  // Specific error types by status
  if (status === 401) {
    return new AuthenticationError(ERROR_MESSAGES.SESSION_EXPIRED);
  }

  if (status === 403) {
    return new AuthorizationError(ERROR_MESSAGES.UNAUTHORIZED);
  }

  if (status === 404) {
    return new NotFoundError(message || 'Resource');
  }

  if (status === 409) {
    return new ConflictError(message || ERROR_MESSAGES.CONFLICT);
  }

  // Handle validation errors
  if (status === 400) {
    // Check for field-specific validation errors
    if (error.data) {
      const fields = Object.keys(error.data);
      if (fields.length > 0) {
        const field = fields[0];
        const fieldError = error.data[field];
        return new ValidationError(field, fieldError?.message || message);
      }
    }

    // Check for specific validation messages
    if (message.includes('email')) {
      return new ValidationError('email', ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    return new APIError(400, message || ERROR_MESSAGES.VALIDATION_ERROR);
  }

  // Handle network/timeout errors
  if (status === 0 || error.isNetworkError) {
    return new NetworkError(ERROR_MESSAGES.NETWORK_ERROR);
  }

  // Default: generic API error
  return new APIError(status, message || ERROR_MESSAGES.UNKNOWN_ERROR);
}

/**
 * Get user-friendly message for an error
 * Falls back to error message if no mapping found
 */
export function getUserFriendlyMessage(error: APIError | Error): string {
  if (error instanceof APIError) {
    // Try to find a matching message by code
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }

    // Return the error message itself if it's user-friendly
    return error.message;
  }

  // For generic Error objects, return message or generic fallback
  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if an error is of a specific type
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Log error for debugging (in development)
 */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
}
