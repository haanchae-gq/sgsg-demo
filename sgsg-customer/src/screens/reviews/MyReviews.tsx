import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Button,
  Tag,
  Rate,
  Image,
  Grid,
  Popup,
  TextArea,
  Empty,
  PullToRefresh,
  InfiniteScroll,
  Modal,
  Toast
} from 'antd-mobile';
import {
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  MessageOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Review } from '../../types';

const MyReviews: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);

  // 내 리뷰 목록 조회
  const {
    data: reviewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading
  } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      // 임시 데이터 (실제 구현에서는 API 호출)
      const mockReviews: (Review & { canEdit: boolean; canDelete: boolean })[] = [
        {
          id: '1',
          orderId: 'order1',
          order: {
            id: 'order1',
            orderNumber: 'ORD-20240228-001',
            serviceItemId: 'item1',
            serviceItem: {
              id: 'item1',
              categoryId: 'cat1',
              name: '정기 청소',
              description: '',
              basePrice: 150000,
              estimatedDuration: 180,
              isActive: true,
              tags: [],
              createdAt: '',
              updatedAt: ''
            },
            customerId: '',
            addressId: '',
            requestedDate: '',
            status: 'completed',
            totalAmount: 150000,
            depositAmount: 30000,
            balanceAmount: 120000,
            createdAt: '',
            updatedAt: ''
          },
          customerId: 'customer1',
          expertId: 'expert1',
          expert: {
            id: 'expert1',
            userId: 'user1',
            businessName: '깔끔한 청소 서비스',
            description: '',
            rating: 4.8,
            reviewCount: 342,
            completedOrderCount: 1250,
            isVerified: true,
            status: 'active',
            createdAt: '',
            updatedAt: ''
          },
          rating: 5,
          title: '정말 꼼꼼하게 청소해주셨어요!',
          content: '시간 약속도 정확히 지켜주시고, 청소도 정말 깨끗하게 해주셨습니다. 특히 화장실과 주방이 완전히 새것같이 변했어요. 다음에도 꼭 부탁드리고 싶어요!',
          images: ['/review1.jpg', '/review2.jpg'],
          expertReply: '정성스럽게 청소해드릴 수 있어서 기뻤습니다. 다음에도 만족스러운 서비스로 찾아뵙겠습니다!',
          expertRepliedAt: '2024-03-01T20:30:00Z',
          isHelpful: 12,
          isVisible: true,
          createdAt: '2024-02-29T14:30:00Z',
          updatedAt: '2024-02-29T14:30:00Z',
          canEdit: true, // 7일 이내
          canDelete: true
        },
        {
          id: '2',
          orderId: 'order2',
          order: {
            id: 'order2',
            orderNumber: 'ORD-20240215-002',
            serviceItemId: 'item2',
            serviceItem: {
              id: 'item2',
              categoryId: 'cat1',
              name: '대청소',
              description: '',
              basePrice: 280000,
              estimatedDuration: 300,
              isActive: true,
              tags: [],
              createdAt: '',
              updatedAt: ''
            },
            customerId: '',
            addressId: '',
            requestedDate: '',
            status: 'completed',
            totalAmount: 280000,
            depositAmount: 56000,
            balanceAmount: 224000,
            createdAt: '',
            updatedAt: ''
          },
          customerId: 'customer1',
          expertId: 'expert2',
          expert: {
            id: 'expert2',
            userId: 'user2',
            businessName: '완벽청소',
            description: '',
            rating: 4.9,
            reviewCount: 156,
            completedOrderCount: 890,
            isVerified: true,
            status: 'active',
            createdAt: '',
            updatedAt: ''
          },
          rating: 4,
          title: '',
          content: '전체적으로 만족스러웠습니다. 다만 좀 더 세심한 부분까지 신경써주셨으면 더 좋았을 것 같아요.',
          images: [],
          expertReply: '소중한 의견 감사드립니다. 다음에는 더욱 세심하게 서비스하겠습니다.',
          expertRepliedAt: '2024-02-16T20:30:00Z',
          isHelpful: 5,
          isVisible: true,
          createdAt: '2024-02-15T16:45:00Z',
          updatedAt: '2024-02-15T16:45:00Z',
          canEdit: false, // 7일 초과
          canDelete: false
        }
      ];

      return {
        data: mockReviews,
        meta: { page: 1, totalPages: 1, totalCount: mockReviews.length }
      };
    }
  });

  // 리뷰 수정
  const editReviewMutation = useMutation({
    mutationFn: async (data: { reviewId: string; content: string; rating: number }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '리뷰가 수정되었습니다'
      });
      setEditModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '리뷰 수정에 실패했습니다'
      });
    }
  });

  // 리뷰 삭제
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '리뷰가 삭제되었습니다'
      });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '리뷰 삭제에 실패했습니다'
      });
    }
  });

  const reviews = reviewsData?.data || [];

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY.MM.DD');
  };

  const handleEditClick = (review: Review & { canEdit: boolean }) => {
    if (!review.canEdit) {
      Toast.show('작성 후 7일이 지나 수정할 수 없습니다');
      return;
    }
    
    setSelectedReview(review);
    setEditContent(review.content);
    setEditRating(review.rating);
    setEditModalVisible(true);
  };

  const handleDeleteClick = (review: Review & { canDelete: boolean }) => {
    if (!review.canDelete) {
      Toast.show('작성 후 7일이 지나 삭제할 수 없습니다');
      return;
    }

    Modal.confirm({
      title: '리뷰 삭제',
      content: '정말로 이 리뷰를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.',
      onConfirm: () => {
        deleteReviewMutation.mutate(review.id);
      }
    });
  };

  const handleEditSubmit = () => {
    if (!selectedReview) return;
    
    if (!editContent.trim()) {
      Toast.show('리뷰 내용을 입력해주세요');
      return;
    }

    if (editContent.trim().length < 10) {
      Toast.show('리뷰 내용을 10자 이상 작성해주세요');
      return;
    }

    editReviewMutation.mutate({
      reviewId: selectedReview.id,
      content: editContent.trim(),
      rating: editRating
    });
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>;
  }

  return (
    <div style={{ paddingBottom: '20px', minHeight: '100vh' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar onBack={() => navigate(-1)}>
        내 리뷰 관리
      </NavBar>

      <div style={{ padding: '16px' }}>
        
        {/* 리뷰 통계 */}
        <Card 
          style={{ 
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
              {reviews.length}개
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              작성한 리뷰 • 평균 평점 {reviews.length > 0 ? 
                (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1) : 0}점
            </div>
          </div>
        </Card>

        <PullToRefresh onRefresh={refetch}>
          <div>
            {reviews.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {reviews.map((review) => (
                  <Card 
                    key={review.id}
                    style={{ 
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      
                      {/* 리뷰 헤더 */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <Rate value={review.rating} readonly size={14} />
                            <Tag size="small" color="primary" fill="outline">
                              {review.order?.serviceItem?.name}
                            </Tag>
                          </div>
                          
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 500,
                            marginBottom: '4px'
                          }}>
                            {review.expert?.businessName}
                          </div>
                          
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#8c8c8c',
                            fontFamily: 'monospace'
                          }}>
                            {review.order?.orderNumber} • {formatDate(review.createdAt)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {review.canEdit && (
                            <Button 
                              size="mini"
                              fill="none"
                              color="primary"
                              onClick={() => handleEditClick(review)}
                            >
                              <EditOutlined />
                            </Button>
                          )}
                          
                          {review.canDelete && (
                            <Button 
                              size="mini"
                              fill="none"
                              color="danger"
                              onClick={() => handleDeleteClick(review)}
                            >
                              <DeleteOutlined />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 리뷰 제목 */}
                      {review.title && (
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: 500,
                          lineHeight: '1.4'
                        }}>
                          {review.title}
                        </div>
                      )}

                      {/* 리뷰 내용 */}
                      <div style={{ 
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: '#262626'
                      }}>
                        {review.content}
                      </div>

                      {/* 리뷰 이미지 */}
                      {review.images && review.images.length > 0 && (
                        <Grid columns={4} gap={8}>
                          {review.images.slice(0, 4).map((image, index) => (
                            <Grid.Item key={index}>
                              <div style={{
                                width: '100%',
                                height: '60px',
                                background: '#f0f0f0',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px'
                              }}>
                                📷
                              </div>
                            </Grid.Item>
                          ))}
                        </Grid>
                      )}

                      {/* 도움됨 & 전문가 답글 */}
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#8c8c8c'
                        }}>
                          <LikeOutlined />
                          도움됨 {review.isHelpful}
                        </div>

                        {review.expertReply && (
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: '#2196F3'
                          }}>
                            <MessageOutlined />
                            전문가 답글
                          </div>
                        )}
                      </div>

                      {/* 전문가 답글 */}
                      {review.expertReply && (
                        <div style={{ 
                          background: '#fafafa',
                          padding: '12px',
                          borderRadius: '8px',
                          borderLeft: '3px solid #2196F3'
                        }}>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#2196F3',
                            fontWeight: 500,
                            marginBottom: '4px'
                          }}>
                            👨‍🔧 {review.expert?.businessName}의 답글
                          </div>
                          <div style={{ 
                            fontSize: '13px',
                            lineHeight: '1.4',
                            color: '#595959'
                          }}>
                            {review.expertReply}
                          </div>
                          <div style={{ 
                            fontSize: '11px',
                            color: '#bfbfbf',
                            marginTop: '4px'
                          }}>
                            {formatDate(review.expertRepliedAt!)}
                          </div>
                        </div>
                      )}

                      {/* 수정/삭제 가능 기간 안내 */}
                      {(review.canEdit || review.canDelete) && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#ff7f00',
                          background: '#fff7e6',
                          padding: '6px 8px',
                          borderRadius: '4px'
                        }}>
                          💡 작성 후 7일 이내 수정·삭제 가능
                        </div>
                      )}

                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <Empty 
                style={{ padding: '64px 32px' }}
                imageStyle={{ width: 128 }}
                description={
                  <Space direction="vertical" size="middle">
                    <div>아직 작성한 리뷰가 없어요</div>
                    <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                      서비스 이용 후 리뷰를 작성하면<br/>
                      포인트도 받고 다른 고객들에게도 도움이 됩니다
                    </div>
                    <Button 
                      color="primary"
                      onClick={() => navigate('/orders')}
                    >
                      주문 내역 보기
                    </Button>
                  </Space>
                }
              />
            )}
          </div>
        </PullToRefresh>

      </div>

      {/* 리뷰 수정 팝업 */}
      <Popup 
        visible={editModalVisible}
        onMaskClick={() => setEditModalVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px',
          maxHeight: '80vh'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0 }}>리뷰 수정</h3>
            <Button 
              fill="none" 
              onClick={() => setEditModalVisible(false)}
              size="small"
            >
              ✕
            </Button>
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            
            {/* 평점 수정 */}
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500,
                marginBottom: '12px'
              }}>
                평점
              </div>
              <div style={{ textAlign: 'center' }}>
                <Rate 
                  value={editRating}
                  onChange={setEditRating}
                  size={32}
                />
              </div>
            </div>

            {/* 내용 수정 */}
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500,
                marginBottom: '8px'
              }}>
                리뷰 내용
              </div>
              <TextArea
                value={editContent}
                onChange={setEditContent}
                rows={6}
                maxLength={1000}
                showCount
                placeholder="수정할 내용을 입력해주세요 (최소 10자)"
                autoSize={{ minRows: 6, maxRows: 10 }}
              />
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                fill="outline" 
                onClick={() => setEditModalVisible(false)}
                style={{ flex: 1 }}
              >
                취소
              </Button>
              <Button 
                color="primary"
                onClick={handleEditSubmit}
                loading={editReviewMutation.isPending}
                disabled={!editContent.trim() || editContent.trim().length < 10}
                style={{ flex: 1 }}
              >
                수정 완료
              </Button>
            </div>

          </Space>
        </div>
      </Popup>

    </div>
  );
};

export default MyReviews;