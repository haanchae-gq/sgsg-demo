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
  Popconfirm,
  Image,
  Rate,
  Input,
  Form,
  Alert
} from 'antd';
import { 
  EyeOutlined, 
  UserOutlined, 
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  StopOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import FilterForm from '../../components/common/FilterForm';
import apiService from '../../services/api';
import { 
  formatDate,
  formatDateTime, 
  formatCurrency, 
  formatNumber,
  formatRelativeTime 
} from '../../utils/formatters';
import type { Expert, ExpertFilterForm } from '../../types';

const { TextArea } = Input;

const Experts: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<ExpertFilterForm>({});
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalForm] = Form.useForm();

  const filterFields = [
    {
      name: 'search',
      label: '검색',
      type: 'input' as const,
      placeholder: '이름, 사업자명, 이메일로 검색',
    },
    {
      name: 'status',
      label: '승인 상태',
      type: 'select' as const,
      options: [
        { label: '승인 대기', value: 'pending' },
        { label: '승인됨', value: 'approved' },
        { label: '거부됨', value: 'rejected' },
        { label: '정지됨', value: 'suspended' },
      ],
    },
    {
      name: 'operatingStatus',
      label: '운영 상태',
      type: 'select' as const,
      options: [
        { label: '온라인', value: 'online' },
        { label: '오프라인', value: 'offline' },
        { label: '바쁨', value: 'busy' },
      ],
    },
    {
      name: 'dateRange',
      label: '신청일',
      type: 'dateRange' as const,
    },
  ];

  const fetchExperts = async (page = 1, pageSize = 20, filterParams = filters) => {
    try {
      setLoading(true);
      const response = await apiService.getExperts({
        page,
        limit: pageSize,
        ...filterParams,
      });

      setExperts(response.data.items || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total || 0,
      });
    } catch (error) {
      message.error('전문가 목록을 불러오는데 실패했습니다.');
      console.error('Fetch experts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (values: ExpertFilterForm) => {
    setFilters(values);
    fetchExperts(1, pagination.pageSize, values);
  };

  const handleResetFilter = () => {
    setFilters({});
    fetchExperts(1, pagination.pageSize, {});
  };

  const handleTableChange = (paginationParams: any) => {
    fetchExperts(paginationParams.current, paginationParams.pageSize, filters);
  };

  const handleViewExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setDetailModalVisible(true);
  };

  const handleApprovalProcess = (expert: Expert) => {
    setSelectedExpert(expert);
    setApprovalModalVisible(true);
    approvalForm.resetFields();
  };

  const handleApprove = async () => {
    try {
      const values = await approvalForm.validateFields();
      await apiService.approveExpert(selectedExpert!.id, values.notes);
      message.success('전문가가 승인되었습니다.');
      setApprovalModalVisible(false);
      fetchExperts(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('승인 처리에 실패했습니다.');
      console.error('Approve expert error:', error);
    }
  };

  const handleReject = async () => {
    try {
      const values = await approvalForm.validateFields();
      if (!values.reason) {
        message.error('거부 사유를 입력해주세요.');
        return;
      }
      await apiService.rejectExpert(selectedExpert!.id, values.reason);
      message.success('전문가 신청이 거부되었습니다.');
      setApprovalModalVisible(false);
      fetchExperts(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('거부 처리에 실패했습니다.');
      console.error('Reject expert error:', error);
    }
  };

  const getStatusColor = (status: Expert['status']) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'suspended': return 'volcano';
      default: return 'default';
    }
  };

  const getStatusText = (status: Expert['status']) => {
    switch (status) {
      case 'pending': return '승인 대기';
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'suspended': return '정지됨';
      default: return status;
    }
  };

  const getOperatingStatusColor = (status: Expert['operatingStatus']) => {
    switch (status) {
      case 'online': return 'green';
      case 'offline': return 'default';
      case 'busy': return 'orange';
      default: return 'default';
    }
  };

  const getOperatingStatusText = (status: Expert['operatingStatus']) => {
    switch (status) {
      case 'online': return '온라인';
      case 'offline': return '오프라인';
      case 'busy': return '바쁨';
      default: return status;
    }
  };

  // Show pending experts first
  const sortedExperts = [...experts].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  const columns = [
    {
      title: '전문가 정보',
      key: 'expertInfo',
      width: 200,
      render: (_, record: Expert) => (
        <Space size={12}>
          <Avatar 
            size={40} 
            src={record.profileImage} 
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: '500' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.businessName}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '사업자 정보',
      key: 'businessInfo',
      width: 150,
      render: (_, record: Expert) => (
        <div>
          <div style={{ fontSize: '13px' }}>{record.businessNumber}</div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
            {record.email}
          </div>
        </div>
      ),
    },
    {
      title: '평점',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      align: 'center' as const,
      render: (rating: number) => (
        <div>
          <Rate disabled defaultValue={rating} style={{ fontSize: '12px' }} />
          <div style={{ fontSize: '11px', marginTop: '2px' }}>
            {rating.toFixed(1)}
          </div>
        </div>
      ),
    },
    {
      title: '완료 주문',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ fontWeight: '500' }}>
          {formatNumber(count)}건
        </span>
      ),
    },
    {
      title: '총 수익',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ fontWeight: '500' }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '승인 상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: Expert['status']) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '운영 상태',
      dataIndex: 'operatingStatus',
      key: 'operatingStatus',
      width: 80,
      align: 'center' as const,
      render: (status: Expert['operatingStatus']) => (
        <Tag color={getOperatingStatusColor(status)}>
          {getOperatingStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '신청일',
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
      render: (_, record: Expert) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewExpert(record)}
            title="상세 정보"
          />
          {record.status === 'pending' && (
            <Button
              type="text"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleApprovalProcess(record)}
              title="승인 처리"
              style={{ color: '#1890ff' }}
            />
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchExperts();
  }, []);

  return (
    <div>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '24px' 
      }}>
        전문가 관리
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
          dataSource={sortedExperts}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Expert Detail Modal */}
      <Modal
        title="전문가 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedExpert && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="이름" span={1}>
                {selectedExpert.name}
              </Descriptions.Item>
              <Descriptions.Item label="승인 상태" span={1}>
                <Tag color={getStatusColor(selectedExpert.status)}>
                  {getStatusText(selectedExpert.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="사업자명" span={2}>
                {selectedExpert.businessName}
              </Descriptions.Item>
              <Descriptions.Item label="사업자 등록번호" span={1}>
                {selectedExpert.businessNumber}
              </Descriptions.Item>
              <Descriptions.Item label="연락처" span={1}>
                {selectedExpert.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="이메일" span={2}>
                {selectedExpert.email}
              </Descriptions.Item>
              <Descriptions.Item label="평점" span={1}>
                <Rate disabled defaultValue={selectedExpert.rating} style={{ fontSize: '14px' }} />
                <span style={{ marginLeft: '8px' }}>{selectedExpert.rating.toFixed(1)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="완료 주문" span={1}>
                {formatNumber(selectedExpert.completedOrders)}건
              </Descriptions.Item>
              <Descriptions.Item label="총 수익" span={1}>
                {formatCurrency(selectedExpert.totalEarnings)}
              </Descriptions.Item>
              <Descriptions.Item label="운영 상태" span={1}>
                <Tag color={getOperatingStatusColor(selectedExpert.operatingStatus)}>
                  {getOperatingStatusText(selectedExpert.operatingStatus)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="신청일" span={1}>
                {formatDateTime(selectedExpert.createdAt)}
              </Descriptions.Item>
              {selectedExpert.approvedAt && (
                <Descriptions.Item label="승인일" span={1}>
                  {formatDateTime(selectedExpert.approvedAt)}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedExpert.portfolio && selectedExpert.portfolio.length > 0 && (
              <div>
                <h4>포트폴리오</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedExpert.portfolio.map(item => (
                    <Card key={item.id} size="small" cover={
                      item.images[0] && <Image src={item.images[0]} height={120} />
                    }>
                      <Card.Meta 
                        title={<span style={{ fontSize: '14px' }}>{item.title}</span>}
                        description={
                          <div style={{ fontSize: '12px' }}>
                            {item.description}
                            <p style={{ margin: '4px 0 0 0', color: '#8c8c8c' }}>
                              {formatDate(item.completedAt)}
                            </p>
                          </div>
                        }
                      />
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        title={`전문가 승인 처리 - ${selectedExpert?.name}`}
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApprovalModalVisible(false)}>
            취소
          </Button>,
          <Button key="reject" danger onClick={handleReject}>
            거부
          </Button>,
          <Button key="approve" type="primary" onClick={handleApprove}>
            승인
          </Button>,
        ]}
        width={600}
      >
        {selectedExpert && (
          <div>
            <Alert
              message="전문가 승인 처리"
              description="사업자 등록증과 포트폴리오를 검토한 후 승인 여부를 결정해주세요."
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={approvalForm} layout="vertical">
              <Form.Item 
                name="notes" 
                label="승인 메모 (선택사항)"
              >
                <TextArea 
                  rows={3} 
                  placeholder="승인과 관련된 메모를 작성해주세요..."
                />
              </Form.Item>
              
              <Form.Item
                name="reason"
                label="거부 사유 (거부 시 필수)"
                rules={[
                  { 
                    required: false,
                    message: '거부 사유를 입력해주세요.' 
                  }
                ]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="거부 시 사유를 입력해주세요..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Experts;