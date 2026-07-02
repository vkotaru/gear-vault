import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { Spot } from "@shared/schema";
import { Plus, X } from "lucide-react";

interface LocationSpotsProps {
  locationId: number;
}

/** Manage the named spots within a place (list, add, remove). */
export default function LocationSpots({ locationId }: LocationSpotsProps) {
  const queryClient = useQueryClient();
  const spotsKey = [`/api/locations/${locationId}/spots`];
  const { data: spots = [] } = useQuery<Spot[]>({ queryKey: spotsKey });
  const [name, setName] = useState("");

  const addSpot = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/locations/${locationId}/spots`, { name: name.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spotsKey });
      setName("");
    },
  });

  const removeSpot = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/spots/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: spotsKey }),
  });

  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-1">Spots</p>
      {spots.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {spots.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
              {s.name}
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeSpot.mutate(s.id)}
                aria-label={`Remove ${s.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-2">No spots yet.</p>
      )}
      <div className="flex gap-2">
        <Input
          className="h-8 text-sm"
          placeholder="Add a spot (e.g. Box 1)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              e.preventDefault();
              addSpot.mutate();
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={!name.trim() || addSpot.isPending} onClick={() => addSpot.mutate()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
