import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full bg-background">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur md:hidden">
            <SidebarTrigger />
            <span className="font-mono text-sm tracking-tight">Handoff</span>
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
