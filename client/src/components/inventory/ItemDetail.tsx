import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Item, CheckoutHistory } from "@shared/schema";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Edit,
  ArrowRightCircle,
  Clock,
  Check,
  X,
  User,
  CalendarIcon,
  MapPin,
  Info
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

  const {
    data: checkoutHistory = [],
    isLoading: isLoadingHistory,
    isError: isErrorHistory
  } = useQuery<CheckoutHistory[]>({
    queryKey: [`/api/checkout/${itemId}`],
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
                  <h3 className="font-semibold mb-1">Added On</h3>
                  <p className="text-muted-foreground flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-primary" />
                    {format(new Date(item.addedOn), 'MMMM d, yyyy')}
                  </p>
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
                <Tabs defaultValue="history">
                  <TabsList>
                    <TabsTrigger value="history">Checkout History</TabsTrigger>
                    <TabsTrigger value="status">Status</TabsTrigger>
                  </TabsList>

                  <TabsContent value="history" className="space-y-3 text-sm pt-4">
                    {isLoadingHistory ? (
                      <div className="py-3 text-center">
                        <div className="animate-spin h-5 w-5 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : isErrorHistory ? (
                      <div className="py-3 text-center text-destructive">
                        Failed to load checkout history
                      </div>
                    ) : checkoutHistory.length === 0 ? (
                      <div className="py-3 text-center text-muted-foreground">
                        No checkout history available
                      </div>
                    ) : (
                      checkoutHistory.map((record) => (
                        <div key={record.id} className="flex justify-between">
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${record.returnedOn ? 'bg-primary' : 'bg-secondary'}`}></span>
                            <span>
                              {record.returnedOn
                                ? `Returned by ${record.checkedOutBy}`
                                : `Checked out by ${record.checkedOutBy}`}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {format(new Date(record.returnedOn || record.checkedOutOn), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="status" className="pt-4">
                    <div className="flex items-center gap-2">
                      <Badge className={statusBadgeClass(item.status)}>
                        {statusLabel(item.status)}
                      </Badge>
                      {item.status === "lent" && item.lentTo && (
                        <span className="text-muted-foreground">to {item.lentTo}</span>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
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
