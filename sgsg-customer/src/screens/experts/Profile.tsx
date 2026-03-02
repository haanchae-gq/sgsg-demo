import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Button,
  Image,
  Tag,
  Divider,
  Grid,
  Rate,
  Tabs,
  SafeArea,
  Swiper
} from 'antd-mobile';
import {
  StarFilled,
  PhoneOutlined,
  MessageOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import dayjs from 'dayjs';
import type { Expert, ExpertService, Review } from '../../types';

const ExpertProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  // 전문가 정보 조회
  const { data: expert, isLoading } = useQuery({
    queryKey: ['expert', id],
    queryFn: async () => {
      // TODO: 실제 API 구현 시 주석 해제
      // const response = await api.get(`/experts/${id}`);
      // return response.data.data;
      
      // 임시 데이터
      return {
        id: id,
        businessName: '깔끔한 청소 서비스',
        user: {
          name: '김영희',
          phone: '010-1234-5678',
          email: 'expert@example.com'
        },
        description: '15년 경력의 전문 청소 전문가입니다. 꼼꼼하고 정성스러운 서비스로 고객 만족도 1위를 달성했습니다.',
        profileImage: null,
        rating: 4.8,
        reviewCount: 342,
        completedOrderCount: 1250,
        isVerified: true,
        status: 'active',
        portfolioImages: [
          '/portfolio1.jpg',
          '/portfolio2.jpg',
          '/portfolio3.jpg',
          '/portfolio4.jpg'
        ],
        certifications: [
          '청소관리사 1급',
          '위생관리사',
          '소독업체 등록증'
        ],
        workingHours: {
          monday: '09:00-18:00',
          tuesday: '09:00-18:00',
          wednesday: '09:00-18:00',
          thursday: '09:00-18:00',
          friday: '09:00-18:00',
          saturday: '09:00-16:00',
          sunday: '휴무'
        },
        serviceAreas: ['강남구', '서초구', '송파구', '압구정동'],
        responseTime: '평균 1시간 내',
        createdAt: '2020-03-15T00:00:00Z'
      } as Expert & {
        portfolioImages: string[];
        certifications: string[];
        workingHours: Record<string, string>;
        serviceAreas: string[];
        responseTime: string;
      };
    },
    enabled: !!id
  });

  // 전문가 서비스 목록
  const { data: services } = useQuery({
    queryKey: ['expert', id, 'services'],
    queryFn: async () => {
      // 임시 데이터
      return [
        {
          id: '1',
          serviceItem: {
            id: 'item1',
            name: '정기 청소',
            description: '주1회 정기적인 청소 서비스',
            category: { name: '청소 서비스' }
          },
          price: 140000,
          isActive: true,
          description: '2-3시간 소요, 거실/방/주방/화장실 전체 청소'
        },
        {
          id: '2',
          serviceItem: {
            id: 'item2',
            name: '대청소',
            description: '꼼꼼한 대청소 서비스',
            category: { name: '청소 서비스' }
          },
          price: 280000,
          isActive: true,
          description: '4-5시간 소요, 모든 공간의 세밀한 청소'
        }
      ] as ExpertService[];
    },
    enabled: !!id
  });

  // 전문가 리뷰 목록
  const { data: reviews } = useQuery({
    queryKey: ['expert', id, 'reviews'],
    queryFn: async () => {
      // 임시 데이터
      return [
        {
          id: '1',
          rating: 5,
          content: '정말 꼼꼼하게 청소해주셨어요. 특히 화장실과 주방이 정말 깨끗해졌습니다. 다음에도 꼭 부탁드리고 싶어요!',
          customer: { name: '이○○' },
          order: {
            serviceItem: { name: '정기 청소' }
          },
          images: ['/review1.jpg', '/review2.jpg'],
          createdAt: '2024-02-20T14:30:00Z',
          expertReply: '정성스럽게 청소해드릴 수 있어서 기뻤습니다. 다음에도 만족스러운 서비스로 찾아뵙겠습니다!',
          expertRepliedAt: '2024-02-20T18:30:00Z'
        },
        {
          id: '2',
          rating: 5,
          content: '시간 약속도 정확히 지키시고, 청소 실력도 정말 좋으세요. 가격대비 너무 만족스러운 서비스였습니다.',
          customer: { name: '박○○' },
          order: {
            serviceItem: { name: '대청소' }
          },
          images: [],
          createdAt: '2024-02-18T10:15:00Z'
        },
        {
          id: '3',
          rating: 4,
          content: '전체적으로 만족스러웠습니다. 다만 좀 더 세심한 부분까지 신경써주셨으면 더 좋았을 것 같아요.',
          customer: { name: '최○○' },
          order: {
            serviceItem: { name: '정기 청소' }
          },
          images: [],
          createdAt: '2024-02-15T16:45:00Z',
          expertReply: '소중한 의견 감사드립니다. 다음에는 더욱 세심하게 서비스하겠습니다.',
          expertRepliedAt: '2024-02-15T20:30:00Z'
        }
      ] as Review[];
    },
    enabled: !!id
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const handleOrderClick = (serviceId?: string) => {
    navigate('/order/create', { 
      state: { 
        serviceId,
        expertId: id 
      } 
    });
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>;
  }

  if (!expert) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>전문가를 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar onBack={() => navigate(-1)}>
        전문가 프로필
      </NavBar>

      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 전문가 기본 정보 */}
          <Card style={{ border: 'none', borderRadius: '12px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              {/* 프로필 헤더 */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  flexShrink: 0
                }}>
                  👨‍🔧
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <h2 style={{ 
                      margin: 0, 
                      fontSize: '20px', 
                      fontWeight: 600 
                    }}>
                      {expert.businessName}
                    </h2>
                    {expert.isVerified && (
                      <CheckCircleOutlined style={{ color: '#2196F3', fontSize: '16px' }} />
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <StarFilled style={{ color: '#faad14', fontSize: '14px' }} />
                      <span style={{ fontWeight: 500 }}>
                        {expert.rating.toFixed(1)}
                      </span>
                      <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                        ({expert.reviewCount}개 리뷰)
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#8c8c8c',
                    marginBottom: '12px'
                  }}>
                    완료한 주문 {expert.completedOrderCount}회 • 
                    경력 {dayjs().diff(dayjs(expert.createdAt), 'year')}년 • 
                    응답시간 평균 1시간
                  </div>

                  <Space size="small">
                    <Button 
                      size="small" 
                      color="primary"
                      icon={<PhoneOutlined />}
                      onClick={() => window.location.href = `tel:${expert.user?.phone}`}
                    >
                      전화
                    </Button>
                    <Button 
                      size="small" 
                      fill="outline"
                      icon={<MessageOutlined />}
                      onClick={() => window.location.href = `sms:${expert.user?.phone}`}
                    >
                      문자
                    </Button>
                  </Space>
                </div>
              </div>

              {/* 인증 및 특징 */}
              <div>
                <Space wrap>
                  <Tag color="success" fill="outline" size="small">
                    <CheckCircleOutlined /> 신원인증 완료
                  </Tag>
                  <Tag color="primary" fill="outline" size="small">
                    전문가 인증
                  </Tag>
                  <Tag color="warning" fill="outline" size="small">
                    우수 서비스
                  </Tag>
                </Space>
              </div>

              {/* 소개 */}
              <div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  lineHeight: '1.6',
                  color: '#262626'
                }}>
                  {expert.description}
                </p>
              </div>

            </Space>
          </Card>

          {/* 탭 메뉴 */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            style={{ '--content-padding': '0' }}
          >
            
            {/* 서비스 목록 */}
            <Tabs.Tab title="서비스" key="services">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {services?.map((service) => (
                  <Card 
                    key={service.id}
                    style={{ 
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <Tag size="small" color="primary" fill="outline">
                            {service.serviceItem?.category?.name}
                          </Tag>
                          <h4 style={{ 
                            margin: '8px 0', 
                            fontSize: '16px', 
                            fontWeight: 600 
                          }}>
                            {service.serviceItem?.name}
                          </h4>
                          <p style={{ 
                            margin: '0 0 8px 0', 
                            color: '#8c8c8c', 
                            fontSize: '14px' 
                          }}>
                            {service.serviceItem?.description}
                          </p>
                          {service.description && (
                            <p style={{ 
                              margin: 0, 
                              fontSize: '12px', 
                              color: '#595959',
                              background: '#fafafa',
                              padding: '8px',
                              borderRadius: '4px'
                            }}>
                              {service.description}
                            </p>
                          )}
                        </div>
                        
                        <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 600, 
                            color: '#2196F3',
                            marginBottom: '8px'
                          }}>
                            {formatPrice(service.price)}
                          </div>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => handleOrderClick(service.serviceItem?.id)}
                          >
                            주문하기
                          </Button>
                        </div>
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Tabs.Tab>

            {/* 포트폴리오 */}
            <Tabs.Tab title="포트폴리오" key="portfolio">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                
                {expert.portfolioImages && expert.portfolioImages.length > 0 ? (
                  <div>
                    <h4 style={{ marginBottom: '16px' }}>작업 사례</h4>
                    <Grid columns={2} gap={12}>
                      {expert.portfolioImages.map((image, index) => (
                        <Grid.Item key={index}>
                          <div style={{ 
                            width: '100%', 
                            height: '120px',
                            background: '#f0f0f0',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            📸
                          </div>
                        </Grid.Item>
                      ))}
                    </Grid>
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#8c8c8c'
                  }}>
                    포트폴리오 준비중입니다
                  </div>
                )}

                {/* 자격증 */}
                {expert.certifications && expert.certifications.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '16px' }}>보유 자격증</h4>
                    <Space wrap>
                      {expert.certifications.map((cert, index) => (
                        <Tag key={index} color="success" fill="outline">
                          {cert}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

              </Space>
            </Tabs.Tab>

            {/* 리뷰 */}
            <Tabs.Tab title={`리뷰 (${expert.reviewCount})`} key="reviews">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                
                {/* 평점 요약 */}
                <Card style={{ 
                  background: '#f0f9ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '32px', 
                      fontWeight: 600, 
                      color: '#2196F3',
                      marginBottom: '8px'
                    }}>
                      {expert.rating.toFixed(1)}
                    </div>
                    <Rate value={expert.rating} readonly size={16} />
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#8c8c8c',
                      marginTop: '8px'
                    }}>
                      {expert.reviewCount}개의 리뷰 평균
                    </div>
                  </div>
                </Card>

                {/* 리뷰 목록 */}
                {reviews?.map((review) => (
                  <Card 
                    key={review.id}
                    style={{ 
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      
                      {/* 리뷰 헤더 */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Rate value={review.rating} readonly size={12} />
                          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                            {review.customer?.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#bfbfbf' }}>
                          {dayjs(review.createdAt).format('YYYY.MM.DD')}
                        </span>
                      </div>

                      {/* 서비스 정보 */}
                      <Tag size="small" fill="outline" color="primary">
                        {review.order?.serviceItem?.name}
                      </Tag>

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
                        <div>
                          <Grid columns={3} gap={8}>
                            {review.images.slice(0, 3).map((image, index) => (
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
                        </div>
                      )}

                      {/* 전문가 답글 */}
                      {review.expertReply && (
                        <div style={{ 
                          background: '#fafafa',
                          padding: '12px',
                          borderRadius: '8px',
                          marginTop: '8px',
                          borderLeft: '3px solid #2196F3'
                        }}>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#2196F3',
                            fontWeight: 500,
                            marginBottom: '4px'
                          }}>
                            👨‍🔧 전문가 답글
                          </div>
                          <div style={{ 
                            fontSize: '13px',
                            lineHeight: '1.4',
                            color: '#595959'
                          }}>
                            {review.expertReply}
                          </div>
                        </div>
                      )}

                    </Space>
                  </Card>
                ))}

              </Space>
            </Tabs.Tab>

            {/* 전문가 정보 */}
            <Tabs.Tab title="정보" key="info">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                
                {/* 근무 시간 */}
                <Card 
                  title="근무 시간"
                  style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {Object.entries(expert.workingHours || {}).map(([day, time]) => {
                      const dayNames: Record<string, string> = {
                        monday: '월요일',
                        tuesday: '화요일', 
                        wednesday: '수요일',
                        thursday: '목요일',
                        friday: '금요일',
                        saturday: '토요일',
                        sunday: '일요일'
                      };
                      
                      return (
                        <div key={day} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '14px'
                        }}>
                          <span>{dayNames[day]}</span>
                          <span style={{ 
                            color: time === '휴무' ? '#ff4d4f' : '#52c41a',
                            fontWeight: 500
                          }}>
                            {time}
                          </span>
                        </div>
                      );
                    })}
                  </Space>
                </Card>

                {/* 서비스 지역 */}
                <Card 
                  title="서비스 지역"
                  style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
                >
                  <Space wrap>
                    {expert.serviceAreas?.map((area, index) => (
                      <Tag key={index} color="geekblue" fill="outline">
                        {area}
                      </Tag>
                    ))}
                  </Space>
                </Card>

                {/* 연락처 정보 */}
                <Card 
                  title="연락처 정보"
                  style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ fontSize: '14px' }}>
                      <strong>응답 시간:</strong> {expert.responseTime || '평균 1시간 내'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      👍 빠른 응답과 친절한 상담으로 고객 만족도가 높습니다
                    </div>
                  </Space>
                </Card>

              </Space>
            </Tabs.Tab>

          </Tabs>

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
            color="primary" 
            size="large"
            block
            onClick={() => handleOrderClick()}
            style={{ borderRadius: '12px' }}
          >
            이 전문가에게 주문하기
          </Button>
        </SafeArea>
      </div>

    </div>
  );
};

export default ExpertProfile;