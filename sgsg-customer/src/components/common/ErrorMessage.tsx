import React from 'react';
import { Result, Button } from 'antd-mobile';
import { 
  ExclamationCircleOutlined,
  WifiOutlined,
  ClockCircleOutlined,
  LockOutlined
} from '@ant-design/icons';

interface ErrorMessageProps {
  error?: Error | any;
  onRetry?: () => void;
  onGoBack?: () => void;
  customMessage?: string;
  customAction?: React.ReactNode;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onGoBack,
  customMessage,
  customAction
}) => {
  const getErrorInfo = () => {
    if (customMessage) {
      return {
        title: '오류가 발생했습니다',
        description: customMessage,
        icon: '⚠️'
      };
    }

    if (!error) {
      return {
        title: '알 수 없는 오류',
        description: '예상치 못한 오류가 발생했습니다',
        icon: '❌'
      };
    }

    // HTTP 상태 코드별 처리
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return {
            title: '잘못된 요청',
            description: '요청 정보를 확인하고 다시 시도해주세요',
            icon: '⚠️'
          };
        case 401:
          return {
            title: '인증이 필요합니다',
            description: '로그인 후 이용해주세요',
            icon: '🔒'
          };
        case 403:
          return {
            title: '접근 권한이 없습니다',
            description: '이 기능을 사용할 권한이 없습니다',
            icon: '🚫'
          };
        case 404:
          return {
            title: '페이지를 찾을 수 없습니다',
            description: '요청하신 페이지가 존재하지 않거나 이동되었습니다',
            icon: '🔍'
          };
        case 408:
          return {
            title: '요청 시간 초과',
            description: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요',
            icon: '⏰'
          };
        case 429:
          return {
            title: '너무 많은 요청',
            description: '잠시 후 다시 시도해주세요',
            icon: '🚦'
          };
        case 500:
          return {
            title: '서버 오류',
            description: '서버에 일시적인 문제가 발생했습니다',
            icon: '🔧'
          };
        case 502:
        case 503:
        case 504:
          return {
            title: '서비스 점검 중',
            description: '현재 서비스 점검 중입니다. 잠시 후 다시 시도해주세요',
            icon: '🛠️'
          };
        default:
          return {
            title: '서버 연결 실패',
            description: '서버와의 연결에 실패했습니다',
            icon: '🌐'
          };
      }
    }

    // 네트워크 오류
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return {
        title: '네트워크 연결 확인',
        description: '인터넷 연결을 확인하고 다시 시도해주세요',
        icon: '📶'
      };
    }

    // 타임아웃 오류
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return {
        title: '연결 시간 초과',
        description: '네트워크가 불안정합니다. 잠시 후 다시 시도해주세요',
        icon: '⏱️'
      };
    }

    // 기본 오류
    return {
      title: '오류가 발생했습니다',
      description: error.message || '알 수 없는 오류가 발생했습니다',
      icon: '❌'
    };
  };

  const errorInfo = getErrorInfo();

  const defaultActions = (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {onRetry && (
        <Button color="primary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
      {onGoBack && (
        <Button fill="outline" onClick={onGoBack}>
          이전으로
        </Button>
      )}
      {!onRetry && !onGoBack && (
        <Button 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          새로고침
        </Button>
      )}
    </div>
  );

  return (
    <div style={{ 
      padding: '40px 20px',
      textAlign: 'center',
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div>
        <div style={{ 
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          {errorInfo.icon}
        </div>
        
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 600,
          color: '#262626',
          marginBottom: '12px'
        }}>
          {errorInfo.title}
        </h3>
        
        <p style={{ 
          fontSize: '14px',
          color: '#8c8c8c',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          {errorInfo.description}
        </p>

        {customAction || defaultActions}

        {/* 개발 환경에서만 상세 에러 정보 표시 */}
        {process.env.NODE_ENV === 'development' && error && (
          <details style={{ 
            fontSize: '12px', 
            color: '#bfbfbf',
            textAlign: 'left',
            marginTop: '24px',
            background: '#fafafa',
            padding: '12px',
            borderRadius: '4px'
          }}>
            <summary>에러 상세 (개발용)</summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              marginTop: '8px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;