import React from "react";
import { GenerationProvider } from "../../contexts/generation-context";

interface GenerationWrapperProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that ensures the GenerationProvider is available
 * for any component that needs to access the generation context.
 *
 * Use this wrapper for any component or page that uses generation functionality.
 */
export function GenerationWrapper({ children }: GenerationWrapperProps) {
  // Check if we already have a provider in the tree to avoid nesting
  const isProviderInTree = React.useContext(React.createContext<boolean>(false));

  // If a provider already exists in the tree, just render children
  if (isProviderInTree) {
    return <>{children}</>;
  }

  // Otherwise wrap with the provider
  return <GenerationProvider>{children}</GenerationProvider>;
}
