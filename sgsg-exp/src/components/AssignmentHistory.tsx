import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Badge,
  Toast,
  PullToRefresh,
  SearchBar,
  Selector,
  DatePicker,
  Button,
  InfiniteScroll
} from 'antd-mobile';
import {
  ClockCircleOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  UserContactOutline,
  FilterOutline
} from 'antd-mobile-icons';

interface AssignmentHistoryItem {
  id: string;
  orderId: string;
  assignedMasterId: string;
  assignedWorkerId?: string;
  assignmentType: string;
  assignmentResultStatus: string;
  isMembershipAssignment: boolean;
  membershipSlotCountAtTime: number;
  weightAtTime: number;
  serviceMidAtTime: string;
  regionGroupAtTime: string;
  assignedAt: string;
  respondedAt?: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    serviceItem: {
      name: string;
    };
    customer: {
      user: {
        name: string;
      };
    };
  };
  assignedWorker?: {
    id: string;
    user: {
      name: string;
    };
  };
}

interface AssignmentHistoryProps {
  authToken: string;
}

const AssignmentHistory: React.FC<AssignmentHistoryProps> = ({ authToken }) => {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentHistoryItem[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentHistoryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    assignmentType: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const apiHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const fetchAssignments = async (pageNum = 1, resetData = true) => {
    try {
      if (resetData) setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      });
      
      if (filters.assignmentType) queryParams.append('assignmentType', filters.assignmentType);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`http://localhost:4001/api/v1/experts/me/assignment-history?${queryParams}`, {
        headers: apiHeaders
      });
      const data = await response.json();

      if (data.success) {
        const newAssignments = data.data.histories || [];
        if (resetData) {
          setAssignments(newAssignments);
          setFilteredAssignments(newAssignments);
        } else {
          setAssignments(prev => [...prev, ...newAssignments]);
          setFilteredAssignments(prev => [...prev, ...newAssignments]);
        }
        
        setHasMore(newAssignments.length === 20);
        setPage(pageNum);
      } else {
        Toast.show('배정 이력 로딩 실패');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Assignment history fetch error:', error);
    } finally {
      if (resetData) setLoading(false);
    }
  };

  const loadMore = async () => {
    await fetchAssignments(page + 1, false);
  };

  useEffect(() => {
    fetchAssignments(1, true);
  }, [filters]);

  useEffect(() => {
    if (!searchText) {
      setFilteredAssignments(assignments);
    } else {
      const filtered = assignments.filter(assignment =>
        assignment.order.customer.user.name.includes(searchText) ||
        assignment.order.orderNumber.includes(searchText) ||
        assignment.order.serviceItem.name.includes(searchText) ||
        assignment.serviceMidAtTime.includes(searchText) ||
        assignment.regionGroupAtTime.includes(searchText) ||
        (assignment.assignedWorker && assignment.assignedWorker.user.name.includes(searchText))
      );
      setFilteredAssignments(filtered);
    }
  }, [searchText, assignments]);

  const getAssignmentTypeText = (type: string) => {
    switch (type) {
      case 'AUTO_ASSIGN': return '자동배정';
      case 'MANUAL_ASSIGN': return '수동배정';
      case 'REASSIGN': return '재배정';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'danger';  
      case 'TIMEOUT': return 'warning';
      case 'HOLD': return 'default';
      case 'SENT': return 'primary';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return '수락';
      case 'REJECTED': return '거절';
      case 'TIMEOUT': return '시간초과';
      case 'HOLD': return '보류';
      case 'SENT': return '발송됨';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircleOutline />;
      case 'REJECTED': return <CloseCircleOutline />;
      case 'TIMEOUT': return <ClockCircleOutline />;
      default: return <ClockCircleOutline />;
    }
  };

  const assignmentTypeOptions = [
    { label: '전체', value: '' },
    { label: '자동배정', value: 'AUTO_ASSIGN' },
    { label: '수동배정', value: 'MANUAL_ASSIGN' },
    { label: '재배정', value: 'REASSIGN' }
  ];

  const statusOptions = [
    { label: '전체', value: '' },
    { label: '수락', value: 'ACCEPTED' },
    { label: '거절', value: 'REJECTED' },
    { label: '시간초과', value: 'TIMEOUT' },
    { label: '보류', value: 'HOLD' },
    { label: '발송됨', value: 'SENT' }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* 필터 및 검색 */}
      <Card title="📊 배정 이력" style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <Button
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            style={{ marginBottom: '8px' }}
          >
            <FilterOutline /> 필터 {showFilters ? '숨기기' : '보기'}
          </Button>
        </div>

        {showFilters && (
          <div style={{ marginBottom: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>배정 유형</span>
              <Selector
                options={assignmentTypeOptions}
                value={[filters.assignmentType]}
                onChange={(val) => setFilters(prev => ({ ...prev, assignmentType: val[0] || '' }))}
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>상태</span>
              <Selector
                options={statusOptions}
                value={[filters.status]}
                onChange={(val) => setFilters(prev => ({ ...prev, status: val[0] || '' }))}
              />
            </div>
          </div>
        )}

        <SearchBar
          placeholder="주문번호, 고객명, 서비스명으로 검색"
          value={searchText}
          onChange={setSearchText}
        />
      </Card>

      {/* 배정 이력 목록 */}
      <PullToRefresh onRefresh={() => fetchAssignments(1, true)} loading={loading}>
        {filteredAssignments.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              {searchText ? '🔍 검색 결과가 없습니다.' : '📋 배정 이력이 없습니다.'}
            </div>
          </Card>
        ) : (
          <List>
            {filteredAssignments.map((assignment) => (
              <List.Item
                key={assignment.id}
                prefix={getStatusIcon(assignment.assignmentResultStatus)}
                extra={
                  <div style={{ textAlign: 'right' }}>
                    <Badge
                      color={getStatusColor(assignment.assignmentResultStatus)}
                      content={getStatusText(assignment.assignmentResultStatus)}
                    />
                    {assignment.isMembershipAssignment && (
                      <div style={{ fontSize: '10px', color: '#1890ff', marginTop: '2px' }}>
                        💎 멤버십
                      </div>
                    )}
                  </div>
                }
                description={
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      {assignment.order.orderNumber} · {getAssignmentTypeText(assignment.assignmentType)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      🏷️ {assignment.serviceMidAtTime} · 📍 {assignment.regionGroupAtTime}
                    </div>
                    {assignment.assignedWorker && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        <UserContactOutline style={{ marginRight: '4px' }} />
                        작업자: {assignment.assignedWorker.user.name}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      배정: {new Date(assignment.assignedAt).toLocaleString()}
                      {assignment.respondedAt && ` · 응답: ${new Date(assignment.respondedAt).toLocaleString()}`}
                    </div>
                  </div>
                }
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {assignment.order.customer.user.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#333' }}>
                    {assignment.order.serviceItem.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    가중치: {assignment.weightAtTime} · 슬롯: {assignment.membershipSlotCountAtTime}
                  </div>
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </PullToRefresh>

      {!loading && hasMore && (
        <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            더 많은 데이터 로딩 중...
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
};

export default AssignmentHistory;