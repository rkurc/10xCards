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
import type { CardSetCreateCommand } from "../../types";

interface CreateCardSetModalProps {
  onSubmit: (data: CardSetCreateCommand) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCardSetModal({ onSubmit, open, onOpenChange }: CreateCardSetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CardSetCreateCommand>({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({ name: "", description: "" });
    } catch (error) {
      console.error("Failed to create card set:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Utwórz nowy zestaw fiszek</DialogTitle>
            <DialogDescription>
              Utwórz nowy zestaw fiszek, który pomoże Ci w nauce i zapamiętywaniu informacji.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Nazwa</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Wprowadź nazwę zestawu fiszek"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">Opis</label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Wprowadź opis zestawu fiszek"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Tworzenie..." : "Utwórz zestaw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
