import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const DashboardPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={1128}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix=""
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Experts"
              value={93}
              precision={0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix=""
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={96.5}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={12850000}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix="₩"
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Recent Activity">
            <p>Dashboard content will be added here...</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;