import { createContext, useContext, useState, type ReactNode } from "react";
import CreateCardSetModal from "./card-sets/CreateCardSetModal";

interface DialogProviderProps {
  children: ReactNode;
}

interface DialogContextType {
  openCreateCardSetModal: () => void;
}

const DialogContext = createContext<DialogContextType>({
  openCreateCardSetModal: () => undefined,
});

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [isCreateCardSetModalOpen, setIsCreateCardSetModalOpen] = useState(false);

  const openCreateCardSetModal = () => setIsCreateCardSetModalOpen(true);

  return (
    <DialogContext.Provider value={{ openCreateCardSetModal }}>
      {children}

      <CreateCardSetModal
        open={isCreateCardSetModalOpen}
        onOpenChange={setIsCreateCardSetModalOpen}
        onSubmit={async (data) => {
          try {
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
