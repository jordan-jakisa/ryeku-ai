import { ResearchTopic, Source, Report } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const submitTopic = async (topic: ResearchTopic): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/research/topic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(topic),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to submit topic');
  }

  return response.json();
};

export const fetchSources = async (topic: ResearchTopic): Promise<Source[]> => {
    const params = new URLSearchParams({
        topic: topic.topic,
        depth: topic.depth,
        timeframe: topic.timeframe,
    });
    topic.focus.forEach(f => params.append('focus', f));
    topic.sourceTypes.forEach(s => params.append('sourceTypes', s.toString()));

    const response = await fetch(`${API_BASE_URL}/research/sources?${params.toString()}`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch sources');
    }
    return response.json();
};


export const generateReport = async (topic: ResearchTopic, sources: Source[]): Promise<{ report_id: string }> => {
  const response = await fetch(`${API_BASE_URL}/research/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, sources }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to start report generation');
  }

  return response.json();
};

export const checkProgress = async (reportId: string): Promise<{ progress: number; status: string }> => {
  const response = await fetch(`${API_BASE_URL}/research/progress/${reportId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to check progress');
  }

  return response.json();
};

export const getReport = async (reportId: string): Promise<Report> => {
  const response = await fetch(`${API_BASE_URL}/research/report/${reportId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to get report');
  }

  return response.json();
}; 