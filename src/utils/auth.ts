import type { AstroGlobal } from 'astro';

export interface User {
  id: string;
  name: string;
  email: string;
}

// Mock user for development
const MOCK_USER: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com'
};

// Always return mock user for simplified auth
export const checkAuth = () => MOCK_USER;
