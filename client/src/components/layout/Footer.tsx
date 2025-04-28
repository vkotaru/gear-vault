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
          <Link href="/privacy">
            <a className="text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
          </Link>
          <Link href="/terms">
            <a className="text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
          </Link>
          <Link href="/contact">
            <a className="text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </Link>
        </div>
      </div>
    </footer>
  );
}