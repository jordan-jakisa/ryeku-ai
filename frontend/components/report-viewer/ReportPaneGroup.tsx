"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import OutlinePane from "./OutlinePane";
import ContentPane from "./ContentPane";
import { ReportProvider } from "./ReportContext";
import { useEffect, useState } from "react";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);

  return isMobile;
}

export default function ReportPaneGroup() {
  const isMobile = useIsMobile();

  return (
    <ReportProvider>
      {isMobile ? (
        <div className="flex flex-col h-full w-full">
          <div className="max-h-48 border-b border-white/10 bg-white/5 glass-effect md:hidden">
            <OutlinePane className="h-full" />
          </div>
          <div className="flex-1 overflow-hidden">
            <ContentPane />
          </div>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            maxSize={40}
            className="bg-white/5 glass-effect border-r border-white/10"
          >
            <OutlinePane />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70} className="bg-transparent">
            <ContentPane />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </ReportProvider>
  );
}
