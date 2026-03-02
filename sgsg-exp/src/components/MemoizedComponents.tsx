import React, { memo } from 'react';
import { Card, Badge } from 'antd-mobile';
import { formatDateTime, formatCurrency } from '../utils/formatters';
import { getOrderStatusText, getOrderStatusColor } from '../utils/status';

// 최적화된 주문 카드 컴포넌트
interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    serviceItem: {
      name: string;
      category: {
        name: string;
      };
    };
    customer: {
      name: string;
    };
    requestedDate: string;
    status: string;
    totalAmount: number;
    address: {
      fullAddress: string;
    };
  };
  onClick: () => void;
}

export const MemoizedOrderCard = memo<OrderCardProps>(({ order, onClick }) => {
  return (
    <Card className="order-card" key={order.id} onClick={onClick}>
      <div className="order-header">
        <div className="order-info">
          <div className="order-number">#{order.orderNumber}</div>
          <Badge 
            content={getOrderStatusText(order.status)}
            style={{ 
              background: getOrderStatusColor(order.status),
              fontSize: '11px'
            }}
          />
        </div>
        <div className="order-amount">{formatCurrency(order.totalAmount)}</div>
      </div>

      <div className="order-service">
        <h3>{order.serviceItem.name}</h3>
        <div className="service-category">{order.serviceItem.category.name}</div>
      </div>

      <div className="order-details">
        <div className="detail-item">
          <span>{order.customer.name}</span>
        </div>
        <div className="detail-item">
          <span>{formatDateTime(order.requestedDate)}</span>
        </div>
        <div className="detail-item">
          <span>{order.address.fullAddress}</span>
        </div>
      </div>
    </Card>
  );
});

MemoizedOrderCard.displayName = 'MemoizedOrderCard';

// 최적화된 리뷰 카드 컴포넌트
interface ReviewCardProps {
  review: {
    id: string;
    customer: {
      name: string;
      profileImage?: string;
    };
    rating: number;
    content?: string;
    createdAt: string;
    order: {
      orderNumber: string;
      serviceItem: {
        name: string;
        category: {
          name: string;
        };
      };
    };
    response?: string;
    respondedAt?: string;
  };
  onResponse: () => void;
}

export const MemoizedReviewCard = memo<ReviewCardProps>(({ review, onResponse }) => {
  return (
    <Card className="review-card">
      <div className="review-header">
        <div className="customer-info">
          <div className="customer-avatar">
            {review.customer.profileImage ? (
              <img src={review.customer.profileImage} alt={review.customer.name} />
            ) : (
              <div>{review.customer.name[0]}</div>
            )}
          </div>
          <div className="customer-details">
            <div className="customer-name">{review.customer.name}</div>
            <div className="review-date">{formatDateTime(review.createdAt)}</div>
          </div>
        </div>
        <div className="review-rating">
          ⭐ {review.rating}
        </div>
      </div>

      <div className="review-service">
        <span>{review.order.serviceItem.category.name}</span>
        <span>•</span>
        <span>{review.order.serviceItem.name}</span>
        <span>•</span>
        <span>#{review.order.orderNumber}</span>
      </div>

      {review.content && (
        <div className="review-content">
          {review.content}
        </div>
      )}

      {review.response && (
        <div className="review-response">
          <div className="response-header">
            <span>내 답변</span>
            <span>{formatDateTime(review.respondedAt!)}</span>
          </div>
          <div className="response-content">{review.response}</div>
        </div>
      )}

      <div className="review-actions">
        <button onClick={onResponse}>
          {review.response ? '답변 수정' : '답변 작성'}
        </button>
      </div>
    </Card>
  );
});

MemoizedReviewCard.displayName = 'MemoizedReviewCard';