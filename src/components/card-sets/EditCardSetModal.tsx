import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CardSetDTO, CardSetUpdateCommand } from "../../types";

interface EditCardSetModalProps {
  cardSet: CardSetDTO;
  onSubmit: (data: CardSetUpdateCommand) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCardSetModal({ cardSet, onSubmit, open, onOpenChange }: EditCardSetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CardSetUpdateCommand>({
    name: cardSet.name,
    description: cardSet.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update card set:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-content-opaque">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edytuj zestaw fiszek</DialogTitle>
            <DialogDescription>Update your flashcard set details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Nazwa</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Podaj nazwę zestawu"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">Opis</label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Podaj opis zestawu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisuje..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
