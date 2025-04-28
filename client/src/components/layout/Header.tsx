import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { Link, useLocation } from "wouter";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings, HelpCircle } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "All Gear", path: "/all-gear" },
    { name: "My Gear", path: "/my-gear" },
    { name: "Shared Gear", path: "/shared-gear" },
    { name: "Checked Out", path: "/checked-out" },
  ];

  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white h-6 w-6 mr-2"
            >
              <path d="M17.5 17.5 14 20l-2.5-5.5L6 12l10-2.5L17.5 7l.5-3.5 3.5.5-2 10-2 3.5z" />
            </svg>
            <h1 className="font-bold text-xl text-white">GearShare</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`${
                  location === item.path 
                    ? "text-white font-medium border-b-2 border-white" 
                    : "text-white/80 hover:text-white font-medium"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* User Menu Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-white/20 hover:bg-white/30">
                  <User className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.username}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-dark">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${
                    location === item.path 
                      ? "text-white font-medium border-l-4 border-white pl-2" 
                      : "text-white/80 hover:text-white font-medium pl-3"
                  } py-2`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-primary/20 pt-2 mt-2">
                <Button 
                  variant="ghost" 
                  className="text-white/80 hover:text-white w-full justify-start pl-3"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
