import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Avatar, 
  Button, 
  Space, 
  Modal, 
  Descriptions,
  message,
  Popconfirm
} from 'antd';
import { 
  EyeOutlined, 
  UserOutlined, 
  StopOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import FilterForm from '../../components/common/FilterForm';
import apiService from '../../services/api';
import { 
  formatDateTime, 
  formatCurrency, 
  formatNumber,
  formatRelativeTime 
} from '../../utils/formatters';
import type { Customer, CustomerFilterForm } from '../../types';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<CustomerFilterForm>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const filterFields = [
    {
      name: 'search',
      label: '검색',
      type: 'input' as const,
      placeholder: '이름, 이메일, 전화번호로 검색',
    },
    {
      name: 'status',
      label: '상태',
      type: 'select' as const,
      options: [
        { label: '활성', value: 'active' },
        { label: '비활성', value: 'inactive' },
        { label: '정지', value: 'suspended' },
      ],
    },
    {
      name: 'dateRange',
      label: '가입일',
      type: 'dateRange' as const,
    },
  ];

  const fetchCustomers = async (page = 1, pageSize = 20, filterParams = filters) => {
    try {
      setLoading(true);
      const response = await apiService.getCustomers({
        page,
        limit: pageSize,
        ...filterParams,
      });

      setCustomers(response.data.items || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total || 0,
      });
    } catch (error) {
      message.error('고객 목록을 불러오는데 실패했습니다.');
      console.error('Fetch customers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (values: CustomerFilterForm) => {
    setFilters(values);
    fetchCustomers(1, pagination.pageSize, values);
  };

  const handleResetFilter = () => {
    setFilters({});
    fetchCustomers(1, pagination.pageSize, {});
  };

  const handleTableChange = (paginationParams: any) => {
    fetchCustomers(paginationParams.current, paginationParams.pageSize, filters);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailModalVisible(true);
  };

  const handleChangeStatus = async (customerId: string, newStatus: Customer['status']) => {
    try {
      await apiService.updateCustomerStatus(customerId, newStatus);
      message.success('고객 상태가 변경되었습니다.');
      fetchCustomers(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('상태 변경에 실패했습니다.');
      console.error('Change status error:', error);
    }
  };

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'orange';
      case 'suspended': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: Customer['status']) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'suspended': return '정지';
      default: return status;
    }
  };

  const columns = [
    {
      title: '고객 정보',
      key: 'customerInfo',
      width: 200,
      render: (_, record: Customer) => (
        <Space size={12}>
          <Avatar 
            size={40} 
            src={record.profileImage} 
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: '500' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone: string) => phone || '-',
    },
    {
      title: '주문 건수',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ fontWeight: '500' }}>
          {formatNumber(count)}건
        </span>
      ),
    },
    {
      title: '총 결제 금액',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ fontWeight: '500' }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center' as const,
      render: (status: Customer['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '가입일',
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
      width: 150,
      align: 'center' as const,
      render: (_, record: Customer) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCustomer(record)}
            title="상세 정보"
          />
          {record.status === 'active' ? (
            <Popconfirm
              title="정말 이 고객을 정지하시겠습니까?"
              onConfirm={() => handleChangeStatus(record.id, 'suspended')}
              okText="예"
              cancelText="아니요"
            >
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                title="정지"
                style={{ color: '#ff4d4f' }}
              />
            </Popconfirm>
          ) : record.status === 'suspended' ? (
            <Popconfirm
              title="이 고객을 활성화하시겠습니까?"
              onConfirm={() => handleChangeStatus(record.id, 'active')}
              okText="예"
              cancelText="아니요"
            >
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                title="활성화"
                style={{ color: '#52c41a' }}
              />
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '24px' 
      }}>
        고객 관리
      </h1>

      <FilterForm
        fields={filterFields}
        onFilter={handleFilter}
        onReset={handleResetFilter}
        loading={loading}
      />

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={customers}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${formatNumber(total)}명`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="고객 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedCustomer && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="이름" span={1}>
              {selectedCustomer.name}
            </Descriptions.Item>
            <Descriptions.Item label="상태" span={1}>
              <Tag color={getStatusColor(selectedCustomer.status)}>
                {getStatusText(selectedCustomer.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="이메일" span={2}>
              {selectedCustomer.email}
            </Descriptions.Item>
            <Descriptions.Item label="연락처" span={2}>
              {selectedCustomer.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="총 주문 건수" span={1}>
              {formatNumber(selectedCustomer.totalOrders)}건
            </Descriptions.Item>
            <Descriptions.Item label="총 결제 금액" span={1}>
              {formatCurrency(selectedCustomer.totalSpent)}
            </Descriptions.Item>
            <Descriptions.Item label="가입일" span={1}>
              {formatDateTime(selectedCustomer.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="최근 접속" span={1}>
              {formatRelativeTime(selectedCustomer.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Customers;