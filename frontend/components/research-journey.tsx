"use client";

import { useResearchStore } from "@/lib/store";
import { ResearchForm } from "@/components/research-form";
import SourceCuration from "@/components/source-curation";
import { ReportViewer } from "@/components/report-viewer";
import { GeneratingScreen } from "@/components/generating-screen";

export function ResearchJourney() {
  const { currentStep } = useResearchStore();

  const renderStep = () => {
    switch (currentStep) {
      case "input":
        return <ResearchForm />;
      case "sources":
        return <SourceCuration />;
      case "generating":
        return <GeneratingScreen />;
      case "report":
        return <ReportViewer />;
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
}
