import React, { useState } from 'react';
import { Calendar as AntdCalendar, Card, List, Badge } from 'antd-mobile';
import { CalendarOutline, ClockCircleOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime, formatDate } from '../../utils/formatters';
import api from '../../services/api';
import dayjs from 'dayjs';
import './Calendar.css';

interface ScheduleOrder {
  id: string;
  orderNumber: string;
  serviceItem: {
    name: string;
  };
  customer: {
    name: string;
  };
  requestedDate: string;
  status: string;
  address: {
    fullAddress: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 일정이 있는 날짜 조회
  const { data: scheduledOrders } = useQuery({
    queryKey: ['orders', 'scheduled'],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: {
          status: 'scheduled,in_progress',
          limit: 100
        }
      });
      return response.data.data.items;
    }
  });

  // 선택된 날짜의 주문들
  const selectedDateOrders = scheduledOrders?.filter((order: ScheduleOrder) => 
    dayjs(order.requestedDate).format('YYYY-MM-DD') === dayjs(selectedDate).format('YYYY-MM-DD')
  ) || [];

  return (
    <div className="calendar-container">
      <div className="calendar-section">
        <AntdCalendar
          value={selectedDate}
          onChange={(date) => setSelectedDate(date || new Date())}
          renderDate={(date) => {
            const hasSchedule = scheduledOrders?.some((order: ScheduleOrder) => 
              dayjs(order.requestedDate).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
            );

            return (
              <div className="calendar-date">
                <span>{date.getDate()}</span>
                {hasSchedule && <div className="schedule-dot" />}
              </div>
            );
          }}
        />
      </div>

      <div className="schedule-section">
        <div className="schedule-header">
          <h3>{formatDate(selectedDate)} 일정</h3>
          <div className="schedule-count">
            {selectedDateOrders.length}건의 예약
          </div>
        </div>

        {selectedDateOrders.length === 0 ? (
          <div className="empty-schedule">
            <CalendarOutline fontSize={48} color="#ccc" />
            <p>선택한 날짜에 일정이 없습니다</p>
          </div>
        ) : (
          <List>
            {selectedDateOrders.map((order: ScheduleOrder) => (
              <List.Item
                key={order.id}
                prefix={<ClockCircleOutline />}
                description={
                  <div className="order-details">
                    <div>고객: {order.customer.name}</div>
                    <div>주소: {order.address.fullAddress}</div>
                  </div>
                }
                extra={
                  <Badge
                    content={order.status === 'in_progress' ? '진행중' : '예정'}
                    color={order.status === 'in_progress' ? '#52c41a' : '#1890ff'}
                  />
                }
              >
                <div className="order-info">
                  <div className="service-name">{order.serviceItem.name}</div>
                  <div className="order-time">{formatDateTime(order.requestedDate)}</div>
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </div>
    </div>
  );
};

export default Calendar;