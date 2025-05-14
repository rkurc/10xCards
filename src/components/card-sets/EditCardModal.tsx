import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CardDTO } from "../../types";

interface EditCardModalProps {
  card: CardDTO;
  onSubmit: (cardId: string, frontContent: string, backContent: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCardModal({ card, onSubmit, open, onOpenChange }: EditCardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    frontContent: card.front_content,
    backContent: card.back_content,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSubmit(card.id, formData.frontContent, formData.backContent);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>
              Update the front and back content of your flashcard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="frontContent">Front Content</label>
              <Textarea
                id="frontContent"
                value={formData.frontContent}
                onChange={(e) => setFormData((prev) => ({ ...prev, frontContent: e.target.value }))}
                placeholder="Enter the front content of your card"
                rows={4}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="backContent">Back Content</label>
              <Textarea
                id="backContent"
                value={formData.backContent}
                onChange={(e) => setFormData((prev) => ({ ...prev, backContent: e.target.value }))}
                placeholder="Enter the back content of your card"
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
