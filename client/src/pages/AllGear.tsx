import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Item } from "@shared/schema";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Filter, Tag } from "lucide-react";

export default function AllGear() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ['/api/items']
  });
  
  // Filter items based on search and filters
  const filteredItems = items?.filter(item => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || item.category === categoryFilter;
    
    // Status filter
    const matchesStatus = !statusFilter || statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Gear</h1>
            <p className="text-muted-foreground">Manage your outdoor equipment inventory</p>
          </div>
          <Button className="mt-4 md:mt-0" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, or brand..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="camping">Camping</SelectItem>
              <SelectItem value="hiking">Hiking</SelectItem>
              <SelectItem value="biking">Biking</SelectItem>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="winter">Winter</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Inventory Grid */}
            {filteredItems && filteredItems.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="h-full cursor-pointer hover:border-primary transition-colors"
                    onClick={() => window.location.href = `/items/${item.id}`}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <img 
                          src={item.imageUrls[0]} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Tag className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'available' ? 'Available' : 'Checked Out'}
                        </span>
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground">
                        {item.brand && `${item.brand} • `}
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </p>
                      {item.description && (
                        <p className="text-sm mt-2 line-clamp-2">{item.description}</p>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                      Location: {item.storageLocation}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <div className="flex justify-center">
                  <Tag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No items found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter || statusFilter
                    ? "Try adjusting your search or filters"
                    : "Add some gear to get started"}
                </p>
                <Button className="mt-4" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add New Item
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}