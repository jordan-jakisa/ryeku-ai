"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Share2, BarChart3, Eye } from 'lucide-react';
import { ResearchTopic, Source } from '@/app/page';

interface ReportViewerProps {
  topic: ResearchTopic;
  report: string;
  sources: Source[];
}

export function ReportViewer({ topic, report, sources }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState('report');

  const handleExport = (format: 'pdf' | 'word') => {
    // Simulate export functionality
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  const formatReportContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-white mb-6">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold text-white mb-4 mt-8">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium text-white mb-3 mt-6">{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="text-white/90 mb-2">{line.slice(2)}</li>;
      }
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
        return <li key={index} className="text-white/90 mb-2">{line}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      if (line.startsWith('*') && line.endsWith('*')) {
        return <p key={index} className="text-white/60 italic text-sm mt-6">{line.slice(1, -1)}</p>;
      }
      return <p key={index} className="text-white/90 mb-4 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Research Report Generated</h2>
          <p className="text-gray-300">Comprehensive analysis based on {sources.length} authoritative sources</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => handleExport('pdf')}
            className="bg-white hover:bg-gray-200 text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleExport('word')}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger value="report" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            Report
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            Sources ({sources.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <Card className="bg-white/5 glass-effect border-white/10">
            <CardContent className="p-8">
              <div className="prose prose-invert max-w-none">
                {formatReportContent(report)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid gap-4">
            {sources.map((source) => (
              <Card key={source.id} className="bg-white/5 glass-effect border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium">{source.title}</h4>
                        <Badge className="bg-white/20 text-white">
                          Authoritative
                        </Badge>
                      </div>
                      <p className="text-white/70 text-sm">{source.description}</p>
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
                <CardTitle className="text-white text-lg">Source Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-white">A+</div>
                  <p className="text-white/70 text-sm">All sources are from authoritative institutions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Average Credibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(sources.reduce((acc, s) => acc + s.credibilityScore, 0) / sources.length)}
                  </div>
                  <p className="text-white/70 text-sm">Out of 100</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Average Relevance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(sources.reduce((acc, s) => acc + s.relevanceScore, 0) / sources.length)}%
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