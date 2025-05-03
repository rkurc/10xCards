import { ErrorBoundary } from "react-error-boundary";
import { Suspense, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GenerateForm } from "./GenerateForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { GenerationStatus } from "./GenerationStatus";
import { GenerationResults } from "./GenerationResults";
import { useGenerationContext } from "../../contexts/generation-context";
import { Button } from "../ui/button";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>Wystąpił problem podczas ładowania komponentu: {error.message}</AlertDescription>
    </Alert>
  );
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">Ładowanie...</span>
    </div>
  );
}

export default function GenerateContent() {
  const { currentStep, setCurrentStep, generationId, cards, setCards, stats, setStats, resetGeneration } =
    useGenerationContext();

  useEffect(() => {
    // If we have a generationId but no cards yet, fetch the results
    const fetchResults = async () => {
      if (generationId && currentStep === "review" && cards.length === 0) {
        try {
          const response = await fetch(`/api/generation/${generationId}/results`);

          if (!response.ok) {
            throw new Error("Failed to fetch generation results");
          }

          const data = await response.json();
          setCards(data.cards);
          setStats(data.stats);
        } catch (error) {
          console.error("Error fetching generation results:", error);
          // Handle error (show toast, etc.)
        }
      }
    };

    fetchResults();
  }, [generationId, currentStep, cards.length, setCards, setStats]);

  const handleProcessingComplete = async () => {
    setCurrentStep("review");
  };

  const handleGenerationComplete = () => {
    setCurrentStep("complete");
  };

  const handleStartNewGeneration = () => {
    resetGeneration();
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Generate Flashcards</h1>

        {currentStep === "input" && <GenerateForm />}

        {currentStep === "processing" && generationId && (
          <Card>
            <CardContent className="p-6">
              <GenerationStatus generationId={generationId} onComplete={handleProcessingComplete} />
            </CardContent>
          </Card>
        )}

        {currentStep === "review" && generationId && cards.length > 0 && stats && (
          <GenerationResults
            generationId={generationId}
            cards={cards}
            stats={stats}
            onComplete={handleGenerationComplete}
          />
        )}

        {currentStep === "complete" && (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Flashcards Created Successfully!</h2>
              <p className="mb-6 text-muted-foreground">
                Your flashcards have been saved. You can now access them in your collection.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleStartNewGeneration}>
                  Create New Cards
                </Button>
                <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
