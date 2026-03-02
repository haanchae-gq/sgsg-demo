import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Button,
  Tag,
  Image,
  Divider,
  Steps,
  Popup,
  Modal,
  Toast,
  Rate,
  TextArea
} from 'antd-mobile';
import {
  PhoneOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  CameraOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Order } from '../../types';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // 주문 상세 정보 조회
  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      // 임시 데이터 (실제 구현에서는 API 호출)
      return {
        id: id,
        orderNumber: 'ORD-20240301-001',
        serviceItemId: 'item1',
        serviceItem: {
          id: 'item1',
          categoryId: 'cat1',
          category: { id: 'cat1', name: '청소 서비스', description: '', icon: '', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
          name: '정기 청소',
          description: '주1회 정기적인 청소 서비스',
          basePrice: 150000,
          estimatedDuration: 180,
          isActive: true,
          tags: ['정기', '청소'],
          createdAt: '',
          updatedAt: ''
        },
        expert: {
          id: 'exp1',
          userId: 'user1',
          user: {
            id: 'user1',
            email: 'expert@example.com',
            name: '김영희',
            phone: '010-1234-5678',
            role: 'expert' as const,
            status: 'active' as const,
            createdAt: '',
            updatedAt: ''
          },
          businessName: '깔끔한 청소 서비스',
          description: '15년 경력의 전문 청소 전문가',
          profileImage: null,
          rating: 4.8,
          reviewCount: 342,
          completedOrderCount: 1250,
          isVerified: true,
          status: 'active' as const,
          createdAt: '',
          updatedAt: ''
        },
        customerId: 'customer1',
        expertId: 'exp1',
        addressId: 'addr1',
        requestedDate: dayjs().add(2, 'day').format(),
        scheduledDate: dayjs().add(2, 'day').format(),
        status: 'scheduled' as const,
        totalAmount: 150000,
        depositAmount: 30000,
        balanceAmount: 120000,
        customerNotes: '정기 청소 신청합니다. 특히 화장실과 주방을 꼼꼼히 해주세요.',
        expertNotes: '네, 화장실과 주방 위주로 꼼꼼히 청소해드리겠습니다.',
        createdAt: dayjs().subtract(1, 'day').format(),
        updatedAt: dayjs().subtract(1, 'day').format(),
        // 추가 정보
        address: {
          id: 'addr1',
          name: '우리집',
          address: '서울특별시 강남구 테헤란로 123',
          addressDetail: '101동 505호',
          contactName: '홍길동',
          contactPhone: '010-9876-5432'
        },
        progressHistory: [
          {
            status: 'pending',
            timestamp: dayjs().subtract(1, 'day').format(),
            description: '주문이 접수되었습니다'
          },
          {
            status: 'confirmed',
            timestamp: dayjs().subtract(1, 'day').add(30, 'minute').format(),
            description: '예약금 결제가 완료되어 주문이 확정되었습니다'
          },
          {
            status: 'expert_assigned',
            timestamp: dayjs().subtract(1, 'day').add(45, 'minute').format(),
            description: '전문가가 배정되었습니다'
          },
          {
            status: 'scheduled',
            timestamp: dayjs().subtract(1, 'day').add(2, 'hour').format(),
            description: '서비스 일정이 확정되었습니다'
          }
        ]
      } as Order & {
        address: any;
        progressHistory: Array<{
          status: string;
          timestamp: string;
          description: string;
        }>;
      };
    },
    enabled: !!id
  });

  // 주문 취소
  const cancelOrderMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      // TODO: 실제 API 구현
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '주문이 취소되었습니다'
      });
      setCancelModalVisible(false);
      refetch();
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '주문 취소에 실패했습니다'
      });
    }
  });

  // 서비스 완료 확인
  const completeOrderMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '서비스 완료가 확인되었습니다'
      });
      setCompleteModalVisible(false);
      navigate(`/reviews/write/${id}`);
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '완료 처리에 실패했습니다'
      });
    }
  });

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'orange',
      'confirmed': 'blue',
      'expert_assigned': 'cyan',
      'schedule_pending': 'geekblue', 
      'scheduled': 'green',
      'in_progress': 'green',
      'completed': 'default',
      'cancelled': 'red'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '대기 중',
      'confirmed': '확정됨',
      'expert_assigned': '전문가 배정',
      'schedule_pending': '일정 대기',
      'scheduled': '일정 확정',
      'in_progress': '진행 중',
      'completed': '완료',
      'cancelled': '취소됨'
    };
    return statusMap[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDateTime = (date: string) => {
    return dayjs(date).format('YYYY년 M월 D일 (ddd) HH:mm');
  };

  const handleExpertContact = (phoneNumber?: string, type: 'call' | 'sms' = 'call') => {
    if (!phoneNumber) return;
    
    if (type === 'call') {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      window.location.href = `sms:${phoneNumber}`;
    }
  };

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      Toast.show('취소 사유를 입력해주세요');
      return;
    }
    
    Modal.confirm({
      title: '주문 취소',
      content: '정말로 주문을 취소하시겠습니까?',
      onConfirm: () => {
        cancelOrderMutation.mutate({ reason: cancelReason });
      }
    });
  };

  const handleCompleteOrder = () => {
    Modal.confirm({
      title: '서비스 완료 확인',
      content: '서비스가 완료되었습니까? 완료 확인 후 리뷰를 작성할 수 있습니다.',
      onConfirm: () => {
        completeOrderMutation.mutate({ notes: completionNotes });
      }
    });
  };

  const canCancel = order && ['confirmed', 'expert_assigned', 'schedule_pending', 'scheduled'].includes(order.status);
  const canComplete = order && order.status === 'in_progress';
  const canWriteReview = order && order.status === 'completed';

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>;
  }

  if (!order) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>주문을 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar onBack={() => navigate(-1)}>
        주문 상세
      </NavBar>

      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 주문 상태 & 기본 정보 */}
          <Card style={{ border: 'none', borderRadius: '12px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <Tag 
                      color={getStatusColor(order.status)} 
                      size="large"
                      fill="solid"
                    >
                      {getStatusText(order.status)}
                    </Tag>
                  </div>
                  
                  <h2 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '20px', 
                    fontWeight: 600 
                  }}>
                    {order.serviceItem?.name}
                  </h2>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#8c8c8c',
                    fontFamily: 'monospace'
                  }}>
                    주문번호: {order.orderNumber}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#2196F3',
                    marginBottom: '4px'
                  }}>
                    {formatPrice(order.totalAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    예약금 {formatPrice(order.depositAmount)} 결제완료
                  </div>
                </div>
              </div>

            </Space>
          </Card>

          {/* 진행 상황 */}
          <Card 
            title="진행 상황"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              {order.progressHistory?.map((progress, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#52c41a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CheckCircleOutlined style={{ color: 'white', fontSize: '12px' }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 500,
                      marginBottom: '2px'
                    }}>
                      {progress.description}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {formatDateTime(progress.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {/* 다음 단계 (진행중인 경우) */}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '12px',
                  opacity: 0.5
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid #d9d9d9',
                    flexShrink: 0
                  }} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                      {order.status === 'scheduled' && '서비스 진행 예정'}
                      {order.status === 'in_progress' && '서비스 완료 대기 중'}
                    </div>
                  </div>
                </div>
              )}

            </Space>
          </Card>

          {/* 서비스 정보 */}
          <Card 
            title="서비스 정보"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CalendarOutlined style={{ color: '#2196F3' }} />
                  <span style={{ fontWeight: 500 }}>예약 일시</span>
                </div>
                <span>
                  {order.scheduledDate ? formatDateTime(order.scheduledDate) : '미정'}
                </span>
              </div>

              <Divider style={{ margin: '0' }} />

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <EnvironmentOutlined style={{ color: '#2196F3' }} />
                  <span style={{ fontWeight: 500 }}>서비스 주소</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>{order.address?.address}</div>
                  <div>{order.address?.addressDetail}</div>
                  {order.address?.contactName && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      연락처: {order.address.contactName} {order.address.contactPhone}
                    </div>
                  )}
                </div>
              </div>

            </Space>
          </Card>

          {/* 전문가 정보 */}
          {order.expert && (
            <Card 
              title="배정된 전문가"
              style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '12px'
                }}>
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
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 500,
                      marginBottom: '4px'
                    }}>
                      {order.expert.businessName}
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <Rate value={order.expert.rating} readonly size={12} />
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {order.expert.rating?.toFixed(1)} ({order.expert.reviewCount}개 리뷰)
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      완료 {order.expert.completedOrderCount}회
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    color="primary"
                    icon={<PhoneOutlined />}
                    onClick={() => handleExpertContact(order.expert?.user?.phone, 'call')}
                    style={{ flex: 1 }}
                  >
                    전화하기
                  </Button>
                  <Button 
                    fill="outline"
                    icon={<MessageOutlined />}
                    onClick={() => handleExpertContact(order.expert?.user?.phone, 'sms')}
                    style={{ flex: 1 }}
                  >
                    문자하기
                  </Button>
                </div>

              </Space>
            </Card>
          )}

          {/* 요청사항 */}
          {(order.customerNotes || order.expertNotes) && (
            <Card 
              title="요청사항 & 전문가 메모"
              style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                
                {order.customerNotes && (
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#2196F3'
                    }}>
                      👤 고객 요청사항
                    </div>
                    <div style={{ 
                      background: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {order.customerNotes}
                    </div>
                  </div>
                )}

                {order.expertNotes && (
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#52c41a'
                    }}>
                      👨‍🔧 전문가 메모
                    </div>
                    <div style={{ 
                      background: '#f6ffed',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {order.expertNotes}
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
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#52c41a' }}>✅ 예약금 (결제완료)</span>
                <span style={{ color: '#52c41a', fontWeight: 500 }}>
                  {formatPrice(order.depositAmount)}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#ff7f00' }}>⏳ 잔금 (서비스 완료 후)</span>
                <span style={{ color: '#ff7f00', fontWeight: 500 }}>
                  {formatPrice(order.balanceAmount)}
                </span>
              </div>

            </Space>
          </Card>

        </Space>
      </div>

      {/* 하단 액션 버튼들 */}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          
          {/* 진행중 주문 액션 */}
          {canCancel && (
            <Button 
              color="danger"
              fill="outline"
              onClick={() => setCancelModalVisible(true)}
              style={{ flex: 1 }}
            >
              주문 취소
            </Button>
          )}

          {canComplete && (
            <Button 
              color="primary"
              onClick={() => setCompleteModalVisible(true)}
              style={{ flex: 1 }}
            >
              <CheckCircleOutlined /> 완료 확인
            </Button>
          )}

          {canWriteReview && (
            <Button 
              color="primary"
              onClick={() => navigate(`/reviews/write/${id}`)}
              style={{ flex: 1 }}
            >
              <StarOutlined /> 리뷰 작성
            </Button>
          )}

          {/* 전문가 연락 (항상 표시) */}
          {order.expert && (
            <Button 
              fill="outline"
              icon={<PhoneOutlined />}
              onClick={() => handleExpertContact(order.expert?.user?.phone, 'call')}
              style={{ minWidth: '80px' }}
            >
              연락
            </Button>
          )}

        </div>
      </div>

      {/* 주문 취소 팝업 */}
      <Popup 
        visible={cancelModalVisible}
        onMaskClick={() => setCancelModalVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
            <h3 style={{ margin: 0, color: '#ff4d4f' }}>주문 취소</h3>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#8c8c8c',
              marginBottom: '12px'
            }}>
              취소 사유를 선택하거나 직접 입력해주세요
            </div>
            
            <TextArea
              placeholder="취소 사유를 입력해주세요"
              value={cancelReason}
              onChange={setCancelReason}
              rows={3}
              maxLength={200}
              showCount
            />
          </div>

          <div style={{ 
            fontSize: '12px', 
            color: '#ff7f00',
            background: '#fff7e6',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            ⚠️ 서비스 24시간 전 취소 시 무료, 당일 취소 시 예약금의 50%가 취소 수수료로 부과됩니다.
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              fill="outline" 
              onClick={() => setCancelModalVisible(false)}
              style={{ flex: 1 }}
            >
              취소
            </Button>
            <Button 
              color="danger"
              onClick={handleCancelOrder}
              loading={cancelOrderMutation.isPending}
              style={{ flex: 1 }}
            >
              주문 취소하기
            </Button>
          </div>
        </div>
      </Popup>

      {/* 완료 확인 팝업 */}
      <Popup 
        visible={completeModalVisible}
        onMaskClick={() => setCompleteModalVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            <h3 style={{ margin: 0, color: '#52c41a' }}>서비스 완료 확인</h3>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#8c8c8c',
              marginBottom: '12px'
            }}>
              서비스가 만족스럽게 완료되었나요? 완료 확인 후 리뷰를 작성해주세요.
            </div>
            
            <TextArea
              placeholder="서비스에 대한 간단한 소감이나 추가 의견을 남겨주세요 (선택사항)"
              value={completionNotes}
              onChange={setCompletionNotes}
              rows={3}
              maxLength={200}
              showCount
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              fill="outline" 
              onClick={() => setCompleteModalVisible(false)}
              style={{ flex: 1 }}
            >
              취소
            </Button>
            <Button 
              color="primary"
              onClick={handleCompleteOrder}
              loading={completeOrderMutation.isPending}
              style={{ flex: 1 }}
            >
              완료 확인
            </Button>
          </div>
        </div>
      </Popup>

    </div>
  );
};

export default OrderDetail;