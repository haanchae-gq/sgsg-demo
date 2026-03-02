import React from 'react';
import { Card, Table, Tag, Avatar, Button, Space } from 'antd';
import { EyeOutlined, UserOutlined } from '@ant-design/icons';
import { formatDateTime, formatCurrency, getOrderStatusText, getOrderStatusColor } from '../../utils/formatters';
import type { Order } from '../../types';

interface RecentOrdersTableProps {
  data: Order[];
  loading?: boolean;
  onViewOrder?: (orderId: string) => void;
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  data,
  loading = false,
  onViewOrder
}) => {
  const columns = [
    {
      title: '주문번호',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (orderNumber: string) => (
        <span style={{ fontWeight: '500', color: '#1890ff' }}>
          {orderNumber}
        </span>
      ),
    },
    {
      title: '고객',
      dataIndex: 'customer',
      key: 'customer',
      width: 150,
      render: (customer: any) => (
        <Space size={8}>
          <Avatar 
            size={24} 
            src={customer?.profileImage} 
            icon={<UserOutlined />}
          />
          <span>{customer?.name || '-'}</span>
        </Space>
      ),
    },
    {
      title: '서비스',
      dataIndex: 'service',
      key: 'service',
      width: 200,
      render: (service: any) => service?.name || '-',
    },
    {
      title: '전문가',
      dataIndex: 'expert',
      key: 'expert',
      width: 120,
      render: (expert: any) => expert?.name || '배정 대기',
    },
    {
      title: '금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ fontWeight: '500' }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={getOrderStatusColor(status)}>
          {getOrderStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '주문일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '액션',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_, record: Order) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewOrder?.(record.id)}
          title="주문 상세보기"
        />
      ),
    },
  ];

  return (
    <Card 
      title="최근 주문" 
      bordered={false}
      style={{ borderRadius: '8px' }}
      extra={
        <Button type="link" size="small">
          전체 보기
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 900 }}
        rowKey="id"
        locale={{
          emptyText: '최근 주문이 없습니다'
        }}
      />
    </Card>
  );
};

export default RecentOrdersTable;