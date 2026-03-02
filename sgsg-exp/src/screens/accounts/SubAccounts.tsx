import React, { useState } from 'react';
import { 
  NavBar, 
  Card, 
  List, 
  Button, 
  Switch,
  Modal, 
  Form, 
  Input, 
  Picker,
  Toast,
  Badge,
  ActionSheet
} from 'antd-mobile';
import { 
  LeftOutline,
  AddOutline,
  UserOutline,
  EditSOutline,
  DeleteOutline,
  MoreOutline
} from 'antd-mobile-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import './SubAccounts.css';

interface SubAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'assistant' | 'manager';
  isActive: boolean;
  permissions: {
    viewOrders: boolean;
    acceptOrders: boolean;
    manageSchedule: boolean;
    viewEarnings: boolean;
    manageServices: boolean;
  };
  createdAt: string;
  lastLoginAt?: string;
}

const SubAccounts: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SubAccount | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [form] = Form.useForm();

  // 서브 계정 목록 조회
  const { data: subAccounts, isLoading } = useQuery({
    queryKey: ['sub-accounts'],
    queryFn: async () => {
      const response = await api.get('/experts/me/sub-accounts');
      return response.data.data.items as SubAccount[];
    }
  });

  // 서브 계정 추가
  const addAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/experts/me/sub-accounts', data);
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '서브 계정이 추가되었습니다' });
      setAddModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['sub-accounts'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '서브 계정 추가에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  // 서브 계정 업데이트
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<SubAccount>) => {
      return await api.put(`/experts/me/sub-accounts/${id}`, data);
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '서브 계정이 업데이트되었습니다' });
      setEditModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['sub-accounts'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '서브 계정 업데이트에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  // 서브 계정 삭제
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/experts/me/sub-accounts/${id}`);
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '서브 계정이 삭제되었습니다' });
      queryClient.invalidateQueries({ queryKey: ['sub-accounts'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '서브 계정 삭제에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  const handleToggleActive = (account: SubAccount) => {
    updateAccountMutation.mutate({
      id: account.id,
      isActive: !account.isActive
    });
  };

  const handleEditAccount = (account: SubAccount) => {
    setSelectedAccount(account);
    form.setFieldsValue({
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      permissions: account.permissions
    });
    setEditModalVisible(true);
  };

  const handleDeleteAccount = (account: SubAccount) => {
    Modal.confirm({
      title: '서브 계정 삭제',
      content: `${account.name} 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      onConfirm: () => deleteAccountMutation.mutate(account.id)
    });
  };

  const handleAccountAction = (account: SubAccount) => {
    setSelectedAccount(account);
    setActionSheetVisible(true);
  };

  const handleAddSubmit = (values: any) => {
    addAccountMutation.mutate({
      name: values.name,
      email: values.email,
      phone: values.phone,
      role: values.role,
      permissions: values.permissions || {
        viewOrders: false,
        acceptOrders: false,
        manageSchedule: false,
        viewEarnings: false,
        manageServices: false
      }
    });
  };

  const handleEditSubmit = (values: any) => {
    if (!selectedAccount) return;
    
    updateAccountMutation.mutate({
      id: selectedAccount.id,
      name: values.name,
      email: values.email,
      phone: values.phone,
      role: values.role,
      permissions: values.permissions
    });
  };

  const roleOptions = [
    { label: '어시스턴트 (제한적 권한)', value: 'assistant' },
    { label: '매니저 (전체 권한)', value: 'manager' }
  ];

  const actionSheetActions = [
    { text: '정보 수정', key: 'edit' },
    { text: '계정 삭제', key: 'delete', danger: true },
    { text: '취소', key: 'cancel' }
  ];

  const renderPermissionForm = (readOnly = false) => (
    <>
      <Form.Item name={['permissions', 'viewOrders']} label="주문 조회">
        <Switch disabled={readOnly} />
      </Form.Item>
      <Form.Item name={['permissions', 'acceptOrders']} label="주문 승낙/거절">
        <Switch disabled={readOnly} />
      </Form.Item>
      <Form.Item name={['permissions', 'manageSchedule']} label="일정 관리">
        <Switch disabled={readOnly} />
      </Form.Item>
      <Form.Item name={['permissions', 'viewEarnings']} label="정산 조회">
        <Switch disabled={readOnly} />
      </Form.Item>
      <Form.Item name={['permissions', 'manageServices']} label="서비스 관리">
        <Switch disabled={readOnly} />
      </Form.Item>
    </>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="서브 계정 정보를 불러오는 중..." />;
  }

  return (
    <div className="sub-accounts">
      <NavBar
        onBack={() => navigate(-1)}
        backIcon={<LeftOutline />}
        right={
          <Button
            fill="none"
            size="mini"
            onClick={() => setAddModalVisible(true)}
          >
            <AddOutline />
            추가
          </Button>
        }
      >
        서브 계정 관리
      </NavBar>

      <div className="accounts-content">
        <Card className="summary-card">
          <div className="summary-info">
            <div className="summary-item">
              <span className="summary-label">총 계정</span>
              <span className="summary-value">{subAccounts?.length || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">활성 계정</span>
              <span className="summary-value">
                {subAccounts?.filter(account => account.isActive).length || 0}
              </span>
            </div>
          </div>
        </Card>

        {!subAccounts || subAccounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>등록된 서브 계정이 없습니다</h3>
            <p>팀원들을 서브 계정으로 추가하여<br />업무를 효율적으로 분담하세요</p>
            <Button 
              color="primary" 
              onClick={() => setAddModalVisible(true)}
            >
              서브 계정 추가하기
            </Button>
          </div>
        ) : (
          <div className="accounts-list">
            {subAccounts.map((account) => (
              <Card key={account.id} className="account-card">
                <div className="account-header">
                  <div className="account-avatar">
                    <UserOutline />
                  </div>
                  <div className="account-info">
                    <div className="account-name">
                      {account.name}
                      <Badge 
                        content={account.role === 'manager' ? '매니저' : '어시스턴트'}
                        color={account.role === 'manager' ? 'primary' : 'default'}
                        style={{ marginLeft: 8 }}
                      />
                    </div>
                    <div className="account-email">{account.email}</div>
                    {account.phone && (
                      <div className="account-phone">{account.phone}</div>
                    )}
                  </div>
                  <div className="account-actions">
                    <Switch
                      checked={account.isActive}
                      onChange={() => handleToggleActive(account)}
                    />
                    <MoreOutline 
                      onClick={() => handleAccountAction(account)}
                      style={{ marginLeft: 12, cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div className="account-details">
                  <div className="account-meta">
                    <span>가입일: {formatDate(account.createdAt)}</span>
                    {account.lastLoginAt && (
                      <span>최근 로그인: {formatDate(account.lastLoginAt)}</span>
                    )}
                  </div>

                  <div className="permissions-summary">
                    <span className="permissions-label">권한:</span>
                    <div className="permissions-tags">
                      {account.permissions.viewOrders && <span>주문조회</span>}
                      {account.permissions.acceptOrders && <span>주문승낙</span>}
                      {account.permissions.manageSchedule && <span>일정관리</span>}
                      {account.permissions.viewEarnings && <span>정산조회</span>}
                      {account.permissions.manageServices && <span>서비스관리</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 서브 계정 추가 모달 */}
      <Modal
        visible={addModalVisible}
        title="서브 계정 추가"
        onClose={() => setAddModalVisible(false)}
        content={
          <Form
            form={form}
            onFinish={handleAddSubmit}
            layout="vertical"
          >
            <Form.Item 
              name="name" 
              label="이름"
              rules={[{ required: true, message: '이름을 입력하세요' }]}
            >
              <Input placeholder="이름을 입력하세요" />
            </Form.Item>

            <Form.Item 
              name="email" 
              label="이메일"
              rules={[
                { required: true, message: '이메일을 입력하세요' },
                { type: 'email', message: '올바른 이메일을 입력하세요' }
              ]}
            >
              <Input placeholder="이메일을 입력하세요" />
            </Form.Item>

            <Form.Item name="phone" label="전화번호 (선택)">
              <Input placeholder="전화번호를 입력하세요" />
            </Form.Item>

            <Form.Item 
              name="role" 
              label="역할"
              rules={[{ required: true, message: '역할을 선택하세요' }]}
            >
              <Picker columns={[roleOptions]} />
            </Form.Item>

            <div style={{ marginBottom: 20 }}>
              <h4>권한 설정</h4>
              {renderPermissionForm()}
            </div>

            <div className="modal-actions">
              <Button
                fill="outline"
                onClick={() => setAddModalVisible(false)}
              >
                취소
              </Button>
              <Button
                color="primary"
                type="submit"
                loading={addAccountMutation.isPending}
              >
                추가
              </Button>
            </div>
          </Form>
        }
      />

      {/* 서브 계정 수정 모달 */}
      <Modal
        visible={editModalVisible}
        title="서브 계정 수정"
        onClose={() => setEditModalVisible(false)}
        content={
          <Form
            form={form}
            onFinish={handleEditSubmit}
            layout="vertical"
          >
            <Form.Item name="name" label="이름">
              <Input placeholder="이름을 입력하세요" />
            </Form.Item>

            <Form.Item name="email" label="이메일">
              <Input placeholder="이메일을 입력하세요" />
            </Form.Item>

            <Form.Item name="phone" label="전화번호">
              <Input placeholder="전화번호를 입력하세요" />
            </Form.Item>

            <Form.Item name="role" label="역할">
              <Picker columns={[roleOptions]} />
            </Form.Item>

            <div style={{ marginBottom: 20 }}>
              <h4>권한 설정</h4>
              {renderPermissionForm()}
            </div>

            <div className="modal-actions">
              <Button
                fill="outline"
                onClick={() => setEditModalVisible(false)}
              >
                취소
              </Button>
              <Button
                color="primary"
                type="submit"
                loading={updateAccountMutation.isPending}
              >
                저장
              </Button>
            </div>
          </Form>
        }
      />

      {/* 액션 시트 */}
      <ActionSheet
        visible={actionSheetVisible}
        actions={actionSheetActions}
        onClose={() => setActionSheetVisible(false)}
        onAction={(action) => {
          if (selectedAccount) {
            switch (action.key) {
              case 'edit':
                handleEditAccount(selectedAccount);
                break;
              case 'delete':
                handleDeleteAccount(selectedAccount);
                break;
            }
          }
          setActionSheetVisible(false);
        }}
      />
    </div>
  );
};

export default SubAccounts;