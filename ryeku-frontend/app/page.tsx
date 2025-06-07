"use client";

import { useState, useEffect } from 'react';
import { ResearchForm } from '@/components/research-form';
import { SourceSelection } from '@/components/source-selection';
import { ReportViewer } from '@/components/report-viewer';
import { Navbar } from '@/components/navbar';
import { ResearchStep, ResearchTopic, Source, Report } from '@/lib/types';
import { submitTopic, fetchSources, generateReport, checkProgress, getReport } from '@/lib/api';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<ResearchStep>('input');
  const [researchTopic, setResearchTopic] = useState<ResearchTopic | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const handleTopicSubmit = async (topic: ResearchTopic) => {
    try {
      setError(null);
      await submitTopic(topic);
      setResearchTopic(topic);
      setCurrentStep('sources');
      const fetchedSources = await fetchSources(topic);
      setSources(fetchedSources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleSourcesConfirm = async (selectedSources: Source[]) => {
    try {
        setError(null);
        if (!researchTopic) {
            throw new Error("Research topic is not set.");
        }
        const finalSources = selectedSources.filter(s => s.selected);
        setSources(finalSources);
        setCurrentStep('generating');
        const { report_id } = await generateReport(researchTopic, finalSources);
        setReportId(report_id);
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setCurrentStep('sources'); // Revert to source selection on error
    }
  };

    useEffect(() => {
        if (currentStep === 'generating' && reportId) {
            const interval = setInterval(async () => {
                try {
                    const { progress: newProgress, status } = await checkProgress(reportId);
                    setProgress(newProgress);

                    if (status === 'completed') {
                        clearInterval(interval);
                        const finalReport = await getReport(reportId);
                        setReport(finalReport);
                        setCurrentStep('report');
                    } else if (status === 'failed') {
                        clearInterval(interval);
                        setError('Report generation failed.');
                        setCurrentStep('input');
                    }
                } catch (err) {
                    clearInterval(interval);
                    setError(err instanceof Error ? err.message : "An unknown error occurred");
                    setCurrentStep('input');
                }
            }, 2000); // Poll every 2 seconds

            return () => clearInterval(interval);
        }
    }, [currentStep, reportId]);

  const handleStartNew = () => {
    setCurrentStep('input');
    setResearchTopic(null);
    setSources([]);
    setReport(null);
    setProgress(0);
    setError(null);
    setReportId(null);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar onStartNew={handleStartNew} currentStep={currentStep} />
      
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {currentStep === 'input' && (
          <ResearchForm onSubmit={handleTopicSubmit} />
        )}
        
        {currentStep === 'sources' && researchTopic && (
          <SourceSelection
            topic={researchTopic}
            sources={sources}
            onConfirm={handleSourcesConfirm}
          />
        )}
        
        {currentStep === 'generating' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-white to-gray-400 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-10 h-10 text-black\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
                  <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Generating Research Report</h2>
              <p className="text-gray-300">AI is analyzing sources and compiling comprehensive insights...</p>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-white to-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">{Math.round(progress)}% Complete</p>
            </div>
          </div>
        )}
        
        {currentStep === 'report' && report && researchTopic && (
          <ReportViewer
            topic={researchTopic}
            report={report.content}
            sources={report.sources}
          />
        )}
      </main>
    </div>
  );
}