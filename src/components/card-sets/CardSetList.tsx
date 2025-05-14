import { useState } from 'react';
import type { CardSetWithCardCount } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCardSets } from '../../hooks/useCardSets';

export default function CardSetList() {
  const { cardSets, isLoading, error } = useCardSets();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load flashcard sets</p>
        <Button variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!cardSets?.length) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold mb-4">No flashcard sets yet</h3>
        <p className="text-gray-600 mb-8">Create your first set to start learning</p>
        <Button>Create New Set</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4 space-x-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          onClick={() => setViewMode('grid')}
        >
          Grid
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          List
        </Button>
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {cardSets.map((set) => (
          <Card key={set.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{set.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{set.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">{set.card_count} cards</span>
                <Button variant="outline" onClick={() => window.location.href = `/sets/${set.id}`}>
                  View Set
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
