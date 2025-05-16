import { useState, useEffect, useCallback } from "react";
import type { CardSetDTO, CardDTO, PaginationInfo } from "../types";

interface UseCardSetParams {
  page?: number;
  limit?: number;
}

interface UseCardSetReturn {
  cardSet: CardSetDTO | null;
  cards: CardDTO[];
  cardPagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCardSet(setId: string, params: UseCardSetParams = {}): UseCardSetReturn {
  const [cardSet, setCardSet] = useState<CardSetDTO | null>(null);
  const [cards, setCards] = useState<CardDTO[]>([]);
  const [cardPagination, setCardPagination] = useState<PaginationInfo>({
    total: 0,
    page: params.page || 1,
    limit: params.limit || 10,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCardSet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: String(params.page || 1),
        limit: String(params.limit || 10),
      });

      const response = await fetch(`/api/card-sets/${setId}?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch card set");
        }
        return res.json();
      });

      setCardSet(response);
      setCards(response.cards.data);
      setCardPagination(response.cards.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card set");
    } finally {
      setIsLoading(false);
    }
  }, [setId, params.page, params.limit]);

  useEffect(() => {
    fetchCardSet();
  }, [fetchCardSet]);

  return {
    cardSet,
    cards,
    cardPagination,
    isLoading,
    error,
    refetch: fetchCardSet,
  };
}
