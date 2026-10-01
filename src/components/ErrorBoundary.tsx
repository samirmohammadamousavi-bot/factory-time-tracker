'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div dir="rtl" className="flex items-center justify-center min-h-screen p-4">
          <div className="luxury-card w-full max-w-md rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-plum">خطای غیرمنتظره رخ داد</h2>
            <p className="text-sm text-plum/60">
              {this.state.error?.message || 'لطفاً صفحه را مجدداً بارگذاری کنید'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-linear-to-br from-teal to-teal-dark text-white py-3 rounded-xl font-semibold shadow-lg shadow-teal/30 hover:shadow-xl transition-all"
            >
              بارگذاری مجدد
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;