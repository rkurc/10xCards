import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCardSet } from '../../hooks/useCardSet';
import type { CardDTO } from '../../types';

interface CardSetDetailProps {
  setId: string;
}

export default function CardSetDetail({ setId }: CardSetDetailProps) {
  const { cardSet, cards, isLoading, error } = useCardSet(setId);
  const [selectedCard, setSelectedCard] = useState<CardDTO | null>(null);

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
        <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/sets'}>
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
            <h1 className="text-3xl font-bold mb-2">{cardSet.name}</h1>
            <p className="text-gray-600">{cardSet.description}</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline">Edit Set</Button>
            <Button>Add Card</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedCard(card)}
          >
            <CardContent className="p-4">
              <div className="h-32 flex items-center justify-center border-b">
                <p className="text-center">{card.front_content}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-4">No cards in this set yet</h3>
          <p className="text-gray-600 mb-8">Add your first card to start learning</p>
          <Button>Add Card</Button>
        </div>
      )}

      {/* TODO: Add card modal component */}
    </div>
  );
}
