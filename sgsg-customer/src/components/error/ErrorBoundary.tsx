import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Result, Button } from 'antd-mobile';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 에러 로깅 서비스로 전송 (실제 구현에서는 Sentry, LogRocket 등 사용)
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ 
          padding: '40px 20px',
          textAlign: 'center',
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Result
            status="error"
            title="앗, 문제가 발생했어요"
            description={
              <div>
                <div style={{ marginBottom: '16px' }}>
                  일시적인 오류가 발생했습니다.<br/>
                  잠시 후 다시 시도해주세요.
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details style={{ 
                    fontSize: '12px', 
                    color: '#8c8c8c',
                    textAlign: 'left',
                    marginTop: '16px',
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px'
                  }}>
                    <summary>에러 상세 (개발용)</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                      {this.state.error.message}
                      {'\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            }
            extra={
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <Button 
                  color="primary"
                  onClick={this.handleRetry}
                >
                  다시 시도
                </Button>
                <Button 
                  fill="outline"
                  onClick={() => window.location.reload()}
                >
                  새로고침
                </Button>
              </div>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}