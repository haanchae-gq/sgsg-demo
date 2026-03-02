import React from 'react';
import { Card } from 'antd';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { getOrderStatusText } from '../../utils/formatters';

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface OrderStatusChartProps {
  data: OrderStatusData[];
  loading?: boolean;
  height?: number;
}

const COLORS = {
  pending: '#faad14',
  confirmed: '#1890ff',
  expert_assigned: '#13c2c2',
  schedule_pending: '#722ed1',
  scheduled: '#52c41a',
  in_progress: '#52c41a',
  completed: '#8c8c8c',
  cancelled: '#ff4d4f',
  as_requested: '#eb2f96'
};

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
  data,
  loading = false,
  height = 300
}) => {
  const processedData = data.map(item => ({
    ...item,
    name: getOrderStatusText(item.status),
    color: COLORS[item.status as keyof typeof COLORS] || '#8c8c8c'
  }));

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    if (percent < 0.05) return null; // Don't show label for values less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card 
      title="주문 상태 분포" 
      bordered={false}
      style={{ borderRadius: '8px' }}
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: string) => [
              `${value || 0}건 (${processedData.find(d => d.name === name)?.percentage.toFixed(1)}%)`,
              '주문 수'
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value: string, entry: any) => (
              <span style={{ color: entry.color }}>
                {value} ({entry.payload.count}건)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default OrderStatusChart;