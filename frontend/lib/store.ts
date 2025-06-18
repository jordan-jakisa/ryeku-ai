import { create } from "zustand";
import { ResearchTopic, Source, Report, ResearchStep } from "@/lib/types";
import {
  submitTopic,
  fetchSources,
  generateReport,
  checkProgress,
  getReport,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface ResearchState {
  currentStep: ResearchStep;
  researchTopic: ResearchTopic | null;
  sources: Source[];
  report: Report | null;
  progress: number;
  error: string | null;
  reportId: string | null;

  setTopic: (topic: ResearchTopic) => Promise<void>;
  setSources: (sources: Source[]) => void;
  generateReport: (sources: Source[]) => Promise<void>;
  checkProgress: () => Promise<void>;
  startNew: () => void;
  setError: (error: string | null) => void;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  currentStep: "input",
  researchTopic: null,
  sources: [],
  report: null,
  progress: 0,
  error: null,
  reportId: null,

  setTopic: async (topic) => {
    try {
      set({ error: null, researchTopic: topic, currentStep: "sources" });
      await submitTopic(topic);
      const fetchedSources = await fetchSources(topic);
      set({ sources: fetchedSources });
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error, currentStep: "input" });
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  },

  setSources: (sources) => {
    set({ sources });
  },

  generateReport: async (selectedSources) => {
    const { researchTopic } = get();
    if (!researchTopic) {
      const error = "Research topic is not set.";
      set({ error, currentStep: "sources" });
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    try {
      set({ error: null, sources: selectedSources, currentStep: "generating" });
      const { report_id } = await generateReport(
        researchTopic,
        selectedSources
      );
      set({ reportId: report_id });
      get().checkProgress();
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error, currentStep: "sources" });
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  },

  checkProgress: async () => {
    const { reportId } = get();
    if (!reportId) return;

    const interval = setInterval(async () => {
      try {
        const { progress: newProgress, status } = await checkProgress(reportId);
        set({ progress: newProgress });

        if (status === "completed") {
          clearInterval(interval);
          const finalReport = await getReport(reportId);
          set({ report: finalReport, currentStep: "report" });
        } else if (status === "failed") {
          clearInterval(interval);
          const errorMsg = "Report generation failed.";
          set({ error: errorMsg, currentStep: "input" });
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      } catch (err) {
        clearInterval(interval);
        const error =
          err instanceof Error ? err.message : "An unknown error occurred";
        set({ error, currentStep: "input" });
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    }, 2000);
  },

  startNew: () => {
    set({
      currentStep: "input",
      researchTopic: null,
      sources: [],
      report: null,
      progress: 0,
      error: null,
      reportId: null,
    });
  },

  setError: (error: string | null) => {
    set({ error });
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  },
}));
