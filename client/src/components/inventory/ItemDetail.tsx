import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Item, Trip } from "@shared/schema";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Edit,
  Clock,
  X,
  User,
  CalendarIcon,
  MapPin,
  Info,
  Route
} from "lucide-react";

interface ItemDetailProps {
  itemId: number;
}

export default function ItemDetail({ itemId }: ItemDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    data: item,
    isLoading: isLoadingItem,
    isError: isErrorItem
  } = useQuery<Item>({
    queryKey: [`/api/items/${itemId}`],
  });


  const { data: itemTrips = [] } = useQuery<Trip[]>({
    queryKey: [`/api/items/${itemId}/trips`],
  });

  const markSeenMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/items/${itemId}/seen`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Marked as seen", description: "Last-seen date updated to today." });
      queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
    },
  });

  const handleGoBack = () => {
    setLocation('/all-gear');
  };

  if (isLoadingItem) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isErrorItem || !item) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Item</h3>
        <p className="text-muted-foreground mb-4">Unable to load the item details.</p>
        <Button onClick={handleGoBack}>Go Back</Button>
      </div>
    );
  }

  if (item.imageUrls && item.imageUrls.length > 0 && !selectedImage) {
    setSelectedImage(item.imageUrls[0]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Item Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="bg-muted rounded-lg overflow-hidden h-64 mb-4">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Info className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  item.imageUrls.map((imageUrl, index) => (
                    <div
                      key={index}
                      className={`h-16 bg-muted rounded overflow-hidden cursor-pointer border-2 ${
                        selectedImage === imageUrl ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`${item.name} ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 h-16 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No images available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{item.name}</CardTitle>
                  <CardDescription>{item.brand || "No brand specified"}</CardDescription>
                </div>
                <Badge className={statusBadgeClass(item.status)}>
                  {item.status === "lent" && item.lentTo ? `Lent to ${item.lentTo}` : statusLabel(item.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-1">Description</h3>
                <p className="text-muted-foreground">
                  {item.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Category</h3>
                  <p className="text-muted-foreground capitalize">{item.category}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Condition</h3>
                  <p className="text-muted-foreground">{item.condition}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Owner</h3>
                  <p className="text-muted-foreground flex items-center">
                    <User className="h-4 w-4 mr-1 text-primary" />
                    {item.owner}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Bought / Added</h3>
                  <p className="text-muted-foreground flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-primary" />
                    {format(new Date(item.addedOn), 'MMMM d, yyyy')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Last Seen</h3>
                  <p className="text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-primary" />
                    {item.lastSeen
                      ? `${format(new Date(item.lastSeen), 'MMM d, yyyy')} (${formatDistanceToNow(new Date(item.lastSeen), { addSuffix: true })})`
                      : "Never confirmed"}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => markSeenMutation.mutate()}
                    disabled={markSeenMutation.isPending}
                  >
                    Mark as seen today
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Storage Location</h3>
                <p className="text-muted-foreground flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                  {item.storageLocation}
                </p>
                {item.storageAddress && (
                  <p className="text-muted-foreground text-sm ml-5 mt-1">{item.storageAddress}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-1">
                  Trip History{itemTrips.length > 0 ? ` (${itemTrips.length})` : ""}
                </h3>
                {itemTrips.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Not taken on any trip yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {itemTrips.map((t, i) => (
                      <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Route className="h-4 w-4 text-primary shrink-0" />
                          <Link href={`/trips/${t.id}`} className="text-primary hover:underline truncate">
                            {t.name}
                          </Link>
                          {i === 0 && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground border rounded px-1 py-0.5 shrink-0">
                              Last
                            </span>
                          )}
                        </div>
                        {t.startDate && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(t.startDate), "MMM yyyy")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </CardContent>

            <CardFooter className="border-t border-border pt-4 flex flex-wrap justify-between items-center">
              <div className="mb-4 md:mb-0">
                <label className="flex items-center">
                  <Checkbox
                    checked={item.isShared}
                    disabled
                  />
                  <span className="ml-2">This item is available for others to borrow</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => setLocation(`/items/${itemId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
