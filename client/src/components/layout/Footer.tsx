import { Link } from "wouter";
import { HelpCircle, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function Footer() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <footer className="bg-neutral-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="font-bold text-xl flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 mr-2"
              >
                <path d="M17.5 17.5 14 20l-2.5-5.5L6 12l10-2.5L17.5 7l.5-3.5 3.5.5-2 10-2 3.5z" />
              </svg>
              GearShare
            </h2>
            <p className="text-neutral-400 text-sm mt-1">Outdoor equipment management</p>
          </div>
          
          <div className="flex space-x-6">
            <Link href="/help" className="text-neutral-300 hover:text-white flex items-center">
              <HelpCircle className="h-4 w-4 mr-1" /> Help
            </Link>
            <Link href="/settings" className="text-neutral-300 hover:text-white flex items-center">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Link>
            <button 
              onClick={handleLogout}
              className="text-neutral-300 hover:text-white flex items-center"
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
