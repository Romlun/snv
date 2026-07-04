import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { MobileBottomNav, Sidebar } from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission CRM",
  description: "Centralized system mission organization relationship management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        <div className="flex min-h-full bg-background text-on-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            <div className="mx-auto max-w-[1280px]">{children}</div>
          </main>
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}
