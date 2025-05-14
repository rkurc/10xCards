import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CardSetFiltersProps {
  filters: {
    search: string;
    sortBy: "name" | "created_at" | "updated_at" | "card_count";
    sortDirection: "asc" | "desc";
  };
  onFilterChange: (filters: CardSetFiltersProps["filters"]) => void;
}

export default function CardSetFilters({ filters, onFilterChange }: CardSetFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Search flashcard sets..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="max-w-sm"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              sortBy: value as CardSetFiltersProps["filters"]["sortBy"],
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="created_at">Creation Date</SelectItem>
            <SelectItem value="updated_at">Last Updated</SelectItem>
            <SelectItem value="card_count">Card Count</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sortDirection}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              sortDirection: value as "asc" | "desc",
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
