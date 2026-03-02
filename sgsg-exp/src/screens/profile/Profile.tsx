import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Avatar, 
  List, 
  Button, 
  Switch, 
  Rate,
  Modal,
  Form,
  Input,
  Picker
} from 'antd-mobile';
import { 
  UserOutline,
  PhoneFill,
  LocationOutline,
  PayCircleOutline,
  StarFill,
  RightOutline,
  EditSOutline,
  SetOutline,
  AppstoreOutline,
  TeamOutline
} from 'antd-mobile-icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { formatCurrency } from '../../utils/formatters';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const handleLogout = () => {
    Modal.confirm({
      title: '로그아웃',
      content: '정말 로그아웃하시겠습니까?',
      onConfirm: logout
    });
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const mockStats = {
    rating: 4.8,
    completedOrders: 127,
    totalEarnings: 12450000,
    responseRate: 98
  };

  return (
    <div className="profile-container">
      {/* 프로필 헤더 */}
      <Card className="profile-header">
        <div className="profile-info">
          <Avatar
            src={user?.profileImage}
            style={{ '--size': '80px' }}
            className="profile-avatar"
          >
            {user?.name?.[0]}
          </Avatar>
          
          <div className="profile-details">
            <div className="profile-name">
              <h2>{user?.name}</h2>
              <Button 
                size="mini" 
                fill="none"
                onClick={handleEditProfile}
              >
                <EditSOutline />
              </Button>
            </div>
            
            <div className="profile-rating">
              <Rate 
                value={mockStats.rating} 
                readOnly 
                allowHalf 
                style={{ '--star-size': '16px' }}
              />
              <span>{mockStats.rating}점</span>
            </div>

            <div className="profile-status">
              <span className={`status-badge ${user?.status}`}>
                {user?.status === 'active' ? '활성' : 
                 user?.status === 'pending' ? '대기중' : '비활성'}
              </span>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-value">{mockStats.completedOrders}</div>
            <div className="stat-label">완료 주문</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatCurrency(mockStats.totalEarnings)}</div>
            <div className="stat-label">총 수익</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{mockStats.responseRate}%</div>
            <div className="stat-label">응답률</div>
          </div>
        </div>
      </Card>

      {/* 메뉴 리스트 */}
      <List className="profile-menu">
        <List.Item
          prefix={<UserOutline />}
          extra={<RightOutline />}
          onClick={() => console.log('기본 정보 수정')}
        >
          기본 정보 수정
        </List.Item>
        
        <List.Item
          prefix={<AppstoreOutline />}
          extra={<RightOutline />}
          onClick={() => navigate('/services/mapping')}
        >
          내 서비스 관리
        </List.Item>

        <List.Item
          prefix={<LocationOutline />}
          extra={<RightOutline />}
          onClick={() => console.log('서비스 지역 설정')}
        >
          서비스 지역 설정
        </List.Item>

        <List.Item
          prefix={<TeamOutline />}
          extra={<RightOutline />}
          onClick={() => navigate('/sub-accounts')}
        >
          서브 계정 관리
        </List.Item>

        <List.Item
          prefix={<PayCircleOutline />}
          extra={<RightOutline />}
          onClick={() => console.log('계좌 정보 관리')}
        >
          계좌 정보 관리
        </List.Item>

        <List.Item
          prefix={<StarFill />}
          extra={<RightOutline />}
          onClick={() => navigate('/reviews')}
        >
          받은 리뷰 보기
        </List.Item>
      </List>

      {/* 설정 */}
      <List className="profile-settings" header="설정">
        <List.Item
          prefix={<SetOutline />}
          extra={
            <Switch
              checked={notificationEnabled}
              onChange={setNotificationEnabled}
            />
          }
        >
          새 주문 알림
        </List.Item>

        <List.Item
          prefix={<SetOutline />}
          extra={
            <Switch
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
          }
        >
          다크 모드
        </List.Item>

        <List.Item
          prefix={<RightOutline />}
          onClick={handleLogout}
          className="logout-item"
        >
          로그아웃
        </List.Item>
      </List>

      {/* 기본 정보 수정 모달 */}
      <Modal
        visible={editModalVisible}
        title="기본 정보 수정"
        onClose={() => setEditModalVisible(false)}
        content={
          <Form
            layout="vertical"
            onFinish={(values) => {
              updateUser(values);
              setEditModalVisible(false);
            }}
          >
            <Form.Item name="name" label="이름" initialValue={user?.name}>
              <Input placeholder="이름을 입력하세요" />
            </Form.Item>
            
            <Form.Item name="phone" label="전화번호" initialValue={user?.phone}>
              <Input placeholder="전화번호를 입력하세요" />
            </Form.Item>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button
                block
                fill="outline"
                onClick={() => setEditModalVisible(false)}
              >
                취소
              </Button>
              <Button block color="primary" type="submit">
                저장
              </Button>
            </div>
          </Form>
        }
      />
    </div>
  );
};

export default Profile;