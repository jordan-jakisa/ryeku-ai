"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Star, ArrowRight, Check, X } from 'lucide-react';
import { ResearchTopic, Source } from '@/app/page';

interface SourceSelectionProps {
  topic: ResearchTopic;
  sources: Source[];
  onConfirm: (sources: Source[]) => void;
}

export function SourceSelection({ topic, sources, onConfirm }: SourceSelectionProps) {
  const [localSources, setLocalSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLocalSources(sources);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sources]);

  const selectedCount = localSources.filter(s => s.selected).length;

  const toggleSource = (sourceId: string) => {
    setLocalSources(prev =>
      prev.map(source =>
        source.id === sourceId ? { ...source, selected: !source.selected } : source
      )
    );
  };

  const toggleAll = (selected: boolean) => {
    setLocalSources(prev =>
      prev.map(source => ({ ...source, selected }))
    );
  };

  const handleConfirm = () => {
    onConfirm(localSources);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-6 mb-8">
          <h2 className="text-3xl font-bold text-white">Finding Authoritative Sources</h2>
          <p className="text-gray-300">AI is searching for credible academic and institutional sources for: "{topic.topic}"</p>
        </div>
        
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-white/5 glass-effect border-white/10 animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  <div className="h-3 bg-white/10 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Review Authoritative Sources</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          We've found {localSources.length} high-quality authoritative sources for "{topic.topic}". 
          All sources are from academic institutions, research organizations, and industry leaders.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-white/5 glass-effect border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-white" />
                  Authoritative Sources ({localSources.length})
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAll(true)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAll(false)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {localSources.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onToggle={toggleSource}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary & Actions */}
        <div className="space-y-6">
          <Card className="bg-white/5 glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Research Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-white/70">Topic:</span>
                  <p className="text-white font-medium mt-1">{topic.topic}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Depth:</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {topic.depth}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Timeframe:</span>
                  <span className="text-white">{topic.timeframe}</span>
                </div>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">Selected Sources</h4>
                <div className="text-3xl font-bold text-white">{selectedCount}</div>
                <div className="text-sm text-white/70">
                  out of {localSources.length} available
                </div>
              </div>
              
              <Button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="w-full bg-gradient-to-r from-white to-gray-300 hover:from-gray-100 hover:to-gray-400 text-black"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          {topic.focus.length > 0 && (
            <Card className="bg-white/5 glass-effect border-white/10">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h4 className="text-white font-medium text-sm">Focus Areas:</h4>
                  <div className="flex flex-wrap gap-1">
                    {topic.focus.map((focus, index) => (
                      <Badge key={index} variant="outline" className="border-white/50 text-white text-xs">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface SourceCardProps {
  source: Source;
  onToggle: (sourceId: string) => void;
}

function SourceCard({ source, onToggle }: SourceCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
        source.selected
          ? 'bg-white/20 border-white/50'
          : 'bg-white/5 border-white/20 hover:border-white/30'
      }`}
      onClick={() => onToggle(source.id)}
    >
      <div className="flex items-start space-x-3">
        <Checkbox
          checked={source.selected}
          onChange={() => onToggle(source.id)}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-white font-medium text-sm">{source.title}</h4>
            <Shield className="w-4 h-4 text-white" />
          </div>
          
          <p className="text-white/70 text-xs">{source.description}</p>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">{source.domain}</span>
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Star className="w-3 h-3 text-white mr-1" />
                <span className="text-white/70">{source.credibilityScore}/100</span>
              </div>
              <Badge 
                variant="outline" 
                className="border-white/50 text-white text-xs bg-white/10"
              >
                {source.relevanceScore}% relevant
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}