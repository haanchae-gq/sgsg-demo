import React, { Component, ReactNode } from 'react';
import { Result, Button } from 'antd-mobile';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 에러 로깅 서비스로 전송 (예: Sentry)
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <Result
            status="error"
            title="문제가 발생했습니다"
            description="앱에서 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가세요."
            renderActions={() => (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button 
                  color="primary" 
                  onClick={this.handleReload}
                >
                  새로고침
                </Button>
                <Button 
                  fill="outline"
                  onClick={this.handleGoHome}
                >
                  홈으로
                </Button>
              </div>
            )}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;