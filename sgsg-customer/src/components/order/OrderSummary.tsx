import React from 'react';
import {
  Card,
  Space,
  Divider,
  Image,
  Tag,
  Button,
  Checkbox
} from 'antd-mobile';
import {
  CheckCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface OrderSummaryProps {
  orderData: {
    serviceId: string;
    service: any;
    expertId?: string;
    expert?: any;
    selectedDate: Date | null;
    selectedTime: string | null;
    address: any;
    requirements: string;
    specialRequests: string;
  };
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orderData }) => {
  const {
    service,
    expert,
    selectedDate,
    selectedTime,
    address,
    requirements,
    specialRequests
  } = orderData;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDateTime = () => {
    if (!selectedDate || !selectedTime) return '';
    return dayjs(selectedDate).format('YYYY년 M월 D일 (ddd)') + ` ${selectedTime}`;
  };

  const depositAmount = service?.basePrice ? Math.round(service.basePrice * 0.2) : 0;
  const balanceAmount = service?.basePrice ? service.basePrice - depositAmount : 0;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      
      {/* 주문 확인 헤더 */}
      <Card 
        style={{ 
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <h2 style={{ color: 'white', margin: '0 0 8px 0' }}>주문 내용을 확인해주세요</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '14px' }}>
            모든 정보가 정확한지 확인 후 주문을 완료하세요
          </p>
        </div>
      </Card>

      {/* 서비스 정보 */}
      <Card 
        title="선택한 서비스"
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        {service && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Tag size="small" color="primary" fill="outline">
                  {service.category?.name}
                </Tag>
                <h3 style={{ margin: '8px 0', fontSize: '16px', fontWeight: 600 }}>
                  {service.name}
                </h3>
                <p style={{ margin: 0, color: '#8c8c8c', fontSize: '14px' }}>
                  {service.description}
                </p>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: '1px solid #f0f0f0'
            }}>
              <span style={{ fontWeight: 500 }}>서비스 금액</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#2196F3' }}>
                {formatPrice(service.basePrice)}
              </span>
            </div>
          </Space>
        )}
      </Card>

      {/* 전문가 정보 */}
      {expert ? (
        <Card 
          title="선택한 전문가"
          style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Image
              src={expert.profileImage || '/placeholder-avatar.png'}
              width={50}
              height={50}
              style={{ borderRadius: '50%' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                {expert.businessName || expert.user?.name}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                평점 {expert.rating?.toFixed(1)} • 완료 {expert.completedOrderCount}회
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
              🎯 최적의 전문가 자동 매칭
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              주문 확정 후 가장 적합한 전문가를 배정해드립니다
            </div>
          </div>
        </Card>
      )}

      {/* 일정 정보 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined />
            예약 일정
          </div>
        }
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>서비스 일시</span>
            <span style={{ fontWeight: 500 }}>
              {formatDateTime()}
            </span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#8c8c8c',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ClockCircleOutlined />
            예상 소요시간: {service?.estimatedDuration ? Math.round(service.estimatedDuration / 60) : 0}시간
          </div>
        </Space>
      </Card>

      {/* 주소 정보 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EnvironmentOutlined />
            서비스 주소
          </div>
        }
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        {address && (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ fontWeight: 500 }}>
              {address.name}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
              {address.address}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
              {address.addressDetail}
            </div>
            {address.contactName && (
              <div style={{ fontSize: '12px', color: '#bfbfbf' }}>
                연락처: {address.contactName} {address.contactPhone}
              </div>
            )}
          </Space>
        )}
      </Card>

      {/* 요구사항 */}
      {(requirements || specialRequests) && (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileTextOutlined />
              요구사항
            </div>
          }
          style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {requirements && (
              <div>
                <div style={{ fontWeight: 500, marginBottom: '8px', fontSize: '14px' }}>
                  서비스 요구사항
                </div>
                <div style={{ 
                  background: '#fafafa', 
                  padding: '12px', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line'
                }}>
                  {requirements}
                </div>
              </div>
            )}
            
            {specialRequests && (
              <div>
                <div style={{ fontWeight: 500, marginBottom: '8px', fontSize: '14px' }}>
                  특별 요청사항
                </div>
                <div style={{ 
                  background: '#fafafa', 
                  padding: '12px', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line'
                }}>
                  {specialRequests}
                </div>
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* 결제 정보 */}
      <Card 
        title="결제 정보"
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>서비스 금액</span>
            <span>{service?.basePrice ? formatPrice(service.basePrice) : '0원'}</span>
          </div>
          
          <Divider style={{ margin: '8px 0' }} />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#8c8c8c' }}>예약금 (20%)</span>
            <span style={{ color: '#8c8c8c' }}>{formatPrice(depositAmount)}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#8c8c8c' }}>서비스 완료 후 잔금</span>
            <span style={{ color: '#8c8c8c' }}>{formatPrice(balanceAmount)}</span>
          </div>
          
          <Divider style={{ margin: '8px 0' }} />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>총 결제금액</span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#2196F3' }}>
              {service?.basePrice ? formatPrice(service.basePrice) : '0원'}
            </span>
          </div>
        </Space>
      </Card>

      {/* 약관 동의 */}
      <Card style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Checkbox>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              서비스 이용약관 및 개인정보처리방침에 동의합니다
            </span>
          </Checkbox>
          
          <Checkbox>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              주문 내용을 확인했으며, 결제에 동의합니다
            </span>
          </Checkbox>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#8c8c8c',
            background: '#fafafa',
            padding: '12px',
            borderRadius: '6px',
            lineHeight: '1.5'
          }}>
            • 예약금 결제 후 주문이 확정됩니다<br/>
            • 서비스 24시간 전까지 무료 취소 가능합니다<br/>
            • 당일 취소 시 예약금의 50%가 취소 수수료로 부과됩니다<br/>
            • 최종 결제 금액은 전문가와 상담 후 변동될 수 있습니다
          </div>
        </Space>
      </Card>

    </Space>
  );
};

export default OrderSummary;