/**
 * Centralized error handling functions for authentication
 */

import { toast } from "sonner";

/**
 * AuthError types for better classification of errors
 */
export enum AuthErrorType {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  SERVER = "server",
  UNKNOWN = "unknown"
}

/**
 * Custom error interface for authentication errors
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: unknown;
}

/**
 * Handles authentication errors in a consistent way
 * @param error The error to handle
 * @param defaultMessage Default message to show if error is not recognized
 * @returns Formatted AuthError object
 */
export function handleAuthError(error: unknown, defaultMessage = "Wystąpił błąd podczas uwierzytelniania"): AuthError {
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