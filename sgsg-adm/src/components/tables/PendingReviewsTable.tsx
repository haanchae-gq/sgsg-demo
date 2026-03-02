import React from 'react';
import { Card, Table, Tag, Avatar, Button, Space, Rate } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import type { Review } from '../../types';

interface PendingReviewsTableProps {
  data: Review[];
  loading?: boolean;
  onApproveReview?: (reviewId: string) => void;
  onRejectReview?: (reviewId: string) => void;
  onViewReview?: (reviewId: string) => void;
}

const PendingReviewsTable: React.FC<PendingReviewsTableProps> = ({
  data,
  loading = false,
  onApproveReview,
  onRejectReview,
  onViewReview
}) => {
  const columns = [
    {
      title: '고객',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
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
      title: '전문가',
      dataIndex: 'expert',
      key: 'expert',
      width: 120,
      render: (expert: any) => expert?.name || '-',
    },
    {
      title: '평점',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      align: 'center' as const,
      render: (rating: number) => (
        <Rate disabled defaultValue={rating} style={{ fontSize: '14px' }} />
      ),
    },
    {
      title: '리뷰 내용',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => content || '내용 없음',
    },
    {
      title: '작성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center' as const,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'orange', text: '승인 대기' },
          approved: { color: 'green', text: '승인됨' },
          rejected: { color: 'red', text: '거부됨' },
          reported: { color: 'volcano', text: '신고됨' }
        };
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return (
          <Tag color={statusInfo?.color}>
            {statusInfo?.text || status}
          </Tag>
        );
      },
    },
    {
      title: '액션',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_, record: Review) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            style={{ color: '#52c41a' }}
            onClick={() => onApproveReview?.(record.id)}
            title="승인"
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            danger
            onClick={() => onRejectReview?.(record.id)}
            title="거부"
          />
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="대기 중인 리뷰" 
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
        scroll={{ x: 700 }}
        rowKey="id"
        locale={{
          emptyText: '승인 대기 중인 리뷰가 없습니다'
        }}
      />
    </Card>
  );
};

export default PendingReviewsTable;