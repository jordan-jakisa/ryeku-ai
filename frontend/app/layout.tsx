import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AxeInitializer } from "@/components/axe-initializer";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RyekuAI",
  description: "Intelligent Research Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <AxeInitializer />
        <Toaster />
      </body>
    </html>
  );
}
