import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { useGenerationContext } from "../../contexts/generation-context";
import { useToast } from "../ui/use-toast";

export function GenerateForm() {
  const { toast } = useToast();
  const { text, setText, targetCount, setTargetCount, setGenerationId, setCurrentStep, updateGenerationState } =
    useGenerationContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localText, setLocalText] = useState(text);

  // Sync local state with context when context changes
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Update context after local state changes
  useEffect(() => {
    setText(localText);
  }, [localText, setText]);

  useEffect(() => {
    console.log("[GENERATE-FORM] Context setters:", { setCurrentStep, setGenerationId, updateGenerationState });
  }, [setCurrentStep, setGenerationId, updateGenerationState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localText.trim()) {
      setError("Wprowadź tekst, aby wygenerować fiszki.");
      return;
    }

    if (localText.length < 100) {
      setError("Wprowadź co najmniej 100 znaków, aby uzyskać lepsze wyniki.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      console.log("[GENERATE-FORM] Submitting form with:", { text: localText, targetCount });

      const response = await fetch("/api/generation/process-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: localText,
          target_count: targetCount,
        }),
      });
      console.log("[GENERATE-FORM] API response status:", response.status);
      if (!response.ok) {
        throw new Error("Nie udało się rozpocząć procesu generowania");
      }

      const data = await response.json();
      console.log("[GENERATE-FORM] API response data:", data);

      // Use the new combined state update function instead of separate setters
      console.log("[GENERATE-FORM] Updating generation state with:", data.generation_id);
      updateGenerationState(data.generation_id, "processing");
      console.log("[GENERATE-FORM] State update complete");

      toast({
        title: "Generowanie rozpoczęte",
        description: `Szacowany czas: ${data.estimated_time_seconds} sekund`,
      });

      // Check if the API response includes a redirect URL
      if (data.redirect_url) {
        // Store the redirect URL to be used after processing completes
        sessionStorage.setItem("flashcard_redirect_url", data.redirect_url);
      }
    } catch (error) {
      console.error("Error starting generation:", error);
      setError("Wystąpił błąd podczas rozpoczynania procesu generowania. Spróbuj ponownie.");
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się rozpocząć procesu generowania. Spróbuj ponownie.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generuj nowe fiszki</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="text">Wklej swój tekst poniżej</Label>
            <Textarea
              id="text"
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              placeholder="Wklej tekst, z którego chcesz wygenerować fiszki..."
              rows={10}
              required
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Liczba znaków: {localText.length}
              {localText.length < 100 && localText.length > 0 && " (wymagane minimum 100 znaków)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-count">Docelowa liczba fiszek</Label>
            <Input
              id="target-count"
              type="number"
              min={1}
              max={50}
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 10)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Możesz wygenerować do 50 fiszek jednocześnie</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting || localText.length < 100} className="min-w-[120px]">
            {isSubmitting ? "Przetwarzanie..." : "Generuj fiszki"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
