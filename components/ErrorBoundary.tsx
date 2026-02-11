import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cyber-950 text-red-500 flex flex-col items-center justify-center p-8 font-mono">
          <div className="bg-cyber-900 border border-red-900/50 p-6 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-4 border-b border-red-900/30 pb-4">
              <AlertTriangle size={32} className="animate-pulse" />
              <h1 className="text-2xl font-bold font-display uppercase tracking-widest">System Failure</h1>
            </div>
            
            <div className="bg-black/50 p-4 rounded-lg mb-4 overflow-auto max-h-48 border border-red-900/20">
              <p className="font-bold mb-2 text-red-400">{this.state.error?.toString()}</p>
              <pre className="text-xs text-red-700 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-red-500/20"
            >
              <RefreshCw size={18} />
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;