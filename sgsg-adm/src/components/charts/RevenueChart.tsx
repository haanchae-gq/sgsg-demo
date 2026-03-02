import React from 'react';
import { Card } from 'antd';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  loading?: boolean;
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  loading = false,
  height = 300
}) => {
  return (
    <Card 
      title="매출 트렌드" 
      bordered={false}
      style={{ borderRadius: '8px' }}
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
          />
          <Tooltip
            formatter={(value: any, name: string) => {
              if (name === 'revenue') {
                return [formatCurrency(value || 0), '매출'];
              }
              return [value || 0, '주문 수'];
            }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1890ff"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="매출"
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#52c41a"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            yAxisId="right"
            name="주문 수"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default RevenueChart;