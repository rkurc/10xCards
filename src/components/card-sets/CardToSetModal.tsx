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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  const [newCardForm, setNewCardForm] = useState({
    frontContent: "",
    backContent: "",
  });
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
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

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.frontContent || !newCardForm.backContent) {
      setCreateError("Wypełnij zawartość obu stron fiszki.");
      return;
    }

    try {
      setIsCreatingCard(true);
      setCreateError(null);

      // Create the card
      const cardResponse = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front_content: newCardForm.frontContent,
          back_content: newCardForm.backContent,
          source_type: "manual",
        }),
      });

      const data = await cardResponse.json();

      if (!cardResponse.ok) {
        // Check for validation details
        if (data.details) {
          const frontError = data.details.front_content?._errors?.[0];
          const backError = data.details.back_content?._errors?.[0];
          throw new Error(frontError || backError || data.error?.message || "Nie udało się utworzyć fiszki");
        }
        throw new Error(data.error?.message || data.message || "Nie udało się utworzyć fiszki");
      }

      // Add the card to the set
      await onSubmit([data.id]);

      // Reset form and close modal
      setNewCardForm({ frontContent: "", backContent: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating card:", error);
      setCreateError(error instanceof Error ? error.message : "Nie udało się utworzyć fiszki");
    } finally {
      setIsCreatingCard(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] dialog-content-opaque">
        <DialogHeader>
          <DialogTitle>Dodaj fiszki do zestawu</DialogTitle>
          <DialogDescription>Wybierz istniejące fiszki lub utwórz nowe.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="select" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="select"
              className="data-[state=active]:border data-[state=active]:border-input data-[state=active]:bg-background"
            >
              Wybierz istniejące
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="data-[state=active]:border data-[state=active]:border-input data-[state=active]:bg-background"
            >
              Utwórz nową
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select">
            <form onSubmit={handleSubmit}>
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
                    <div className="text-center py-8 text-gray-600">Brak dostępnych fiszek</div>
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
                    Wybrano {selectedCards.length} {selectedCards.length === 1 ? "fiszkę" : "fiszek"}
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
          </TabsContent>

          <TabsContent value="create">
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="frontContent">Przód fiszki</label>
                  <Textarea
                    id="frontContent"
                    value={newCardForm.frontContent}
                    onChange={(e) => setNewCardForm((prev) => ({ ...prev, frontContent: e.target.value }))}
                    placeholder="Wprowadź treść przedniej strony fiszki"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="backContent">Tył fiszki</label>
                  <Textarea
                    id="backContent"
                    value={newCardForm.backContent}
                    onChange={(e) => setNewCardForm((prev) => ({ ...prev, backContent: e.target.value }))}
                    placeholder="Wprowadź treść tylnej strony fiszki"
                    rows={4}
                    required
                  />
                </div>
                {createError && <div className="text-red-500 text-sm">{createError}</div>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreatingCard}>
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingCard || !newCardForm.frontContent || !newCardForm.backContent}
                >
                  {isCreatingCard ? "Tworzenie..." : "Utwórz i dodaj do zestawu"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
