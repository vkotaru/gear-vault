import Layout from "@/components/layout/Layout";
import InventoryGrid from "@/components/inventory/InventoryGrid";
import AddItemForm from "@/components/inventory/AddItemForm";

export default function AllGear() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">All Gear</h2>
          
          <div className="mt-4 md:mt-0">
            <AddItemForm />
          </div>
        </div>
        
        <InventoryGrid 
          queryKey="/api/items"
          title="All Equipment"
          emptyMessage="No equipment found. Add your first item with the 'Add New Item' button."
        />
      </div>
    </Layout>
  );
}
