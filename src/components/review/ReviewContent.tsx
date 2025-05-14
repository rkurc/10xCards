import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReviewContentProps {
  generationId: string;
}

interface FlashCard {
  id: string;
  front_content: string;
  back_content: string;
  readability_score: number;
  isAccepted?: boolean;
  isRejected?: boolean;
}

export function ReviewContent({ generationId }: ReviewContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Log the generation ID to help debug
  console.log(`[REVIEW] Reviewing cards for generation: ${generationId}`);

  useEffect(() => {
    console.log("[REVIEW] Loading review data...");

    const fetchCards = async () => {
      try {
        // Real API fetch
        const response = await fetch(`/api/generation/${generationId}/results`);

        if (!response.ok) {
          throw new Error(`Failed to fetch cards: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[REVIEW] Received ${data.cards?.length || 0} cards from API`);

        if (data.cards && Array.isArray(data.cards)) {
          setCards(
            data.cards.map((card: any) => ({
              ...card,
              isAccepted: true, // By default, all cards are accepted
            }))
          );
        } else {
          // Fallback to mock data if API doesn't return expected format
          console.warn("[REVIEW] API didn't return expected data format, using mock data");
          setCards([
            {
              id: "1",
              front_content: "Co to jest astrofizyka?",
              back_content: "Dział fizyki zajmujący się badaniem ciał niebieskich.",
              readability_score: 5,
              isAccepted: true,
            },
            {
              id: "2",
              front_content: "Czym jest czarna dziura?",
              back_content: "Obszar czasoprzestrzeni o bardzo silnym polu grawitacyjnym.",
              readability_score: 4,
              isAccepted: true,
            },
          ]);
        }
      } catch (err) {
        console.error("[REVIEW] Error fetching cards:", err);
        setError("Failed to load cards. Please try again.");

        // Fallback to mock data for development
        if (process.env.NODE_ENV === "development") {
          setCards([
            {
              id: "1",
              front_content: "Co to jest astrofizyka?",
              back_content: "Dział fizyki zajmujący się badaniem ciał niebieskich.",
              readability_score: 5,
              isAccepted: true,
            },
            {
              id: "2",
              front_content: "Czym jest czarna dziura?",
              back_content: "Obszar czasoprzestrzeni o bardzo silnym polu grawitacyjnym.",
              readability_score: 4,
              isAccepted: true,
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [generationId]);

  useEffect(() => {
    
      cards,
      firstCard: cards[0],
      totalCards: cards.length,
    });
  }, [cards]);

  const handleAcceptCard = async (cardId: string) => {
    console.log(`[REVIEW] Accepting card: ${cardId}`);
    try {
      // Make API call to accept the card
      const response = await fetch(`/api/generation/${generationId}/cards/${cardId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to accept card: ${response.status}`);
      }

      // Update local state
      setCards(cards.map((card) => (card.id === cardId ? { ...card, isAccepted: true } : card)));
    } catch (err) {
      console.error("[REVIEW] Error accepting card:", err);
      toast.error("Failed to accept card. Please try again.");
    }
  };

  const handleRejectCard = async (cardId: string) => {
    console.log(`[REVIEW] Rejecting card: ${cardId}`);
    try {
      // Make API call to reject the card
      const response = await fetch(`/api/generation/${generationId}/cards/${cardId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to reject card: ${response.status}`);
      }

      // Update local state
      setCards(cards.map((card) => (card.id === cardId ? { ...card, isAccepted: false } : card)));
    } catch (err) {
      console.error("[REVIEW] Error rejecting card:", err);
      toast.error("Failed to reject card. Please try again.");
    }
  };

  const handleSaveCards = async () => {
    setIsSaving(true);

    try {
      // Get only IDs of accepted cards
      const acceptedCardIds = cards.filter((card) => card.isAccepted).map((card) => card.id);

      // Match the schema structure exactly
      const payload = {
        name: `Generated Set - ${new Date().toLocaleDateString()}`,
        description: "Automatically generated flashcards",
        accepted_cards: acceptedCardIds, // This matches the schema expectation
      };

      

      const response = await fetch(`/api/generation/${generationId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DEBUG] Server error response:", errorData);
        throw new Error(errorData.error || `Failed to finalize generation: ${response.status}`);
      }

      toast.success("Fiszki zostały zapisane");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("[REVIEW] Error saving cards:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania fiszek");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToGenerate = () => {
    // Simple direct navigation
    window.location.href = "/generate";
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
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleBackToGenerate} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Generator
          </Button>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Przegląd wygenerowanych fiszek</h1>
        <p className="text-muted-foreground">
          Przejrzyj i zatwierdź wygenerowane fiszki przed zapisaniem ich do swojej kolekcji.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {cards.map((card) => (
          <Card key={card.id} className={card.isAccepted ? "border-green-500" : ""}>
            <CardHeader>
              <CardTitle>Przód</CardTitle>
              <CardDescription>{card.front_content}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="text-sm font-medium mb-2">Tył</h4>
                <p className="text-muted-foreground">{card.back_content}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleRejectCard(card.id)} disabled={!card.isAccepted}>
                Odrzuć
              </Button>
              <Button onClick={() => handleAcceptCard(card.id)} disabled={card.isAccepted}>
                Akceptuj
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBackToGenerate}>
          Back to Generator
        </Button>

        <Button onClick={handleSaveCards} disabled={isSaving || cards.every((card) => !card.isAccepted)}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zapisz zaakceptowane fiszki
        </Button>
      </div>
    </div>
  );
}
