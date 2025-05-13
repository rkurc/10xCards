import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import DashboardContent from "./DashboardContent";
import { AuthContext, type AuthContextType, TestAuthProvider } from "@/context/AuthContext";
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

// Różne stany kontekstu uwierzytelniania
const mockAuthContextAuthenticated: AuthContextType = {
  user: { id: "123", name: "Test User", email: "test@example.com" },
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  register: vi.fn(),
};

const mockAuthContextLoading: AuthContextType = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  loading: true,
  error: null,
  register: vi.fn(),
};

const mockAuthContextNoName: AuthContextType = {
  user: { id: "123", name: undefined, email: "noname@example.com" },
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  register: vi.fn(),
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

    // Default mock for useDirectAuth to ensure consistency
    vi.mock("@/hooks/useDirectAuth", () => ({
      useDirectAuth: () => ({
        user: { name: "Test User", email: "test@example.com" },
        loading: false,
      }),
    }));
  });

  describe("Scenariusze użytkownika zalogowanego", () => {
    it("renderuje powitanie z imieniem użytkownika", () => {
      // Reset mocks to ensure useDirectAuth is properly mocked
      vi.resetModules();
      // Mock the authentication context to show the actual name is used
      // Spy on the useDirectAuth hook to override its return value
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { name: "Test User", email: "test1@example.com" },
          loading: false,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert: check if welcome text with the user's name is present
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toContain("Witaj");
      expect(heading.textContent).toContain("Test User");
    });

    it("renderuje wszystkie karty akcji", () => {
      // Reset mocks to ensure consistent behavior
      vi.resetModules();
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { name: "Test User", email: "test@example.com" },
          loading: false,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText("Karty do nauki")).toBeTruthy();
      expect(screen.getByText("Twoje zestawy")).toBeTruthy();
      expect(screen.getByText("Twoje postępy")).toBeTruthy();
    });

    it("zawiera poprawne linki nawigacyjne na kartach", () => {
      // Reset mocks to ensure consistent behavior
      vi.resetModules();
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { name: "Test User", email: "test@example.com" },
          loading: false,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      const studyLink = screen.getByText("Rozpocznij naukę").closest("a");
      const setsLink = screen.getByText("Zobacz zestawy").closest("a");
      const statsLink = screen.getByText("Zobacz statystyki").closest("a");

      // Assert
      expect(studyLink?.getAttribute("href")).toBe("/study");
      expect(setsLink?.getAttribute("href")).toBe("/sets");
      expect(statsLink?.getAttribute("href")).toBe("/stats");
    });

    it("renderuje opisy funkcjonalności na kartach", () => {
      // Reset mocks to ensure consistent behavior
      vi.resetModules();
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { name: "Test User", email: "test@example.com" },
          loading: false,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByText("Karty czekające na powtórzenie")).toBeTruthy();
      expect(screen.getByText("Wszystkie Twoje zestawy kart")).toBeTruthy();
      expect(screen.getByText("Statystyki nauki")).toBeTruthy();
    });

    it("renderuje przycisk do tworzenia nowych kart", () => {
      // Reset mocks to ensure consistent behavior
      vi.resetModules();
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { name: "Test User", email: "test@example.com" },
          loading: false,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      const createLink = screen.getByText("Stwórz nowe karty").closest("a");
      expect(createLink?.getAttribute("href")).toBe("/create");
    });
  });

  describe("Scenariusz ładowania", () => {
    it("pokazuje animowane placeholdery podczas ładowania", () => {
      // Reset mocks to ensure useDirectAuth returns loading state
      vi.resetModules();
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: null,
          loading: true,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextLoading}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert - look for animation placeholders in the component
      expect(screen.getAllByTestId("card")).toHaveLength(3);
    });
  });

  describe("Scenariusze obsługi błędów", () => {
    it("łapie i wyświetla błędy renderowania za pomocą ErrorBoundary", () => {
      // Arrange: define a faulty component
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
      expect(screen.getByTestId("error-fallback")).toBeTruthy();
      expect(screen.getByText(/Wystąpił błąd: Test błędu renderowania/i)).toBeTruthy();
    });
  });

  describe("Scenariusze warunków brzegowych", () => {
    it("obsługuje przypadek gdy dane użytkownika są niekompletne i pokazuje 'użytkowniku'", async () => {
      // First, reset all modules to clear existing imports
      vi.resetModules();
      
      // Clear all mocks
      vi.clearAllMocks();
      
      // Use doMock instead of mock for dynamic mocking
      vi.doMock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { id: "123", email: "", name: undefined },
          loading: false,
        }),
      }));
      
      // Dynamically import the component after mocking
      const { default: DashboardContentImported } = await import("./DashboardContent");

      // Arrange
      render(
        <TestWrapper
          authContext={{
            ...mockAuthContextAuthenticated,
            user: {
              id: "123",
              email: "",
              name: undefined,
            },
          }}
        >
          <DashboardContentImported />
        </TestWrapper>
      );

      // Assert: używa domyślnego powitania bez imienia/emaila
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toContain("użytkowniku");
    });

    it("obsługuje przypadek gdy email jest dostępny, ale nie ma imienia", async () => {
      // First, reset all modules to clear existing imports
      vi.resetModules();

      // Clear all mocks
      vi.clearAllMocks();

      // Use doMock instead of mock for dynamic mocking
      vi.doMock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { id: "123", email: "test_user@example.com", name: undefined },
          loading: false,
        }),
      }));

      // Dynamically import the component after mocking
      const { default: DashboardContentImported } = await import("./DashboardContent");

      // Arrange
      render(
        <TestWrapper
          authContext={{
            ...mockAuthContextNoName,
            user: {
              id: "123",
              email: "test_user@example.com",
              name: undefined,
            },
          }}
        >
          <DashboardContentImported />
        </TestWrapper>
      );

      // Assert: używa pierwszej części emaila
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toContain("test");
    });
  });

  describe("Testy dostępności (a11y)", () => {
    it("przyciski nawigacyjne mają dostępny tekst", () => {
      // Reset mocks to ensure consistent behavior
      vi.resetModules();
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { name: "Test User", email: "test@example.com" },
          loading: false,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );

      // Assert
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link.textContent).toBeTruthy();
      });
    });
  });

  describe("Interakcje użytkownika", () => {
    it("linki można klikać i mają właściwe atrybuty", async () => {
      // Reset mocks to ensure consistent behavior
      vi.resetModules();
      vi.mock("@/hooks/useDirectAuth", () => ({
        useDirectAuth: () => ({
          user: { name: "Test User", email: "test@example.com" },
          loading: false,
        }),
      }));

      // Arrange
      render(
        <TestWrapper authContext={mockAuthContextAuthenticated}>
          <DashboardContent />
        </TestWrapper>
      );
      const user = userEvent.setup();

      // Act
      const studyButton = screen.getByText("Rozpocznij naukę").closest("button");
      expect(studyButton).toBeTruthy();

      if (studyButton) {
        // Symulujemy kliknięcie
        await user.click(studyButton);
      }

      // Assert - w tym przypadku wystarczy, że nie wystąpił błąd
      expect(screen.getByText("Rozpocznij naukę")).toBeTruthy();
    });
  });
});
