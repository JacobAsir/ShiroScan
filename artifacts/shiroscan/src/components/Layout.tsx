import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { useSessionStore } from "@/store/sessionStore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sessions = useSessionStore((s) => s.sessions);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const isScanPage = location === "/scan";

  const handleNewScan = () => {
    setActiveSession(null);
    setSidebarOpen(false);
    setLocation("/scan");
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Header
        onMenuClick={isScanPage && sessions.length > 0 ? () => setSidebarOpen(true) : undefined}
      />
      <div className="flex-1 flex">
        {/* Desktop sidebar — only on scan page when there are sessions */}
        {isScanPage && sessions.length > 0 && (
          <aside className="hidden lg:block w-[260px] border-r border-border shrink-0">
            <Sidebar onNewScan={handleNewScan} className="h-[calc(100dvh-3.5rem)] sticky top-14" />
          </aside>
        )}

        {/* Mobile sidebar sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[280px]">
            <Sidebar onNewScan={handleNewScan} className="h-full pt-8" />
          </SheetContent>
        </Sheet>

        <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-6 md:py-8 flex flex-col">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
