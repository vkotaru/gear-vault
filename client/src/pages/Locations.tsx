import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Map, Plus, Search, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Simplified location data structure until we add it to the schema
interface Location {
  id: number;
  name: string;
  address: string;
  items: number; // Count of items stored at this location
}

// Form validation schema
const locationFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

export default function Locations() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const queryClient = useQueryClient();
  
  // Form setup
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      address: ""
    }
  });

  // Reset form when opening modal in add mode
  const openAddLocationModal = () => {
    form.reset({
      name: "",
      address: ""
    });
    setCurrentLocation(null);
    setIsDialogOpen(true);
  };

  // Populate form when opening modal in edit mode
  const openEditLocationModal = (location: Location) => {
    form.reset({
      id: location.id,
      name: location.name,
      address: location.address
    });
    setCurrentLocation(location);
    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (values: LocationFormValues) => {
    // In a real app, this would call the API to save the location
    const isEditing = !!values.id;
    
    toast({
      title: `${isEditing ? 'Updated' : 'Added'} location`,
      description: `Successfully ${isEditing ? 'updated' : 'added'} ${values.name}`,
    });
    
    // Close the dialog
    setIsDialogOpen(false);
    
    // Refresh the locations list
    queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
  };
  
  // Mock data for now - will be replaced with actual API call
  const { data: locations, isLoading } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      try {
        // This will start working when we add the API endpoint
        // const res = await apiRequest("GET", "/api/locations");
        // return await res.json();
        
        // For now, return sample data
        return [
          { id: 1, name: "Home Storage", address: "123 Main St, Anytown", items: 5 },
          { id: 2, name: "Garage", address: "123 Main St, Anytown", items: 8 },
          { id: 3, name: "Basement", address: "123 Main St, Anytown", items: 3 },
          { id: 4, name: "Cabin", address: "456 Mountain Rd, Forest Hills", items: 12 },
        ] as Location[];
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
                  <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis mb-4">
                    {location.address}
                  </p>
                  <div className="flex justify-end space-x-2">
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
                        toast({
                          title: "Location deleted",
                          description: `${location.name} has been removed.`,
                        });
                        // In a real app, this would call the API to delete the location
                        queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
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
              <Button className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Location
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}