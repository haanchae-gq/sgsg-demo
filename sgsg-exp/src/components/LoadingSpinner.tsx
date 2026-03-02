import React from 'react';
import { SpinLoading } from 'antd-mobile';
import './LoadingSpinner.css';

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
  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 32;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  const content = (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-content">
        <SpinLoading style={{ '--size': `${getSpinnerSize()}px` }} color="primary" />
        {text && <div className="loading-text">{text}</div>}
      </div>
    </div>
  );

  return content;
};

export default LoadingSpinner;