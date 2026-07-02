import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, Grid3x3, List } from "lucide-react";
import type { ViewMode } from "@/hooks/use-view-mode";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

const OPTIONS: { mode: ViewMode; icon: typeof List; label: string }[] = [
  { mode: "list", icon: List, label: "List view" },
  { mode: "compact", icon: Grid3x3, label: "Compact grid" },
  { mode: "tiles", icon: LayoutGrid, label: "Tile view" },
];

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border p-0.5">
      {OPTIONS.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={view === mode}
          className={cn("h-8 w-8", view === mode && "bg-accent text-accent-foreground")}
          onClick={() => onChange(mode)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
