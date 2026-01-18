import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-cream p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-serif text-burgundy mb-2">Une erreur est survenue</h1>
            <p className="text-muted mb-4">{this.state.error?.message || 'Erreur inconnue'}</p>
            <Button onClick={this.handleReload}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recharger l'application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
