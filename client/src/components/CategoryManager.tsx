import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";
import { BUILTIN_CATEGORIES } from "@/lib/categories";
import { Plus, X } from "lucide-react";

/** Manage user-defined item categories (built-ins are shown but not editable). */
export default function CategoryManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const { data: custom = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const add = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/categories", { name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setName("");
    },
    onError: (err: any) =>
      toast({ title: "Couldn't add category", description: (err?.message || "").replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/categories"] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Built-in</p>
        <div className="flex flex-wrap gap-1.5">
          {BUILTIN_CATEGORIES.map((c) => (
            <span key={c.value} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs">
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Your categories</p>
        {custom.length === 0 ? (
          <p className="text-xs text-muted-foreground mb-2">None yet. Add your own below (e.g. Running).</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {custom.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs">
                {c.name}
                <button
                  type="button"
                  className="hover:text-destructive"
                  onClick={() => remove.mutate(c.id)}
                  aria-label={`Remove ${c.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 max-w-sm">
          <Input
            placeholder="Add a category (e.g. Running)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                e.preventDefault();
                add.mutate();
              }
            }}
          />
          <Button type="button" variant="outline" disabled={!name.trim() || add.isPending} onClick={() => add.mutate()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Removing a category won't change items already using it.
        </p>
      </div>
    </div>
  );
}
