import { useState } from "react";
import type { CardSetWithCardCount } from "../../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCardSets } from "../../hooks/useCardSets";
import DeleteAlertDialog from "./DeleteAlertDialog";
import { useDialog } from "../DialogProvider";
import CardSetFilters from "./CardSetFilters";

interface Filters {
  search: string;
  sortBy: "name" | "created_at" | "updated_at" | "card_count";
  sortDirection: "asc" | "desc";
}

export default function CardSetList() {
  const { openCreateCardSetModal } = useDialog();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    sortBy: "updated_at",
    sortDirection: "desc",
  });

  const { cardSets, isLoading, error, refetch } = useCardSets(filters);

  const handleDeleteSet = async (setId: string) => {
    try {
      await fetch(`/api/card-sets/${setId}`, {
        method: "DELETE",
      });
      await refetch();
    } catch (error) {
      console.error("Failed to delete card set:", error);
    }
  };

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
        <Button variant="outline" className="mt-4" onClick={refetch}>
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
        <Button onClick={openCreateCardSetModal}>Create New Set</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
        <div className="w-full md:flex-1">
          <CardSetFilters filters={filters} onFilterChange={(newFilters) => setFilters(newFilters)} />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <Button onClick={openCreateCardSetModal}>Create New Set</Button>
          <div className="flex space-x-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>Grid</Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>List</Button>
          </div>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
        {cardSets.map((set: CardSetWithCardCount) => (
          <Card key={set.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{set.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{set.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">{set.card_count} cards</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => (window.location.href = `/sets/${set.id}`)}>View Set</Button>
                  <DeleteAlertDialog onConfirm={() => handleDeleteSet(set.id)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
