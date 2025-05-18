import { useState } from "react";
import type { CardSetWithCardCount, CardSetCreateCommand } from "../../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCardSets } from "../../hooks/useCardSets";
import DeleteAlertDialog from "./DeleteAlertDialog";
import CardSetFilters from "./CardSetFilters";
import { Grid3X3, List } from "lucide-react";
import CreateCardSetModal from "./CreateCardSetModal";

interface Filters {
  search: string;
  sortBy: "name" | "created_at" | "updated_at" | "card_count";
  sortDirection: "asc" | "desc";
}

export default function CardSetList() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
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

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleCreateSet = () => {
    console.log("Opening create set modal...");
    setIsCreateModalOpen(true);
  };

  const handleCreateSetSubmit = async (data: CardSetCreateCommand) => {
    try {
      console.log("Submitting form data:", data);
      const response = await fetch("/api/card-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create card set");
      }

      setIsCreateModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to create card set:", error);
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
        <p className="text-red-500">Nie udało się załadować zestawów fiszek</p>
        <Button variant="outline" className="mt-4" onClick={refetch}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  if (!cardSets?.length) {
    return (
      <>
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-4">Nie masz jeszcze żadnych zestawów fiszek</h3>
          <p className="text-gray-600 mb-8">Utwórz swój pierwszy zestaw, aby rozpocząć naukę</p>
          <Button onClick={handleCreateSet}>Utwórz nowy zestaw</Button>
        </div>

        <CreateCardSetModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSubmit={handleCreateSetSubmit}
        />
      </>
    );
  }

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <div className="w-full md:flex-1">
            <CardSetFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Button onClick={handleCreateSet}>Utwórz nowy zestaw</Button>
            <div className="flex space-x-2">
              <Button variant={viewMode === "list" ? "outline" : "default"} onClick={() => setViewMode("list")}>
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
              <Button variant={viewMode === "grid" ? "outline" : "default"} onClick={() => setViewMode("grid")}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Siatka
              </Button>
            </div>
          </div>
        </div>

        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {cardSets.map((set) => (
            <Card key={set.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{set.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{set.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{set.card_count} fiszek</span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => (window.location.href = `/sets/${set.id}`)}>
                      Zobacz zestaw
                    </Button>
                    <DeleteAlertDialog
                      title="Usuń zestaw"
                      description="Czy na pewno chcesz usunąć ten zestaw? Wszystkie fiszki zostaną usunięte."
                      onConfirm={() => handleDeleteSet(set.id)}
                    >
                      <Button
                        variant="destructive"
                        className="shadow-md hover:shadow-lg transition-shadow text-black font-bold"
                      >
                        Usuń zestaw
                      </Button>
                    </DeleteAlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CreateCardSetModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateSetSubmit}
      />
    </>
  );
}
