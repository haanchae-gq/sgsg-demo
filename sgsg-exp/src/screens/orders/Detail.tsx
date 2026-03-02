import React, { useState } from 'react';
import { 
  NavBar, 
  Card, 
  Badge, 
  Button, 
  List, 
  Modal, 
  Form, 
  TextArea,
  ActionSheet,
  Toast,
  Divider
} from 'antd-mobile';
import { 
  LeftOutline,
  PhoneFill,
  MessageOutline,
  EnvironmentOutline,
  ClockCircleOutline,
  UserOutline,
  FileWrongOutline,
  CameraOutline
} from 'antd-mobile-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderStatusText, getOrderStatusColor, getPaymentStatusText } from '../../utils/status';
import { formatDateTime, formatCurrency, formatDate } from '../../utils/formatters';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import FileUploader from '../../components/FileUploader';
import './Detail.css';

interface OrderDetail {
  id: string;
  orderNumber: string;
  serviceItem: {
    id: string;
    name: string;
    category: {
      name: string;
    };
    price: number;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  expert?: {
    id: string;
    name: string;
  };
  address: {
    fullAddress: string;
    detailAddress?: string;
    latitude?: number;
    longitude?: number;
  };
  requestedDate: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  customerNotes?: string;
  expertNotes?: string;
  completedAt?: string;
  attachments?: string[];
  createdAt: string;
}

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [form] = Form.useForm();

