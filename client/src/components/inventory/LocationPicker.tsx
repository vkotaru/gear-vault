import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Location } from "@shared/schema";
import { Plus, X } from "lucide-react";

interface LocationPickerProps {
  selectedId: number | null;
  onSelect: (loc: { id: number; name: string; address: string }) => void;
}

/**
 * Choose an existing storage location, or add a new one inline (which creates
 * a Location record). Backs the item form's storage-location field.
 */
export default function LocationPicker({ selectedId, onSelect }: LocationPickerProps) {
  const { data: locations = [] } = useQuery<Array<Location & { items: number }>>({
    queryKey: ["/api/locations"],
  });
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/locations", {
        name: newName.trim(),
        address: newAddress.trim(),
      });
      return (await res.json()) as Location;
    },
    onSuccess: (loc) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      onSelect({ id: loc.id, name: loc.name, address: loc.address });
      setAdding(false);
      setNewName("");
      setNewAddress("");
      toast({ title: "Location added", description: loc.name });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't add location",
        description: (err?.message || "").replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  if (adding) {
    return (
      <div className="space-y-2 rounded-md border p-3">
        <Input
          placeholder="Location name (e.g. Home Garage)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <AddressAutocomplete
          value={newAddress}
          onChange={setNewAddress}
          placeholder="Start typing an address..."
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!newName.trim() || !newAddress.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Adding..." : "Add location"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select
        value={selectedId ? String(selectedId) : undefined}
        onValueChange={(v) => {
          const loc = locations.find((l) => String(l.id) === v);
          if (loc) onSelect({ id: loc.id, name: loc.name, address: loc.address });
        }}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select a location" />
        </SelectTrigger>
        <SelectContent>
          {locations.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No locations yet</div>
          ) : (
            locations.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.name}
                {l.address ? ` — ${l.address}` : ""}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" onClick={() => setAdding(true)} title="Add new location">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
