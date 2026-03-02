import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Avatar, 
  Button, 
  Space, 
  Tabs,
  Modal, 
  Descriptions,
  message,
  Dropdown,
  Menu,
  Badge,
  Select,
  DatePicker,
  Checkbox
} from 'antd';
import { 
  EyeOutlined, 
  UserOutlined, 
  MoreOutlined,
  DownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import FilterForm from '../../components/common/FilterForm';
import apiService from '../../services/api';
import { 
  formatDateTime, 
  formatCurrency, 
  formatNumber,
  formatRelativeTime,
  getOrderStatusText,
  getOrderStatusColor,
  getPaymentStatusText,
  getPaymentStatusColor
} from '../../utils/formatters';
import type { Order, OrderFilterForm } from '../../types';

const { TabPane } = Tabs;
const { Option } = Select;

interface OrderStatus {
  key: string;
  label: string;
  count: number;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<OrderFilterForm>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [orderStatusCounts, setOrderStatusCounts] = useState<OrderStatus[]>([
    { key: 'all', label: '전체', count: 0 },
    { key: 'pending', label: '대기', count: 0 },
    { key: 'confirmed', label: '확정', count: 0 },
    { key: 'in_progress', label: '진행중', count: 0 },
    { key: 'completed', label: '완료', count: 0 },
    { key: 'cancelled', label: '취소', count: 0 },
  ]);

  const filterFields = [
    {
      name: 'search',
      label: '검색',
      type: 'input' as const,
      placeholder: '주문번호, 고객명, 서비스명으로 검색',
    },
    {
      name: 'paymentStatus',
      label: '결제 상태',
      type: 'select' as const,
      options: [
        { label: '미결제', value: 'unpaid' },
        { label: '선금 완료', value: 'deposit_paid' },
        { label: '잔금 완료', value: 'balance_paid' },
        { label: '환불됨', value: 'refunded' },
      ],
    },
    {
      name: 'dateRange',
      label: '주문일',
      type: 'dateRange' as const,
    },
  ];

  const fetchOrders = async (page = 1, pageSize = 20, filterParams = filters, status?: string) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        ...filterParams,
      };

      if (status && status !== 'all') {
        params.status = status;
      }

      const response = await apiService.getOrders(params);
      setOrders(response.data.items || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total || 0,
      });

      // Update tab counts - in real app, this would come from a separate API
      const statusCounts = await fetchOrderStatusCounts();
      setOrderStatusCounts(statusCounts);
    } catch (error) {
      message.error('주문 목록을 불러오는데 실패했습니다.');
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatusCounts = async (): Promise<OrderStatus[]> => {
    // This would be a real API call in production
    // For now, return mock counts
    return [
      { key: 'all', label: '전체', count: 0 },
      { key: 'pending', label: '대기', count: 0 },
      { key: 'confirmed', label: '확정', count: 0 },
      { key: 'in_progress', label: '진행중', count: 0 },
      { key: 'completed', label: '완료', count: 0 },
      { key: 'cancelled', label: '취소', count: 0 },
    ];
  };

  const handleFilter = (values: OrderFilterForm) => {
    setFilters(values);
    fetchOrders(1, pagination.pageSize, values, activeTab);
  };

  const handleResetFilter = () => {
    setFilters({});
    fetchOrders(1, pagination.pageSize, {}, activeTab);
  };

  const handleTableChange = (paginationParams: any) => {
    fetchOrders(paginationParams.current, paginationParams.pageSize, filters, activeTab);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedOrders([]);
    fetchOrders(1, pagination.pageSize, filters, key);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      message.success('주문 상태가 변경되었습니다.');
      fetchOrders(pagination.current, pagination.pageSize, filters, activeTab);
    } catch (error) {
      message.error('상태 변경에 실패했습니다.');
      console.error('Status change error:', error);
    }
  };

  const handleBatchStatusChange = async (status: string) => {
    if (selectedOrders.length === 0) {
      message.warning('주문을 선택해주세요.');
      return;
    }

    try {
      await Promise.all(
        selectedOrders.map(orderId => apiService.updateOrderStatus(orderId, status))
      );
      message.success(`${selectedOrders.length}개 주문의 상태가 변경되었습니다.`);
      setSelectedOrders([]);
      fetchOrders(pagination.current, pagination.pageSize, filters, activeTab);
    } catch (error) {
      message.error('일괄 상태 변경에 실패했습니다.');
      console.error('Batch status change error:', error);
    }
  };

  const batchActionsMenu = (
    <Menu>
      <Menu.Item key="confirm" onClick={() => handleBatchStatusChange('confirmed')}>
        <CheckCircleOutlined /> 확정 처리
      </Menu.Item>
      <Menu.Item key="start" onClick={() => handleBatchStatusChange('in_progress')}>
        <PlayCircleOutlined /> 진행 시작
      </Menu.Item>
      <Menu.Item key="complete" onClick={() => handleBatchStatusChange('completed')}>
        <CheckCircleOutlined /> 완료 처리
      </Menu.Item>
      <Menu.Item key="cancel" onClick={() => handleBatchStatusChange('cancelled')}>
        <StopOutlined style={{ color: '#ff4d4f' }} /> 취소 처리
      </Menu.Item>
    </Menu>
  );

  const orderActionsMenu = (record: Order) => (
    <Menu>
      {record.status === 'pending' && (
        <Menu.Item key="confirm" onClick={() => handleStatusChange(record.id, 'confirmed')}>
          <CheckCircleOutlined /> 확정
        </Menu.Item>
      )}
      {record.status === 'confirmed' && (
        <Menu.Item key="start" onClick={() => handleStatusChange(record.id, 'in_progress')}>
          <PlayCircleOutlined /> 진행 시작
        </Menu.Item>
      )}
      {record.status === 'in_progress' && (
        <Menu.Item key="complete" onClick={() => handleStatusChange(record.id, 'completed')}>
          <CheckCircleOutlined /> 완료
        </Menu.Item>
      )}
      {['pending', 'confirmed'].includes(record.status) && (
        <Menu.Item key="cancel" onClick={() => handleStatusChange(record.id, 'cancelled')}>
          <StopOutlined style={{ color: '#ff4d4f' }} /> 취소
        </Menu.Item>
      )}
    </Menu>
  );

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedOrders.length === orders.length && orders.length > 0}
          indeterminate={selectedOrders.length > 0 && selectedOrders.length < orders.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedOrders(orders.map(order => order.id));
            } else {
              setSelectedOrders([]);
            }
          }}
        />
      ),
      key: 'checkbox',
      width: 50,
      render: (_, record: Order) => (
        <Checkbox
          checked={selectedOrders.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedOrders([...selectedOrders, record.id]);
            } else {
              setSelectedOrders(selectedOrders.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: '주문 정보',
      key: 'orderInfo',
      width: 200,
      render: (_, record: Order) => (
        <div>
          <div style={{ fontWeight: '500', color: '#1890ff' }}>
            {record.orderNumber}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
            {record.service?.name || '서비스 정보 없음'}
          </div>
        </div>
      ),
    },
    {
      title: '고객',
      key: 'customer',
      width: 150,
      render: (_, record: Order) => (
        <Space size={8}>
          <Avatar 
            size={24} 
            src={record.customer?.profileImage} 
            icon={<UserOutlined />}
          />
          <span>{record.customer?.name || '고객 정보 없음'}</span>
        </Space>
      ),
    },
    {
      title: '전문가',
      key: 'expert',
      width: 120,
      render: (_, record: Order) => record.expert?.name || (
        <Tag icon={<ClockCircleOutlined />} color="orange">배정 대기</Tag>
      ),
    },
    {
      title: '금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ fontWeight: '500' }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '주문 상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={getOrderStatusColor(status)}>
          {getOrderStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '결제 상태',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '주문일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <div>
          <div>{formatDateTime(date).split(' ')[0]}</div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
            {formatRelativeTime(date)}
          </div>
        </div>
      ),
    },
    {
      title: '액션',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_, record: Order) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
            title="상세 정보"
          />
          {/* @ts-ignore */}
          <Dropdown overlay={orderActionsMenu(record)} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              title="더 보기"
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          margin: 0
        }}>
          주문 관리
        </h1>
        
        {selectedOrders.length > 0 && (
          <Dropdown overlay={batchActionsMenu} trigger={['click']}>
            <Button type="primary">
              선택된 {selectedOrders.length}개 일괄 처리 <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </div>

      <FilterForm
        fields={filterFields}
        onFilter={handleFilter}
        onReset={handleResetFilter}
        loading={loading}
      />

      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          {orderStatusCounts.map(status => (
            <TabPane
              tab={
                <Badge count={status.count} showZero>
                  <span>{status.label}</span>
                </Badge>
              }
              key={status.key}
            />
          ))}
        </Tabs>

        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${formatNumber(total)}건`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title="주문 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="주문번호" span={1}>
                <span style={{ fontWeight: '500', color: '#1890ff' }}>
                  {selectedOrder.orderNumber}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="주문일시" span={1}>
                {formatDateTime(selectedOrder.createdAt)}
              </Descriptions.Item>
              
              <Descriptions.Item label="고객명">
                {selectedOrder.customer?.name || '정보 없음'}
              </Descriptions.Item>
              <Descriptions.Item label="전문가">
                {selectedOrder.expert?.name || '배정 대기'}
              </Descriptions.Item>
              
              <Descriptions.Item label="서비스" span={2}>
                {selectedOrder.service?.name || '서비스 정보 없음'}
              </Descriptions.Item>
              
              <Descriptions.Item label="주문 상태">
                <Tag color={getOrderStatusColor(selectedOrder.status)}>
                  {getOrderStatusText(selectedOrder.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="결제 상태">
                <Tag color={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                  {getPaymentStatusText(selectedOrder.paymentStatus)}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="총 금액">
                <span style={{ fontWeight: '500', fontSize: '16px' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="예약금">
                {selectedOrder.depositAmount ? formatCurrency(selectedOrder.depositAmount) : '-'}
              </Descriptions.Item>
              
              {selectedOrder.scheduledAt && (
                <Descriptions.Item label="예정일시" span={2}>
                  {formatDateTime(selectedOrder.scheduledAt)}
                </Descriptions.Item>
              )}
              
              {selectedOrder.completedAt && (
                <Descriptions.Item label="완료일시" span={2}>
                  {formatDateTime(selectedOrder.completedAt)}
                </Descriptions.Item>
              )}
              
              {selectedOrder.notes && (
                <Descriptions.Item label="고객 요청사항" span={2}>
                  {selectedOrder.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;