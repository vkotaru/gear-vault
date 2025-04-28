import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-4 px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          © {currentYear} GearShare. All rights reserved.
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}