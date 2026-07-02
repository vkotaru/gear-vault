import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Item } from '@shared/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoreVertical, Tag, Trash, Edit } from 'lucide-react';
import AddItemForm from '@/components/inventory/AddItemForm';
import GearItemsView from '@/components/inventory/GearItemsView';
import ViewToggle from '@/components/inventory/ViewToggle';
import { useViewMode } from '@/hooks/use-view-mode';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function MyGear() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useViewMode("mygear-view");
  
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ['/api/items/owner', user?.username],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/items/owner/${user!.username}`);
      return await res.json();
    },
    enabled: !!user,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items/owner', user?.username] });
      toast({
        title: 'Item deleted',
        description: 'The item has been deleted from your inventory',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Gear</h1>
            <p className="text-muted-foreground">Manage your personal gear inventory</p>
          </div>
          <AddItemForm />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {items && items.length > 0 ? (
              <>
                <div className="flex justify-end mb-4">
                  <ViewToggle view={view} onChange={setView} />
                </div>
                <GearItemsView
                  items={items}
                  view={view}
                  renderMenu={(item) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={`/items/${item.id}`}>
                          <DropdownMenuItem>
                            <Tag className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/items/${item.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Item</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(item.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                />
              </>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <div className="flex justify-center">
                  <Tag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No items found</h3>
                <p className="text-muted-foreground">
                  You haven't added any items to your inventory yet
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