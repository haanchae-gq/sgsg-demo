import React, { useState } from 'react';
import {
  Card,
  Space,
  Button,
  Grid,
  Calendar,
  Popup,
  Tag
} from 'antd-mobile';
import {
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface DateTimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  expertId?: string;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  expertId
}) => {
  const [calendarVisible, setCalendarVisible] = useState(false);
  
  // 빠른 선택 옵션
  const quickOptions = [
    { 
      label: '오늘', 
      value: dayjs().toDate(),
      disabled: dayjs().hour() >= 18 // 18시 이후 당일 예약 불가
    },
    { 
      label: '내일', 
      value: dayjs().add(1, 'day').toDate(),
      disabled: false
    },
    { 
      label: '모레', 
      value: dayjs().add(2, 'day').toDate(),
      disabled: false
    },
    { 
      label: '이번 주말', 
      value: getNextSaturday(),
      disabled: false
    }
  ];

  // 시간 선택 옵션 (9시-18시)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  function getNextSaturday() {
    const today = dayjs();
    const saturday = today.startOf('week').add(6, 'day');
    return saturday.isBefore(today) ? saturday.add(7, 'day').toDate() : saturday.toDate();
  }

  const formatSelectedDate = (date: Date) => {
    return dayjs(date).format('YYYY년 M월 D일 (ddd)');
  };

  const isDateDisabled = (date: Date) => {
    const today = dayjs().startOf('day');
    const targetDate = dayjs(date);
    
    // 과거 날짜 비활성화
    if (targetDate.isBefore(today)) return true;
    
    // 3개월 이후 비활성화
    if (targetDate.isAfter(today.add(3, 'month'))) return true;
    
    // TODO: 전문가별 불가능한 날짜 확인
    
    return false;
  };

  const isTimeDisabled = (time: string) => {
    if (!selectedDate) return true;
    
    const selectedDateTime = dayjs(selectedDate).hour(parseInt(time.split(':')[0]));
    const now = dayjs();
    
    // 현재 시간 이전 비활성화 (당일인 경우)
    if (selectedDateTime.isSame(now, 'day') && selectedDateTime.isBefore(now.add(2, 'hour'))) {
      return true;
    }
    
    // TODO: 전문가별 불가능한 시간 확인
    
    return false;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      
      {/* 날짜 선택 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined />
            날짜 선택
          </div>
        }
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          
          {/* 빠른 선택 */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>
              빠른 선택
            </div>
            <Grid columns={2} gap={8}>
              {quickOptions.map((option, index) => (
                <Grid.Item key={index}>
                  <Button
                    size="small"
                    fill={selectedDate && dayjs(selectedDate).isSame(option.value, 'day') ? 'solid' : 'outline'}
                    color={selectedDate && dayjs(selectedDate).isSame(option.value, 'day') ? 'primary' : 'default'}
                    onClick={() => !option.disabled && onDateSelect(option.value)}
                    disabled={option.disabled}
                    block
                  >
                    {option.label}
                  </Button>
                </Grid.Item>
              ))}
            </Grid>
          </div>

          {/* 선택된 날짜 표시 */}
          {selectedDate && (
            <div style={{ 
              padding: '12px', 
              background: '#f0f9ff',
              border: '1px solid #91d5ff',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#1890ff' }}>
                선택된 날짜: {formatSelectedDate(selectedDate)}
              </div>
            </div>
          )}

          {/* 달력 버튼 */}
          <Button 
            fill="outline" 
            block 
            onClick={() => setCalendarVisible(true)}
          >
            달력에서 다른 날짜 선택
          </Button>
        </Space>
      </Card>

      {/* 시간 선택 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockCircleOutlined />
            시간 선택
          </div>
        }
        style={{ 
          border: '1px solid #f0f0f0', 
          borderRadius: '12px',
          opacity: selectedDate ? 1 : 0.5
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          
          {!selectedDate && (
            <div style={{ 
              textAlign: 'center', 
              color: '#8c8c8c',
              fontSize: '14px',
              padding: '20px 0'
            }}>
              먼저 날짜를 선택해주세요
            </div>
          )}

          {selectedDate && (
            <>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                이용 가능한 시간
              </div>
              
              <Grid columns={3} gap={8}>
                {timeSlots.map((time) => (
                  <Grid.Item key={time}>
                    <Button
                      size="small"
                      fill={selectedTime === time ? 'solid' : 'outline'}
                      color={selectedTime === time ? 'primary' : 'default'}
                      onClick={() => !isTimeDisabled(time) && onTimeSelect(time)}
                      disabled={isTimeDisabled(time)}
                      block
                    >
                      {time}
                    </Button>
                  </Grid.Item>
                ))}
              </Grid>
              
              {selectedTime && (
                <div style={{ 
                  padding: '12px', 
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '14px', color: '#52c41a' }}>
                    선택된 시간: {selectedTime}
                  </div>
                </div>
              )}

              {/* 시간 선택 안내 */}
              <div style={{ 
                fontSize: '12px', 
                color: '#8c8c8c',
                padding: '8px',
                background: '#fafafa',
                borderRadius: '4px'
              }}>
                💡 서비스 시작 최소 2시간 전에 예약해주세요
              </div>
            </>
          )}
          
        </Space>
      </Card>

      {/* 달력 팝업 */}
      <Popup 
        visible={calendarVisible}
        onMaskClick={() => setCalendarVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0 }}>날짜 선택</h3>
            <Button 
              fill="none" 
              onClick={() => setCalendarVisible(false)}
              size="small"
            >
              ✕
            </Button>
          </div>

          <Calendar
            selectionMode="single"
            value={selectedDate}
            onChange={(date) => {
              if (date && !isDateDisabled(date)) {
                onDateSelect(date);
                setCalendarVisible(false);
              }
            }}
            shouldDisableDate={isDateDisabled}
          />
        </div>
      </Popup>
    </Space>
  );
};

export default DateTimeSelector;