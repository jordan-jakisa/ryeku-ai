export type ResearchStep = 'input' | 'sources' | 'generating' | 'report';

export interface ResearchTopic {
  topic: string;
  depth: 'basic' | 'comprehensive' | 'expert';
  focus: string[];
  timeframe: string;
  sourceTypes: string[];
}

export interface Source {
  id: string;
  title: string;
  url: string;
  domain: string;
  type: 'authoritative' | 'academic' | 'industry' | 'news';
  description: string;
  credibilityScore: number;
  relevanceScore: number;
  selected: boolean;
}

export interface Report {
    id: string;
    topic: ResearchTopic;
    content: string;
    sources: Source[];
    generated_at: string;
    metadata: Record<string, any>;
} 