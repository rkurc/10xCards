/**
 * Common types for authentication shared between components and services
 */

export interface User {
  id: string;
  name?: string;
  email: string;
}

/**
 * Interface for login results
 */
export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Interface for registration results
 */
export interface RegisterResult {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
}
