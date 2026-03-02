import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Toast,
  Badge,
  PullToRefresh,
  SearchBar
} from 'antd-mobile';
import {
  CalendarOutline,
  ClockCircleOutline,
  LocationOutline,
  EditSOutline,
  DeleteOutline
} from 'antd-mobile-icons';
import { dayjs } from 'dayjs';

interface Schedule {
  id: string;
  orderId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  order: {
    id: string;
    orderNumber: string;
    serviceItem: {
      name: string;
    };
    customer: {
      user: {
        name: string;
        phone: string;
      };
    };
    address: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
    };
  };
}

interface ScheduleManagerProps {
  authToken: string;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ authToken }) => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const apiHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const fetchSchedules = async (date?: string) => {
    try {
      setLoading(true);
      const url = date 
        ? `http://localhost:4001/api/v1/experts/me/schedule?date=${date}`
        : 'http://localhost:4001/api/v1/experts/me/schedule';
        
      const response = await fetch(url, { headers: apiHeaders });
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data.data || []);
        setFilteredSchedules(data.data.data || []);
      } else {
        Toast.show('스케줄 로딩 실패');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Schedules fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (scheduleId: string, updateData: {
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    status?: string;
  }) => {
    try {
      const response = await fetch(`http://localhost:4001/api/v1/experts/me/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        Toast.show('스케줄이 업데이트되었습니다.');
        fetchSchedules(selectedDate);
        setEditModalVisible(false);
      } else {
        Toast.show(data.error?.message || '업데이트에 실패했습니다.');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Schedule update error:', error);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`http://localhost:4001/api/v1/experts/me/schedule/${scheduleId}`, {
        method: 'DELETE',
        headers: apiHeaders
      });

      const data = await response.json();

      if (data.success) {
        Toast.show('스케줄이 삭제되었습니다.');
        fetchSchedules(selectedDate);
      } else {
        Toast.show(data.error?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Schedule delete error:', error);
    }
  };

  useEffect(() => {
    fetchSchedules(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!searchText) {
      setFilteredSchedules(schedules);
    } else {
      const filtered = schedules.filter(schedule =>
        schedule.order.customer.user.name.includes(searchText) ||
        schedule.order.serviceItem.name.includes(searchText) ||
        schedule.order.orderNumber.includes(searchText) ||
        schedule.order.address.addressLine1.includes(searchText)
      );
      setFilteredSchedules(filtered);
    }
  }, [searchText, schedules]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <CalendarOutline />;
      case 'in_progress': return <ClockCircleOutline />;
      case 'completed': return <CheckCircleOutline />;
      default: return <ClockCircleOutline />;
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setEditModalVisible(true);
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    Modal.confirm({
      title: '스케줄 삭제',
      content: '정말로 이 스케줄을 삭제하시겠습니까?',
      onConfirm: () => deleteSchedule(schedule.id)
    });
  };

  const handleEditSubmit = (values: any) => {
    if (!selectedSchedule) return;
    
    const updateData: any = {};
    if (values.scheduledDate) updateData.scheduledDate = values.scheduledDate;
    if (values.startTime) updateData.startTime = values.startTime;
    if (values.endTime) updateData.endTime = values.endTime;
    if (values.notes !== undefined) updateData.notes = values.notes;
    if (values.status) updateData.status = values.status;

    updateSchedule(selectedSchedule.id, updateData);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card title="📅 스케줄 관리" style={{ marginBottom: '16px' }}>
        {/* 날짜 선택 */}
        <div style={{ marginBottom: '12px' }}>
          <DatePicker
            value={new Date(selectedDate)}
            onSelect={(date) => setSelectedDate(date.toISOString().split('T')[0])}
          >
            {(value) => (
              <Button size="small">
                📅 {value ? dayjs(value).format('YYYY-MM-DD') : '날짜 선택'}
              </Button>
            )}
          </DatePicker>
        </div>

        {/* 검색 */}
        <SearchBar
          placeholder="고객명, 서비스명, 주소로 검색"
          value={searchText}
          onChange={setSearchText}
          style={{ marginBottom: '12px' }}
        />
      </Card>

      {/* 스케줄 목록 */}
      <PullToRefresh onRefresh={() => fetchSchedules(selectedDate)} loading={loading}>
        {filteredSchedules.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              {searchText ? '🔍 검색 결과가 없습니다.' : '📭 해당 날짜에 스케줄이 없습니다.'}
            </div>
          </Card>
        ) : (
          <List>
            {filteredSchedules.map((schedule) => (
              <List.Item
                key={schedule.id}
                prefix={getStatusIcon(schedule.status)}
                extra={
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="mini"
                      color="primary"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <EditSOutline />
                    </Button>
                    <Button
                      size="mini"
                      color="danger"
                      onClick={() => handleDeleteSchedule(schedule)}
                      disabled={schedule.status === 'in_progress' || schedule.status === 'completed'}
                    >
                      <DeleteOutline />
                    </Button>
                  </div>
                }
                description={
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <Badge color={getStatusColor(schedule.status)} content={getStatusText(schedule.status)} />
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                        {schedule.order.orderNumber}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <LocationOutline style={{ marginRight: '4px' }} />
                      {schedule.order.address.addressLine1}, {schedule.order.address.city}
                    </div>
                    {schedule.notes && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        💬 {schedule.notes}
                      </div>
                    )}
                  </div>
                }
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {schedule.order.customer.user.name} · {schedule.order.serviceItem.name}
                  </div>
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </PullToRefresh>

      {/* 편집 모달 */}
      <Modal
        visible={editModalVisible}
        title="스케줄 편집"
        onClose={() => setEditModalVisible(false)}
        content={
          selectedSchedule && (
            <Form
              onFinish={handleEditSubmit}
              footer={
                <Button block type="submit" color="primary">
                  저장
                </Button>
              }
            >
              <Form.Item name="scheduledDate" label="날짜">
                <DatePicker />
              </Form.Item>
              <Form.Item name="startTime" label="시작 시간">
                <TimePicker />
              </Form.Item>
              <Form.Item name="endTime" label="종료 시간">  
                <TimePicker />
              </Form.Item>
              <Form.Item name="notes" label="메모">
                <Input.TextArea placeholder="메모를 입력하세요" maxLength={200} />
              </Form.Item>
            </Form>
          )
        }
      />
    </div>
  );
};

export default ScheduleManager;