import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <MobileHeader />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
