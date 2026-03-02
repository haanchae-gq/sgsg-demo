import React, { useState } from 'react';
import { 
  NavBar, 
  Card, 
  Rate, 
  Tabs, 
  List, 
  Badge, 
  Button,
  Modal,
  Form,
  TextArea,
  Empty,
  ProgressBar
} from 'antd-mobile';
import { 
  LeftOutline,
  StarFill,
  StarOutline,
  MessageOutline,
  UserOutline,
  CalendarOutline
} from 'antd-mobile-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import api from '../../services/api';
import './Reviews.css';

interface Review {
  id: string;
  orderId: string;
  order: {
    orderNumber: string;
    serviceItem: {
      name: string;
      category: {
        name: string;
      };
    };
  };
  customer: {
    id: string;
    name: string;
    profileImage?: string;
  };
  rating: number;
  content?: string;
  images?: string[];
  response?: string;
  createdAt: string;
  respondedAt?: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const Reviews: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [form] = Form.useForm();

  // 리뷰 목록 조회
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', 'expert'],
    queryFn: async () => {
      const response = await api.get('/reviews/expert/me');
      return response.data.data.items as Review[];
    }
  });

  // 리뷰 통계 조회
  const { data: stats } = useQuery({
    queryKey: ['reviews', 'stats'],
    queryFn: async () => {
      const response = await api.get('/reviews/expert/me/stats');
      return response.data.data as ReviewStats;
    }
  });

  // 리뷰 응답 작성
  const respondMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      return await api.post(`/reviews/${reviewId}/response`, { response });
    },
    onSuccess: () => {
      setResponseModalVisible(false);
      setSelectedReview(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    }
  });

  const getFilteredReviews = () => {
    if (!reviews) return [];
    
    switch (activeTab) {
      case 'all':
        return reviews;
      case 'responded':
        return reviews.filter(review => review.response);
      case 'pending':
        return reviews.filter(review => !review.response);
      case 'high':
        return reviews.filter(review => review.rating >= 4);
      case 'low':
        return reviews.filter(review => review.rating <= 3);
      default:
        return reviews;
    }
  };

  const handleResponse = (review: Review) => {
    setSelectedReview(review);
    if (review.response) {
      form.setFieldsValue({ response: review.response });
    }
    setResponseModalVisible(true);
  };

  const handleResponseSubmit = (values: any) => {
    if (!selectedReview) return;
    respondMutation.mutate({
      reviewId: selectedReview.id,
      response: values.response
    });
  };

  const renderStarDistribution = () => {
    if (!stats) return null;

    const { ratingDistribution, totalReviews } = stats;

    return (
      <Card className="star-distribution-card">
        <h4>별점 분포</h4>
        <div className="distribution-list">
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingDistribution[star as keyof typeof ratingDistribution] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={star} className="distribution-item">
                <div className="star-label">
                  <span>{star}</span>
                  <StarFill />
                </div>
                <ProgressBar 
                  percent={percentage} 
                  style={{ 
                    '--fill-color': star >= 4 ? '#52c41a' : star >= 3 ? '#fa8c16' : '#ff4d4f'
                  }}
                />
                <span className="count">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} className="review-card">
      <div className="review-header">
        <div className="customer-info">
          <div className="customer-avatar">
            {review.customer.profileImage ? (
              <img src={review.customer.profileImage} alt={review.customer.name} />
            ) : (
              <UserOutline />
            )}
          </div>
          <div className="customer-details">
            <div className="customer-name">{review.customer.name}</div>
            <div className="review-date">{formatRelativeTime(review.createdAt)}</div>
          </div>
        </div>
        <div className="review-rating">
          <Rate value={review.rating} readOnly />
        </div>
      </div>

      <div className="review-service">
        <span className="service-category">{review.order.serviceItem.category.name}</span>
        <span>•</span>
        <span className="service-name">{review.order.serviceItem.name}</span>
        <span>•</span>
        <span className="order-number">#{review.order.orderNumber}</span>
      </div>

      {review.content && (
        <div className="review-content">
          {review.content}
        </div>
      )}

      {review.images && review.images.length > 0 && (
        <div className="review-images">
          {review.images.map((image, index) => (
            <img key={index} src={image} alt={`리뷰 이미지 ${index + 1}`} />
          ))}
        </div>
      )}

      {review.response && (
        <div className="review-response">
          <div className="response-header">
            <MessageOutline />
            <span>내 답변</span>
            <span className="response-date">{formatDate(review.respondedAt!)}</span>
          </div>
          <div className="response-content">{review.response}</div>
        </div>
      )}

      <div className="review-actions">
        <Button
          size="small"
          fill={review.response ? "outline" : "solid"}
          color={review.response ? "default" : "primary"}
          onClick={() => handleResponse(review)}
        >
          {review.response ? '답변 수정' : '답변 작성'}
        </Button>
      </div>
    </Card>
  );

  const tabItems = [
    { key: 'all', title: `전체 ${reviews?.length || 0}` },
    { key: 'pending', title: `미답변 ${reviews?.filter(r => !r.response).length || 0}` },
    { key: 'responded', title: `답변완료 ${reviews?.filter(r => r.response).length || 0}` },
    { key: 'high', title: `긍정적 ${reviews?.filter(r => r.rating >= 4).length || 0}` },
    { key: 'low', title: `개선필요 ${reviews?.filter(r => r.rating <= 3).length || 0}` }
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="reviews-screen">
      <NavBar
        onBack={() => navigate(-1)}
        backIcon={<LeftOutline />}
      >
        받은 리뷰
      </NavBar>

      <div className="reviews-content">
        {/* 리뷰 통계 */}
        {stats && (
          <Card className="stats-card">
            <div className="stats-header">
              <div className="average-rating">
                <div className="rating-number">{stats.averageRating.toFixed(1)}</div>
                <Rate value={stats.averageRating} readOnly allowHalf />
                <div className="total-reviews">총 {stats.totalReviews}개 리뷰</div>
              </div>
            </div>
          </Card>
        )}

        {/* 별점 분포 */}
        {renderStarDistribution()}

        {/* 리뷰 탭 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="reviews-tabs"
        >
          {tabItems.map(tab => (
            <Tabs.Tab title={tab.title} key={tab.key}>
              <div className="reviews-list">
                {getFilteredReviews().length === 0 ? (
                  <Empty
                    description="해당하는 리뷰가 없습니다"
                    imageStyle={{ width: 128 }}
                  />
                ) : (
                  getFilteredReviews().map(renderReviewCard)
                )}
              </div>
            </Tabs.Tab>
          ))}
        </Tabs>
      </div>

      {/* 답변 작성/수정 모달 */}
      <Modal
        visible={responseModalVisible}
        title={selectedReview?.response ? "답변 수정" : "답변 작성"}
        onClose={() => setResponseModalVisible(false)}
        content={
          <Form
            form={form}
            onFinish={handleResponseSubmit}
            layout="vertical"
          >
            <Form.Item 
              name="response" 
              label="답변 내용"
              rules={[{ required: true, message: '답변을 입력하세요' }]}
            >
              <TextArea
                placeholder="고객에게 감사 인사와 함께 정중한 답변을 작성하세요"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <div className="modal-actions">
              <Button
                fill="outline"
                onClick={() => setResponseModalVisible(false)}
              >
                취소
              </Button>
              <Button
                color="primary"
                type="submit"
                loading={respondMutation.isPending}
              >
                {selectedReview?.response ? '수정' : '답변 등록'}
              </Button>
            </div>
          </Form>
        }
      />
    </div>
  );
};

export default Reviews;