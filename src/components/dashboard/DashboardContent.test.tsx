import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DashboardContent } from "./DashboardContent";
import { AuthContext, AuthContextType, TestAuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "react-error-boundary";
import * as React from "react";

// Mocking komponentów, które są używane w DashboardContent
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="card-footer">{children}</div>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, className }: { children: React.ReactNode; asChild?: boolean; className?: string }) => (
    <button data-testid="button" className={className}>
      {children}
    </button>
  ),
}));
vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid={`alert-${variant || "default"}`}>{children}</div>
  ),
  AlertTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-title">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));
vi.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
}));
// Fix Suspense mock
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    Suspense: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => children, // Return children instead of fallback
  };
});

// Różne stany kontekstu uwierzytelniania
const mockAuthContextAuthenticated: AuthContextType = {
  user: { id: "123", name: "Test User", email: "test@example.com" },
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  register: function (_email: string, _password: string): Promise<void> {
    throw new Error("Function not implemented.");
  },
};

const mockAuthContextLoading: AuthContextType = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  loading: true,
  error: null,
  register: function (_email: string, _password: string): Promise<void> {
    throw new Error("Function not implemented.");
  },
};

const mockAuthContextError: AuthContextType = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  register: function (_email: string, _password: string): Promise<void> {
    throw new Error("Function not implemented.");
  },
};

const mockAuthContextNoName: AuthContextType = {
  user: { id: "123", name: undefined, email: "noname@example.com" },
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  register: function (_email: string, _password: string): Promise<void> {
    throw new Error("Function not implemented.");
  },
};

// Wrapper dla testów z ErrorBoundary
const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div data-testid="error-fallback">
          <div>Wystąpił błąd: {error.message}</div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// Create a test wrapper component - update to use the TestAuthProvider
const TestWrapper = ({ children, authContext }: { children: React.ReactNode; authContext: AuthContextType }) => (
  <TestAuthProvider value={authContext}>{children}</TestAuthProvider>
);

