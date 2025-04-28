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

  // Fetch item details
  const { 
    data: item, 
    isLoading: isLoadingItem, 
    isError: isErrorItem 
  } = useQuery<Item>({
    queryKey: [`/api/items/${itemId}`],
  });

  // Fetch checkout history
  const { 
    data: checkoutHistory = [], 
    isLoading: isLoadingHistory, 
    isError: isErrorHistory 
  } = useQuery<CheckoutHistory[]>({
    queryKey: [`/api/checkout/${itemId}`],
  });

  // Mutation for checking out an item
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!item) return;
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Default checkout for 7 days
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          checkedOutBy: "Current User", // In a real app, this would be the actual user
          dueBack: dueDate.toISOString(),
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to check out item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item checked out successfully",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/checkout/${itemId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to check out item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for returning an item
  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!item) return;
      
      const response = await fetch(`/api/return/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnedOn: new Date().toISOString(),
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to return item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item returned successfully",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/checkout/${itemId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to return item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleGoBack = () => {
    setLocation('/all-gear');
  };

  const handleCheckout = () => {
    checkoutMutation.mutate();
  };

  const handleReturn = () => {
    returnMutation.mutate();
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
        <h3 className="text-xl font-bold text-red-500 mb-2">Error Loading Item</h3>
        <p className="text-neutral-600 mb-4">Unable to load the item details.</p>
        <Button onClick={handleGoBack}>Go Back</Button>
      </div>
    );
  }

  // Set the first image as selected image if none is selected
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
              {/* Main Image */}
              <div className="bg-neutral-100 rounded-lg overflow-hidden h-64 mb-4">
                {selectedImage ? (
                  <img 
                    src={selectedImage} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Info className="h-12 w-12 text-neutral-300" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  item.imageUrls.map((imageUrl, index) => (
                    <div 
                      key={index}
                      className={`h-16 bg-neutral-100 rounded overflow-hidden cursor-pointer border-2 ${
                        selectedImage === imageUrl ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`${item.name} ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 h-16 bg-neutral-100 rounded flex items-center justify-center">
                    <p className="text-neutral-400 text-sm">No images available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          <Card>
            {/* Header */}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{item.name}</CardTitle>
                  <CardDescription>{item.brand || "No brand specified"}</CardDescription>
                </div>
                <Badge 
                  className={`${
                    item.status === 'available' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {item.status === 'available' ? 'Available' : 'Checked Out'}
                </Badge>
              </div>
            </CardHeader>
            
            {/* Main Content */}
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-neutral-700 mb-1">Description</h3>
                <p className="text-neutral-600">
                  {item.description || "No description provided."}
                </p>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <h3 className="font-semibold text-neutral-700 mb-1">Category</h3>
                  <p className="text-neutral-600 capitalize">{item.category}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-neutral-700 mb-1">Condition</h3>
                  <p className="text-neutral-600">{item.condition}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-neutral-700 mb-1">Owner</h3>
                  <p className="text-neutral-600 flex items-center">
                    <User className="h-4 w-4 mr-1 text-primary" />
                    {item.owner}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-neutral-700 mb-1">Added On</h3>
                  <p className="text-neutral-600 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-primary" />
                    {format(new Date(item.addedOn), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              {/* Location */}
              <div>
                <h3 className="font-semibold text-neutral-700 mb-1">Storage Location</h3>
                <p className="text-neutral-600 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                  {item.storageLocation}
                </p>
                {item.storageAddress && (
                  <p className="text-neutral-600 text-sm ml-5 mt-1">{item.storageAddress}</p>
                )}
              </div>
              
              {/* Checkout History */}
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
                      <div className="py-3 text-center text-red-500">
                        Failed to load checkout history
                      </div>
                    ) : checkoutHistory.length === 0 ? (
                      <div className="py-3 text-center text-neutral-500">
                        No checkout history available
                      </div>
                    ) : (
                      checkoutHistory.map((record) => (
                        <div key={record.id} className="flex justify-between">
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${record.returnedOn ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                            <span>
                              {record.returnedOn 
                                ? `Returned by ${record.checkedOutBy}` 
                                : `Checked out by ${record.checkedOutBy}`}
                            </span>
                          </div>
                          <span className="text-neutral-500">
                            {format(new Date(record.returnedOn || record.checkedOutOn), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="status" className="pt-4">
                    {item.status === 'checked_out' ? (
                      <div className="space-y-3">
                        <div className="flex items-center text-amber-500">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="font-medium">Currently checked out</span>
                        </div>
                        
                        {checkoutHistory.length > 0 && !checkoutHistory[0].returnedOn && (
                          <div>
                            <p className="text-neutral-600 ml-7">
                              Checked out by: <span className="font-medium">{checkoutHistory[0].checkedOutBy}</span>
                            </p>
                            {checkoutHistory[0].dueBack && (
                              <p className="text-neutral-600 ml-7">
                                Due back: <span className="font-medium">{format(new Date(checkoutHistory[0].dueBack), 'MMMM d, yyyy')}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-green-500">
                        <Check className="h-5 w-5 mr-2" />
                        <span className="font-medium">Available for checkout</span>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
            
            {/* Footer */}
            <CardFooter className="border-t border-neutral-200 pt-4 flex flex-wrap justify-between items-center">
              <div className="mb-4 md:mb-0">
                <label className="flex items-center">
                  <Checkbox 
                    checked={item.isShared} 
                    disabled
                  />
                  <span className="ml-2 text-neutral-700">This item is available for others to borrow</span>
                </label>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                
                {item.status === 'available' ? (
                  <Button 
                    className="bg-secondary hover:bg-secondary/90 flex items-center"
                    onClick={handleCheckout}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <ArrowRightCircle className="h-4 w-4 mr-2" /> Check Out
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 flex items-center"
                    onClick={handleReturn}
                    disabled={returnMutation.isPending}
                  >
                    {returnMutation.isPending ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Return Item
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
