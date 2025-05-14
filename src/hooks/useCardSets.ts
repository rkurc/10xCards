import { useState, useEffect, useCallback } from "react";
import type { CardSetWithCardCount, CardSetListResponse, PaginationInfo } from "../types";

interface UseCardSetsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "created_at" | "updated_at" | "card_count";
  sortDirection?: "asc" | "desc";
}

export function useCardSets(params: UseCardSetsParams = {}) {
  const [cardSets, setCardSets] = useState<CardSetWithCardCount[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 10, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCardSets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const response: CardSetListResponse = await fetch("/api/card-sets", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());

      setCardSets(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card sets");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCardSets();
  }, [fetchCardSets]);

  return {
    cardSets,
    pagination,
    isLoading,
    error,
    refetch: fetchCardSets,
  };
}
