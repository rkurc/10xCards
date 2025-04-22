import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewContentProps {
  generationId: string;
}

interface FlashCard {
  id: string;
  front: string;
  back: string;
  isAccepted: boolean;
}

export function ReviewContent({ generationId }: ReviewContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cards, setCards] = useState<FlashCard[]>([]);

  // Log the generation ID to help debug
  console.log(`Reviewing cards for generation: ${generationId}`);

  // Use useEffect for loading mock data, not useState
  useEffect(() => {
    console.log("Loading review data...");
    
    // Simulate API fetch with a delay
    const timer = setTimeout(() => {
      console.log("Review data loaded");
      setCards([
        { id: "1", front: "Co to jest astrofizyka?", back: "Dział fizyki zajmujący się badaniem ciał niebieskich.", isAccepted: true },
        { id: "2", front: "Czym jest czarna dziura?", back: "Obszar czasoprzestrzeni o bardzo silnym polu grawitacyjnym.", isAccepted: true },
      ]);
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [generationId]);

  const handleAcceptCard = (cardId: string) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isAccepted: true } : card
    ));
  };

  const handleRejectCard = (cardId: string) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isAccepted: false } : card
    ));
  };

  const handleSaveCards = async () => {
    setIsSaving(true);
    
    console.log("Saving cards...");
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Fiszki zostały zapisane");
      
      console.log("Cards saved, redirecting to dashboard");
      // Add a small delay before redirect to ensure toast is visible
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Error saving cards:", error);
      toast.error("Wystąpił błąd podczas zapisywania fiszek");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Przegląd wygenerowanych fiszek</h1>
        <p className="text-muted-foreground">
          Przejrzyj i zatwierdź wygenerowane fiszki przed zapisaniem ich do swojej kolekcji.
        </p>
      </div>

      <div className="grid gap-4">
        {cards.map(card => (
          <Card key={card.id} className={card.isAccepted ? "border-green-500" : ""}>
            <CardHeader>
              <CardTitle>Przód</CardTitle>
              <CardDescription>{card.front}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="text-sm font-medium mb-2">Tył</h4>
                <p className="text-muted-foreground">{card.back}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handleRejectCard(card.id)}
                disabled={!card.isAccepted}
              >
                Odrzuć
              </Button>
              <Button
                onClick={() => handleAcceptCard(card.id)}
                disabled={card.isAccepted}
              >
                Akceptuj
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveCards}
          disabled={isSaving || cards.every(card => !card.isAccepted)}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zapisz zaakceptowane fiszki
        </Button>
      </div>
    </div>
  );
}
