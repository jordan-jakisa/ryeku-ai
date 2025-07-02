"use client";

import { useState } from "react";
import { Progress } from "./ui/progress";

export type SourceSelectionProps = {
  topic: string;
};

const SourceSelection = ({ topic }: SourceSelectionProps) => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [progress, setProgress] = useState(5);
//   const [progressText, setProgressText] = useState("Searching sources for ");

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        {true && (
          <div className="flex flex-col space-y-4 p-12">
            <h2 className="text-2xl font-bold">
              Searching the internet for credible sources
            </h2>
            <Progress value={15} className="w-[55%" />
            <p className="text-sm text-muted-foreground">Searching the internet for {topic}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default SourceSelection;
