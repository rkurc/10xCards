import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardContent } from './DashboardContent';
import { AuthContext } from '../../context/AuthContext';

// Mocking the AuthContext
const mockAuthContext = {
  user: { id: '123', name: 'Test User', email: 'test@example.com' },
  loading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

describe('DashboardContent', () => {
  it('renders the dashboard with user name', () => {
    // Arrange
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <DashboardContent />
      </AuthContext.Provider>
    );

    // Act & Assert
    expect(screen.getByText(/Witaj, Test User!/i)).toBeInTheDocument();
    expect(screen.getByText(/Generuj fiszki/i)).toBeInTheDocument();
    expect(screen.getByText(/Moje zestawy/i)).toBeInTheDocument();
    expect(screen.getByText(/Rozpocznij naukę/i)).toBeInTheDocument();
  });

  it('renders action cards with correct links', () => {
    // Arrange
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <DashboardContent />
      </AuthContext.Provider>
    );

    // Act & Assert
    const generateLink = screen.getByRole('link', { name: /Rozpocznij generowanie/i });
    const setsLink = screen.getByRole('link', { name: /Przeglądaj zestawy/i });
    const learnLink = screen.getByRole('link', { name: /Zacznij sesję/i });

    expect(generateLink).toHaveAttribute('href', '/generate');
    expect(setsLink).toHaveAttribute('href', '/sets');
    expect(learnLink).toHaveAttribute('href', '/learn');
  });
});
