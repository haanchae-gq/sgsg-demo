import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Badge,
  ProgressBar,
  Toast,
  PullToRefresh,
  Grid
} from 'antd-mobile';
import {
  CrownOutline,
  UserContactOutline,
  TagOutline,
  LocationOutline,
  CalendarOutline
} from 'antd-mobile-icons';

interface AssignmentLimit {
  dailyAssignmentLimit: number;
  todayAssignmentCount: number;
  remainingLimit: number;
  isLimitReached: boolean;
  policy?: {
    id: string;
    effectiveFrom: string;
    effectiveTo?: string;
    isActive: boolean;
  };
}

interface MembershipInfo {
  membershipEnabled: boolean;
  membershipSlotCount: number;
  serviceCategoryMidAvailableList: string[];
  usedSlots: number;
  availableSlots: number;
  masterMemberships: any[];
}

interface MembershipDashboardProps {
  authToken: string;
}

const MembershipDashboard: React.FC<MembershipDashboardProps> = ({ authToken }) => {
  const [loading, setLoading] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [assignmentLimit, setAssignmentLimit] = useState<AssignmentLimit | null>(null);

  const apiHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const fetchMembershipData = async () => {
    try {
      setLoading(true);

      const [membershipResponse, limitResponse] = await Promise.all([
        fetch('http://localhost:4001/api/v1/experts/me/membership', { headers: apiHeaders }),
        fetch('http://localhost:4001/api/v1/experts/me/daily-assignment-limit', { headers: apiHeaders })
      ]);

      const [membershipData, limitData] = await Promise.all([
        membershipResponse.json(),
        limitResponse.json()
      ]);

      if (membershipData.success) {
        setMembershipInfo(membershipData.data);
      }

      if (limitData.success) {
        setAssignmentLimit(limitData.data);
      }
    } catch (error) {
      Toast.show('데이터 로딩 중 오류가 발생했습니다.');
      console.error('Membership data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const getSlotUsageColor = (usedSlots: number, totalSlots: number) => {
    const usage = totalSlots > 0 ? usedSlots / totalSlots : 0;
    if (usage >= 1) return '#f5222d'; // 빨간색 (100%)
    if (usage >= 0.8) return '#faad14'; // 노란색 (80% 이상)
    return '#52c41a'; // 초록색 (여유)
  };

  const getAssignmentLimitColor = (current: number, limit: number) => {
    if (limit === 0) return '#d9d9d9';
    const usage = current / limit;
    if (usage >= 1) return '#f5222d';
    if (usage >= 0.8) return '#faad14';
    return '#52c41a';
  };

  return (
    <PullToRefresh onRefresh={fetchMembershipData} loading={loading}>
      <div style={{ padding: '16px' }}>
        {/* 멤버십 상태 */}
        <Card title="💳 멤버십 정보" style={{ marginBottom: '16px' }}>
          {membershipInfo ? (
            <>
              <List>
                <List.Item
                  prefix={<CrownOutline />}
                  extra={
                    <Badge
                      color={membershipInfo.membershipEnabled ? 'success' : 'default'}
                      content={membershipInfo.membershipEnabled ? '활성' : '비활성'}
                    />
                  }
                >
                  멤버십 상태
                </List.Item>
                
                <List.Item
                  prefix={<UserContactOutline />}
                  extra={`${membershipInfo.usedSlots} / ${membershipInfo.membershipSlotCount}`}
                >
                  <div>
                    <div>서브 계정 슬롯</div>
                    <div style={{ marginTop: '8px' }}>
                      <ProgressBar
                        percent={(membershipInfo.membershipSlotCount > 0 ? membershipInfo.usedSlots / membershipInfo.membershipSlotCount : 0) * 100}
                        style={{
                          '--fill-color': getSlotUsageColor(membershipInfo.usedSlots, membershipInfo.membershipSlotCount)
                        }}
                      />
                    </div>
                  </div>
                </List.Item>

                <List.Item prefix={<TagOutline />}>
                  <div>
                    <div style={{ marginBottom: '8px' }}>가능한 서비스</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {membershipInfo.serviceCategoryMidAvailableList.length > 0
                        ? membershipInfo.serviceCategoryMidAvailableList.join(', ')
                        : '설정된 서비스가 없습니다'}
                    </div>
                  </div>
                </List.Item>
              </List>

              {membershipInfo.masterMemberships.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4>🏆 마스터 멤버십 상세</h4>
                  {membershipInfo.masterMemberships.map((membership, index) => (
                    <Card key={index} style={{ marginTop: '8px', background: '#f8f9fa' }}>
                      <List>
                        <List.Item extra={membership.membershipStatus}>
                          멤버십 상태
                        </List.Item>
                        <List.Item extra={new Date(membership.startDate).toLocaleDateString()}>
                          시작일
                        </List.Item>
                        {membership.endDate && (
                          <List.Item extra={new Date(membership.endDate).toLocaleDateString()}>
                            종료일
                          </List.Item>
                        )}
                      </List>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              멤버십 정보를 로딩 중입니다...
            </div>
          )}
        </Card>

        {/* 일일 배정 한도 */}
        <Card title="🎯 일일 배정 한도" style={{ marginBottom: '16px' }}>
          {assignmentLimit ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>오늘 배정 현황</span>
                  <span>
                    <strong>{assignmentLimit.todayAssignmentCount}</strong> / {assignmentLimit.dailyAssignmentLimit}
                  </span>
                </div>
                <ProgressBar
                  percent={assignmentLimit.dailyAssignmentLimit > 0 
                    ? (assignmentLimit.todayAssignmentCount / assignmentLimit.dailyAssignmentLimit) * 100 
                    : 0}
                  style={{
                    '--fill-color': getAssignmentLimitColor(assignmentLimit.todayAssignmentCount, assignmentLimit.dailyAssignmentLimit)
                  }}
                />
              </div>

              <Grid columns={3} gap={8}>
                <Grid.Item>
                  <div style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                      {assignmentLimit.dailyAssignmentLimit}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>일일 한도</div>
                  </div>
                </Grid.Item>
                <Grid.Item>
                  <div style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                      {assignmentLimit.todayAssignmentCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>오늘 배정</div>
                  </div>
                </Grid.Item>
                <Grid.Item>
                  <div style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: assignmentLimit.isLimitReached ? '#f5222d' : '#52c41a' }}>
                      {assignmentLimit.remainingLimit}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>남은 한도</div>
                  </div>
                </Grid.Item>
              </Grid>

              {assignmentLimit.isLimitReached && (
                <div style={{
                  background: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: '6px',
                  padding: '12px',
                  marginTop: '12px',
                  textAlign: 'center'
                }}>
                  ⚠️ 오늘의 배정 한도에 도달했습니다.
                </div>
              )}

              {assignmentLimit.policy && (
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                  <CalendarOutline style={{ marginRight: '4px' }} />
                  정책 기간: {new Date(assignmentLimit.policy.effectiveFrom).toLocaleDateString()}
                  {assignmentLimit.policy.effectiveTo && ` - ${new Date(assignmentLimit.policy.effectiveTo).toLocaleDateString()}`}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              배정 한도 정보를 로딩 중입니다...
            </div>
          )}
        </Card>
      </div>
    </PullToRefresh>
  );
};

export default MembershipDashboard;