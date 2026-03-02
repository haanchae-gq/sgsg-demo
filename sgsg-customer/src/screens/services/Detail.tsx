import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Tag,
  Button,
  Divider,
  Image,
  Swiper,
  Grid,
  Rate,
  SafeArea
} from 'antd-mobile';
import {
  LeftOutlined,
  StarFilled,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { ServiceItem, ExpertService, Review } from '../../types';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 서비스 상세 조회
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await api.get(`/services/items/${id}`);
      return response.data.data;
    },
    enabled: !!id
  });

  // 서비스 제공 전문가 목록
  const { data: experts } = useQuery({
    queryKey: ['service', id, 'experts'],
    queryFn: async () => {
      const response = await api.get(`/services/items/${id}/experts`);
      return response.data.data;
    },
    enabled: !!id
  });

  // 서비스 리뷰 목록 (최근 5개)
  const { data: reviews } = useQuery({
    queryKey: ['service', id, 'reviews'],
    queryFn: async () => {
      const response = await api.get(`/services/items/${id}/reviews?limit=5`);
      return response.data.data;
    },
    enabled: !!id
  });

  const handleOrderClick = (expertId?: string) => {
    navigate('/order/create', { 
      state: { 
        serviceId: id, 
        service,
        expertId 
      } 
    });
  };

  const handleExpertClick = (expertId: string) => {
    navigate(`/experts/${expertId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return remainMinutes > 0 ? `${hours}시간 ${remainMinutes}분` : `${hours}시간`;
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>;
  }

  if (!service) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>서비스를 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* 상단 네비게이션 */}
      <NavBar onBack={() => navigate(-1)}>
        {service.name}
      </NavBar>

      {/* 서비스 기본 정보 */}
      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 서비스 헤더 */}
          <Card style={{ border: 'none', background: '#fafafa', borderRadius: '12px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Tag size="small" color="primary" fill="outline">
                  {service.category?.name}
                </Tag>
                <h2 style={{ margin: '8px 0', fontSize: '20px', fontWeight: 600 }}>
                  {service.name}
                </h2>
                <p style={{ 
                  margin: 0, 
                  color: '#8c8c8c', 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {service.description}
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: '#2196F3',
                    marginBottom: '4px'
                  }}>
                    {formatPrice(service.basePrice)}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: '#8c8c8c',
                    fontSize: '12px'
                  }}>
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    예상 소요시간 {formatDuration(service.estimatedDuration)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <StarFilled style={{ color: '#faad14', fontSize: '14px' }} />
                    <span style={{ fontSize: '14px', marginLeft: '4px', fontWeight: 500 }}>
                      4.8
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    리뷰 {reviews?.length || 0}개
                  </div>
                </div>
              </div>
            </Space>
          </Card>

          <Divider />

          {/* 서비스 태그 */}
          {service.tags && service.tags.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>서비스 특징</h3>
              <Space wrap>
                {service.tags.map((tag: string) => (
                  <Tag key={tag} fill="outline" size="small">
                    #{tag}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          <Divider />

          {/* 제공 전문가 목록 */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>
              이 서비스를 제공하는 전문가 ({experts?.length || 0}명)
            </h3>
            
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {experts?.slice(0, 3).map((expertService: ExpertService) => (
                <Card 
                  key={expertService.id}
                  style={{ 
                    border: '1px solid #f0f0f0',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleExpertClick(expertService.expertId)}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Image
                      src={expertService.expert?.profileImage || '/placeholder-avatar.png'}
                      width={50}
                      height={50}
                      style={{ borderRadius: '50%' }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 500,
                        marginBottom: '4px'
                      }}>
                        {expertService.expert?.businessName || expertService.expert?.user?.name}
                      </div>
                      
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center'
                        }}>
                          <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />
                          <span style={{ fontSize: '12px', marginLeft: '2px' }}>
                            {expertService.expert?.rating.toFixed(1)}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          완료 {expertService.expert?.completedOrderCount}회
                        </span>
                      </div>

                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        color: '#2196F3' 
                      }}>
                        {formatPrice(expertService.price)}
                      </div>
                    </div>

                    <Button 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderClick(expertService.expertId);
                      }}
                    >
                      선택
                    </Button>
                  </div>
                </Card>
              ))}

              {experts && experts.length > 3 && (
                <Button 
                  fill="outline" 
                  block
                  onClick={() => navigate(`/experts?service=${id}`)}
                >
                  전문가 더보기 ({experts.length - 3}명)
                </Button>
              )}
            </Space>
          </div>

          <Divider />

          {/* 최근 리뷰 */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>
              최근 리뷰 ({reviews?.length || 0}개)
            </h3>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {reviews?.map((review: Review) => (
                <Card 
                  key={review.id}
                  style={{ 
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Rate value={review.rating} readonly size={12} />
                        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {review.customer?.name?.substring(0, 1)}***
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#bfbfbf' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ 
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: '#262626'
                    }}>
                      {review.content}
                    </div>

                    {review.images && review.images.length > 0 && (
                      <div>
                        <Grid columns={4} gap={8}>
                          {review.images.slice(0, 4).map((image, index) => (
                            <Grid.Item key={index}>
                              <Image 
                                src={image} 
                                width="100%" 
                                height={60}
                                style={{ borderRadius: '4px' }}
                              />
                            </Grid.Item>
                          ))}
                        </Grid>
                      </div>
                    )}
                  </Space>
                </Card>
              ))}

              {reviews && reviews.length > 0 && (
                <Button 
                  fill="outline" 
                  block
                  onClick={() => navigate(`/services/${id}/reviews`)}
                >
                  리뷰 더보기
                </Button>
              )}
            </Space>
          </div>
        </Space>
      </div>

      {/* 하단 주문 버튼 */}
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
            block 
            color="primary" 
            size="large"
            onClick={() => handleOrderClick()}
            style={{ borderRadius: '12px' }}
          >
            주문하기
          </Button>
        </SafeArea>
      </div>
    </div>
  );
};

export default ServiceDetail;