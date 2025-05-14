import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";

interface NavigationState {
  path: string | null;
  replace: boolean;
  storageState?: Record<string, string>;
}

/**
 * A custom hook that provides navigation functionality
 *
 * This hook centralizes navigation logic and provides a more React-friendly
 * approach to navigation within the application.
 */
export function useNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    path: null,
    replace: false,
  });

  // Handle actual navigation in an effect
  useEffect(() => {
    if (!navigationState.path) return;

    try {
      // Store any state in sessionStorage before navigation
      if (navigationState.storageState) {
        Object.entries(navigationState.storageState).forEach(([key, value]) => {
          sessionStorage.setItem(key, value);
        });
        console.debug("[NAVIGATION] State preserved in sessionStorage");
      }

      // Perform the navigation
      if (navigationState.replace) {
        window.location.replace(navigationState.path);
      } else {
        window.location.href = navigationState.path;
      }
    } catch (error) {
      console.error("[NAVIGATION] Navigation error:", error);
      toast.error("Navigation failed. Please try again.");
    }
  }, [navigationState]);

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
    ): Promise<boolean> => {
      try {
        setNavigationState({
          path,
          replace: options?.replace ?? false,
          storageState: options?.state,
        });
        return Promise.resolve(true);
      } catch (error) {
        console.error("[NAVIGATION] Navigation error:", error);
        toast.error("Navigation failed. Please try again.");
        return Promise.resolve(false);
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
