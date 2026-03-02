import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  NavBar,
  SearchBar,
  Tabs,
  Card,
  Grid,
  Image,
  Space,
  Tag,
  Button,
  Selector,
  Popup,
  Slider,
  PullToRefresh
} from 'antd-mobile';
import {
  SearchOutlined,
  FilterOutlined,
  StarFilled,
  LeftOutlined
} from '@ant-design/icons';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { ServiceCategory, ServiceItem } from '../../types';

const ServiceCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [filterVisible, setFilterVisible] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [sortBy, setSortBy] = useState('popular');

  // 카테고리 목록 조회
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/services/categories');
      return response.data.data;
    }
  });

  // 서비스 목록 조회 (무한 스크롤)
  const {
    data: servicesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['services', selectedCategory, searchValue, sortBy, priceRange],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        pageSize: '20',
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchValue && { search: searchValue }),
        sort: sortBy,
        'priceRange.min': priceRange[0].toString(),
        'priceRange.max': priceRange[1].toString(),
      });
      
      const response = await api.get(`/services/items?${params}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/services/${serviceId}`);
  };

  const handleFilterApply = () => {
    setFilterVisible(false);
    refetch();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const sortOptions = [
    { label: '인기순', value: 'popular' },
    { label: '낮은 가격순', value: 'price_low' },
    { label: '높은 가격순', value: 'price_high' },
    { label: '평점순', value: 'rating' },
  ];

  return (
    <div>
      {/* 상단 네비게이션 */}
      <NavBar 
        back="서비스"
        onBack={() => navigate('/')}
        right={
          <Space>
            <SearchOutlined />
            <FilterOutlined onClick={() => setFilterVisible(true)} />
          </Space>
        }
      >
        서비스 목록
      </NavBar>

      {/* 검색바 */}
      <div style={{ padding: '8px 16px' }}>
        <SearchBar
          placeholder="원하는 서비스를 검색하세요"
          value={searchValue}
          onChange={setSearchValue}
          onSearch={handleSearch}
          style={{ '--border-radius': '20px' }}
        />
      </div>

      {/* 카테고리 탭 */}
      <div style={{ borderBottom: '1px solid #f0f0f0' }}>
        <Tabs
          activeKey={selectedCategory || 'all'}
          onChange={handleCategoryChange}
          style={{ '--content-padding': '0 16px' }}
        >
          <Tabs.Tab title="전체" key="all" />
          {categories?.map((category: ServiceCategory) => (
            <Tabs.Tab 
              title={category.name} 
              key={category.id}
            />
          ))}
        </Tabs>
      </div>

      {/* 정렬 옵션 */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <Selector
          options={sortOptions}
          value={[sortBy]}
          onChange={(val) => setSortBy(val[0])}
          style={{ '--color': '#2196F3' }}
        />
      </div>

      {/* 서비스 목록 */}
      <PullToRefresh onRefresh={refetch}>
        <div style={{ padding: '16px' }}>
          <Grid columns={2} gap={12}>
            {servicesData?.pages.flatMap(page => page.data).map((service: ServiceItem) => (
              <Grid.Item key={service.id}>
                <Card 
                  onClick={() => handleServiceClick(service.id)}
                  style={{ 
                    border: '1px solid #f0f0f0',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '12px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 500,
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {service.name}
                    </div>
                    
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      marginBottom: '8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.3'
                    }}>
                      {service.description}
                    </div>

                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 600,
                      color: '#2196F3',
                      marginBottom: '8px'
                    }}>
                      {formatPrice(service.basePrice)}
                    </div>

                    <Space size="small">
                      <Tag size="small" fill="outline" color="primary">
                        {service.category?.name}
                      </Tag>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#8c8c8c',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <StarFilled style={{ color: '#faad14', fontSize: '10px' }} />
                        <span style={{ marginLeft: '2px' }}>4.8</span>
                      </div>
                    </Space>
                  </div>
                </Card>
              </Grid.Item>
            ))}
          </Grid>

          {/* 더보기 버튼 */}
          {hasNextPage && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Button 
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
                fill="outline"
              >
                {isFetchingNextPage ? '로딩 중...' : '더 많은 서비스 보기'}
              </Button>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* 필터 팝업 */}
      <Popup 
        visible={filterVisible}
        onMaskClick={() => setFilterVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0 }}>필터</h3>
            <Button 
              fill="none" 
              onClick={() => setFilterVisible(false)}
              size="small"
            >
              ✕
            </Button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px' }}>가격대</h4>
            <Slider
              range
              value={priceRange}
              onChange={setPriceRange}
              min={0}
              max={500000}
              step={10000}
              marks={{
                0: '0원',
                100000: '10만원',
                300000: '30만원',
                500000: '50만원+'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '8px',
              fontSize: '12px',
              color: '#8c8c8c'
            }}>
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
          </div>

          <Button 
            block 
            type="submit"
            color="primary"
            size="large"
            onClick={handleFilterApply}
          >
            적용하기
          </Button>
        </div>
      </Popup>
    </div>
  );
};

export default ServiceCatalog;