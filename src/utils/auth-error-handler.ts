/**
 * Centralized error handling functions for authentication
 */

import { toast } from "sonner";
import { AuthError as SupabaseAuthError } from '@supabase/supabase-js';

/**
 * AuthError types for better classification of errors
 */
export enum AuthErrorType {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  SERVER = "server",
  EXPIRED_SESSION = "expired_session",
  RATE_LIMIT = "rate_limit",
  UNKNOWN = "unknown"
}

/**
 * Custom error interface for authentication errors
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: unknown;
  code?: string;
}

/**
 * Maps Supabase error codes to user-friendly messages
 */
const supabaseErrorMessages: Record<string, string> = {
  'auth/invalid-email': 'Podany adres email jest nieprawidłowy.',
  'auth/user-not-found': 'Niepoprawny email lub hasło.',
  'auth/wrong-password': 'Niepoprawny email lub hasło.',
  'auth/email-already-in-use': 'Ten adres email jest już zarejestrowany.',
  'auth/weak-password': 'Hasło jest zbyt słabe. Użyj silniejszego hasła.',
  'auth/too-many-requests': 'Za dużo prób logowania. Spróbuj ponownie później.',
  'auth/expired-action-code': 'Link do resetowania hasła wygasł. Poproś o nowy link.',
  'auth/invalid-action-code': 'Link do resetowania hasła jest nieprawidłowy.',
  'auth/argument-error': 'Nieprawidłowe dane wejściowe. Sprawdź wprowadzone informacje.',
  'auth/invalid-credential': 'Niepoprawne dane uwierzytelniające.',
  'auth/invalid-verification-code': 'Nieprawidłowy kod weryfikacyjny.',
  'auth/invalid-verification-id': 'Nieprawidłowy identyfikator weryfikacji.',
  'auth/session-expired': 'Twoja sesja wygasła. Zaloguj się ponownie.',
  'auth/internal-error': 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie później.',
};

/**
 * Handles authentication errors in a consistent way
 * @param error The error to handle
 * @param defaultMessage Default message to show if error is not recognized
 * @returns Formatted AuthError object
 */
export function handleAuthError(error: unknown, defaultMessage = "Wystąpił błąd podczas uwierzytelniania"): AuthError {
  // Handle Supabase Auth errors
  if (error instanceof SupabaseAuthError) {
    const code = error.code || '';
    
    // Rate limiting errors
    if (code.includes('rate_limit') || error.message.includes('too many requests')) {
      return {
        type: AuthErrorType.RATE_LIMIT,
        message: "Za dużo prób. Spróbuj ponownie za kilka minut.",
        originalError: error,
        code
      };
    }
    
    // Session expiration
    if (code.includes('expired') || error.message.includes('expired')) {
      return {
        type: AuthErrorType.EXPIRED_SESSION,
        message: "Twoja sesja wygasła. Zaloguj się ponownie.",
        originalError: error,
        code
      };
    }
    
    // Lookup message from our mapping
    if (code && code in supabaseErrorMessages) {
      return {
        type: getErrorTypeFromCode(code),
        message: supabaseErrorMessages[code],
        originalError: error,
        code
      };
    }
    
    // Other Supabase errors
    return {
      type: getErrorTypeFromMessage(error.message),
      message: getFriendlyMessage(error.message),
      originalError: error,
      code
    };
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes("network")) {
    return {
      type: AuthErrorType.NETWORK,
      message: "Problem z połączeniem internetowym. Sprawdź swoje połączenie i spróbuj ponownie.",
      originalError: error
    };
  }

  // Handle errors with standard structure
  if (error && typeof error === "object" && "message" in error) {
    const errorMessage = String(error.message);
    
    // Validation errors
    if (errorMessage.includes("password") || errorMessage.includes("email")) {
      return {
        type: AuthErrorType.VALIDATION,
        message: errorMessage,
        originalError: error
      };
    }
    
    // Authentication errors
    if (
      errorMessage.includes("Invalid login") ||
      errorMessage.includes("Invalid credentials") ||
      errorMessage.includes("Invalid email")
    ) {
      return {
        type: AuthErrorType.AUTHENTICATION,
        message: "Niepoprawny email lub hasło",
        originalError: error
      };
    }
    
    // Server errors
    if (errorMessage.includes("server") || errorMessage.includes("503") || errorMessage.includes("500")) {
      return {
        type: AuthErrorType.SERVER,
        message: "Problem z serwerem. Spróbuj ponownie później.",
        originalError: error
      };
    }
    
    // Return message from error if available
    return {
      type: AuthErrorType.UNKNOWN,
      message: errorMessage,
      originalError: error
    };
  }
  
  // Default error
  return {
    type: AuthErrorType.UNKNOWN,
    message: defaultMessage,
    originalError: error
  };
}

