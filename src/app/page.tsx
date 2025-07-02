"use client";

import { useEffect, useState } from "react";
import TopicInput from "@/components/topic-input";
import { toast } from "sonner";
import SourceSelection from "@/components/source-selection";
import GeneratingView from "@/components/generating-view";
import ReportView from "@/components/report-view";

export default function Home() {
  const [status, setStatus] = useState<
    "input" | "sources" | "generating" | "complete" | "error" | null
  >("input");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (topic) {
      toast.success(`Topic submitted: ${topic}`);
      setStatus("sources");
    }
  }, [topic]);

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        {status == "input" && <TopicInput onSubmitTopic={(t) => setTopic(t)} />}
        {status == "sources" && <SourceSelection topic={topic} />}
        {status == "generating" && <GeneratingView />}
        {status == "complete" && <ReportView />}
      </div>
    </>
  );
}
