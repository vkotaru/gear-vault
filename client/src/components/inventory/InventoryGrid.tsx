import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InventoryCard from "./InventoryCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Item } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

interface InventoryGridProps {
  queryKey: string;
  title?: string;
  emptyMessage?: string;
}

export default function InventoryGrid({
  queryKey,
  title = "Equipment",
  emptyMessage = "No items found"
}: InventoryGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: items = [], isLoading, isError, error } = useQuery<Item[]>({
    queryKey: [queryKey],
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const filteredItems = items.filter(item => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full p-8 text-center border rounded-lg bg-destructive/10">
        <Package className="mx-auto h-12 w-12 text-destructive/60 mb-4" />
        <h3 className="text-lg font-semibold text-destructive">Error loading inventory</h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-xl font-bold">{title}</h2>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
          <Input
            placeholder="Search gear..."
            className="pl-10 w-full md:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className={!activeCategory ? "bg-primary/10 text-primary border-primary" : ""}
          onClick={() => setActiveCategory(null)}
        >
          All Categories
        </Button>

        {CATEGORIES.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            className={activeCategory === value ? "bg-primary/10 text-primary border-primary" : ""}
            onClick={() => handleCategoryClick(value)}
          >
            <Icon className="h-4 w-4 mr-1" /> {label}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow-md">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-bold text-xl mb-2">No Items Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
