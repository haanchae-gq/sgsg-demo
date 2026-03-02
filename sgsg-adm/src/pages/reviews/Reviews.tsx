import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Avatar, 
  Button, 
  Space, 
  Modal, 
  Form,
  Input,
  Rate,
  Descriptions,
  message,
  Checkbox,
  Dropdown,
  Menu,
  Image,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import { 
  EyeOutlined, 
  UserOutlined, 
  CheckOutlined,
  CloseOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  DownOutlined
} from '@ant-design/icons';
import FilterForm from '../../components/common/FilterForm';
import apiService from '../../services/api';
import { 
  formatDateTime, 
  formatRelativeTime
} from '../../utils/formatters';
import type { Review } from '../../types';

const { TextArea } = Input;

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  reportedReviews: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [moderationModalVisible, setModerationModalVisible] = useState(false);
  const [moderationForm] = Form.useForm();
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    pendingReviews: 0,
    reportedReviews: 0,
    ratingDistribution: []
  });

  const filterFields = [
    {
      name: 'search',
      label: '검색',
      type: 'input' as const,
      placeholder: '고객명, 전문가명, 리뷰 내용으로 검색',
    },
    {
      name: 'status',
      label: '상태',
      type: 'select' as const,
      options: [
        { label: '승인 대기', value: 'pending' },
        { label: '승인됨', value: 'approved' },
        { label: '거부됨', value: 'rejected' },
        { label: '신고됨', value: 'reported' },
      ],
    },
    {
      name: 'rating',
      label: '평점',
      type: 'select' as const,
      options: [
        { label: '5점', value: '5' },
        { label: '4점', value: '4' },
        { label: '3점', value: '3' },
        { label: '2점', value: '2' },
        { label: '1점', value: '1' },
      ],
    },
    {
      name: 'dateRange',
      label: '작성일',
      type: 'dateRange' as const,
    },
  ];

  const fetchReviews = async (page = 1, pageSize = 20, filterParams = filters) => {
    try {
      setLoading(true);
      const response = await apiService.getReviews({
        page,
        limit: pageSize,
        ...filterParams,
      });

      setReviews(response.data.items || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total || 0,
      });

      // Calculate statistics
      calculateStats(response.data.items || []);
    } catch (error) {
      message.error('리뷰 목록을 불러오는데 실패했습니다.');
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewList: Review[]) => {
    const pending = reviewList.filter(r => r.status === 'pending').length;
    const reported = reviewList.filter(r => r.status === 'reported').length;
    const avgRating = reviewList.length > 0 
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length 
      : 0;

    // Rating distribution
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = reviewList.filter(r => r.rating === rating).length;
      return {
        rating,
        count,
        percentage: reviewList.length > 0 ? (count / reviewList.length) * 100 : 0
      };
    });

    setStats({
      totalReviews: reviewList.length,
      averageRating: avgRating,
      pendingReviews: pending,
      reportedReviews: reported,
      ratingDistribution: distribution
    });
  };

  const handleFilter = (values: any) => {
    setFilters(values);
    fetchReviews(1, pagination.pageSize, values);
  };

  const handleResetFilter = () => {
    setFilters({});
    fetchReviews(1, pagination.pageSize, {});
  };

  const handleTableChange = (paginationParams: any) => {
    fetchReviews(paginationParams.current, paginationParams.pageSize, filters);
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setDetailModalVisible(true);
  };

  const handleModerateReview = (review: Review, action: 'approve' | 'reject') => {
    setSelectedReview(review);
    moderationForm.resetFields();
    moderationForm.setFieldsValue({ action });
    setModerationModalVisible(true);
  };

  const handleModerationSubmit = async () => {
    try {
      const values = await moderationForm.validateFields();
      if (!selectedReview) return;

      if (values.action === 'approve') {
        await apiService.approveReview(selectedReview.id);
        message.success('리뷰가 승인되었습니다.');
      } else {
        const reason = values.reason || '관리자 검토 결과 부적절한 내용';
        await apiService.rejectReview(selectedReview.id, reason);
        message.success('리뷰가 거부되었습니다.');
      }

      setModerationModalVisible(false);
      fetchReviews(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('리뷰 처리에 실패했습니다.');
      console.error('Moderation error:', error);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedReviews.length === 0) {
      message.warning('리뷰를 선택해주세요.');
      return;
    }

    try {
      await Promise.all(
        selectedReviews.map(reviewId => apiService.approveReview(reviewId))
      );
      message.success(`${selectedReviews.length}개 리뷰가 승인되었습니다.`);
      setSelectedReviews([]);
      fetchReviews(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('일괄 승인에 실패했습니다.');
      console.error('Batch approve error:', error);
    }
  };

  const handleBatchReject = async () => {
    if (selectedReviews.length === 0) {
      message.warning('리뷰를 선택해주세요.');
      return;
    }

    try {
      await Promise.all(
        selectedReviews.map(reviewId => 
          apiService.rejectReview(reviewId, '관리자 일괄 검토 결과 부적절한 내용')
        )
      );
      message.success(`${selectedReviews.length}개 리뷰가 거부되었습니다.`);
      setSelectedReviews([]);
      fetchReviews(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('일괄 거부에 실패했습니다.');
      console.error('Batch reject error:', error);
    }
  };

  const batchActionsMenu = (
    <Menu>
      <Menu.Item key="approve" onClick={handleBatchApprove}>
        <CheckOutlined /> 일괄 승인
      </Menu.Item>
      <Menu.Item key="reject" onClick={handleBatchReject}>
        <CloseOutlined style={{ color: '#ff4d4f' }} /> 일괄 거부
      </Menu.Item>
    </Menu>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'reported': return 'volcano';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '승인 대기';
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'reported': return '신고됨';
      default: return status;
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedReviews.length === reviews.length && reviews.length > 0}
          indeterminate={selectedReviews.length > 0 && selectedReviews.length < reviews.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedReviews(reviews.map(review => review.id));
            } else {
              setSelectedReviews([]);
            }
          }}
        />
      ),
      key: 'checkbox',
      width: 50,
      render: (_, record: Review) => (
        <Checkbox
          checked={selectedReviews.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedReviews([...selectedReviews, record.id]);
            } else {
              setSelectedReviews(selectedReviews.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: '고객',
      key: 'customer',
      width: 120,
      render: (_, record: Review) => (
        <Space size={8}>
          <Avatar 
            size={24} 
            src={record.customer?.profileImage} 
            icon={<UserOutlined />}
          />
          <span>{record.customer?.name || '정보 없음'}</span>
        </Space>
      ),
    },
    {
      title: '전문가',
      key: 'expert',
      width: 120,
      render: (_, record: Review) => record.expert?.name || '정보 없음',
    },
    {
      title: '평점',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      align: 'center' as const,
      render: (rating: number) => (
        <div>
          <Rate disabled defaultValue={rating} style={{ fontSize: '14px' }} />
          <div style={{ fontSize: '11px', marginTop: '2px' }}>
            {rating}.0
          </div>
        </div>
      ),
    },
    {
      title: '리뷰 내용',
      key: 'content',
      ellipsis: true,
      render: (_, record: Review) => (
        <div>
          {record.title && (
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              {record.title}
            </div>
          )}
          <div style={{ color: '#8c8c8c' }}>
            {record.content || '내용 없음'}
          </div>
        </div>
      ),
    },
    {
      title: '이미지',
      key: 'images',
      width: 80,
      align: 'center' as const,
      render: (_, record: Review) => (
        record.images && record.images.length > 0 ? (
          <Image.PreviewGroup>
            <Image
              src={record.images[0]}
              width={40}
              height={40}
              style={{ borderRadius: '4px', objectFit: 'cover' }}
            />
          </Image.PreviewGroup>
        ) : (
          <span style={{ color: '#d9d9d9' }}>-</span>
        )
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '작성일',
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
      render: (_, record: Review) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewReview(record)}
            title="상세 정보"
          />
          {record.status === 'pending' && (
            <>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleModerateReview(record, 'approve')}
                title="승인"
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                danger
                onClick={() => handleModerateReview(record, 'reject')}
                title="거부"
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  // Sort reviews to show pending and reported first
  const sortedReviews = [...reviews].sort((a, b) => {
    const priorityOrder = { 'reported': 0, 'pending': 1, 'approved': 2, 'rejected': 3 };
    return (priorityOrder[a.status as keyof typeof priorityOrder] || 4) - 
           (priorityOrder[b.status as keyof typeof priorityOrder] || 4);
  });

  useEffect(() => {
    fetchReviews();
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
          리뷰 관리
        </h1>
        
        {selectedReviews.length > 0 && (
          <Dropdown overlay={batchActionsMenu} trigger={['click']}>
            <Button type="primary">
              선택된 {selectedReviews.length}개 처리 <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </div>

      {/* Review Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="평균 평점"
              value={stats.averageRating}
              precision={1}
              prefix={<StarOutlined />}
              suffix="/ 5.0"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="승인 대기 리뷰"
              value={stats.pendingReviews}
              prefix={<ExclamationCircleOutlined />}
              suffix="건"
              valueStyle={{ color: stats.pendingReviews > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="신고된 리뷰"
              value={stats.reportedReviews}
              prefix={<ExclamationCircleOutlined />}
              suffix="건"
              valueStyle={{ color: stats.reportedReviews > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Rating Distribution */}
      {stats.ratingDistribution.length > 0 && (
        <Card title="평점 분포" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            {stats.ratingDistribution.map(({ rating, count, percentage }) => (
              <Col key={rating} xs={24} sm={12} md={8} lg={4.8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <Rate disabled defaultValue={rating} character={<StarOutlined />} style={{ fontSize: '12px' }} />
                  </div>
                  <Progress
                    percent={percentage}
                    showInfo={false}
                    strokeColor="#faad14"
                    style={{ marginBottom: '4px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {count}건 ({percentage.toFixed(1)}%)
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <FilterForm
        fields={filterFields}
        onFilter={handleFilter}
        onReset={handleResetFilter}
        loading={loading}
      />

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={sortedReviews}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${total}건`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Review Detail Modal */}
      <Modal
        title="리뷰 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedReview && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="고객명">
                {selectedReview.customer?.name || '정보 없음'}
              </Descriptions.Item>
              <Descriptions.Item label="전문가명">
                {selectedReview.expert?.name || '정보 없음'}
              </Descriptions.Item>
              
              <Descriptions.Item label="평점" span={2}>
                <Rate disabled defaultValue={selectedReview.rating} style={{ fontSize: '16px' }} />
                <span style={{ marginLeft: '8px' }}>{selectedReview.rating}.0</span>
              </Descriptions.Item>
              
              <Descriptions.Item label="상태">
                <Tag color={getStatusColor(selectedReview.status)}>
                  {getStatusText(selectedReview.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="작성일">
                {formatDateTime(selectedReview.createdAt)}
              </Descriptions.Item>
              
              {selectedReview.title && (
                <Descriptions.Item label="제목" span={2}>
                  {selectedReview.title}
                </Descriptions.Item>
              )}
              
              {selectedReview.content && (
                <Descriptions.Item label="내용" span={2}>
                  {selectedReview.content}
                </Descriptions.Item>
              )}
              
              {selectedReview.moderatorNotes && (
                <Descriptions.Item label="관리자 노트" span={2}>
                  {selectedReview.moderatorNotes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedReview.images && selectedReview.images.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4>첨부 이미지</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                  gap: '8px' 
                }}>
                  {selectedReview.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      width="100%"
                      height={80}
                      style={{ objectFit: 'cover', borderRadius: '6px' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Moderation Modal */}
      <Modal
        title="리뷰 검토"
        open={moderationModalVisible}
        onCancel={() => setModerationModalVisible(false)}
        onOk={handleModerationSubmit}
        width={500}
      >
        {selectedReview && (
          <div>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f5f5f5', 
              marginBottom: '16px', 
              borderRadius: '6px' 
            }}>
              <div><strong>고객:</strong> {selectedReview.customer?.name}</div>
              <div><strong>전문가:</strong> {selectedReview.expert?.name}</div>
              <div><strong>평점:</strong> <Rate disabled defaultValue={selectedReview.rating} style={{ fontSize: '12px' }} /></div>
              {selectedReview.content && (
                <div style={{ marginTop: '8px' }}>
                  <strong>내용:</strong> {selectedReview.content}
                </div>
              )}
            </div>
            
            <Form form={moderationForm} layout="vertical">
              <Form.Item name="action" label="처리 방법" style={{ display: 'none' }}>
                <Input />
              </Form.Item>
              
              <Form.Item
                name="reason"
                label="거부 사유 (거부 시 입력)"
              >
                <TextArea
                  rows={3}
                  placeholder="리뷰 거부 시 사유를 입력해주세요..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reviews;