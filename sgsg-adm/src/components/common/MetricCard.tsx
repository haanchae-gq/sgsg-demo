import React from 'react';
import { Card, Statistic } from 'antd';
import { 
  CaretUpOutlined,
  CaretDownOutlined
} from '@ant-design/icons';

interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error';
  suffix?: string;
  prefix?: string;
  loading?: boolean;
}

const colorMap = {
  primary: '#1890ff',
  success: '#52c41a', 
  warning: '#faad14',
  error: '#ff4d4f'
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  color,
  suffix,
  prefix,
  loading = false
}) => {
  const trendColor = trend && trend > 0 ? '#52c41a' : '#ff4d4f';
  const TrendIcon = trend && trend > 0 ? CaretUpOutlined : CaretDownOutlined;

  return (
    <Card
      bordered={false}
      style={{
        borderTop: `3px solid ${colorMap[color]}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        borderRadius: '8px'
      }}
      loading={loading}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Statistic
            title={title}
            value={value}
            valueStyle={{ 
              color: colorMap[color],
              fontSize: '24px',
              fontWeight: 'bold'
            }}
            prefix={prefix}
            suffix={suffix}
          />
          {trend !== undefined && (
            <div style={{ 
              marginTop: '8px',
              fontSize: '12px',
              color: trendColor,
              fontWeight: '500'
            }}>
              <TrendIcon style={{ marginRight: '4px' }} />
              {Math.abs(trend)}% vs 지난 달
            </div>
          )}
        </div>
        <div style={{
          fontSize: '32px',
          color: colorMap[color],
          opacity: 0.8,
          marginLeft: '16px'
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default MetricCard;