import Layout from "@/components/layout/Layout";
import InventoryGrid from "@/components/inventory/InventoryGrid";
import AddItemForm from "@/components/inventory/AddItemForm";

export default function SharedGear() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="font-bold text-lg mb-4">Community Equipment</h3>
          <p className="text-neutral-600">Gear that has been marked as available for anyone to borrow.</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">Shared Gear</h2>
          
          <div className="mt-4 md:mt-0">
            <AddItemForm />
          </div>
        </div>
        
        <InventoryGrid 
          queryKey="/api/items/shared"
          title="Shared Equipment"
          emptyMessage="No shared equipment available at the moment."
        />
      </div>
    </Layout>
  );
}
