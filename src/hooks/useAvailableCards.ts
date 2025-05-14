import { useState, useEffect, useCallback } from "react";
import type { CardDTO, PaginationInfo } from "../types";

interface UseAvailableCardsParams {
  setId: string;
  page?: number;
  limit?: number;
}

interface UseAvailableCardsReturn {
  cards: CardDTO[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAvailableCards({ setId, page = 1, limit = 10 }: UseAvailableCardsParams): UseAvailableCardsReturn {
  const [cards, setCards] = useState<CardDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page,
    limit,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableCards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const response = await fetch(`/api/card-sets/${setId}/available-cards?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch available cards");
        }
        return res.json();
      });

      setCards(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load available cards");
    } finally {
      setIsLoading(false);
    }
  }, [setId, page, limit]);

  useEffect(() => {
    fetchAvailableCards();
  }, [fetchAvailableCards]);

  return {
    cards,
    pagination,
    isLoading,
    error,
    refetch: fetchAvailableCards,
  };
}
