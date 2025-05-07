import { useState, useEffect } from 'react';
import { authStore, getCurrentUser } from '@/services/auth.direct';
import type { User } from '@/types/auth.types';

/**
 * React hook for accessing authentication state without context
 * Works with the auth.direct.ts auth store
 */
export function useDirectAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    // First try to get user from store immediately
    if (authStore) {
      const currentUser = authStore.getCurrentUser();
      if (currentUser !== null) {
        setUser(currentUser);
        setLoading(false);
      }
      
      // Then subscribe to changes
      const unsubscribe = authStore.subscribe((updatedUser) => {
        setUser(updatedUser);
        setLoading(false);
      });
      
      return unsubscribe;
    } else {
      // Fallback in case authStore isn't available
      getCurrentUser().then(fetchedUser => {
        setUser(fetchedUser);
        setLoading(false);
      });
    }
  }, []);
  
  return { user, loading, isAuthenticated: !!user };
}