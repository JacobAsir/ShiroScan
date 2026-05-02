import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1 w-full max-w-screen-md mx-auto px-4 py-6 md:py-8 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
