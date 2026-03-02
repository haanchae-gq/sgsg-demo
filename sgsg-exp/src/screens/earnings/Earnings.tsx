import React, { useState } from 'react';
import { Card, Grid, Tabs, List, Button } from 'antd-mobile';
import { PayCircleOutline, CalendarOutline, ClockCircleOutline } from 'antd-mobile-icons';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '../../utils/formatters';
import api from '../../services/api';
import './Earnings.css';

interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  completedOrders: number;
}

interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentDate: string;
  serviceItem: {
    name: string;
  };
  customer: {
    name: string;
  };
}

const Earnings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('summary');

  // 수익 요약 조회
  const { data: summary } = useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: async () => {
      // 실제로는 백엔드에서 집계된 데이터를 받아와야 함
      return {
        today: 150000,
        thisWeek: 450000,
        thisMonth: 1200000,
        completedOrders: 12
      } as EarningsSummary;
    }
  });

  // 차트 데이터
  const weeklyData = [
    { day: '월', earnings: 120000 },
    { day: '화', earnings: 85000 },
    { day: '수', earnings: 95000 },
    { day: '목', earnings: 110000 },
    { day: '금', earnings: 140000 },
    { day: '토', earnings: 180000 },
    { day: '일', earnings: 160000 }
  ];

  const serviceData = [
    { name: '정기 청소', value: 40, color: '#1890ff' },
    { name: '대청소', value: 25, color: '#52c41a' },
    { name: '집수리', value: 20, color: '#faad14' },
    { name: '기타', value: 15, color: '#ff7875' }
  ];

  // 결제 내역 조회
  const { data: payments } = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: async () => {
      // 실제로는 전문가의 결제 완료된 주문 목록
      return [] as PaymentRecord[];
    }
  });

  const renderSummaryCard = () => (
    <div className="earnings-summary">
      <Grid columns={2} gap={12}>
        <Grid.Item>
          <Card className="summary-card">
            <div className="summary-item">
              <div className="summary-label">오늘 수익</div>
              <div className="summary-value">{formatCurrency(summary?.today || 0)}</div>
            </div>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card className="summary-card">
            <div className="summary-item">
              <div className="summary-label">이번 주</div>
              <div className="summary-value">{formatCurrency(summary?.thisWeek || 0)}</div>
            </div>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card className="summary-card">
            <div className="summary-item">
              <div className="summary-label">이번 달</div>
              <div className="summary-value primary">{formatCurrency(summary?.thisMonth || 0)}</div>
            </div>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card className="summary-card">
            <div className="summary-item">
              <div className="summary-label">완료 주문</div>
              <div className="summary-value">{summary?.completedOrders || 0}건</div>
            </div>
          </Card>
        </Grid.Item>
      </Grid>

      <Card className="chart-card">
        <div className="chart-header">
          <h3>수익 트렌드</h3>
          <span>최근 7일</span>
        </div>
        <div className="chart-content">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis hide />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#1890ff" 
                strokeWidth={3}
                dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="chart-card">
        <div className="chart-header">
          <h3>서비스별 비중</h3>
          <span>이번 달</span>
        </div>
        <div className="chart-content">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={serviceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={30}
              >
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {serviceData.map((item) => (
              <div key={item.name} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="payment-history">
      {payments && payments.length > 0 ? (
        <List>
          {payments.map((payment) => (
            <List.Item
              key={payment.id}
              prefix={<PayCircleOutline />}
              description={`${payment.customer.name} • ${formatDate(payment.paymentDate)}`}
              extra={<span className="payment-amount">{formatCurrency(payment.amount)}</span>}
            >
              {payment.serviceItem.name}
            </List.Item>
          ))}
        </List>
      ) : (
        <div className="empty-history">
          <PayCircleOutline fontSize={48} color="#ccc" />
          <p>결제 내역이 없습니다</p>
        </div>
      )}
    </div>
  );

  const renderSettlement = () => (
    <div className="settlement-section">
      <Card>
        <div className="settlement-info">
          <h3>다음 정산일</h3>
          <div className="settlement-date">
            <CalendarOutline />
            <span>2026년 3월 10일 (매월 10일)</span>
          </div>
          <div className="settlement-amount">
            <span>정산 예정 금액</span>
            <strong>{formatCurrency(summary?.thisMonth || 0)}</strong>
          </div>
        </div>
        
        <Button block color="primary" className="settlement-button">
          정산 내역 자세히 보기
        </Button>
      </Card>

      <Card className="account-info">
        <h4>정산 계좌 정보</h4>
        <div className="account-details">
          <div>은행: 국민은행</div>
          <div>계좌: 123-456-789012</div>
          <div>예금주: 홍길동</div>
        </div>
        <Button size="small" fill="outline">계좌 변경</Button>
      </Card>
    </div>
  );

  const tabItems = [
    { key: 'summary', title: '수익 요약' },
    { key: 'history', title: '결제 내역' },
    { key: 'settlement', title: '정산' }
  ];

  return (
    <div className="earnings-container">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="earnings-tabs"
      >
        {tabItems.map(tab => (
          <Tabs.Tab title={tab.title} key={tab.key}>
            <div className="tab-content">
              {tab.key === 'summary' && renderSummaryCard()}
              {tab.key === 'history' && renderPaymentHistory()}
              {tab.key === 'settlement' && renderSettlement()}
            </div>
          </Tabs.Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default Earnings;