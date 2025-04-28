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
import AddItemForm from "@/components/inventory/AddItemForm";

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
    let matchesCategory = !categoryFilter || categoryFilter === 'all';
    if (!matchesCategory) {
      if (categoryFilter === 'hiking') {
        // The button says "Mountain" but the database uses "hiking"
        matchesCategory = item.category === 'hiking';
      } else {
        matchesCategory = item.category === categoryFilter;
      }
    }
    
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
          <AddItemForm />
        </div>
        
        {/* Search */}
        <div className="mb-6">
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
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            variant={categoryFilter === '' || categoryFilter === 'all' ? "default" : "outline"} 
            size="sm"
            onClick={() => setCategoryFilter('all')}
            className="rounded-full px-4"
          >
            All Categories
          </Button>
          
          <Button 
            variant={categoryFilter === 'camping' ? "default" : "outline"} 
            size="sm"
            onClick={() => setCategoryFilter('camping')}
            className="rounded-full px-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="mr-1">
              <path fill="currentColor" d="M11.45 2.578l-4.5 9 .944.472L11.5 4.117l4.5 9 .944-.472-4.5-9a1 1 0 0 0-1.788 0zM4 20a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1z"/>
            </svg>
            Camping
          </Button>
          
          <Button 
            variant={categoryFilter === 'hiking' ? "default" : "outline"} 
            size="sm"
            onClick={() => setCategoryFilter('hiking')}
            className="rounded-full px-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="mr-1">
              <path fill="currentColor" d="M14,13.25c0,0.69-0.56,1.25-1.25,1.25H5.25C4.56,14.5,4,13.94,4,13.25l0,0c0-0.69,0.56-1.25,1.25-1.25h7.5 C13.44,12,14,12.56,14,13.25L14,13.25z M14,18.25c0,0.69-0.56,1.25-1.25,1.25H5.25C4.56,19.5,4,18.94,4,18.25l0,0 c0-0.69,0.56-1.25,1.25-1.25h7.5C13.44,17,14,17.56,14,18.25L14,18.25z M20,8.25c0,0.69-0.56,1.25-1.25,1.25h-7.5 C10.56,9.5,10,8.94,10,8.25l0,0c0-0.69,0.56-1.25,1.25-1.25h7.5C19.44,7,20,7.56,20,8.25L20,8.25z M20,3.25 C20,3.94,19.44,4.5,18.75,4.5h-7.5C10.56,4.5,10,3.94,10,3.25l0,0c0-0.69,0.56-1.25,1.25-1.25h7.5C19.44,2,20,2.56,20,3.25L20,3.25z"/>
            </svg>
            Mountain
          </Button>
          
          <Button 
            variant={categoryFilter === 'biking' ? "default" : "outline"} 
            size="sm"
            onClick={() => setCategoryFilter('biking')}
            className="rounded-full px-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="mr-1">
              <path fill="currentColor" d="M5,12c-1.93,0-3.5,1.57-3.5,3.5S3.07,19,5,19s3.5-1.57,3.5-3.5S6.93,12,5,12z M5,17c-0.83,0-1.5-0.67-1.5-1.5 S4.17,14,5,14s1.5,0.67,1.5,1.5S5.83,17,5,17z M19,12c-1.93,0-3.5,1.57-3.5,3.5S17.07,19,19,19s3.5-1.57,3.5-3.5S20.93,12,19,12z M19,17c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S19.83,17,19,17z M16.95,5.63l-1.73,4.32 c-1.31-0.98-3.09-0.91-4.32,0.19c-1.46,1.32-1.63,3.44-0.59,4.97c1.19,1.76,3.48,2.29,5.32,1.23l3.16,5.57l1.74-0.99l-3.17-5.58 C17.88,14.59,18,13.81,18,13c0-1.91-0.99-3.59-2.48-4.55l1.81-4.51L16.95,5.63z"/>
            </svg>
            Biking
          </Button>
          
          <Button 
            variant={categoryFilter === 'water' ? "default" : "outline"} 
            size="sm"
            onClick={() => setCategoryFilter('water')}
            className="rounded-full px-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="mr-1">
              <path fill="currentColor" d="M12,2c-5.33,4.55-8,8.48-8,11.8c0,4.98,3.8,8.2,8,8.2s8-3.22,8-8.2C20,10.48,17.33,6.55,12,2z M12,20 c-3.35,0-6-2.57-6-6.2c0-2.34,1.95-5.44,6-9.14c4.05,3.7,6,6.79,6,9.14C18,17.43,15.35,20,12,20z M7.83,14 c0.37,0,0.67,0.26,0.74,0.62c0.41,2.22,2.28,2.98,3.64,2.87c0.43-0.02,0.79,0.32,0.79,0.75c0,0.4-0.32,0.73-0.72,0.75 c-2.13,0.13-4.62-1.09-5.19-4.12C7.01,14.42,7.37,14,7.83,14z"/>
            </svg>
            Water
          </Button>
          
          <Button 
            variant={categoryFilter === 'winter' ? "default" : "outline"} 
            size="sm"
            onClick={() => setCategoryFilter('winter')}
            className="rounded-full px-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="mr-1">
              <path fill="currentColor" d="M22,12c0-5.52-4.48-10-10-10S2,6.48,2,12s4.48,10,10,10S22,17.52,22,12z M20,12c0,4.42-3.58,8-8,8s-8-3.58-8-8 s3.58-8,8-8S20,7.58,20,12z M15,12c0-1.66-1.34-3-3-3s-3,1.34-3,3s1.34,3,3,3S15,13.66,15,12z M6,12c0-3.31,2.69-6,6-6 s6,2.69,6,6s-2.69,6-6,6S6,15.31,6,12z"/>
            </svg>
            Winter
          </Button>
          
          <Button 
            variant={categoryFilter === 'other' ? "default" : "outline"} 
            size="sm"
            onClick={() => setCategoryFilter('other')}
            className="rounded-full px-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="mr-1">
              <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8 s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z M15,9c0,1.66-1.34,3-3,3s-3-1.34-3-3s1.34-3,3-3S15,7.34,15,9z"/>
            </svg>
            Other
          </Button>
        </div>
        
        {/* Status Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
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
                <div className="mt-4">
                  <AddItemForm />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}