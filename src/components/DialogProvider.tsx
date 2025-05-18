import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import CreateCardSetModal from "./card-sets/CreateCardSetModal";

interface DialogProviderProps {
  children: ReactNode;
}

interface DialogContextType {
  openCreateCardSetModal: () => void;
  isCreateCardSetModalOpen: boolean;
}

const DialogContext = createContext<DialogContextType>({
  isCreateCardSetModalOpen: false,
  openCreateCardSetModal: () => undefined,
});

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [isCreateCardSetModalOpen, setIsCreateCardSetModalOpen] = useState(false);

  // Use effect to log the state change
  useEffect(() => {
    console.log("Modal state changed:", isCreateCardSetModalOpen);
  }, [isCreateCardSetModalOpen]);

  const openCreateCardSetModal = useCallback(() => {
    console.log("Opening modal function called");
    setIsCreateCardSetModalOpen(true);
  }, []);

  return (
    <DialogContext.Provider value={{ openCreateCardSetModal, isCreateCardSetModalOpen }}>
      {children}

      <CreateCardSetModal
        open={isCreateCardSetModalOpen}
        onOpenChange={(open) => {
          console.log("onOpenChange called with:", open);
          setIsCreateCardSetModalOpen(open);
        }}
        onSubmit={async (data) => {
          try {
            console.log("Form submitted with data:", data);
            const response = await fetch("/api/card-sets", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              throw new Error("Failed to create card set");
            }

            setIsCreateCardSetModalOpen(false);
            window.location.reload();
          } catch (error) {
            console.error("Failed to create card set:", error);
          }
        }}
      />
    </DialogContext.Provider>
  );
}
