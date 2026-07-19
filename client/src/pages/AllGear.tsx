import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import GearItemsView from "@/components/inventory/GearItemsView";
import ViewToggle from "@/components/inventory/ViewToggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { useCategories } from "@/hooks/use-categories";
import { STATUSES } from "@/lib/status";

export default function AllGear() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useViewMode("allgear-view");
  const { list: categories } = useCategories();

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

          {categories.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={categoryFilter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(value)}
              className="rounded-full px-4"
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
            </Button>
          ))}
        </div>
        
        {/* Status Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Inventory */}
            {filteredItems && filteredItems.length > 0 ? (
              <>
                <div className="flex justify-end mb-4">
                  <ViewToggle view={view} onChange={setView} />
                </div>
                <GearItemsView items={filteredItems} view={view} />
              </>
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