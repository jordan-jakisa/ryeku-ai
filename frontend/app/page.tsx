"use client";

import { Navbar } from "@/components/navbar";
import { ResearchJourney } from "@/components/research-journey";

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <ResearchJourney />
      </main>
    </div>
  );
}
