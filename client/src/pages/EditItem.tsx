import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import AddItemForm from "@/components/inventory/AddItemForm";
import type { Item } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface EditItemProps {
  id: string;
}

export default function EditItem({ id }: EditItemProps) {
  const [, setLocation] = useLocation();
  const itemId = parseInt(id);

  const { data: item, isLoading, isError } = useQuery<Item>({
    queryKey: [`/api/items/${itemId}`],
    enabled: !Number.isNaN(itemId),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (isError || !item) {
    return (
      <Layout>
        <div className="py-20 text-center text-muted-foreground">Item not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AddItemForm
        item={item}
        open
        onOpenChange={(nextOpen) => {
          // Closing the dialog returns to the item's detail page.
          if (!nextOpen) setLocation(`/items/${itemId}`);
        }}
      />
    </Layout>
  );
}
