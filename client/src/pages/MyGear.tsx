import { useAuth } from "@/lib/authContext";
import Layout from "@/components/layout/Layout";
import InventoryGrid from "@/components/inventory/InventoryGrid";
import AddItemForm from "@/components/inventory/AddItemForm";

export default function MyGear() {
  const { user } = useAuth();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="font-bold text-lg mb-4">My Equipment</h3>
          <p className="text-neutral-600">Items that you own in the system.</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">My Gear</h2>
          
          <div className="mt-4 md:mt-0">
            <AddItemForm />
          </div>
        </div>
        
        <InventoryGrid 
          queryKey={`/api/items/owner/${user?.username || 'Current User'}`}
          title="My Equipment"
          emptyMessage="You don't have any registered gear yet. Click 'Add New Item' to get started."
        />
      </div>
    </Layout>
  );
}
