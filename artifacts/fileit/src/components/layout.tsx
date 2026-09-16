import { Link } from "wouter";
import { FileUp, HardDrive, ScanLine } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-transform group-hover:scale-105">
              <FileUp className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-lg">Fileit</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/qr"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-secondary md:hidden"
            >
              <ScanLine className="w-4 h-4" />
            </Link>
            <Link
              href="/files"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-secondary"
            >
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">My Files</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full flex flex-col">{children}</main>
    </div>
  );
}
