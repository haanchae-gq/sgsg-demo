import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Button,
  Radio,
  Divider,
  SafeArea,
  Toast,
  Modal,
  Checkbox
} from 'antd-mobile';
import {
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import dayjs from 'dayjs';

const Payment: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // 주문 정보 조회
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      // 임시 데이터 (실제 구현에서는 API 호출)
      return {
        id: orderId,
        orderNumber: 'ORD-' + dayjs().format('YYYYMMDD') + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        service: {
          name: '정기 청소',
          category: { name: '청소 서비스' },
          basePrice: 150000
        },
        selectedDate: dayjs().add(2, 'day').toDate(),
        selectedTime: '14:00',
        address: {
          name: '우리집',
          address: '서울특별시 강남구 테헤란로 123',
          addressDetail: '101동 505호'
        },
        totalAmount: 150000,
        depositAmount: 30000,
        balanceAmount: 120000,
        status: 'confirmed'
      };
    },
    enabled: !!orderId
  });

  // 결제 처리 mutation
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // TODO: 실제 PG 연동 구현
      // const response = await api.post('/payments/initialize', paymentData);
      // return response.data;
      
      // 임시 처리
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '결제가 완료되었습니다!'
      });
      setTimeout(() => {
        navigate(`/order/complete/${orderId}`);
      }, 1500);
    },
    onError: (error) => {
      Toast.show({
        icon: 'fail',
        content: '결제에 실패했습니다. 다시 시도해주세요.'
      });
    }
  });

  const paymentMethods = [
    {
      value: 'credit_card',
      label: '신용카드',
      icon: <CreditCardOutlined />,
      description: '국내외 모든 신용카드',
      recommended: true
    },
    {
      value: 'bank_transfer',
      label: '계좌이체',
      icon: <BankOutlined />,
      description: '실시간 계좌이체'
    },
    {
      value: 'mobile_payment',
      label: '간편결제',
      icon: <MobileOutlined />,
      description: '카카오페이, 네이버페이, 토스페이'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDateTime = (date: Date, time: string) => {
    return dayjs(date).format('YYYY년 M월 D일 (ddd)') + ` ${time}`;
  };

  const handlePayment = async () => {
    if (!agreed) {
      Toast.show({
        content: '결제 약관에 동의해주세요',
        position: 'center'
      });
      return;
    }

    Modal.confirm({
      title: '결제 확인',
      content: `예약금 ${formatPrice(order?.depositAmount || 0)}을 결제하시겠습니까?`,
      onConfirm: () => {
        setLoading(true);
        paymentMutation.mutate({
          orderId,
          paymentType: 'deposit',
          method: paymentMethod,
          amount: order?.depositAmount || 0
        });
      }
    });
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>;
  }

  if (!order) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>주문을 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar onBack={() => navigate(-1)}>
        결제하기
      </NavBar>

      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 주문 요약 */}
          <Card 
            title="주문 요약"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                  {order.service?.name}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px', marginBottom: '4px' }}>
                  📅 {formatDateTime(order.selectedDate, order.selectedTime)}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                  📍 {order.address?.address} {order.address?.addressDetail}
                </div>
              </div>

              <Divider />

              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span>서비스 금액</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#8c8c8c' }}>오늘 결제 (예약금 20%)</span>
                  <span style={{ color: '#8c8c8c' }}>{formatPrice(order.depositAmount)}</span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ color: '#8c8c8c' }}>서비스 완료 후 잔금</span>
                  <span style={{ color: '#8c8c8c' }}>{formatPrice(order.balanceAmount)}</span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>
                    지금 결제할 금액
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 600, color: '#2196F3' }}>
                    {formatPrice(order.depositAmount)}
                  </span>
                </div>
              </div>

            </Space>
          </Card>

          {/* 결제 방법 선택 */}
          <Card 
            title="결제 방법 선택"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Radio.Group 
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as string)}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {paymentMethods.map((method) => (
                  <Card
                    key={method.value}
                    style={{
                      border: paymentMethod === method.value ? '2px solid #2196F3' : '1px solid #f0f0f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Radio value={method.value} />
                      <div style={{ fontSize: '20px', color: '#2196F3' }}>
                        {method.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontWeight: 500 }}>
                            {method.label}
                          </span>
                          {method.recommended && (
                            <span style={{ 
                              background: '#2196F3', 
                              color: 'white', 
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '8px'
                            }}>
                              추천
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {method.description}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            </Radio.Group>
          </Card>

          {/* 결제 보안 */}
          <Card style={{ 
            background: '#f0f9ff',
            border: '1px solid #91d5ff',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#2196F3' }} />
              <div>
                <div style={{ fontWeight: 500, color: '#1890ff', marginBottom: '4px' }}>
                  안전한 결제 시스템
                </div>
                <div style={{ fontSize: '12px', color: '#096dd9' }}>
                  SSL 암호화로 결제 정보를 안전하게 보호합니다
                </div>
              </div>
            </div>
          </Card>

          {/* 결제 약관 동의 */}
          <Card style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <Checkbox 
                checked={agreed}
                onChange={setAgreed}
              >
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  결제 약관에 동의합니다
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
                • 전자결제서비스 이용약관 동의<br/>
                • 개인정보 수집 및 이용 동의<br/>
                • 예약금 결제 후 주문이 확정되며, 24시간 전까지 무료 취소 가능<br/>
                • 당일 취소 시 예약금의 50%가 취소 수수료로 부과<br/>
                • 서비스 완료 후 잔금 결제가 진행됩니다
              </div>
              
              <Button 
                fill="none" 
                size="small"
                color="primary"
                style={{ alignSelf: 'flex-start' }}
              >
                약관 전체보기
              </Button>
            </Space>
          </Card>

          {/* 환불 정책 */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                환불 정책
              </div>
            }
            style={{ 
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '8px'
            }}
          >
            <div style={{ fontSize: '12px', color: '#d48806', lineHeight: '1.5' }}>
              • <strong>서비스 24시간 전:</strong> 100% 환불<br/>
              • <strong>서비스 당일 취소:</strong> 예약금의 50% 취소 수수료 부과<br/>
              • <strong>서비스 시작 후:</strong> 환불 불가<br/>
              • 전문가 사정으로 인한 취소 시 100% 환불
            </div>
          </Card>

        </Space>
      </div>

      {/* 하단 결제 버튼 */}
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
          <Button 
            color="primary" 
            size="large"
            block
            onClick={handlePayment}
            disabled={!agreed}
            loading={loading || paymentMutation.isPending}
            style={{ borderRadius: '12px' }}
          >
            {formatPrice(order.depositAmount)} 결제하기
          </Button>
        </SafeArea>
      </div>

    </div>
  );
};

export default Payment;