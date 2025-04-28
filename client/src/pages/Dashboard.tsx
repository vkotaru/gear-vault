import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import InventoryGrid from "@/components/inventory/InventoryGrid";
import AddItemForm from "@/components/inventory/AddItemForm";
import { Item } from "@shared/schema";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  // Fetch recently added items
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ['/api/items'],
  });
  
  // Sort items by addedOn date to get the most recent items
  const recentItems = [...items]
    .sort((a, b) => new Date(b.addedOn).getTime() - new Date(a.addedOn).getTime())
    .slice(0, 6);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">Equipment Dashboard</h2>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <AddItemForm />
            </div>
          </div>
          
          {/* Dashboard Stats */}
          <DashboardStats />
        </div>
        
        {/* Recently Added Items */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-neutral-800">Recently Added</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => setLocation('/all-gear')}
            >
              View All <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <InventoryGrid
                key={item.id}
                queryKey={`/api/items/${item.id}`}
                title="Recent Items"
                emptyMessage="No recent items found"
              />
            ))}
          </div>
        </div>
        
        {/* Quick Access */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-neutral-800 mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              className="h-auto py-6 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              onClick={() => setLocation('/all-gear')}
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-2">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                  <path d="M7 21h10"/>
                  <path d="M12 3v18"/>
                  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                </svg>
                <span className="text-lg font-medium">All Gear</span>
              </div>
            </Button>
            
            <Button
              className="h-auto py-6 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              onClick={() => setLocation('/my-gear')}
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-lg font-medium">My Gear</span>
              </div>
            </Button>
            
            <Button
              className="h-auto py-6 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              onClick={() => setLocation('/shared-gear')}
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="text-lg font-medium">Shared Gear</span>
              </div>
            </Button>
            
            <Button
              className="h-auto py-6 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              onClick={() => setLocation('/checked-out')}
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-2">
                  <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4"/>
                  <path d="m9 17 6 6"/>
                  <path d="m15 17-6 6"/>
                </svg>
                <span className="text-lg font-medium">Checked Out</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
