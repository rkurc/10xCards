import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CardSetFiltersProps {
  filters: {
    search: string;
    sortBy: "name" | "created_at" | "updated_at" | "card_count";
    sortDirection: "asc" | "desc";
  };
  onFilterChange: (newFilters: Partial<CardSetFiltersProps["filters"]>) => void;
}

export default function CardSetFilters({ filters, onFilterChange }: CardSetFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Szukaj zestawów fiszek..."
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="max-w-sm"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            onFilterChange({
              sortBy: value as CardSetFiltersProps["filters"]["sortBy"],
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sortuj według" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nazwa</SelectItem>
            <SelectItem value="created_at">Data utworzenia</SelectItem>
            <SelectItem value="updated_at">Ostatnia aktualizacja</SelectItem>
            <SelectItem value="card_count">Liczba fiszek</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sortDirection}
          onValueChange={(value) =>
            onFilterChange({
              sortDirection: value as "asc" | "desc",
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Kierunek" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Rosnąco</SelectItem>
            <SelectItem value="desc">Malejąco</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
