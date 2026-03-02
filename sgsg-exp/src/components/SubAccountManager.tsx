import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Selector,
  Toast,
  Badge,
  PullToRefresh,
  SearchBar
} from 'antd-mobile';
import {
  UserContactOutline,
  AddOutline,
  EditSOutline,
  PhoneOutline,
  MailOutline
} from 'antd-mobile-icons';

interface SubAccount {
  id: string;
  masterAccountId: string;
  userId: string;
  accountType: string;
  approvalStatus: string;
  activeStatus: string;
  permissions: string[];
  assignedWorkerId?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
  };
}

interface SubAccountManagerProps {
  authToken: string;
}

const SubAccountManager: React.FC<SubAccountManagerProps> = ({ authToken }) => {
  const [loading, setLoading] = useState(false);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<SubAccount[]>([]);
  const [searchText, setSearchText] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SubAccount | null>(null);

  const apiHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const fetchSubAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4001/api/v1/experts/me/sub-accounts', {
        headers: apiHeaders
      });
      const data = await response.json();

      if (data.success) {
        setSubAccounts(data.data.data || []);
        setFilteredAccounts(data.data.data || []);
      } else {
        Toast.show('서브 계정 로딩 실패');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Sub accounts fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubAccount = async (values: any) => {
    try {
      const response = await fetch('http://localhost:4001/api/v1/experts/me/sub-accounts', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        Toast.show('서브 계정이 생성되었습니다.');
        setCreateModalVisible(false);
        fetchSubAccounts();
      } else {
        Toast.show(data.error?.message || '생성에 실패했습니다.');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Sub account create error:', error);
    }
  };

  const updateSubAccount = async (accountId: string, updateData: {
    activeStatus?: string;
    permissions?: string[];
    assignedWorkerId?: string;
  }) => {
    try {
      const response = await fetch(`http://localhost:4001/api/v1/experts/me/sub-accounts/${accountId}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        Toast.show('서브 계정이 업데이트되었습니다.');
        setEditModalVisible(false);
        fetchSubAccounts();
      } else {
        Toast.show(data.error?.message || '업데이트에 실패했습니다.');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Sub account update error:', error);
    }
  };

  useEffect(() => {
    fetchSubAccounts();
  }, []);

  useEffect(() => {
    if (!searchText) {
      setFilteredAccounts(subAccounts);
    } else {
      const filtered = subAccounts.filter(account =>
        account.user.name.includes(searchText) ||
        account.user.email.includes(searchText) ||
        account.user.phone.includes(searchText) ||
        (account.assignedWorkerId && account.assignedWorkerId.includes(searchText))
      );
      setFilteredAccounts(filtered);
    }
  }, [searchText, subAccounts]);

  const getStatusColor = (activeStatus: string, userStatus: string) => {
    if (userStatus === 'active' && activeStatus === 'ACTIVE') return 'success';
    if (activeStatus === 'INACTIVE') return 'warning';
    return 'default';
  };

  const getStatusText = (activeStatus: string, userStatus: string) => {
    if (userStatus === 'active' && activeStatus === 'ACTIVE') return '활성';
    if (activeStatus === 'INACTIVE') return '비활성';
    if (userStatus === 'pending') return '승인 대기';
    return '알 수 없음';
  };

  const permissionOptions = [
    { label: '스케줄 관리', value: 'schedule_management' },
    { label: '주문 조회', value: 'order_view' },
    { label: '주문 관리', value: 'order_management' },
    { label: '고객 연락', value: 'customer_contact' },
    { label: '결제 조회', value: 'payment_view' }
  ];

  const handleCreateSubmit = (values: any) => {
    createSubAccount({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      permissions: values.permissions || [],
      assignedWorkerId: values.assignedWorkerId
    });
  };

  const handleEditSubmit = (values: any) => {
    if (!selectedAccount) return;

    const updateData: any = {};
    if (values.activeStatus !== undefined) updateData.activeStatus = values.activeStatus ? 'ACTIVE' : 'INACTIVE';
    if (values.permissions) updateData.permissions = values.permissions;
    if (values.assignedWorkerId) updateData.assignedWorkerId = values.assignedWorkerId;

    updateSubAccount(selectedAccount.id, updateData);
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* 헤더 및 추가 버튼 */}
      <Card title="👥 서브 계정 관리" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span>총 {subAccounts.length}개의 서브 계정</span>
          <Button
            color="primary"
            size="small"
            onClick={() => setCreateModalVisible(true)}
          >
            <AddOutline /> 계정 추가
          </Button>
        </div>

        {/* 검색 */}
        <SearchBar
          placeholder="이름, 이메일, 전화번호로 검색"
          value={searchText}
          onChange={setSearchText}
        />
      </Card>

      {/* 서브 계정 목록 */}
      <PullToRefresh onRefresh={fetchSubAccounts} loading={loading}>
        {filteredAccounts.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              {searchText ? '🔍 검색 결과가 없습니다.' : '👥 등록된 서브 계정이 없습니다.'}
            </div>
          </Card>
        ) : (
          <List>
            {filteredAccounts.map((account) => (
              <List.Item
                key={account.id}
                prefix={<UserContactOutline />}
                extra={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge
                      color={getStatusColor(account.activeStatus, account.user.status)}
                      content={getStatusText(account.activeStatus, account.user.status)}
                    />
                    <Button
                      size="mini"
                      color="primary"
                      onClick={() => {
                        setSelectedAccount(account);
                        setEditModalVisible(true);
                      }}
                    >
                      <EditSOutline />
                    </Button>
                  </div>
                }
                description={
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <MailOutline style={{ marginRight: '4px', fontSize: '12px' }} />
                      <span style={{ fontSize: '12px', color: '#666' }}>{account.user.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <PhoneOutline style={{ marginRight: '4px', fontSize: '12px' }} />
                      <span style={{ fontSize: '12px', color: '#666' }}>{account.user.phone}</span>
                    </div>
                    {account.assignedWorkerId && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        작업자 ID: {account.assignedWorkerId}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      권한: {account.permissions.length}개 ({account.permissions.slice(0, 2).join(', ')}{account.permissions.length > 2 ? '...' : ''})
                    </div>
                  </div>
                }
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {account.user.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    생성일: {new Date(account.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </PullToRefresh>

      {/* 계정 생성 모달 */}
      <Modal
        visible={createModalVisible}
        title="서브 계정 생성"
        onClose={() => setCreateModalVisible(false)}
        content={
          <Form
            onFinish={handleCreateSubmit}
            footer={
              <Button block type="submit" color="primary">
                생성하기
              </Button>
            }
          >
            <Form.Item name="name" label="이름" required>
              <Input placeholder="서브 계정 사용자 이름" />
            </Form.Item>
            <Form.Item name="email" label="이메일" required>
              <Input placeholder="이메일 주소" type="email" />
            </Form.Item>
            <Form.Item name="phone" label="전화번호" required>
              <Input placeholder="010-0000-0000" />
            </Form.Item>
            <Form.Item name="password" label="비밀번호" required>
              <Input placeholder="비밀번호 (8자 이상)" type="password" />
            </Form.Item>
            <Form.Item name="permissions" label="권한 설정">
              <Selector
                options={permissionOptions}
                multiple
                defaultValue={[]}
              />
            </Form.Item>
            <Form.Item name="assignedWorkerId" label="작업자 ID">
              <Input placeholder="할당된 작업자 ID (선택사항)" />
            </Form.Item>
          </Form>
        }
      />

      {/* 계정 편집 모달 */}
      <Modal
        visible={editModalVisible}
        title="서브 계정 편집"
        onClose={() => setEditModalVisible(false)}
        content={
          selectedAccount && (
            <Form
              initialValues={{
                activeStatus: selectedAccount.activeStatus === 'ACTIVE',
                permissions: selectedAccount.permissions,
                assignedWorkerId: selectedAccount.assignedWorkerId
              }}
              onFinish={handleEditSubmit}
              footer={
                <Button block type="submit" color="primary">
                  업데이트
                </Button>
              }
            >
              <Form.Item name="activeStatus" label="계정 활성화">
                <Switch />
              </Form.Item>
              <Form.Item name="permissions" label="권한 설정">
                <Selector
                  options={permissionOptions}
                  multiple
                  defaultValue={selectedAccount.permissions}
                />
              </Form.Item>
              <Form.Item name="assignedWorkerId" label="작업자 ID">
                <Input placeholder="할당된 작업자 ID" />
              </Form.Item>
            </Form>
          )
        }
      />
    </div>
  );
};

export default SubAccountManager;