/**
 * Shows an error toast with a consistent message
 * @param error Error to display
 * @param defaultMessage Default message to show if error is not recognized
 */
export function showAuthError(error: unknown, defaultMessage = "Wystąpił błąd podczas uwierzytelniania"): void {
  const formattedError = handleAuthError(error, defaultMessage);
  toast.error(formattedError.message);
}

/**
 * Determine error type from error code
 */
function getErrorTypeFromCode(code: string): AuthErrorType {
  if (code.includes('invalid') || code.includes('wrong') || code.includes('not-found')) {
    return AuthErrorType.AUTHENTICATION;
  }
  if (code.includes('expired')) {
    return AuthErrorType.EXPIRED_SESSION;
  }
  if (code.includes('weak') || code.includes('argument') || code.includes('in-use')) {
    return AuthErrorType.VALIDATION;
  }
  if (code.includes('rate') || code.includes('too-many')) {
    return AuthErrorType.RATE_LIMIT;
  }
  if (code.includes('internal') || code.includes('server')) {
    return AuthErrorType.SERVER;
  }
  return AuthErrorType.UNKNOWN;
}

/**
 * Determine error type from error message
 */
function getErrorTypeFromMessage(message: string): AuthErrorType {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('invalid') || lowerMessage.includes('incorrect') || 
      lowerMessage.includes('wrong') || lowerMessage.includes('not found')) {
    return AuthErrorType.AUTHENTICATION;
  }
  if (lowerMessage.includes('expired')) {
    return AuthErrorType.EXPIRED_SESSION;
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('required') || 
      lowerMessage.includes('must be') || lowerMessage.includes('already exists')) {
    return AuthErrorType.VALIDATION;
  }
  if (lowerMessage.includes('too many') || lowerMessage.includes('rate limit')) {
    return AuthErrorType.RATE_LIMIT;
  }
  if (lowerMessage.includes('server') || lowerMessage.includes('internal') || 
      lowerMessage.includes('unavailable')) {
    return AuthErrorType.SERVER;
  }
  return AuthErrorType.UNKNOWN;
}

/**
 * Get a user-friendly message from technical error messages
 */
function getFriendlyMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('password') && (
      lowerMessage.includes('weak') || lowerMessage.includes('strong'))) {
    return 'Hasło jest zbyt słabe. Użyj silniejszego hasła.';
  }
  
  if (lowerMessage.includes('email') && lowerMessage.includes('already')) {
    return 'Ten adres email jest już zarejestrowany.';
  }
  
  if (lowerMessage.includes('invalid') && lowerMessage.includes('email')) {
    return 'Podany adres email jest nieprawidłowy.';
  }
  
  if (lowerMessage.includes('credentials') || 
      (lowerMessage.includes('email') && lowerMessage.includes('password'))) {
    return 'Niepoprawny email lub hasło.';
  }
  
  if (lowerMessage.includes('rate') || lowerMessage.includes('too many')) {
    return 'Za dużo prób. Spróbuj ponownie za kilka minut.';
  }
  
  return message; // Return original if no friendly version found
}