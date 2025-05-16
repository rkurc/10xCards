import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCardSet } from "../../hooks/useCardSet";
import type { CardDTO, CardSetUpdateCommand } from "../../types";
import EditCardSetModal from "./EditCardSetModal";
import EditCardModal from "./EditCardModal";
import CardToSetModal from "./CardToSetModal";
import DeleteAlertDialog from "./DeleteAlertDialog";
import CardViewDialog from "./CardViewDialog";
import { ArrowLeft } from "lucide-react";

interface CardSetDetailProps {
  setId: string;
}

export default function CardSetDetail({ setId }: CardSetDetailProps) {
  const [page, setPage] = useState(1);
  const { cardSet, cards, cardPagination, isLoading, error, refetch } = useCardSet(setId, {
    page,
    limit: 12,
  });
  const [selectedCard, setSelectedCard] = useState<CardDTO | null>(null);
  const [isEditSetOpen, setIsEditSetOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isAddCardsOpen, setIsAddCardsOpen] = useState(false);
  const [isViewCardOpen, setIsViewCardOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(-1);

  const handleUpdateSet = async (data: CardSetUpdateCommand) => {
    try {
      await fetch(`/api/card-sets/${setId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refetch();
    } catch (error) {
      console.error("Failed to update card set:", error);
      throw error;
    }
  };

  const handleUpdateCard = async (cardId: string, frontContent: string, backContent: string) => {
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front_content: frontContent, back_content: backContent }),
      });
      await refetch();
    } catch (error) {
      console.error("Failed to update card:", error);
      throw error;
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      await refetch();
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  const handleDeleteSet = async () => {
    try {
      await fetch(`/api/card-sets/${setId}`, { method: "DELETE" });
      window.location.href = "/sets";
    } catch (error) {
      console.error("Failed to delete set:", error);
    }
  };

  const handleAddCards = async (cardIds: string[]) => {
    try {
      await fetch(`/api/card-sets/${setId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_ids: cardIds }),
      });
      await refetch();
    } catch (error) {
      console.error("Failed to add cards:", error);
      throw error;
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewCard = (card: CardDTO) => {
    setSelectedCard(card);
    setCurrentCardIndex(cards.findIndex((c) => c.id === card.id));
    setIsViewCardOpen(true);
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      const prevCard = cards[currentCardIndex - 1];
      setSelectedCard(prevCard);
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      const nextCard = cards[currentCardIndex + 1];
      setSelectedCard(nextCard);
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error || !cardSet) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Nie udało się załadować zestawu fiszek</p>
        <Button variant="outline" className="mt-4" onClick={() => (window.location.href = "/sets")}>
          Powrót do zestawów
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => (window.location.href = "/sets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy zestawów
          </Button>
          <h1 className="text-3xl font-bold">{isLoading ? "Ładowanie..." : cardSet?.name || "Szczegóły zestawu"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsAddCardsOpen(true)}>
            Dodaj fiszki
          </Button>
          <Button variant="outline" onClick={() => setIsEditSetOpen(true)}>
            Edytuj zestaw
          </Button>
          <DeleteAlertDialog
            title="Usuń zestaw"
            description="Czy na pewno chcesz usunąć ten zestaw? Wszystkie fiszki zostaną usunięte."
            onConfirm={handleDeleteSet}
          >
            <Button variant="destructive">Usuń zestaw</Button>
          </DeleteAlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card: CardDTO) => (
          <Card key={card.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Button
                className="h-32 w-full flex items-center justify-center border-b text-left font-normal hover:bg-gray-50"
                variant="ghost"
                onClick={() => handleViewCard(card)}
              >
                <span className="text-center">{card.front_content}</span>
              </Button>
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCard(card);
                    setIsEditCardOpen(true);
                  }}
                >
                  Edytuj
                </Button>
                <DeleteAlertDialog
                  title="Usuń fiszkę"
                  description="Czy na pewno chcesz usunąć tę fiszkę?"
                  onConfirm={() => handleDeleteCard(card.id)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-4">Brak fiszek w tym zestawie</h3>
          <p className="text-gray-600 mb-8">Dodaj swoją pierwszą fiszkę, aby rozpocząć naukę</p>
          <Button onClick={() => setIsAddCardsOpen(true)}>Dodaj fiszki</Button>
        </div>
      )}

      {cardPagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
              </PaginationItem>
              <PaginationItem>
                Strona {page} z {cardPagination.pages}
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(page + 1)} disabled={page === cardPagination.pages} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {isEditSetOpen && cardSet && (
        <EditCardSetModal
          cardSet={cardSet}
          open={isEditSetOpen}
          onOpenChange={(open) => setIsEditSetOpen(open)}
          onSubmit={handleUpdateSet}
        />
      )}

      {isEditCardOpen && selectedCard && (
        <EditCardModal
          card={selectedCard}
          open={isEditCardOpen}
          onOpenChange={(open) => setIsEditCardOpen(open)}
          onSubmit={(cardId, frontContent, backContent) => handleUpdateCard(cardId, frontContent, backContent)}
        />
      )}

      {isAddCardsOpen && (
        <CardToSetModal
          setId={setId}
          open={isAddCardsOpen}
          onOpenChange={(open) => setIsAddCardsOpen(open)}
          onSubmit={handleAddCards}
        />
      )}

      {isViewCardOpen && selectedCard && (
        <CardViewDialog
          card={selectedCard}
          open={isViewCardOpen}
          onOpenChange={(open) => setIsViewCardOpen(open)}
          onPrevious={handlePreviousCard}
          onNext={handleNextCard}
          hasPrevious={currentCardIndex > 0}
          hasNext={currentCardIndex < cards.length - 1}
        />
      )}
    </div>
  );
}
