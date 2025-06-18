"use client";

import { useResearchStore } from "@/lib/store";

export function GeneratingScreen() {
  const progress = useResearchStore((state) => state.progress);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-white to-gray-400 rounded-full flex items-center justify-center animate-pulse">
          <svg
            className="w-10 h-10 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Generating Research Report
        </h2>
        <p className="text-gray-300">
          AI is analyzing sources and compiling comprehensive insights...
        </p>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-white to-gray-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400">
          {Math.round(progress)}% Complete
        </p>
      </div>
    </div>
  );
}
