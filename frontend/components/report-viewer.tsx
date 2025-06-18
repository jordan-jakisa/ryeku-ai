"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Share2, BarChart3, Eye } from "lucide-react";
import { ResearchTopic, Source, Report } from "@/lib/types";
import { useResearchStore } from "@/lib/store";
import ReportPaneGroup from "@/components/report-viewer/ReportPaneGroup";
import { ErrorBoundary } from "@/components/error-boundary";
import { Suspense } from "react";

export function ReportViewer() {
  const { researchTopic, report, sources } = useResearchStore();
  const [activeTab, setActiveTab] = useState("report");

  const handleExport = (format: "pdf" | "word") => {
    // Simulate export functionality
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  if (!report || !researchTopic) {
    return <div className="text-center text-white">Loading report...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Research Report Generated
          </h2>
          <p className="text-gray-300">
            Comprehensive analysis for &quot;{researchTopic.topic}&quot; based
            on {sources.length} authoritative sources
          </p>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => handleExport("pdf")}
            className="bg-white hover:bg-gray-200 text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleExport("word")}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Word
          </Button>
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger
            value="report"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <FileText className="w-4 h-4 mr-2" />
            Report
          </TabsTrigger>
          <TabsTrigger
            value="sources"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <FileText className="w-4 h-4 mr-2" />
            Sources ({sources.length})
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="h-[70vh]">
          <Card className="bg-white/5 glass-effect border-white/10 h-full">
            <CardContent className="p-0 h-full">
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full text-white/60">
                      Loading viewer…
                    </div>
                  }
                >
                  <ReportPaneGroup />
                </Suspense>
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid gap-4">
            {sources.map((source) => (
              <Card
                key={source.id}
                className="bg-white/5 glass-effect border-white/10"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium">
                          {source.title}
                        </h4>
                        <Badge className="bg-white/20 text-white">
                          Authoritative
                        </Badge>
                      </div>
                      <p className="text-white/70 text-sm">
                        {source.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-white/60">
                        <span>{source.domain}</span>
                        <span>Credibility: {source.credibilityScore}/100</span>
                        <span>Relevance: {source.relevanceScore}%</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white/5 glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Source Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-white">A+</div>
                  <p className="text-white/70 text-sm">
                    All sources are from authoritative institutions
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Average Credibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(
                      sources.reduce((acc, s) => acc + s.credibilityScore, 0) /
                        sources.length
                    )}
                  </div>
                  <p className="text-white/70 text-sm">Out of 100</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Average Relevance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(
                      sources.reduce((acc, s) => acc + s.relevanceScore, 0) /
                        sources.length
                    )}
                    %
                  </div>
                  <p className="text-white/70 text-sm">Topic relevance score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
