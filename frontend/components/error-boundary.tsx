import React from "react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, { info });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center text-white/90">
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="max-w-sm text-white/70">
              An unexpected error occurred while rendering this section. You can
              try again or reload the page.
            </p>
            <Button onClick={this.handleRetry} className="bg-white text-black">
              Try Again
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
