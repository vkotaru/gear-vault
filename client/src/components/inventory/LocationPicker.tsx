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
import type { Location, Spot } from "@shared/schema";
import { Plus, X } from "lucide-react";

export interface LocationSelection {
  locationId: number;
  spotId: number | null;
  locationName: string;
  address: string;
  spotName: string | null;
}

interface LocationPickerProps {
  locationId: number | null;
  spotId: number | null;
  onChange: (selection: LocationSelection) => void;
}

const NO_SPOT = "__none__";

/**
 * Two-level storage picker: choose a place (or add one inline), then optionally
 * a spot within it (or add one inline). Places are the user's own.
 */
export default function LocationPicker({ locationId, spotId, onChange }: LocationPickerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: places = [] } = useQuery<Array<Location & { items: number }>>({
    queryKey: ["/api/locations"],
  });
  const { data: spots = [] } = useQuery<Spot[]>({
    queryKey: [`/api/locations/${locationId}/spots`],
    enabled: !!locationId,
  });

  const [addingPlace, setAddingPlace] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [addingSpot, setAddingSpot] = useState(false);
  const [newSpotName, setNewSpotName] = useState("");

  const selectedPlace = places.find((p) => p.id === locationId) || null;

  const emit = (place: { id: number; name: string; address: string }, spot: Spot | null) => {
    onChange({
      locationId: place.id,
      spotId: spot ? spot.id : null,
      locationName: place.name,
      address: place.address,
      spotName: spot ? spot.name : null,
    });
  };

  const createPlace = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/locations", {
        name: newPlaceName.trim(),
        address: newPlaceAddress.trim(),
      });
      return (await res.json()) as Location;
    },
    onSuccess: (place) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      emit(place, null);
      setAddingPlace(false);
      setNewPlaceName("");
      setNewPlaceAddress("");
      toast({ title: "Place added", description: place.name });
    },
    onError: (err: any) =>
      toast({ title: "Couldn't add place", description: (err?.message || "").replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  const createSpot = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/locations/${locationId}/spots`, { name: newSpotName.trim() });
      return (await res.json()) as Spot;
    },
    onSuccess: (spot) => {
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${locationId}/spots`] });
      if (selectedPlace) emit(selectedPlace, spot);
      setAddingSpot(false);
      setNewSpotName("");
      toast({ title: "Spot added", description: spot.name });
    },
    onError: (err: any) =>
      toast({ title: "Couldn't add spot", description: (err?.message || "").replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  if (addingPlace) {
    return (
      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium">New place</p>
        <Input placeholder="Name (e.g. Home)" value={newPlaceName} onChange={(e) => setNewPlaceName(e.target.value)} />
        <AddressAutocomplete value={newPlaceAddress} onChange={setNewPlaceAddress} placeholder="Start typing an address..." />
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={!newPlaceName.trim() || !newPlaceAddress.trim() || createPlace.isPending} onClick={() => createPlace.mutate()}>
            {createPlace.isPending ? "Adding..." : "Add place"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAddingPlace(false)}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Place */}
      <div className="flex gap-2">
        <Select
          value={locationId ? String(locationId) : undefined}
          onValueChange={(v) => {
            const place = places.find((p) => String(p.id) === v);
            if (place) emit(place, null); // reset spot when place changes
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a place" />
          </SelectTrigger>
          <SelectContent>
            {places.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No places yet</div>
            ) : (
              places.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                  {p.address ? ` — ${p.address}` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={() => setAddingPlace(true)} title="Add new place">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Spot (only once a place is chosen) */}
      {selectedPlace && (
        addingSpot ? (
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Spot name (e.g. Box 1, Living Room)"
              value={newSpotName}
              onChange={(e) => setNewSpotName(e.target.value)}
            />
            <Button type="button" size="sm" disabled={!newSpotName.trim() || createSpot.isPending} onClick={() => createSpot.mutate()}>
              {createSpot.isPending ? "Adding..." : "Add"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAddingSpot(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Select
              value={spotId ? String(spotId) : NO_SPOT}
              onValueChange={(v) => {
                const spot = v === NO_SPOT ? null : spots.find((s) => String(s.id) === v) || null;
                emit(selectedPlace, spot);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Spot (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SPOT}>No specific spot</SelectItem>
                {spots.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => setAddingSpot(true)} title="Add new spot">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )
      )}
    </div>
  );
}
