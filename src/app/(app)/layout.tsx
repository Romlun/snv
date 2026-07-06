import { MobileBottomNav, Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full bg-background text-on-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
