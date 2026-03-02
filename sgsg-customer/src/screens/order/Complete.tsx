import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Space,
  Button,
  Divider,
  SafeArea,
  Steps
} from 'antd-mobile';
import {
  CheckCircleOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MessageOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import dayjs from 'dayjs';

const OrderComplete: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 주문 정보 조회 (실제 구현에서는 API 호출)
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      // TODO: 실제 API 구현 시 주석 해제
      // const response = await api.get(`/orders/${id}`);
      // return response.data.data;
      
      // 임시 데이터
      return {
        id: id,
        orderNumber: 'ORD-' + dayjs().format('YYYYMMDD') + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        service: {
          name: '정기 청소',
          category: { name: '청소 서비스' },
          basePrice: 150000
        },
        expert: {
          businessName: '깔끔한 청소 서비스',
          user: { name: '김영희', phone: '010-1234-5678' },
          rating: 4.8,
          profileImage: null
        },
        selectedDate: dayjs().add(2, 'day').toDate(),
        selectedTime: '14:00',
        address: {
          name: '우리집',
          address: '서울특별시 강남구 테헤란로 123',
          addressDetail: '101동 505호'
        },
        status: 'confirmed',
        totalAmount: 150000,
        depositAmount: 30000,
        balanceAmount: 120000,
        createdAt: new Date().toISOString()
      };
    },
    enabled: !!id
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDateTime = (date: Date, time: string) => {
    return dayjs(date).format('YYYY년 M월 D일 (ddd)') + ` ${time}`;
  };

  const nextSteps = [
    { 
      title: '전문가 배정', 
      description: '30분 내에 전문가가 배정되어 연락드립니다',
      icon: '👨‍🔧',
      status: 'process'
    },
    { 
      title: '일정 조율', 
      description: '전문가와 최종 일정을 확인합니다',
      icon: '📅',
      status: 'wait'
    },
    { 
      title: '서비스 진행', 
      description: '예약된 날짜에 서비스를 받습니다',
      icon: '🔧',
      status: 'wait'
    },
    { 
      title: '서비스 완료', 
      description: '잔금 결제 후 리뷰를 작성해주세요',
      icon: '⭐',
      status: 'wait'
    }
  ];

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>;
  }

  if (!order) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>주문을 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh' }}>
      
      {/* 성공 메시지 */}
      <Card 
        style={{ 
          background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '0',
          margin: 0
        }}
      >
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircleOutlined style={{ fontSize: '64px', marginBottom: '20px' }} />
          <h1 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '24px' }}>
            주문이 완료되었습니다! 🎉
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '16px' }}>
            예약금 결제가 완료되어 주문이 확정되었습니다
          </p>
        </div>
      </Card>

      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 주문 정보 요약 */}
          <Card 
            title="주문 정보"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 500 }}>주문번호</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#2196F3' }}>
                  {order.orderNumber}
                </span>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <div>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                  {order.service?.name}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                  📅 {formatDateTime(order.selectedDate, order.selectedTime)}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                  📍 {order.address?.address} {order.address?.addressDetail}
                </div>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>총 금액</span>
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#2196F3' }}>
                  {formatPrice(order.totalAmount)}
                </span>
              </div>

              <div style={{ 
                background: '#f6ffed',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}>
                <div style={{ fontSize: '14px', color: '#52c41a', fontWeight: 500 }}>
                  ✅ 예약금 {formatPrice(order.depositAmount)} 결제 완료
                </div>
                <div style={{ fontSize: '12px', color: '#389e0d', marginTop: '4px' }}>
                  서비스 완료 후 잔금 {formatPrice(order.balanceAmount)} 결제 예정
                </div>
              </div>

            </Space>
          </Card>

          {/* 배정된 전문가 (있는 경우) */}
          {order.expert && (
            <Card 
              title="배정된 전문가"
              style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  👨‍🔧
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    {order.expert.businessName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    평점 {order.expert.rating?.toFixed(1)} ⭐
                  </div>
                </div>
              </div>

              <Space size="small">
                <Button 
                  size="small" 
                  color="primary"
                  icon={<PhoneOutlined />}
                  onClick={() => window.location.href = `tel:${order.expert?.user?.phone}`}
                >
                  전화하기
                </Button>
                <Button 
                  size="small" 
                  fill="outline"
                  icon={<MessageOutlined />}
                  onClick={() => window.location.href = `sms:${order.expert?.user?.phone}`}
                >
                  문자하기
                </Button>
              </Space>
            </Card>
          )}

          {/* 다음 단계 */}
          <Card 
            title="다음 단계"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              
              {nextSteps.map((step, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: step.status === 'process' ? '#2196F3' : '#f0f0f0',
                    color: step.status === 'process' ? 'white' : '#8c8c8c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 500, 
                      marginBottom: '4px',
                      color: step.status === 'process' ? '#2196F3' : '#262626'
                    }}>
                      {step.icon} {step.title}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      lineHeight: '1.4'
                    }}>
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}

            </Space>
          </Card>

          {/* 유용한 정보 */}
          <Card 
            title="알아두면 좋은 팁"
            style={{ 
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '12px'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div style={{ fontSize: '14px', color: '#d46b08' }}>
                🔔 <strong>알림 설정</strong><br/>
                푸시 알림을 켜두시면 전문가 배정, 일정 변경 등의 중요한 소식을 놓치지 않을 수 있어요
              </div>
              
              <div style={{ fontSize: '14px', color: '#d46b08' }}>
                💬 <strong>소통하기</strong><br/>
                전문가와 미리 소통하여 세부사항을 조율하면 더 만족스러운 서비스를 받을 수 있어요
              </div>
              
              <div style={{ fontSize: '14px', color: '#d46b08' }}>
                ⭐ <strong>리뷰 작성</strong><br/>
                서비스 완료 후 솔직한 리뷰를 남겨주시면 다른 고객들에게 큰 도움이 됩니다
              </div>
            </Space>
          </Card>

        </Space>
      </div>

      {/* 하단 버튼 */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid #f0f0f0'
      }}>
        <SafeArea position="bottom">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                fill="outline" 
                size="large"
                onClick={() => navigate('/orders')}
                style={{ flex: 1 }}
              >
                주문내역 보기
              </Button>
              <Button 
                color="primary" 
                size="large"
                onClick={() => navigate('/')}
                style={{ flex: 1 }}
              >
                홈으로 가기
              </Button>
            </div>
            
            {/* 공유하기 */}
            <Button 
              fill="none" 
              size="small"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'SGSG 주문 완료',
                    text: `${order.service?.name} 주문이 완료되었습니다! 주문번호: ${order.orderNumber}`,
                    url: window.location.href
                  });
                } else {
                  // 폴백: 클립보드에 복사
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              style={{ color: '#8c8c8c' }}
            >
              📤 친구에게 공유하기
            </Button>
          </Space>
        </SafeArea>
      </div>

    </div>
  );
};

export default OrderComplete;