import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip, Item } from "@shared/schema";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { ArrowLeft, Loader2, MapPin, ExternalLink, Calendar, Plus, X, Tag } from "lucide-react";

type TripWithItems = Trip & { items: Item[] };

export default function TripDetail({ id }: { id: string }) {
  const tripId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const tripKey = [`/api/trips/${tripId}`];
  const { data: trip, isLoading, isError } = useQuery<TripWithItems>({ queryKey: tripKey });
  const { data: allItems = [] } = useQuery<Item[]>({ queryKey: ["/api/items"], enabled: pickerOpen });

  const addItems = useMutation({
    mutationFn: async (ids: number[]) => apiRequest("POST", `/api/trips/${tripId}/items`, { itemIds: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKey });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setPickerOpen(false);
      setSelected(new Set());
      toast({ title: "Gear added to trip" });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: number) => apiRequest("DELETE", `/api/trips/${tripId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKey });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
  });

  if (isLoading) {
    return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }
  if (isError || !trip) {
    return <Layout><div className="py-20 text-center text-muted-foreground">Trip not found.</div></Layout>;
  }

  const packedIds = new Set(trip.items.map((i) => i.id));
  const candidates = allItems
    .filter((i) => !packedIds.has(i.id))
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.brand || "").toLowerCase().includes(search.toLowerCase()));

  const dateRange = () => {
    if (!trip.startDate && !trip.endDate) return null;
    const s = trip.startDate ? format(new Date(trip.startDate), "MMM d, yyyy") : "";
    const e = trip.endDate ? format(new Date(trip.endDate), "MMM d, yyyy") : "";
    return s && e ? `${s} – ${e}` : s || e;
  };

  const toggle = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/trips")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> All trips
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{trip.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-muted-foreground">
            {dateRange() && <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {dateRange()}</span>}
            {trip.destination && <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {trip.destination}</span>}
            {trip.url && (
              <a href={trip.url} target="_blank" rel="noreferrer" className="flex items-center text-primary hover:underline">
                <ExternalLink className="h-4 w-4 mr-1" /> Link
              </a>
            )}
          </div>
          {trip.notes && <p className="mt-3 text-sm whitespace-pre-wrap">{trip.notes}</p>}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Gear packed ({trip.items.length})</CardTitle>
            <Button size="sm" onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add gear</Button>
          </CardHeader>
          <CardContent>
            {trip.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No gear packed yet.</p>
            ) : (
              <div className="divide-y">
                {trip.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrls && item.imageUrls.length > 0
                        ? <img src={item.imageUrls[0]} alt={item.name} className="h-full w-full object-contain" />
                        : <Tag className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <Link href={`/items/${item.id}`} className="flex-1 min-w-0 hover:underline">
                      <span className="font-medium truncate">{item.name}</span>
                    </Link>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem.mutate(item.id)} aria-label="Remove from trip">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader><DialogTitle>Add gear to trip</DialogTitle></DialogHeader>
            <Input placeholder="Search your gear…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-80 overflow-y-auto divide-y">
              {candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No matching gear.</p>
              ) : candidates.map((item) => (
                <label key={item.id} className="flex items-center gap-3 py-2 cursor-pointer">
                  <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.brand}</span>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPickerOpen(false)}>Cancel</Button>
              <Button disabled={selected.size === 0 || addItems.isPending} onClick={() => addItems.mutate(Array.from(selected))}>
                {addItems.isPending ? "Adding..." : `Add ${selected.size || ""}`.trim()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
