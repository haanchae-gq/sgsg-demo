import React from 'react';
import {
  Card,
  Space,
  Tag,
  Image,
  Button,
  Divider,
  Rate
} from 'antd-mobile';
import {
  StarFilled,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ServiceItem, Expert } from '../../types';

interface ServiceConfirmationProps {
  service: ServiceItem | null;
  expertId?: string;
  onExpertSelect: (expert: Expert | null) => void;
}

const ServiceConfirmation: React.FC<ServiceConfirmationProps> = ({
  service,
  expertId,
  onExpertSelect
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return remainMinutes > 0 ? `${hours}시간 ${remainMinutes}분` : `${hours}시간`;
  };

  if (!service) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>선택된 서비스가 없습니다.</p>
        </div>
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      
      {/* 서비스 정보 */}
      <Card 
        title="선택한 서비스"
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Tag size="small" color="primary" fill="outline">
              {service.category?.name}
            </Tag>
            <h3 style={{ margin: '8px 0', fontSize: '18px', fontWeight: 600 }}>
              {service.name}
            </h3>
            <p style={{ 
              margin: 0, 
              color: '#8c8c8c', 
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {service.description}
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0'
          }}>
            <div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#2196F3',
                marginBottom: '4px'
              }}>
                {formatPrice(service.basePrice)}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: '#8c8c8c',
                fontSize: '12px'
              }}>
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                예상 소요시간 {formatDuration(service.estimatedDuration)}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <StarFilled style={{ color: '#faad14', fontSize: '14px' }} />
                <span style={{ fontSize: '14px', marginLeft: '4px', fontWeight: 500 }}>
                  4.8
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                리뷰 156개
              </div>
            </div>
          </div>

          {/* 서비스 태그 */}
          {service.tags && service.tags.length > 0 && (
            <div>
              <Space wrap>
                {service.tags.map((tag: string) => (
                  <Tag key={tag} fill="outline" size="small">
                    #{tag}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </Space>
      </Card>

      <Divider />

      {/* 전문가 선택 (선택사항) */}
      <Card 
        title="전문가 선택"
        extra={
          <Button size="small" fill="none" color="primary">
            전문가 더보기
          </Button>
        }
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          
          {/* 추천 전문가 옵션 */}
          <Card 
            style={{ 
              border: expertId === 'auto' ? '2px solid #2196F3' : '1px solid #f0f0f0',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => onExpertSelect(null)}
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                🎯 최적의 전문가 자동 매칭
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '12px' }}>
                리뷰와 평점을 기반으로 가장 적합한 전문가를 추천해드립니다
              </div>
              <Tag color="success" fill="outline" size="small">
                추천
              </Tag>
            </div>
          </Card>

          {/* 직접 선택 안내 */}
          <div style={{ 
            padding: '16px',
            background: '#fafafa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>
              특정 전문가를 선택하고 싶으시다면
            </div>
            <Button size="small" fill="outline" color="primary">
              전문가 목록 보기
            </Button>
          </div>

        </Space>
      </Card>

      {/* 주의사항 */}
      <Card 
        style={{ 
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: '8px'
        }}
      >
        <div style={{ fontSize: '12px', color: '#d46b08' }}>
          <strong>📌 주의사항</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
            <li>선택하신 서비스의 최종 가격은 전문가와 상담 후 확정됩니다</li>
            <li>예약 확정 후 24시간 전까지 무료 취소 가능합니다</li>
            <li>서비스 당일 취소 시 취소 수수료가 부과될 수 있습니다</li>
          </ul>
        </div>
      </Card>
    </Space>
  );
};

export default ServiceConfirmation;