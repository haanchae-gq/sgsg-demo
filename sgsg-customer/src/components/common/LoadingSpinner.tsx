import React from 'react';
import { SpinLoading } from 'antd-mobile';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text = '로딩 중...',
  fullScreen = false
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32
  };

  const containerStyle: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1000
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        minHeight: '200px'
      };

  return (
    <div style={containerStyle}>
      <SpinLoading 
        style={{ 
          '--size': `${sizeMap[size]}px`,
          '--color': '#2196F3'
        }} 
      />
      {text && (
        <div style={{ 
          marginTop: '16px',
          fontSize: '14px',
          color: '#8c8c8c',
          textAlign: 'center'
        }}>
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;