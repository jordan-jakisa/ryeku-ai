"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Sparkles, Target, Clock } from "lucide-react";
import { ResearchTopic } from "@/lib/types";
import { useResearchStore } from "@/lib/store";

export function ResearchForm() {
  const setTopicInStore = useResearchStore((state) => state.setTopic);
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"basic" | "comprehensive" | "expert">(
    "comprehensive"
  );
  const [focus, setFocus] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState("last-2-years");

  const focusAreas = [
    { id: "technical", label: "Technical Analysis" },
    { id: "market", label: "Market Research" },
    { id: "trends", label: "Industry Trends" },
    { id: "ethics", label: "Ethical Considerations" },
    { id: "implementation", label: "Implementation Strategies" },
    { id: "case-studies", label: "Case Studies" },
  ];

  const handleFocusChange = (focusId: string, checked: boolean) => {
    setFocus((prev) =>
      checked ? [...prev, focusId] : prev.filter((f) => f !== focusId)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setTopicInStore({
      topic: topic.trim(),
      depth,
      focus,
      timeframe,
      sourceTypes: ["academic"], // Only authoritative sources
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-white to-gray-400 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-4xl font-bold text-white">
          AI-Powered Deep Research
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Enter your research topic and let our AI analyze authoritative sources
          to generate comprehensive insights
        </p>
      </div>

      <Card className="bg-white/5 glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Research Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-white font-medium">
                Research Topic *
              </Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Impact of AI on Healthcare Diagnostics"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Research Depth
                </Label>
                <Select
                  value={depth}
                  onValueChange={(value: any) => setDepth(value)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Overview</SelectItem>
                    <SelectItem value="comprehensive">
                      Comprehensive Analysis
                    </SelectItem>
                    <SelectItem value="expert">
                      Expert-Level Deep Dive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Time Frame
                </Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-year">Last Year</SelectItem>
                    <SelectItem value="last-2-years">Last 2 Years</SelectItem>
                    <SelectItem value="last-5-years">Last 5 Years</SelectItem>
                    <SelectItem value="all-time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-white font-medium">
                Research Focus Areas (Optional)
              </Label>
              <div className="grid md:grid-cols-2 gap-3">
                {focusAreas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={area.id}
                      checked={focus.includes(area.id)}
                      onCheckedChange={(checked) =>
                        handleFocusChange(area.id, checked as boolean)
                      }
                      className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor={area.id} className="text-white/90 text-sm">
                      {area.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-white to-gray-300 hover:from-gray-100 hover:to-gray-400 text-black py-3 text-lg font-semibold"
              disabled={!topic.trim()}
            >
              <Search className="w-5 h-5 mr-2" />
              Start Research Analysis
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
