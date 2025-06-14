import { useState } from "react";
import { Button } from "../ui/button";
import { FlashCardPreview } from "./FlashCardPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../ui/use-toast";

interface GenerationCard {
  id: string;
  front_content: string;
  back_content: string;
  readability_score: number;
  isAccepted?: boolean;
  isRejected?: boolean;
}

interface GenerationStats {
  text_length: number;
  generated_count: number;
  generation_time_ms: number;
}

interface GenerationResultsProps {
  generationId: string;
  cards: GenerationCard[];
  stats: GenerationStats;
  onComplete: () => void;
}

export function GenerationResults({ generationId, cards, stats, onComplete }: GenerationResultsProps) {
  // Add debug logging at the start
  console.log("[DEBUG-GENERATION-RESULTS]", {
    generationId,
    cardsCount: cards.length,
    stats,
    firstCard: cards[0],
  });

  const [cardStates, setCardStates] = useState<GenerationCard[]>(cards);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [setName, setSetName] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAccept = (id: string, frontContent: string, backContent: string) => {
    setCardStates((prevStates) =>
      prevStates.map((card) =>
        card.id === id
          ? { ...card, isAccepted: true, isRejected: false, front_content: frontContent, back_content: backContent }
          : card
      )
    );
  };

  const handleReject = (id: string) => {
    setCardStates((prevStates) =>
      prevStates.map((card) => (card.id === id ? { ...card, isAccepted: false, isRejected: true } : card))
    );
  };

  const handleEdit = (id: string, frontContent: string, backContent: string) => {
    setCardStates((prevStates) =>
      prevStates.map((card) =>
        card.id === id ? { ...card, front_content: frontContent, back_content: backContent } : card
      )
    );
  };

  const handleAcceptAll = async () => {
    try {
      const response = await fetch(`/api/generation/${generationId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to accept all cards");
      }

      const data = await response.json();

      toast({
        title: "Sukces",
        description: `Pomyślnie zaakceptowano ${data.accepted_count} fiszki.`,
      });

      // Mark all cards as accepted
      setCardStates((prevStates) => prevStates.map((card) => ({ ...card, isAccepted: true, isRejected: false })));
    } catch (error) {
      console.error("Error accepting cards:", error);
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się zaakceptować fiszek. Spróbuj ponownie.",
      });
    }
  };

  const handleFinalize = async () => {
    if (!setName.trim()) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nazwa zestawu jest wymagana.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const acceptedCardIds = cardStates.filter((card) => card.isAccepted && !card.isRejected).map((card) => card.id);

      if (acceptedCardIds.length === 0) {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Zaakceptuj co najmniej jedną fiszkę przed finalizacją.",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/generation/${generationId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: setName,
          description: setDescription,
          accepted_cards: acceptedCardIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to finalize generation");
      }

      const data = await response.json();

      toast({
        title: "Sukces",
        description: `Zestaw "${setName}" utworzony z ${data.card_count} fiszkami.`,
      });

      setFinalizeDialogOpen(false);
      onComplete();
    } catch (error) {
      console.error("Error finalizing generation:", error);
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się sfinalizować generowania. Spróbuj ponownie.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptedCount = cardStates.filter((card) => card.isAccepted && !card.isRejected).length;
  const rejectedCount = cardStates.filter((card) => card.isRejected).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wygenerowane fiszki</h2>

        <div className="space-x-2">
          <Button variant="outline" onClick={handleAcceptAll}>
            Akceptuj wszystkie
          </Button>
          <Button onClick={() => setFinalizeDialogOpen(true)}>
            Finalizuj ({acceptedCount}/{cardStates.length})
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium">Długość tekstu:</p>
            <p>{stats.text_length} znaków</p>
          </div>
          <div>
            <p className="font-medium">Wygenerowano:</p>
            <p>{stats.generated_count} fiszek</p>
          </div>
          <div>
            <p className="font-medium">Czas generowania:</p>
            <p>{(stats.generation_time_ms / 1000).toFixed(2)} sekund</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardStates.map((card) => (
          <div
            key={card.id}
            className={`
            ${card.isRejected ? "opacity-50" : ""}
            ${card.isAccepted ? "ring-2 ring-primary ring-offset-2" : ""}
          `}
          >
            <FlashCardPreview
              id={card.id}
              frontContent={card.front_content}
              backContent={card.back_content}
              readabilityScore={card.readability_score}
              onAccept={handleAccept}
              onReject={handleReject}
              onEdit={handleEdit}
            />
          </div>
        ))}
      </div>

      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Utwórz zestaw fiszek</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="set-name">Nazwa zestawu</Label>
              <Input
                id="set-name"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="Wprowadź nazwę zestawu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="set-description">Opis (Opcjonalnie)</Label>
              <Input
                id="set-description"
                value={setDescription}
                onChange={(e) => setSetDescription(e.target.value)}
                placeholder="Wprowadź opis"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Tworzysz zestaw z {acceptedCount} zaakceptowanymi fiszkami.
              {rejectedCount > 0 && ` ${rejectedCount} odrzuconych fiszek nie zostanie uwzględnionych.`}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleFinalize} disabled={isSubmitting}>
              {isSubmitting ? "Tworzenie..." : "Utwórz zestaw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
