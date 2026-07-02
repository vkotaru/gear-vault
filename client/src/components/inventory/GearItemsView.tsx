import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "lucide-react";
import type { Item } from "@shared/schema";
import type { ViewMode } from "@/hooks/use-view-mode";

interface GearItemsViewProps {
  items: Item[];
  view: ViewMode;
  /** Optional per-item actions (e.g. a dropdown menu). Rendered without triggering navigation. */
  renderMenu?: (item: Item) => React.ReactNode;
}

function statusBadgeClass(status: string) {
  return status === "available"
    ? "bg-primary/15 text-primary"
    : "bg-secondary/15 text-secondary";
}

function statusLabel(status: string) {
  return status === "available" ? "Available" : "Checked Out";
}

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function Thumb({ item, className }: { item: Item; className?: string }) {
  if (item.imageUrls && item.imageUrls.length > 0) {
    return <img src={item.imageUrls[0]} alt={item.name} className={className} />;
  }
  return (
    <div className={`bg-muted flex items-center justify-center ${className || ""}`}>
      <Tag className="h-1/3 w-1/3 text-muted-foreground" />
    </div>
  );
}

export default function GearItemsView({ items, view, renderMenu }: GearItemsViewProps) {
  const [, navigate] = useLocation();
  const go = (item: Item) => navigate(`/items/${item.id}`);
  // Stop card navigation when interacting with the actions menu.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (view === "list") {
    return (
      <div className="divide-y rounded-md border">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/40"
            onClick={() => go(item)}
          >
            <Thumb item={item} className="h-12 w-12 rounded object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.brand ? `${item.brand} • ` : ""}
                {categoryLabel(item.category)}
              </p>
            </div>
            <span className="hidden md:block text-xs text-muted-foreground truncate max-w-[12rem]">
              {item.storageLocation}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}>
              {statusLabel(item.status)}
            </span>
            {renderMenu && <div onClick={stop}>{renderMenu(item)}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="h-full cursor-pointer hover:border-primary transition-colors overflow-hidden"
            onClick={() => go(item)}
          >
            <div className="aspect-square relative overflow-hidden">
              <Thumb item={item} className="w-full h-full object-cover" />
              <span className={`absolute top-1 right-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>
            <div className="p-2">
              <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">{categoryLabel(item.category)}</p>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // tiles (default)
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.id}
          className="h-full cursor-pointer hover:border-primary transition-colors"
          onClick={() => go(item)}
        >
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            <Thumb item={item} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>
            {item.isShared && (
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  Shared
                </span>
              </div>
            )}
          </div>
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              {renderMenu && <div onClick={stop}>{renderMenu(item)}</div>}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground">
              {item.brand && `${item.brand} • `}
              {categoryLabel(item.category)}
            </p>
            {item.description && <p className="text-sm mt-2 line-clamp-2">{item.description}</p>}
          </CardContent>
          <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
            Location: {item.storageLocation}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
