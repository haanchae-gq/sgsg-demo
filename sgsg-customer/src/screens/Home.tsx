import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  SearchBar, 
  Card, 
  Image, 
  Space, 
  Tag,
  Swiper,
  Divider,
  Badge,
  Button,
  TabBar,
  NavBar
} from 'antd-mobile';
import { 
  HomeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  StarFilled
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { ServiceCategory, Expert, Review } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [searchValue, setSearchValue] = useState('');

  // 인기 카테고리 조회
  const { data: categories } = useQuery({
    queryKey: ['categories', 'popular'],
    queryFn: async () => {
      const response = await api.get('/services/categories?limit=8');
      return response.data.data;
    }
  });

  // 추천 전문가 조회
  const { data: experts } = useQuery({
    queryKey: ['experts', 'recommended'],
    queryFn: async () => {
      const response = await api.get('/experts?limit=10');
      return response.data.data;
    }
  });

  // 최근 리뷰 조회
  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'recent'],
    queryFn: async () => {
      const response = await api.get('/reviews?limit=5');
      return response.data.data;
    }
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/services?search=${encodeURIComponent(value.trim())}`);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/services?category=${categoryId}`);
  };

  const handleExpertClick = (expertId: string) => {
    navigate(`/experts/${expertId}`);
  };

  const tabs = [
    {
      key: 'home',
      title: '홈',
      icon: <HomeOutlined />,
    },
    {
      key: 'services',
      title: '서비스',
      icon: <SearchOutlined />,
    },
    {
      key: 'orders',
      title: '주문',
      icon: <ShoppingCartOutlined />,
      badge: Badge.dot,
    },
    {
      key: 'profile',
      title: '내정보',
      icon: <UserOutlined />,
    },
  ];

  return (
    <div style={{ paddingBottom: '50px' }}>
      {/* 검색 헤더 */}
      <div className="search-header">
        <NavBar 
          style={{ 
            background: 'transparent',
            color: 'white',
            '--border-bottom': 'none'
          }}
          right={
            <Space>
              <EnvironmentOutlined style={{ fontSize: '18px' }} />
            </Space>
          }
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: 'white',
            fontSize: '16px',
            fontWeight: 500 
          }}>
            <EnvironmentOutlined style={{ marginRight: '4px' }} />
            서울시 강남구
          </div>
        </NavBar>
        
        <div style={{ padding: '0 16px 16px' }}>
          <SearchBar
            placeholder="어떤 서비스가 필요하세요?"
            value={searchValue}
            onChange={setSearchValue}
            onSearch={handleSearch}
            style={{
              '--border-radius': '24px',
              '--background': 'rgba(255, 255, 255, 0.9)',
              '--color': '#262626'
            }}
          />
        </div>
      </div>

      {/* 인기 카테고리 */}
      <div style={{ padding: '20px 16px' }}>
        <div className="section-header">
          <h2 className="section-title">인기 서비스</h2>
          <Button 
            fill="none" 
            color="primary"
            size="small"
            onClick={() => navigate('/services')}
          >
            더보기
          </Button>
        </div>
        
        <Grid columns={2} gap={12}>
          {categories?.slice(0, 8).map((category: ServiceCategory) => (
            <Grid.Item key={category.id}>
              <Card 
                className="category-item"
                onClick={() => handleCategoryClick(category.id)}
                style={{ 
                  border: 'none', 
                  background: '#fafafa',
                  borderRadius: '12px',
                  padding: '20px 12px'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div className="category-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {getCategoryIcon(category.name)}
                  </div>
                  <div className="category-name" style={{ fontSize: '14px', fontWeight: 500 }}>
                    {category.name}
                  </div>
                </div>
              </Card>
            </Grid.Item>
          ))}
        </Grid>
      </div>

      <Divider style={{ margin: '0', borderColor: '#f0f0f0' }} />

      {/* 추천 전문가 */}
      <div style={{ padding: '20px 0' }}>
        <div className="section-header">
          <h2 className="section-title">추천 전문가</h2>
          <Button 
            fill="none" 
            color="primary"
            size="small"
            onClick={() => navigate('/experts')}
          >
            더보기
          </Button>
        </div>

        <Swiper style={{ '--track-margin': '0 16px' }}>
          {experts?.map((expert: Expert) => (
            <Swiper.Item key={expert.id}>
              <Card 
                className="expert-card"
                onClick={() => handleExpertClick(expert.id)}
                style={{ 
                  margin: '0 6px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '12px'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={expert.profileImage || '/placeholder-avatar.png'}
                    width={60}
                    height={60}
                    style={{ 
                      borderRadius: '50%',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500,
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {expert.businessName || expert.user?.name}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}>
                    <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />
                    <span style={{ fontSize: '12px', marginLeft: '2px' }}>
                      {expert.rating.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                    완료 {expert.completedOrderCount}회
                  </div>
                </div>
              </Card>
            </Swiper.Item>
          ))}
        </Swiper>
      </div>

      <Divider style={{ margin: '0', borderColor: '#f0f0f0' }} />

      {/* 최근 리뷰 */}
      <div style={{ padding: '20px 16px' }}>
        <div className="section-header">
          <h2 className="section-title">최근 리뷰</h2>
          <Button 
            fill="none" 
            color="primary"
            size="small"
            onClick={() => navigate('/reviews')}
          >
            더보기
          </Button>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {reviews?.slice(0, 3).map((review: Review) => (
            <Card 
              key={review.id} 
              style={{ 
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                padding: '12px'
              }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <StarFilled key={i} style={{ color: '#faad14', fontSize: '12px' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {review.customer?.name?.substring(0, 1)}***
                  </span>
                </div>
                <div style={{ 
                  fontSize: '14px',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {review.content}
                </div>
                <Tag size="small" color="primary" fill="outline">
                  {review.order?.serviceItem?.name}
                </Tag>
              </Space>
            </Card>
          ))}
        </Space>
      </div>

      {/* 하단 네비게이션 */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        zIndex: 100
      }}>
        <TabBar 
          activeKey={activeTab} 
          onChange={(key) => {
            setActiveTab(key);
            if (key !== 'home') {
              navigate(`/${key}`);
            }
          }}
          style={{ 
            background: 'white',
            borderTop: '1px solid #f0f0f0'
          }}
        >
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

// 카테고리 아이콘 매핑
const getCategoryIcon = (categoryName: string): string => {
  const iconMap: Record<string, string> = {
    '청소 서비스': '🧹',
    '집수리 서비스': '🔧',
    '이사 서비스': '📦',
    '에어컨 청소': '❄️',
    '인테리어': '🏠',
    '전기': '💡',
    '배관': '🚿',
    '페인트': '🎨',
  };
  return iconMap[categoryName] || '⚡';
};

export default Home;