  // 주문 상세 조회
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.data as OrderDetail;
    },
    enabled: !!orderId
  });

  // 주문 상태 업데이트
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      return await api.put(`/orders/${orderId}`, { 
        status, 
        expertNotes: notes 
      });
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '상태가 업데이트되었습니다' });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '상태 업데이트에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  // 주문 완료 처리
  const completeOrderMutation = useMutation({
    mutationFn: async (data: { notes: string; images: string[] }) => {
      return await api.put(`/orders/${orderId}`, {
        status: 'completed',
        expertNotes: data.notes,
        attachments: data.images,
        completedAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '주문이 완료되었습니다' });
      setCompleteModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '주문 완료 처리에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  const handleCall = () => {
    if (order?.customer.phone) {
      window.location.href = `tel:${order.customer.phone}`;
    }
  };

  const handleSMS = () => {
    if (order?.customer.phone) {
      const message = `안녕하세요, SGSG 전문가입니다. 주문번호 ${order.orderNumber} 관련하여 연락드립니다.`;
      window.location.href = `sms:${order.customer.phone}?body=${encodeURIComponent(message)}`;
    }
  };

  const handleMapView = () => {
    if (order?.address.latitude && order?.address.longitude) {
      const url = `https://map.naver.com/v5/search/${encodeURIComponent(order.address.fullAddress)}`;
      window.open(url, '_blank');
    } else {
      const url = `https://map.naver.com/v5/search/${encodeURIComponent(order.address.fullAddress)}`;
      window.open(url, '_blank');
    }
  };

  const getNextStatus = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'confirmed':
      case 'expert_assigned':
        return 'schedule_pending';
      case 'schedule_pending':
        return 'scheduled';
      case 'scheduled':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      default:
        return currentStatus;
    }
  };

  const getStatusButtonText = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'confirmed':
      case 'expert_assigned':
        return '일정 조정 시작';
      case 'schedule_pending':
        return '일정 확정';
      case 'scheduled':
        return '서비스 시작';
      case 'in_progress':
        return '서비스 완료';
      default:
        return '상태 변경';
    }
  };

  const canUpdateStatus = (status: string): boolean => {
    return ['confirmed', 'expert_assigned', 'schedule_pending', 'scheduled', 'in_progress'].includes(status);
  };

  const handleStatusUpdate = () => {
    if (!order) return;
    
    if (order.status === 'in_progress') {
      setCompleteModalVisible(true);
    } else {
      const nextStatus = getNextStatus(order.status);
      updateStatusMutation.mutate({ status: nextStatus });
    }
  };

  const handleCompleteSubmit = (values: any) => {
    completeOrderMutation.mutate({
      notes: values.notes || '',
      images: uploadedImages
    });
  };

  const contactActions = [
    { text: '전화 걸기', key: 'call' },
    { text: '문자 보내기', key: 'sms' },
    { text: '취소', key: 'cancel' }
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="주문 정보를 불러오는 중..." />;
  }

  if (!order) {
    return <div>주문을 찾을 수 없습니다</div>;
  }

  return (
    <div className="order-detail">
      <NavBar
        onBack={() => navigate(-1)}
        backIcon={<LeftOutline />}
        right={
          <Button
            fill="none"
            size="mini"
            onClick={() => setActionSheetVisible(true)}
          >
            연락
          </Button>
        }
      >
        주문 상세
      </NavBar>

      <div className="order-detail-content">
        {/* 주문 기본 정보 */}
        <Card className="order-info-card">
          <div className="order-header">
            <div>
              <div className="order-number">#{order.orderNumber}</div>
              <Badge 
                content={getOrderStatusText(order.status)}
                style={{ 
                  background: getOrderStatusColor(order.status),
                  fontSize: '11px',
                  marginTop: '4px'
                }}
              />
            </div>
            <div className="order-amount">{formatCurrency(order.totalAmount)}</div>
          </div>
          
          <Divider />
          
          <div className="service-info">
            <h3>{order.serviceItem.name}</h3>
            <div className="service-meta">
              <span>{order.serviceItem.category.name}</span>
              <span>•</span>
              <span>{formatCurrency(order.serviceItem.price)}</span>
            </div>
          </div>
        </Card>

        {/* 고객 정보 */}
        <Card className="customer-card">
          <List header="고객 정보">
            <List.Item
              prefix={<UserOutline />}
              description={order.customer.email}
              extra={
                <Button
                  size="small"
                  fill="outline"
                  onClick={() => setActionSheetVisible(true)}
                >
                  연락
                </Button>
              }
            >
              {order.customer.name}
            </List.Item>
          </List>
        </Card>

        {/* 서비스 정보 */}
        <Card className="service-card">
          <List header="서비스 정보">
            <List.Item
              prefix={<ClockCircleOutline />}
              description="예약 일시"
            >
              {formatDateTime(order.requestedDate)}
            </List.Item>
            
            <List.Item
              prefix={<EnvironmentOutline />}
              description={order.address.detailAddress}
              extra={
                <Button
                  size="small"
                  fill="outline"
                  onClick={handleMapView}
                >
                  지도
                </Button>
              }
            >
              {order.address.fullAddress}
            </List.Item>
          </List>
        </Card>

        {/* 특별 요청사항 */}
        {order.customerNotes && (
          <Card className="notes-card">
            <h4>고객 요청사항</h4>
            <div className="notes-content">{order.customerNotes}</div>
          </Card>
        )}

        {/* 전문가 메모 */}
        {order.expertNotes && (
          <Card className="notes-card">
            <h4>진행 메모</h4>
            <div className="notes-content">{order.expertNotes}</div>
          </Card>
        )}

        {/* 완료 사진 */}
        {order.attachments && order.attachments.length > 0 && (
          <Card className="attachments-card">
            <h4>완료 사진</h4>
            <div className="attachment-grid">
              {order.attachments.map((url, index) => (
                <img key={index} src={url} alt={`완료 사진 ${index + 1}`} />
              ))}
            </div>
          </Card>
        )}

        {/* 상태 업데이트 버튼 */}
        {canUpdateStatus(order.status) && (
          <div className="action-buttons">
            <Button
              block
              color="primary"
              size="large"
              onClick={handleStatusUpdate}
              loading={updateStatusMutation.isPending || completeOrderMutation.isPending}
            >
              {getStatusButtonText(order.status)}
            </Button>
          </div>
        )}
      </div>

      {/* 연락 액션시트 */}
      <ActionSheet
        visible={actionSheetVisible}
        actions={contactActions}
        onClose={() => setActionSheetVisible(false)}
        onAction={(action) => {
          if (action.key === 'call') {
            handleCall();
          } else if (action.key === 'sms') {
            handleSMS();
          }
          setActionSheetVisible(false);
        }}
      />

      {/* 완료 처리 모달 */}
      <Modal
        visible={completeModalVisible}
        title="서비스 완료"
        onClose={() => setCompleteModalVisible(false)}
        content={
          <Form
            form={form}
            onFinish={handleCompleteSubmit}
            layout="vertical"
          >
            <Form.Item name="notes" label="완료 메모">
              <TextArea
                placeholder="서비스 완료 내용을 입력하세요"
                rows={3}
              />
            </Form.Item>

            <Form.Item label="완료 사진">
              <FileUploader
                accept="image/*"
                multiple
                maxFiles={5}
                category="image"
                onUpload={setUploadedImages}
                onError={(error) => Toast.show({ icon: 'fail', content: error })}
              />
            </Form.Item>

            <div className="modal-actions">
              <Button
                fill="outline"
                onClick={() => setCompleteModalVisible(false)}
              >
                취소
              </Button>
              <Button
                color="primary"
                type="submit"
                loading={completeOrderMutation.isPending}
              >
                완료 처리
              </Button>
            </div>
          </Form>
        }
      />
    </div>
  );
};

export default OrderDetail;