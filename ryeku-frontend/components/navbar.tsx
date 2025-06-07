"use client";

import { Brain, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResearchStep } from '@/app/page';

interface NavbarProps {
  onStartNew: () => void;
  currentStep: ResearchStep;
}

export function Navbar({ onStartNew, currentStep }: NavbarProps) {
  return (
    <nav className="bg-black/40 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-400 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DeepResearch AI</h1>
              <p className="text-sm text-gray-300">Intelligent Research Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6">
              <StepIndicator step="input" currentStep={currentStep} label="Topic" />
              <StepIndicator step="sources" currentStep={currentStep} label="Sources" />
              <StepIndicator step="generating" currentStep={currentStep} label="Generate" />
              <StepIndicator step="report" currentStep={currentStep} label="Report" />
            </div>
            
            {currentStep !== 'input' && (
              <Button
                onClick={onStartNew}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home className="w-4 h-4 mr-2" />
                New Research
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface StepIndicatorProps {
  step: ResearchStep;
  currentStep: ResearchStep;
  label: string;
}

function StepIndicator({ step, currentStep, label }: StepIndicatorProps) {
  const stepOrder: ResearchStep[] = ['input', 'sources', 'generating', 'report'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(step);
  
  const isActive = step === currentStep;
  const isCompleted = stepIndex < currentIndex;
  const isUpcoming = stepIndex > currentIndex;
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-r from-white to-gray-300 text-black' 
          : isCompleted
          ? 'bg-white text-black'
          : 'bg-white/20 text-white/60'
      }`}>
        {isCompleted ? '✓' : stepIndex + 1}
      </div>
      <span className={`text-sm font-medium transition-colors duration-300 ${
        isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-white/60'
      }`}>
        {label}
      </span>
    </div>
  );
}