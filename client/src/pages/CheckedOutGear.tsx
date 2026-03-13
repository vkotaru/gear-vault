import Layout from "@/components/layout/Layout";
import InventoryGrid from "@/components/inventory/InventoryGrid";

export default function CheckedOutGear() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card p-6 rounded-lg shadow-md mb-6">
          <h3 className="font-bold text-lg mb-4">Currently Checked Out</h3>
          <p className="text-muted-foreground">Items that are currently being used and not available.</p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Checked Out Equipment</h2>
        </div>
        
        <InventoryGrid 
          queryKey="/api/items/checked-out"
          title="Checked Out Gear"
          emptyMessage="No equipment is currently checked out."
        />
      </div>
    </Layout>
  );
}
