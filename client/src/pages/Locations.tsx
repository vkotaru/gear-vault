import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import LocationSpots from "@/components/inventory/LocationSpots";
import { Map, Plus, Search, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Location } from "@shared/schema";

// Extended location interface with item count
interface LocationWithItemCount {
  id: number;
  name: string;
  address: string;
  description: string | null;
  createdAt: Date;
  items: number; // Count of items stored at this location
}

// Form validation schema
const locationFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  description: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

export default function Locations() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationWithItemCount | null>(null);
  const queryClient = useQueryClient();
  
  // Form setup
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      address: "",
      description: ""
    }
  });

  // Reset form when opening modal in add mode
  const openAddLocationModal = () => {
    form.reset({
      name: "",
      address: "",
      description: ""
    });
    setCurrentLocation(null);
    setIsDialogOpen(true);
  };

  // Populate form when opening modal in edit mode
  const openEditLocationModal = (location: LocationWithItemCount) => {
    form.reset({
      id: location.id,
      name: location.name,
      address: location.address,
      description: location.description || ''
    });
    setCurrentLocation(location);
    setIsDialogOpen(true);
  };

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: LocationFormValues) => {
      const res = await apiRequest("POST", "/api/locations", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Location added",
        description: "The new location has been added successfully.",
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add location: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (data: LocationFormValues) => {
      if (!data.id) throw new Error("Location ID is required for updates");
      const res = await apiRequest("PUT", `/api/locations/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Location updated",
        description: "The location has been updated successfully.",
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update location: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/locations/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Location deleted",
        description: "The location has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete location: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: LocationFormValues) => {
    const isEditing = !!values.id;
    
    if (isEditing) {
      updateLocationMutation.mutate(values);
    } else {
      createLocationMutation.mutate(values);
    }
  };
  
  // Fetch locations from the API
  const { data: locations, isLoading } = useQuery<LocationWithItemCount[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/locations");
        return await res.json();
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast({
          title: "Error",
          description: "Failed to load storage locations. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const filteredLocations = locations?.filter(location => 
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Storage Locations</h1>
            <p className="text-muted-foreground">Manage where your gear is stored</p>
          </div>
          <Button onClick={openAddLocationModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Location
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} className="animate-pulse">
                <CardHeader className="bg-muted/30">
                  <div className="h-7 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-5 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="mt-4">
                  <div className="h-5 bg-muted rounded w-full mb-2"></div>
                  <div className="h-5 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLocations && filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Map className="h-5 w-5 mr-2 text-primary" />
                    {location.name}
                  </CardTitle>
                  <CardDescription>
                    {location.items} {location.items === 1 ? "item" : "items"} stored here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis mb-1">
                    <span className="font-medium">Address:</span> {location.address}
                  </p>
                  {location.description && (
                    <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis mb-4">
                      <span className="font-medium">Note:</span> {location.description}
                    </p>
                  )}
                  <LocationSpots locationId={location.id} />
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditLocationModal(location)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        // Show a confirmation dialog
                        if (window.confirm(`Are you sure you want to delete ${location.name}?`)) {
                          deleteLocationMutation.mutate(location.id);
                        }
                      }}
                      disabled={deleteLocationMutation.isPending}
                    >
                      {deleteLocationMutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      {deleteLocationMutation.isPending ? 'Deleting...' : ''}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <div className="flex justify-center">
              <Map className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No locations found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No locations match your search" : "You haven't added any storage locations yet"}
            </p>
            {!searchTerm && (
              <Button className="mt-4" size="sm" onClick={openAddLocationModal}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Location
              </Button>
            )}
          </div>
        )}
        
        {/* Location Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
              <DialogDescription>
                {currentLocation 
                  ? 'Update the details for this storage location.' 
                  : 'Add a new place where your gear is stored.'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Garage, Basement, Storage Unit..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Start typing an address..."
                        />
                      </FormControl>
                      <FormDescription>
                        Start typing to search real addresses, or enter one manually.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes about this location..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                  >
                    {(createLocationMutation.isPending || updateLocationMutation.isPending) ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        {currentLocation ? 'Saving...' : 'Adding...'}
                      </>
                    ) : (
                      currentLocation ? 'Save Changes' : 'Add Location'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}