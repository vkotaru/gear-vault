import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { formatDateOnly } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip } from "@shared/schema";
import { parseTripLinks } from "@shared/schema";
import { Loader2, Plus, MapPin, ExternalLink, Calendar, Package, Pencil, Trash2 } from "lucide-react";

type TripWithCount = Trip & { itemCount: number };

const EMPTY = { name: "", destination: "", url: "", notes: "", startDate: "", endDate: "" };

function toDateInput(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

// Short label for a link: its hostname (minus www.), falling back to the URL.
function linkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Trips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data: trips = [], isLoading } = useQuery<TripWithCount[]>({ queryKey: ["/api/trips"] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        destination: form.destination.trim() || null,
        url: form.url.trim() || "",
        notes: form.notes.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      if (editingId) return apiRequest("PUT", `/api/trips/${editingId}`, payload);
      return apiRequest("POST", "/api/trips", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setOpen(false);
      toast({ title: editingId ? "Trip updated" : "Trip created" });
    },
    onError: (err: any) =>
      toast({ title: "Couldn't save trip", description: (err?.message || "").replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/trips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: "Trip deleted" });
    },
  });

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (t: TripWithCount) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      destination: t.destination || "",
      url: t.url || "",
      notes: t.notes || "",
      startDate: toDateInput(t.startDate),
      endDate: toDateInput(t.endDate),
    });
    setOpen(true);
  };

  const dateRange = (t: TripWithCount) => {
    if (!t.startDate && !t.endDate) return null;
    const s = formatDateOnly(t.startDate, "MMM d, yyyy");
    const e = formatDateOnly(t.endDate, "MMM d, yyyy");
    return s && e ? `${s} – ${e}` : s || e;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
            <p className="text-muted-foreground">Outings you've taken gear on</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New Trip</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No trips yet</h3>
            <p className="text-muted-foreground">Create a trip and pack your gear into it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <Link href={`/trips/${t.id}`} className="hover:underline">{t.name}</Link>
                  </CardTitle>
                  {dateRange(t) && (
                    <CardDescription className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" /> {dateRange(t)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {t.destination && (
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-primary" /> {t.destination}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Package className="h-4 w-4 mr-1 text-primary" /> {t.itemCount} item{t.itemCount === 1 ? "" : "s"}
                  </p>
                  {parseTripLinks(t.url).map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center hover:underline">
                      <ExternalLink className="h-4 w-4 mr-1 shrink-0" />
                      <span className="truncate">{linkLabel(link)}</span>
                    </a>
                  ))}
                  {t.notes && <p className="text-sm text-muted-foreground line-clamp-2">{t.notes}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { if (confirm(`Delete "${t.name}"?`)) remove.mutate(t.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Trip" : "New Trip"}</DialogTitle>
              <DialogDescription>Record an outing and pack gear into it afterward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trip-name">Name*</Label>
                <Input id="trip-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Havasupai Trip" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="trip-start">Start date</Label>
                  <Input id="trip-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-end">End date</Label>
                  <Input id="trip-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-dest">Destination</Label>
                <Input id="trip-dest" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Havasupai, AZ" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-url">Links (optional)</Label>
                <Input id="trip-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…, https://… (separate multiple with commas)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-notes">Notes</Label>
                <Textarea id="trip-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Conditions, permits, what to pack differently…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!form.name.trim() || save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? "Saving..." : editingId ? "Save changes" : "Create trip"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
