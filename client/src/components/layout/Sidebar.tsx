import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Clock, 
  User,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { name: "All Gear", path: "/all-gear", icon: <Package className="h-5 w-5 mr-3" /> },
    { name: "My Gear", path: "/my-gear", icon: <User className="h-5 w-5 mr-3" /> },
    { name: "Shared Gear", path: "/shared-gear", icon: <Users className="h-5 w-5 mr-3" /> },
    { name: "Checked Out", path: "/checked-out", icon: <Clock className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col shadow-lg">
      {/* Header/Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 mr-2"
          >
            <path d="M17.5 17.5 14 20l-2.5-5.5L6 12l10-2.5L17.5 7l.5-3.5 3.5.5-2 10-2 3.5z" />
          </svg>
          <h1 className="font-bold text-xl">GearShare</h1>
        </div>
        
        {/* User info */}
        <div className="mb-6 p-4 rounded-lg bg-sidebar-accent">
          <div className="flex items-center">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground h-10 w-10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="font-medium">{user?.username}</p>
              <p className="text-sm opacity-75">Administrator</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a className={`
                  flex items-center px-4 py-3 rounded-md w-full
                  ${location === item.path 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"}
                `}>
                  {item.icon}
                  {item.name}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Footer Links */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <ul className="space-y-1">
          <li>
            <Link href="/settings">
              <a className="flex items-center px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md">
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </a>
            </Link>
          </li>
          <li>
            <Link href="/help">
              <a className="flex items-center px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md">
                <HelpCircle className="h-5 w-5 mr-3" />
                Help & Support
              </a>
            </Link>
          </li>
          <li>
            <Button 
              variant="ghost" 
              className="flex items-center w-full px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
