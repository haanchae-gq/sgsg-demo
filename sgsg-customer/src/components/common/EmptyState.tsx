import React from 'react';
import { Empty, Button } from 'antd-mobile';

interface EmptyStateProps {
  type?: 'orders' | 'reviews' | 'favorites' | 'services' | 'addresses' | 'notifications' | 'search' | 'general';
  title?: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
    color?: 'primary' | 'default';
  };
  image?: string;
  customContent?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  action,
  image,
  customContent
}) => {
  const getEmptyConfig = () => {
    switch (type) {
      case 'orders':
        return {
          emoji: '📦',
          defaultTitle: '주문 내역이 없어요',
          defaultDescription: '아직 주문한 서비스가 없습니다.\n필요한 서비스를 찾아보세요!',
          defaultAction: {
            text: '서비스 둘러보기',
            color: 'primary' as const
          }
        };
      
      case 'reviews':
        return {
          emoji: '⭐',
          defaultTitle: '작성한 리뷰가 없어요',
          defaultDescription: '서비스 이용 후 리뷰를 작성하면\n포인트도 받고 다른 고객들에게도 도움이 됩니다',
          defaultAction: {
            text: '주문 내역 보기',
            color: 'primary' as const
          }
        };
      
      case 'favorites':
        return {
          emoji: '💖',
          defaultTitle: '즐겨찾기한 전문가가 없어요',
          defaultDescription: '마음에 드는 전문가를 즐겨찾기에 추가하면\n다음에 쉽게 찾을 수 있어요',
          defaultAction: {
            text: '전문가 찾기',
            color: 'primary' as const
          }
        };
      
      case 'services':
        return {
          emoji: '🔍',
          defaultTitle: '서비스가 없어요',
          defaultDescription: '현재 이용 가능한 서비스가 없습니다.\n다른 카테고리를 확인해보세요',
          defaultAction: {
            text: '전체 서비스 보기',
            color: 'primary' as const
          }
        };
      
      case 'addresses':
        return {
          emoji: '📍',
          defaultTitle: '저장된 주소가 없어요',
          defaultDescription: '자주 이용하는 주소를 저장하면\n주문할 때 더 편리해요',
          defaultAction: {
            text: '주소 추가하기',
            color: 'primary' as const
          }
        };
      
      case 'notifications':
        return {
          emoji: '🔔',
          defaultTitle: '새로운 알림이 없어요',
          defaultDescription: '주문 상태 변경이나 새로운 혜택 정보를\n알림으로 받아보실 수 있어요',
          defaultAction: {
            text: '알림 설정',
            color: 'primary' as const
          }
        };
      
      case 'search':
        return {
          emoji: '🔍',
          defaultTitle: '검색 결과가 없어요',
          defaultDescription: '다른 키워드로 검색하거나\n카테고리에서 서비스를 찾아보세요',
          defaultAction: {
            text: '전체 서비스 보기',
            color: 'primary' as const
          }
        };
      
      default:
        return {
          emoji: '📋',
          defaultTitle: '데이터가 없어요',
          defaultDescription: '현재 표시할 내용이 없습니다',
          defaultAction: {
            text: '새로고침',
            color: 'default' as const
          }
        };
    }
  };

  const config = getEmptyConfig();

  if (customContent) {
    return (
      <div style={{ 
        padding: '64px 32px',
        textAlign: 'center'
      }}>
        {customContent}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '64px 32px',
      textAlign: 'center'
    }}>
      {/* 이미지 또는 이모지 */}
      <div style={{ 
        fontSize: '64px',
        marginBottom: '24px'
      }}>
        {image ? (
          <img 
            src={image} 
            alt="empty" 
            style={{ 
              width: '64px', 
              height: '64px',
              opacity: 0.5
            }} 
          />
        ) : (
          config.emoji
        )}
      </div>

      {/* 제목 */}
      <h3 style={{ 
        fontSize: '18px',
        fontWeight: 600,
        color: '#262626',
        marginBottom: '12px'
      }}>
        {title || config.defaultTitle}
      </h3>

      {/* 설명 */}
      <p style={{ 
        fontSize: '14px',
        color: '#8c8c8c',
        lineHeight: '1.5',
        marginBottom: action ? '32px' : '0',
        whiteSpace: 'pre-line'
      }}>
        {description || config.defaultDescription}
      </p>

      {/* 액션 버튼 */}
      {action && (
        <Button 
          color={action.color || config.defaultAction.color}
          onClick={action.onClick}
        >
          {action.text}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;