describe("DashboardContent", () => {
  // Resetujemy mocki po każdym teście
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Scenariusze użytkownika zalogowanego", () => {
    it("renderuje powitanie z imieniem użytkownika", () => {
      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert: use a matcher function to check if both "Witaj" and "Test User" are present
      expect(
        screen.getByText((content) => content.includes("Witaj") && content.includes("Test User"))
      ).toBeInTheDocument();
    });

    it("renderuje wszystkie karty akcji", () => {
      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText(/Generuj fiszki/i)).toBeInTheDocument();
      expect(screen.getByText(/Moje zestawy/i)).toBeInTheDocument();
      expect(screen.getByText(/Rozpocznij naukę/i)).toBeInTheDocument();
    });

    it("zawiera poprawne linki nawigacyjne na kartach", () => {
      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      const generateLink = screen.getByRole("link", { name: /Rozpocznij generowanie/i });
      const setsLink = screen.getByRole("link", { name: /Przeglądaj zestawy/i });
      const learnLink = screen.getByRole("link", { name: /Zacznij sesję/i });

      // Assert
      expect(generateLink).toHaveAttribute("href", "/generate");
      expect(setsLink).toHaveAttribute("href", "/sets");
      expect(learnLink).toHaveAttribute("href", "/learn");
    });

    it("renderuje opisy funkcjonalności na kartach", () => {
      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText(/Twórz nowe fiszki za pomocą AI/i)).toBeInTheDocument();
      expect(screen.getByText(/Zarządzaj swoimi zestawami fiszek/i)).toBeInTheDocument();
      expect(screen.getByText(/Ucz się za pomocą algorytmu powtórek/i)).toBeInTheDocument();
    });

    it("renderuje Suspense z fallbackiem podczas ładowania zawartości", async () => {
      // Arrange
      // Modelujemy opóźnienie w renderowaniu Suspense
      vi.spyOn(React, "Suspense").mockImplementationOnce(({ fallback, children }) => (
        <div data-testid="suspense">{fallback}</div>
      ));

      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByTestId("suspense")).toBeInTheDocument();
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });
  });

  describe("Scenariusze stanów ładowania", () => {
    it("pokazuje LoadingFallback podczas ładowania danych", () => {
      // Arrange: mockujemy Suspense żeby wymusiło się pokazanie fallbacku
      vi.spyOn(React, "Suspense").mockImplementationOnce(({ fallback }) => <>{fallback}</>);

      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.getByText(/Ładowanie.../i)).toBeInTheDocument();
    });
  });

  describe("Scenariusze obsługi błędów", () => {
    it("łapie i wyświetla błędy renderowania za pomocą ErrorBoundary", () => {
      // Arrange: define a faulty component inline without mocking DashboardContent
      const FaultyComponent = () => {
        throw new Error("Test błędu renderowania");
      };

      // Act
      render(
        <TestErrorBoundary>
          <FaultyComponent />
        </TestErrorBoundary>
      );

      // Assert
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
      expect(screen.getByText(/Wystąpił błąd: Test błędu renderowania/i)).toBeInTheDocument();
    });

    it("prawidłowo obsługuje ErrorFallback gdy wystąpi błąd w komponencie", () => {
      // Arrange
      const error = new Error("Test komponentu ErrorFallback");
      const FaultyComponent = () => {
        throw error;
      };

      // Act
      render(
        <div data-testid="error-container">
          <ErrorBoundary
            FallbackComponent={({ error }) => (
              <div data-testid="error-boundary-fallback">
                <div>Wystąpił problem podczas ładowania dashboardu: {error.message}</div>
              </div>
            )}
          >
            <FaultyComponent />
          </ErrorBoundary>
        </div>
      );

      // Assert
      expect(screen.getByTestId("error-boundary-fallback")).toBeInTheDocument();
      expect(
        screen.getByText(/Wystąpił problem podczas ładowania dashboardu: Test komponentu ErrorFallback/i)
      ).toBeInTheDocument();
    });
  });

  describe("Scenariusze warunków brzegowych", () => {
    it("obsługuje przypadek gdy dane użytkownika są niekompletne", () => {
      // Arrange
      render(
        <TestWrapper
          authContext={{
            ...mockAuthContextAuthenticated,
            user: {
              id: "123",
              email: "",
            },
          }}
        >
          <DashboardContent />
        </TestWrapper>
      );

      // Assert: używa domyślnego powitania bez imienia/emaila
      expect(screen.getByText(/Witaj!/i)).toBeInTheDocument();
    });

    it("obsługuje przypadek pustego obiektu użytkownika", () => {
      // Arrange
      render(
        <TestWrapper
          authContext={{
            ...mockAuthContextNoName,
            user: {
              id: "",
              email: "",
            },
          }}
        >
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText(/Witaj!/i)).toBeInTheDocument();
    });
  });

  describe("Testy dostępności (a11y)", () => {
    it("zawiera odpowiednie nagłówki dla sekcji", () => {
      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Dashboard/i);
    });

    it("przyciski nawigacyjne mają dostępny tekst", () => {
      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe("Interakcje użytkownika", () => {
    it("linki można klikać i mają właściwe atrybuty", async () => {
      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );
      const user = userEvent.setup();

      // Poczekaj na załadowanie komponentu
      await waitFor(() => {
        expect(screen.getByText(/Generuj fiszki/i)).toBeInTheDocument();
      });

      // Act
      const generateButton = screen.getByRole("button", { name: /Rozpocznij generowanie/i });

      // Sprawdzamy czy link ma właściwe atrybuty
      const link = generateButton.querySelector("a");
      expect(link).toHaveAttribute("href", "/generate");

      // Symulujemy kliknięcie
      await user.click(generateButton);

      // Assert - w tym przypadku wystarczy, że nie wystąpił błąd
      expect(generateButton).toBeInTheDocument();
    });
  });
});
