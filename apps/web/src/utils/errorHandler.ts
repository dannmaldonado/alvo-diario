import { toast } from 'sonner';

/**
 * Global error handler for API and application errors
 * Logs errors and displays user-friendly messages
 */

export interface ErrorResponse {
  status?: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Handle different types of errors consistently
 */
export const handleError = (error: any, context?: string): ErrorResponse => {
  let response: ErrorResponse = {
    message: 'Um erro inesperado ocorreu. Tente novamente.',
  };

  // Log for debugging
  console.error(`[${context || 'Error'}]`, error);

  // Handle network errors
  if (!navigator.onLine) {
    response = {
      status: 0,
      message: 'Sem conexão com a internet. Verifique sua conexão.',
      code: 'NETWORK_ERROR',
    };
    toast.error(response.message);
    return response;
  }

  // Handle API errors (Fetch API)
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    response = {
      status: 0,
      message: 'Erro ao conectar com o servidor. Tente novamente.',
      code: 'CONNECTION_ERROR',
    };
    toast.error(response.message);
    return response;
  }

  // Handle validation errors
  if (error.code === 'VALIDATION_ERROR' || error.name === 'ZodError') {
    const issues = error.issues || error.errors || [];
    response = {
      status: 400,
      message: issues[0]?.message || 'Dados inválidos. Verifique o formulário.',
      code: 'VALIDATION_ERROR',
      details: issues,
    };
    toast.error(response.message);
    return response;
  }

  // Handle authentication errors
  if (error.code === 'AUTHENTICATION_ERROR' || error.status === 401) {
    response = {
      status: 401,
      message: 'Sessão expirada. Faça login novamente.',
      code: 'AUTHENTICATION_ERROR',
    };
    // Optionally redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
    toast.error(response.message);
    return response;
  }

  // Handle authorization errors
  if (error.status === 403) {
    response = {
      status: 403,
      message: 'Você não tem permissão para acessar este recurso.',
      code: 'AUTHORIZATION_ERROR',
    };
    toast.error(response.message);
    return response;
  }

  // Handle not found errors
  if (error.status === 404 || error.code === 'NOT_FOUND') {
    response = {
      status: 404,
      message: 'Recurso não encontrado.',
      code: 'NOT_FOUND_ERROR',
    };
    toast.error(response.message);
    return response;
  }

  // Handle server errors
  if (error.status === 500 || (error.status && error.status >= 500)) {
    response = {
      status: error.status,
      message: 'Erro no servidor. Tente novamente mais tarde.',
      code: 'SERVER_ERROR',
    };
    toast.error(response.message);
    return response;
  }

  // Handle API error objects with message
  if (error.message && typeof error.message === 'string') {
    response = {
      status: error.status || 500,
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
    };
    toast.error(response.message);
    return response;
  }

  // Handle string errors
  if (typeof error === 'string') {
    response = {
      message: error,
      code: 'STRING_ERROR',
    };
    toast.error(response.message);
    return response;
  }

  // Generic fallback
  toast.error(response.message);
  return response;
};

/**
 * Handle error with custom callback for retry
 */
export const handleErrorWithRetry = (
  error: any,
  onRetry: () => Promise<void>,
  context?: string
): void => {
  const errorResponse = handleError(error, context);

  // Show retry toast for certain error types
  if (
    errorResponse.code === 'CONNECTION_ERROR' ||
    errorResponse.code === 'SERVER_ERROR'
  ) {
    toast.error(errorResponse.message, {
      action: {
        label: 'Tentar Novamente',
        onClick: onRetry,
      },
    });
  }
};

/**
 * Setup global error listener for unhandled errors
 */
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleError(event.reason, 'UnhandledPromiseRejection');
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (event.error) {
      handleError(event.error, 'GlobalError');
    }
  });
};
