import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { CardDTO } from "../../types";

interface CardToSetModalProps {
  cards: CardDTO[];
  onSubmit: (cardIds: string[]) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardToSetModal({ cards, onSubmit, open, onOpenChange }: CardToSetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onSubmit(selectedCards);
      onOpenChange(false);
      setSelectedCards([]);
    } catch (error) {
      console.error("Failed to add cards to set:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCard = (cardId: string) => {
    setSelectedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Cards to Set</DialogTitle>
            <DialogDescription>Select the cards you want to add to this set.</DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 gap-4">
              {cards.map((card) => (
                <Card key={card.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    <Checkbox
                      id={card.id}
                      checked={selectedCards.includes(card.id)}
                      onCheckedChange={() => toggleCard(card.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium mb-2">{card.front_content}</div>
                      <div className="text-sm text-gray-600">{card.back_content}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {cards.length === 0 && <div className="text-center py-8 text-gray-600">No cards available to add</div>}
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedCards.length} card{selectedCards.length !== 1 ? "s" : ""} selected
              </span>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || selectedCards.length === 0}>
                {isLoading ? "Adding..." : "Add to Set"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
