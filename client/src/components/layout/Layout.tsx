import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export default function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-x-hidden">
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto" style={{ maxWidth: "var(--content-width, 1280px)" }}>
            {children}
          </div>
        </main>
        
        {/* Footer */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
}