import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  UserCircle,
  Share2,
  Calendar,
  Settings,
  Map,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "All Gear", href: "/all-gear", icon: Package },
    { name: "My Gear", href: "/my-gear", icon: UserCircle },
    { name: "Shared Gear", href: "/shared-gear", icon: Share2 },
    { name: "Checked Out", href: "/checked-out", icon: Calendar },
    { name: "Storage Locations", href: "/locations", icon: Map },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r bg-background p-4 shadow-lg transition-transform duration-200 md:static md:z-0 md:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between md:hidden">
          <Link href="/">
            <a className="flex items-center gap-2 font-semibold">
              <span>GearShare</span>
            </a>
          </Link>
          <Button
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Logo and title - desktop */}
        <div className="hidden h-16 items-center border-b md:flex">
          <Link href="/">
            <a className="flex items-center gap-2 font-semibold">
              <span>GearShare</span>
            </a>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8 flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0")} />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
        
        {/* Logout button */}
        <div className="mt-8 border-t pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Log out
          </button>
        </div>
      </div>
    </>
  );
}