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
        <p className="text-red-500">Failed to load flashcard set</p>
        <Button variant="outline" className="mt-4" onClick={() => (window.location.href = "/sets")}>
          Back to Sets
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Button variant="outline" size="sm" className="mb-4" onClick={() => (window.location.href = "/sets")}>
              ← Back to Sets
            </Button>
            <h1 className="text-3xl font-bold mb-2">{cardSet.name}</h1>
            <p className="text-gray-600">{cardSet.description}</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsEditSetOpen(true)}>
              Edit Set
            </Button>
            <Button onClick={() => setIsAddCardsOpen(true)}>Add Cards</Button>
            <DeleteAlertDialog onConfirm={handleDeleteSet} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card: CardDTO) => (
          <Card key={card.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Button
                className="h-32 w-full flex items-center justify-center border-b text-left font-normal hover:bg-gray-50"
                variant="ghost"
                onClick={() => setSelectedCard(card)}
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
                  Edit
                </Button>
                <DeleteAlertDialog onConfirm={() => handleDeleteCard(card.id)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-4">No cards in this set yet</h3>
          <p className="text-gray-600 mb-8">Add your first card to start learning</p>
          <Button onClick={() => setIsAddCardsOpen(true)}>Add Cards</Button>
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
                Page {page} of {cardPagination.pages}
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(page + 1)} disabled={page === cardPagination.pages} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {cardSet && (
        <EditCardSetModal
          cardSet={cardSet}
          onSubmit={handleUpdateSet}
          open={isEditSetOpen}
          onOpenChange={setIsEditSetOpen}
        />
      )}

      {selectedCard && (
        <EditCardModal
          card={selectedCard}
          onSubmit={handleUpdateCard}
          open={isEditCardOpen}
          onOpenChange={setIsEditCardOpen}
        />
      )}

      <CardToSetModal
        setId={setId}
        onSubmit={handleAddCards}
        open={isAddCardsOpen}
        onOpenChange={setIsAddCardsOpen}
      />
    </div>
  );
}
