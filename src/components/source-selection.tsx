"use client";

import { useEffect, useState } from "react";
import { Progress } from "./ui/progress";

export type SourceSelectionProps = {
  topic: string;
};

export type Source = {
  title: string;
  url: string;
  snippet: string;
  rank?: number;
  relevance?: number;
};

export type SearchResponse = {
  results: Source[];
};

const SourceSelection = ({ topic }: SourceSelectionProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sources, setSources] = useState<Source[] | null>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  useEffect(() => {
    const fetchSources = async () => {
      if (!topic) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSources([]);
      setProgress(0);
      setProgressMessage("Initializing search...");

      try {
        setProgress(10);
        setProgressMessage("Connecting to search engine...");

        await new Promise((resolve) => setTimeout(resolve, 500));

        setProgress(30);
        setProgressMessage(`Searching for "${topic}"...`);

        const response = await fetch(
          `/api/search?query=${encodeURIComponent(topic)}`
        );

        setProgress(60);
        setProgressMessage("Processing search results...");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        setProgress(80);
        setProgressMessage("Analyzing sources for credibility...");

        await new Promise((resolve) => setTimeout(resolve, 300));

        const data = await response.json();

        setProgress(100);
        setProgressMessage("Search completed!");

        await new Promise((resolve) => setTimeout(resolve, 200));

        setSources(data.results || []);
        console.log("Sources fetched:", data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching sources:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, [topic]);

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        {isLoading && (
          <div className="flex flex-col space-y-4 p-12">
            <h2 className="text-2xl font-bold">
              Searching the internet for credible sources
            </h2>
            <Progress value={progress} className="w-[55%]" />
            <p className="text-sm text-muted-foreground">
              {progressMessage || `Searching the internet for ${topic}`}
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center space-y-4 p-12">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!isLoading && !error && sources && sources.length > 0 && (
          <div className="flex flex-col space-y-4 p-12">
            <h2 className="text-2xl font-bold">Sources found</h2>
            <p className="text-sm text-muted-foreground">
              Found {sources.length} sources for {topic}
            </p>

            <ul className="space-y-4">
              {sources.map((source, index) => (
                <li key={index} className="border p-4 rounded-md">
                  <h3 className="text-lg font-semibold">{source.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {source.snippet}
                  </p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Read more
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isLoading && !error && sources && sources.length === 0 && (
          <div className="flex flex-col items-center justify-center space-y-4 p-12">
            <h2 className="text-2xl font-bold">No sources found</h2>
            <p className="text-sm text-muted-foreground">
              No credible sources were found for "{topic}". Try a different
              search term.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default SourceSelection;
