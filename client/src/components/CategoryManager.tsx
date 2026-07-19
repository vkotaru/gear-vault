import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";
import { iconForKey } from "@/lib/categories";
import { Plus, X, Pencil, Check } from "lucide-react";

/** Manage item categories: rename or remove any (built-ins included), and add new. */
export default function CategoryManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: cats = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
  const onErr = (err: any) =>
    toast({ title: "Couldn't save", description: (err?.message || "").replace(/^\d+:\s*/, ""), variant: "destructive" });

  const add = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/categories", { name: name.trim() }),
    onSuccess: () => { invalidate(); setName(""); },
    onError: onErr,
  });
  const rename = useMutation({
    mutationFn: async ({ id, newName }: { id: number; newName: string }) =>
      apiRequest("PUT", `/api/categories/${id}`, { name: newName.trim() }),
    onSuccess: () => { invalidate(); setEditingId(null); },
    onError: onErr,
  });
  const remove = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: invalidate,
    onError: onErr,
  });

  const startEdit = (c: Category) => { setEditingId(c.id); setEditName(c.name); };

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-md border">
        {cats.map((c) => {
          const Icon = iconForKey(c.icon);
          const isEditing = editingId === c.id;
          return (
            <div key={c.id} className="flex items-center gap-2 p-2">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              {isEditing ? (
                <>
                  <Input
                    className="h-8 flex-1"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editName.trim()) rename.mutate({ id: c.id, newName: editName });
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8"
                    disabled={!editName.trim() || rename.isPending}
                    onClick={() => rename.mutate({ id: c.id, newName: editName })}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{c.name}</span>
                  {c.builtin && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">default</span>}
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(c)} aria-label={`Rename ${c.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove.mutate(c.id)} aria-label={`Remove ${c.name}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 max-w-sm">
        <Input
          placeholder="Add a category (e.g. Running)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { e.preventDefault(); add.mutate(); } }}
        />
        <Button type="button" variant="outline" disabled={!name.trim() || add.isPending} onClick={() => add.mutate()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Renaming only changes the label — your items stay linked. Removing a category leaves existing items untouched.
      </p>
    </div>
  );
}
