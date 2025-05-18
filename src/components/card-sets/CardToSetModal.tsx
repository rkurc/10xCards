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
import { useAvailableCards } from "../../hooks/useAvailableCards";

interface CardToSetModalProps {
  setId: string;
  onSubmit: (cardIds: string[]) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardToSetModal({ setId, onSubmit, open, onOpenChange }: CardToSetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const { cards, isLoading: isLoadingCards, error } = useAvailableCards({ setId });

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
      <DialogContent className="max-w-3xl max-h-[80vh] dialog-content-opaque">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dodaj fiszki do zestawu</DialogTitle>
            <DialogDescription>Zaznacz karty, które chcesz dodać do zestawu.</DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 gap-4">
              {isLoadingCards ? (
                <div className="text-center py-8">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : cards.length === 0 ? (
                <div className="text-center py-8 text-gray-600">Brak fiszek</div>
              ) : (
                cards.map((card) => (
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
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedCards.length} card{selectedCards.length !== 1 ? "s" : ""} selected
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isLoadingCards}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading || isLoadingCards || selectedCards.length === 0}
              >
                {isLoading ? "Dodawanie..." : "Dodaj do zestawu"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
