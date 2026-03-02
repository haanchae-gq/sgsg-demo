import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Button,
  Rate,
  TextArea,
  Input,
  Image,
  Grid,
  Toast,
  SafeArea,
  Tag,
  Divider
} from 'antd-mobile';
import {
  StarFilled,
  CameraOutlined,
  DeleteOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Order } from '../../types';

const ReviewWrite: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 주문 정보 조회
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      // 임시 데이터 (실제 구현에서는 API 호출)
      return {
        id: orderId,
        orderNumber: 'ORD-20240301-001',
        serviceItem: {
          name: '정기 청소',
          category: { name: '청소 서비스' }
        },
        expert: {
          businessName: '깔끔한 청소 서비스',
          user: { name: '김영희' },
          rating: 4.8,
          reviewCount: 342
        },
        scheduledDate: dayjs().subtract(1, 'day').format(),
        totalAmount: 150000,
        completedAt: dayjs().subtract(1, 'day').format()
      } as Partial<Order>;
    },
    enabled: !!orderId
  });

  // 리뷰 작성 mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      // TODO: 실제 API 구현
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '리뷰가 성공적으로 작성되었습니다! 포인트 500점이 적립되었어요 🎉'
      });
      
      setTimeout(() => {
        navigate('/reviews', { replace: true });
      }, 1500);
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '리뷰 작성에 실패했습니다. 다시 시도해주세요.'
      });
    }
  });

  // 평점별 추천 태그
  const ratingTags: Record<number, string[]> = {
    5: ['완벽해요', '강력추천', '친절해요', '꼼꼼해요', '시간정확', '가격만족', '재이용의사'],
    4: ['만족해요', '추천해요', '괜찮아요', '정성스러워요', '깔끔해요'],
    3: ['보통이에요', '무난해요', '아쉬워요', '개선필요'],
    2: ['별로예요', '실망스러워요', '불만족', '다시이용안함'],
    1: ['최악이에요', '화나요', '돈아까워요', '비추천']
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY년 M월 D일');
  };

  const handleImageUpload = () => {
    // TODO: 실제 이미지 업로드 구현 (파일 선택, 압축, 업로드)
    const newImageUrl = `/review-image-${Date.now()}.jpg`;
    if (images.length < 5) {
      setImages([...images, newImageUrl]);
    } else {
      Toast.show('최대 5장까지 업로드 가능합니다');
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tag]);
      } else {
        Toast.show('태그는 최대 5개까지 선택 가능합니다');
      }
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Toast.show('평점을 선택해주세요');
      return;
    }
    
    if (!content.trim()) {
      Toast.show('리뷰 내용을 입력해주세요');
      return;
    }

    if (content.trim().length < 10) {
      Toast.show('리뷰 내용을 10자 이상 작성해주세요');
      return;
    }

    const reviewData = {
      orderId,
      rating,
      title: title.trim(),
      content: content.trim(),
      images,
      tags: selectedTags
    };

    submitReviewMutation.mutate(reviewData);
  };

  const isSubmitDisabled = rating === 0 || !content.trim() || content.trim().length < 10;

  const getRatingDescription = (rating: number) => {
    const descriptions: Record<number, string> = {
      1: '매우 불만족스러워요 😞',
      2: '불만족스러워요 😐',
      3: '보통이에요 🙂',
      4: '만족해요 😊',
      5: '매우 만족해요! 😍'
    };
    return descriptions[rating] || '';
  };

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
        리뷰 작성
      </NavBar>

      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 주문 정보 요약 */}
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 600,
                marginBottom: '8px'
              }}>
                {order.serviceItem?.name}
              </div>
              
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                👨‍🔧 {order.expert?.businessName}
              </div>
              
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                📅 {formatDate(order.scheduledDate!)} • 💰 {formatPrice(order.totalAmount!)}
              </div>
            </Space>
          </Card>

          {/* 평점 선택 */}
          <Card 
            title="서비스는 어떠셨나요?"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div style={{ textAlign: 'center' }}>
                <Rate 
                  value={rating}
                  onChange={setRating}
                  size={40}
                  style={{ fontSize: '40px' }}
                />
                
                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '16px', 
                  fontWeight: 500,
                  color: '#2196F3'
                }}>
                  {getRatingDescription(rating)}
                </div>
              </div>

              {/* 평점별 추천 태그 */}
              {rating > 0 && ratingTags[rating] && (
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500,
                    marginBottom: '12px'
                  }}>
                    이런 점이 좋았나요? (최대 5개 선택)
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px'
                  }}>
                    {ratingTags[rating].map((tag) => (
                      <Tag
                        key={tag}
                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                        fill={selectedTags.includes(tag) ? 'solid' : 'outline'}
                        onClick={() => handleTagToggle(tag)}
                        style={{ 
                          cursor: 'pointer',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

            </Space>
          </Card>

          {/* 리뷰 제목 (선택사항) */}
          <Card 
            title="리뷰 제목 (선택사항)"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Input
              placeholder="리뷰를 한 줄로 요약하면? (예: 정말 꼼꼼하게 청소해주셨어요!)"
              value={title}
              onChange={setTitle}
              maxLength={50}
              showCount
            />
          </Card>

          {/* 리뷰 내용 */}
          <Card 
            title="상세한 리뷰를 작성해주세요 *"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <TextArea
                placeholder={`어떤 점이 좋았나요? 다른 고객들에게 도움이 될 상세한 후기를 남겨주세요.

예시:
• 시간 약속을 정확히 지켜주셨어요
• 구석구석 세심하게 청소해주셨어요  
• 친절하게 설명해주시고 소통이 좋았어요
• 청소 도구도 깨끗하게 준비해오셨어요
• 마무리까지 깔끔하게 잘 해주셨어요`}
                value={content}
                onChange={setContent}
                rows={6}
                maxLength={1000}
                showCount
                autoSize={{ minRows: 6, maxRows: 10 }}
              />

              <div style={{ 
                fontSize: '12px', 
                color: '#8c8c8c',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                최소 10자 이상 작성하시면 500 포인트가 적립됩니다!
              </div>

            </Space>
          </Card>

          {/* 사진 추가 */}
          <Card 
            title={`사진 추가 (선택사항) ${images.length}/5`}
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div style={{ 
                fontSize: '14px', 
                color: '#8c8c8c',
                marginBottom: '12px'
              }}>
                서비스 전후 사진을 올려주시면 다른 고객들에게 큰 도움이 됩니다
              </div>

              <Grid columns={4} gap={12}>
                {/* 이미지 업로드 버튼 */}
                {images.length < 5 && (
                  <Grid.Item>
                    <div 
                      onClick={handleImageUpload}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        border: '2px dashed #d9d9d9',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#fafafa'
                      }}
                    >
                      <CameraOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />
                      <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '4px' }}>
                        사진 추가
                      </div>
                    </div>
                  </Grid.Item>
                )}

                {/* 업로드된 이미지들 */}
                {images.map((image, index) => (
                  <Grid.Item key={index}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        📷
                      </div>
                      
                      <Button
                        size="mini"
                        color="danger"
                        fill="solid"
                        shape="rounded"
                        onClick={() => handleImageRemove(index)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          minWidth: '20px',
                          height: '20px',
                          padding: 0
                        }}
                      >
                        <DeleteOutlined style={{ fontSize: '10px' }} />
                      </Button>
                    </div>
                  </Grid.Item>
                ))}
              </Grid>

            </Space>
          </Card>

          {/* 리뷰 작성 혜택 안내 */}
          <Card 
            style={{ 
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '12px'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500,
                color: '#d48806',
                marginBottom: '8px'
              }}>
                🎁 리뷰 작성 혜택
              </div>
              
              <div style={{ fontSize: '12px', color: '#ad4e00', lineHeight: '1.5' }}>
                • 텍스트 리뷰 (10자 이상): <strong>500 포인트</strong><br/>
                • 사진 포함 리뷰: <strong>추가 300 포인트</strong><br/>
                • 베스트 리뷰 선정 시: <strong>추가 1,000 포인트</strong>
              </div>
              
              <div style={{ 
                fontSize: '11px', 
                color: '#8c8c8c',
                marginTop: '8px'
              }}>
                작성된 리뷰는 7일 이내에 수정·삭제 가능합니다
              </div>
              
            </Space>
          </Card>

        </Space>
      </div>

      {/* 하단 리뷰 작성 버튼 */}
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
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            
            <Button 
              color="primary" 
              size="large"
              block
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              loading={submitReviewMutation.isPending}
              style={{ borderRadius: '12px' }}
            >
              <StarFilled /> 리뷰 등록하기
              {!isSubmitDisabled && ' (+500P 적립)'}
            </Button>
            
            {isSubmitDisabled && (
              <div style={{ 
                textAlign: 'center',
                fontSize: '12px',
                color: '#ff4d4f'
              }}>
                {rating === 0 && '평점을 선택해주세요'}
                {rating > 0 && !content.trim() && '리뷰 내용을 입력해주세요'}
                {rating > 0 && content.trim() && content.trim().length < 10 && 
                  `리뷰를 ${10 - content.trim().length}자 더 작성해주세요`}
              </div>
            )}
            
          </Space>
        </SafeArea>
      </div>

    </div>
  );
};

export default ReviewWrite;