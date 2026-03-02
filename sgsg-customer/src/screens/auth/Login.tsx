import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Button,
  Input,
  Form,
  Checkbox,
  Divider,
  Toast,
  SafeArea
} from 'antd-mobile';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MobileOutlined,
  WechatOutlined
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [form] = Form.useForm();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 로그인 mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      // TODO: 실제 API 구현
      // const response = await api.post('/auth/login', credentials);
      // return response.data;
      
      // 임시 로그인 처리
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 간단한 검증
      if (credentials.email === 'customer@test.com' && credentials.password === 'password123') {
        return {
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: 'customer1',
              email: 'customer@test.com',
              name: '홍길동',
              phone: '010-1234-5678',
              role: 'customer',
              status: 'active',
              createdAt: '2024-01-15T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z'
            }
          }
        };
      } else {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
      }
    },
    onSuccess: (data) => {
      const { accessToken, refreshToken, user } = data.data;
      login({ accessToken, refreshToken }, user);
      
      Toast.show({
        icon: 'success',
        content: `${user.name}님, 환영합니다!`
      });
      
      // 이전 페이지로 돌아가거나 홈으로 이동
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    },
    onError: (error: any) => {
      Toast.show({
        icon: 'fail',
        content: error.message || '로그인에 실패했습니다'
      });
    }
  });

  const handleLogin = async (values: { email: string; password: string }) => {
    loginMutation.mutate(values);
  };

  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    Toast.show(`${provider} 로그인 준비 중입니다`);
    // TODO: 소셜 로그인 구현
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar onBack={() => navigate(-1)}>
        로그인
      </NavBar>

      <div style={{ padding: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 로고 & 환영 메시지 */}
          <div style={{ textAlign: 'center', padding: '40px 0 20px' }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 700,
              color: '#2196F3',
              marginBottom: '12px'
            }}>
              SGSG
            </div>
            <div style={{ 
              fontSize: '16px', 
              color: '#8c8c8c',
              lineHeight: '1.4'
            }}>
              안전하고 믿을 수 있는<br/>
              홈 서비스 플랫폼
            </div>
          </div>

          {/* 로그인 폼 */}
          <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Form
              form={form}
              onFinish={handleLogin}
              layout="vertical"
              requiredMarkStyle="none"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                
                <Form.Item
                  name="email"
                  label="이메일"
                  rules={[
                    { required: true, message: '이메일을 입력해주세요' },
                    { type: 'email', message: '올바른 이메일 형식을 입력해주세요' }
                  ]}
                >
                  <Input
                    placeholder="이메일을 입력하세요"
                    prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                    size="large"
                    style={{ '--border-radius': '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="비밀번호"
                  rules={[
                    { required: true, message: '비밀번호를 입력해주세요' },
                    { min: 6, message: '비밀번호는 6자 이상이어야 합니다' }
                  ]}
                >
                  <Input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                    suffix={
                      <Button
                        fill="none"
                        size="mini"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        {passwordVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </Button>
                    }
                    size="large"
                    style={{ '--border-radius': '8px' }}
                  />
                </Form.Item>

                {/* 로그인 옵션 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Checkbox
                    checked={rememberMe}
                    onChange={setRememberMe}
                  >
                    로그인 상태 유지
                  </Checkbox>
                  
                  <Button
                    fill="none"
                    size="small"
                    color="primary"
                    onClick={() => navigate('/auth/reset-password')}
                  >
                    비밀번호 찾기
                  </Button>
                </div>

                {/* 로그인 버튼 */}
                <Form.Item>
                  <Button
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    loading={loginMutation.isPending}
                    style={{ 
                      borderRadius: '8px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 500
                    }}
                  >
                    로그인
                  </Button>
                </Form.Item>

                {/* 테스트 계정 안내 */}
                <div style={{ 
                  background: '#f0f9ff',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #b3e5ff'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#1890ff',
                    fontWeight: 500,
                    marginBottom: '4px'
                  }}>
                    🧪 테스트 계정
                  </div>
                  <div style={{ fontSize: '11px', color: '#096dd9' }}>
                    이메일: customer@test.com<br/>
                    비밀번호: password123
                  </div>
                </div>

              </Space>
            </Form>
          </Card>

          {/* 소셜 로그인 */}
          <Card style={{ border: 'none', borderRadius: '12px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <Divider style={{ margin: '8px 0' }}>
                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>간편 로그인</span>
              </Divider>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  fill="outline"
                  style={{ 
                    flex: 1,
                    background: '#FEE500',
                    borderColor: '#FEE500',
                    color: '#3C1E1E'
                  }}
                  onClick={() => handleSocialLogin('kakao')}
                >
                  <WechatOutlined /> 카카오
                </Button>
                
                <Button
                  fill="outline"
                  style={{ 
                    flex: 1,
                    background: '#03C75A',
                    borderColor: '#03C75A',
                    color: 'white'
                  }}
                  onClick={() => handleSocialLogin('naver')}
                >
                  <MobileOutlined /> 네이버
                </Button>
                
                <Button
                  fill="outline"
                  style={{ 
                    flex: 1,
                    background: '#4285F4',
                    borderColor: '#4285F4',
                    color: 'white'
                  }}
                  onClick={() => handleSocialLogin('google')}
                >
                  G 구글
                </Button>
              </div>
              
            </Space>
          </Card>

          {/* 회원가입 링크 */}
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={{ color: '#8c8c8c', fontSize: '14px' }}>
              아직 회원이 아니신가요?{' '}
            </span>
            <Button
              fill="none"
              color="primary"
              size="small"
              onClick={() => navigate('/auth/register')}
            >
              회원가입
            </Button>
          </div>

          {/* 고객센터 */}
          <div style={{ 
            textAlign: 'center',
            fontSize: '12px',
            color: '#bfbfbf',
            padding: '10px 0'
          }}>
            로그인에 문제가 있으신가요?<br/>
            고객센터: 1588-1234 (평일 09:00-18:00)
          </div>

        </Space>
      </div>

      {/* 하단 여백 */}
      <SafeArea position="bottom" />

    </div>
  );
};

export default Login;