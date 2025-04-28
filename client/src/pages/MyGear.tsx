import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Item } from '@shared/schema';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Loader2, Plus, MoreVertical, Tag, Trash, Edit, Share } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function MyGear() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ['/api/items/owner', user?.username],
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
          <Button className="mt-4 md:mt-0" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {items && items.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <Card key={item.id} className="h-full">
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
                      <div className="absolute top-2 left-2">
                        {item.isShared && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          <Link href={`/items/${item.id}`}>
                            <a className="hover:underline">{item.name}</a>
                          </Link>
                        </CardTitle>
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
                      </div>
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
                  You haven't added any items to your inventory yet
                </p>
                <Button className="mt-4" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Item
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}