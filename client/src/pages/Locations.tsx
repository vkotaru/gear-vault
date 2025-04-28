import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Map, Plus, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Simplified location data structure until we add it to the schema
interface Location {
  id: number;
  name: string;
  address: string;
  items: number; // Count of items stored at this location
}

export default function Locations() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
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
          <Button>
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
              <Card key={location.id} className="hover:shadow-md transition-shadow cursor-pointer">
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
                  <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis">
                    {location.address}
                  </p>
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