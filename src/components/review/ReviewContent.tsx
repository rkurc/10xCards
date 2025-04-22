import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Check, X, Edit, Save } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { GenerationService } from "@/services/generation.service";
import { supabaseClient } from "@/db/supabase.client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// Initialize services
const generationService = new GenerationService(supabaseClient);

// Mock type copied from the service for the component
type GenerationResultResponse = {
  cards: {
    id: string;
    front_content: string;
    back_content: string;
    readability_score: number;
  }[];
  stats: {
    text_length: number;
    generated_count: number;
    generation_time_ms: number;
  };
};

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>
        Wystąpił problem podczas ładowania komponentu: {error.message}
      </AlertDescription>
    </Alert>
  );
}

export function ReviewContent({ generationId }: { generationId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerationResultResponse | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFrontContent, setEditFrontContent] = useState("");
  const [editBackContent, setEditBackContent] = useState("");
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  
  // Mock user ID for testing - in a real app, would come from auth context
  const mockUserId = "user-1";

  useEffect(() => {
    async function loadResults() {
      try {
        setIsLoading(true);
        const data = await generationService.getGenerationResults(mockUserId, generationId);
        setResults(data);
        setError(null);
      } catch (err) {
        setError("Nie udało się załadować wyników generowania. Spróbuj ponownie później.");
        console.error("Error loading generation results:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResults();
  }, [generationId]);

  // Function to handle accepting a card
  async function handleAcceptCard(cardId: string) {
    setProcessingCardId(cardId);
    try {
      await generationService.acceptCard(mockUserId, generationId, cardId, {});
      toast.success("Fiszka zaakceptowana");
      
      // Update UI to remove the accepted card
      if (results) {
        setResults({
          ...results,
          cards: results.cards.filter(card => card.id !== cardId)
        });
      }
    } catch (err) {
      toast.error("Wystąpił błąd podczas akceptacji fiszki");
      console.error("Error accepting card:", err);
    } finally {
      setProcessingCardId(null);
    }
  }

  // Function to handle rejecting a card
  async function handleRejectCard(cardId: string) {
    setProcessingCardId(cardId);
    try {
      await generationService.rejectCard(mockUserId, generationId, cardId);
      toast.success("Fiszka odrzucona");
      
      // Update UI to remove the rejected card
      if (results) {
        setResults({
          ...results,
          cards: results.cards.filter(card => card.id !== cardId)
        });
      }
    } catch (err) {
      toast.error("Wystąpił błąd podczas odrzucenia fiszki");
      console.error("Error rejecting card:", err);
    } finally {
      setProcessingCardId(null);
    }
  }

  // Function to start editing a card
  function handleStartEdit(card: { id: string; front_content: string; back_content: string }) {
    setEditingCardId(card.id);
    setEditFrontContent(card.front_content);
    setEditBackContent(card.back_content);
  }

  // Function to save edited card
  async function handleSaveEdit(cardId: string) {
    setProcessingCardId(cardId);
    try {
      await generationService.acceptCard(mockUserId, generationId, cardId, {
        front_content: editFrontContent,
        back_content: editBackContent
      });
      toast.success("Fiszka zedytowana i zaakceptowana");
      
      // Update UI to remove the accepted card
      if (results) {
        setResults({
          ...results,
          cards: results.cards.filter(card => card.id !== cardId)
        });
      }
    } catch (err) {
      toast.error("Wystąpił błąd podczas zapisywania fiszki");
      console.error("Error saving card:", err);
    } finally {
      setProcessingCardId(null);
      setEditingCardId(null);
    }
  }

  // Function to cancel editing
  function handleCancelEdit() {
    setEditingCardId(null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Ładowanie wygenerowanych fiszek...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Błąd</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!results || !results.cards.length) {
    return (
      <Alert className="my-4">
        <AlertTitle>Brak fiszek</AlertTitle>
        <AlertDescription>
          Nie znaleziono żadnych wygenerowanych fiszek. Wróć do poprzedniego kroku i spróbuj wygenerować je ponownie.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Wygenerowane fiszki</h1>
          <p className="text-muted-foreground">
            Przejrzyj wygenerowane fiszki i zaakceptuj lub odrzuć każdą z nich.
          </p>
        </div>

        {/* Stats card */}
        <Card>
          <CardHeader>
            <CardTitle>Statystyki generowania</CardTitle>
            <CardDescription>Informacje o procesie generowania fiszek</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{results.stats.generated_count}</div>
                <div className="text-sm text-muted-foreground">Wygenerowanych fiszek</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{results.stats.text_length}</div>
                <div className="text-sm text-muted-foreground">Długość tekstu</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{(results.stats.generation_time_ms / 1000).toFixed(1)}s</div>
                <div className="text-sm text-muted-foreground">Czas generowania</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accept all button */}
        <div className="flex justify-end">
          <Button 
            variant="default" 
            onClick={async () => {
              try {
                await generationService.acceptAllCards(mockUserId, generationId, {});
                toast.success("Wszystkie fiszki zaakceptowane");
                // Redirect or refresh
              } catch (err) {
                toast.error("Wystąpił błąd podczas akceptacji fiszek");
              }
            }}
          >
            <Check className="mr-2 h-4 w-4" />
            Zaakceptuj wszystkie
          </Button>
        </div>

        {/* Cards list */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Wygenerowane fiszki ({results.cards.length})</h2>
          <div className="space-y-4">
            {results.cards.map((card) => (
              <Card key={card.id} className="border-2 border-muted">
                {editingCardId === card.id ? (
                  // Editing mode
                  <>
                    <CardHeader>
                      <CardTitle>Edycja - Przód fiszki</CardTitle>
                      <CardDescription>Zmodyfikuj pytanie lub termin do nauki</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        value={editFrontContent}
                        onChange={(e) => setEditFrontContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </CardContent>
                    <CardHeader>
                      <CardTitle>Edycja - Tył fiszki</CardTitle>
                      <CardDescription>Zmodyfikuj odpowiedź lub definicję</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        value={editBackContent}
                        onChange={(e) => setEditBackContent(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={handleCancelEdit}>Anuluj</Button>
                      <Button 
                        onClick={() => handleSaveEdit(card.id)} 
                        disabled={processingCardId === card.id}
                      >
                        {processingCardId === card.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zapisz zmiany
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  // Display mode
                  <>
                    <CardHeader>
                      <CardTitle>Przód fiszki</CardTitle>
                      <CardDescription>Pytanie lub termin do nauki</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{card.front_content}</p>
                    </CardContent>
                    <CardHeader>
                      <CardTitle>Tył fiszki</CardTitle>
                      <CardDescription>Odpowiedź lub definicja</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{card.back_content}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Czytelność: {card.readability_score.toFixed(1)}%
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handleStartEdit(card)}
                          disabled={processingCardId === card.id}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edytuj
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleRejectCard(card.id)}
                          disabled={processingCardId === card.id}
                        >
                          {processingCardId === card.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          Odrzuć
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={() => handleAcceptCard(card.id)}
                          disabled={processingCardId === card.id}
                        >
                          {processingCardId === card.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Akceptuj
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
