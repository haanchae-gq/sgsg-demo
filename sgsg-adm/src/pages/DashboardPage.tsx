import React from 'react';
import { Row, Col, message, Alert, Button, Space, Typography, Breadcrumb, Divider, Spin } from 'antd';
import { 
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined,
  DashboardOutlined,
  HomeOutlined
} from '@ant-design/icons';
import MetricCard from '../components/common/MetricCard';
import RevenueChart from '../components/charts/RevenueChart';
import OrderStatusChart from '../components/charts/OrderStatusChart';
import RecentOrdersTable from '../components/tables/RecentOrdersTable';
import PendingReviewsTable from '../components/tables/PendingReviewsTable';
import { useDashboard } from '../hooks/useDashboard';
import { formatNumber } from '../utils/formatters';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const {
    metrics,
    revenueData,
    orderStatusData,
    recentOrders,
    pendingReviews,
    loading,
    error,
    refreshData,
    approveReview,
    rejectReview
  } = useDashboard();

  const handleViewOrder = (orderId: string) => {
    // TODO: Navigate to order detail page
    console.log('View order:', orderId);
    message.info(`주문 상세: ${orderId}`);
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
      message.success('리뷰가 승인되었습니다.');
    } catch (error) {
      message.error('리뷰 승인에 실패했습니다.');
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await rejectReview(reviewId);
      message.success('리뷰가 거부되었습니다.');
    } catch (error) {
      message.error('리뷰 거부에 실패했습니다.');
    }
  };

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item href="/">
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <DashboardOutlined />
            <span>대시보드</span>
          </Breadcrumb.Item>
        </Breadcrumb>
        
        <Alert
          message="데이터 로딩 오류"
          description={`대시보드 데이터를 불러오는데 실패했습니다: ${error}`}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={refreshData}>
              <ReloadOutlined />
              다시 시도
            </Button>
          }
          style={{ marginBottom: '24px' }}
        />
      </div>
    );
  }

  return (
    <Spin spinning={loading} size="large">
      <div style={{ padding: '4px 0' }}>
        {/* 페이지 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <Breadcrumb style={{ marginBottom: '16px' }}>
            <Breadcrumb.Item href="/">
              <HomeOutlined />
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <DashboardOutlined />
              <span>대시보드</span>
            </Breadcrumb.Item>
          </Breadcrumb>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '8px' 
          }}>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              관리자 대시보드
            </Title>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={refreshData}
                disabled={loading}
              >
                새로고침
              </Button>
            </Space>
          </div>
          
          <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
            실시간 비즈니스 현황과 주요 지표를 확인하세요
          </div>
        </div>

        <Divider style={{ margin: '0 0 24px 0' }} />
      
        {/* 지표 카드 섹션 */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
            주요 지표
          </Title>
          <Row gutter={[16, 16]} className="responsive-stack">
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="총 주문 수"
                value={metrics ? formatNumber(metrics.totalOrders) : 0}
                trend={metrics?.ordersTrend}
                icon={<ShoppingCartOutlined />}
                color="primary"
                suffix="건"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="총 매출"
                value={metrics ? metrics.totalRevenue : 0}
                trend={metrics?.revenueTrend}
                icon={<DollarOutlined />}
                color="success"
                prefix="₩"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="활성 고객 수"
                value={metrics ? formatNumber(metrics.activeCustomers) : 0}
                trend={metrics?.customersTrend}
                icon={<UserOutlined />}
                color="warning"
                suffix="명"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="전문가 수"
                value={metrics ? formatNumber(metrics.totalExperts) : 0}
                trend={metrics?.expertsTrend}
                icon={<TeamOutlined />}
                color="error"
                suffix="명"
                loading={loading}
              />
            </Col>
          </Row>
        </div>

        {/* 차트 섹션 */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
            분석 차트
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <RevenueChart 
                data={revenueData} 
                loading={loading} 
                height={350}
              />
            </Col>
            <Col xs={24} lg={8}>
              <OrderStatusChart 
                data={orderStatusData} 
                loading={loading}
                height={350}
              />
            </Col>
          </Row>
        </div>

        {/* 테이블 섹션 */}
        <div>
          <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
            최신 활동
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <RecentOrdersTable
                data={recentOrders}
                loading={loading}
                onViewOrder={handleViewOrder}
              />
            </Col>
            <Col xs={24} lg={10}>
              <PendingReviewsTable
                data={pendingReviews}
                loading={loading}
                onApproveReview={handleApproveReview}
                onRejectReview={handleRejectReview}
              />
            </Col>
          </Row>
        </div>
      </div>
    </Spin>
  );
};

export default DashboardPage;