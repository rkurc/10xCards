import { useState, useEffect } from "react";

/**
 * Test-only component for simulating authentication error scenarios
 * This component is only used in tests to verify error message display
 */
export function TestLoginErrorDisplay() {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in a test environment and should show an error
    const isTestMode = new URLSearchParams(window.location.search).get("test-mode") === "true";
    const errorType = new URLSearchParams(window.location.search).get("error-type");

    if (isTestMode && errorType) {
      setShowError(true);

      switch (errorType) {
        case "invalid-credentials":
          setErrorMessage("Nieprawidłowe dane logowania");
          break;
        case "server-error":
          setErrorMessage("Wystąpił błąd serwera");
          break;
        case "account-locked":
          setErrorMessage("Konto zostało zablokowane");
          break;
        default:
          setErrorMessage(`Błąd: ${errorType}`);
      }
    }
  }, []);

  // If not in test mode or no error requested, don't render anything
  if (!showError) {
    return null;
  }

  return (
    <div className="text-sm p-3 bg-red-50 text-red-500 rounded-md" data-testid="error-message" aria-live="polite">
      {errorMessage}
    </div>
  );
}
