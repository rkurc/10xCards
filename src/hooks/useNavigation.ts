import { useCallback } from "react";
import { toast } from "sonner";

/**
 * A custom hook that provides navigation functionality
 *
 * This hook centralizes navigation logic and provides a more React-friendly
 * approach to navigation within the application.
 */
export function useNavigation() {
  /**
   * Navigate to a specified path
   *
   * @param path - The URL path to navigate to
   * @param options - Navigation options
   * @param options.replace - Whether to replace the current history entry
   * @param options.state - State to preserve in sessionStorage during navigation
   */
  const navigate = useCallback(
    (
      path: string,
      options?: {
        replace?: boolean;
        state?: Record<string, string>;
      }
    ) => {
      try {
        console.log(`[NAVIGATION] Navigating to: ${path}`);

        // Store state in sessionStorage if provided
        if (options?.state) {
          Object.entries(options.state).forEach(([key, value]) => {
            sessionStorage.setItem(key, value);
          });
          console.log("[NAVIGATION] State preserved in sessionStorage");
        }

        // Perform the navigation
        if (options?.replace) {
          window.location.replace(path);
        } else {
          window.location.href = path;
        }

        return true;
      } catch (error) {
        console.error("[NAVIGATION] Navigation error:", error);
        toast.error("Navigation failed. Please try again.");
        return false;
      }
    },
    []
  );

  /**
   * Retrieve state that was stored during navigation
   *
   * @param key - The key of the state item to retrieve
   * @param remove - Whether to remove the item from storage after retrieval
   */
  const getNavigationState = useCallback((key: string, remove = true): string | null => {
    const value = sessionStorage.getItem(key);
    if (value && remove) {
      sessionStorage.removeItem(key);
    }
    return value;
  }, []);

  return { navigate, getNavigationState };
}
