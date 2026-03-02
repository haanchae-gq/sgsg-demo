import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Toast,
  Space,
  Divider
} from 'antd-mobile';
import {
  UserOutline,
  LockOutline
} from 'antd-mobile-icons';

interface LoginFormProps {
  onLoginSuccess: (token: string, user: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:4001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        Toast.show('로그인 성공!');
        onLoginSuccess(data.data.token, data.data.user);
      } else {
        Toast.show(data.error?.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = (email: string, password: string) => {
    form.setFieldsValue({ email, password });
    handleLogin({ email, password });
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '60px' }}>
        <h1 style={{ color: '#1890ff', fontSize: '28px', marginBottom: '8px' }}>
          SGSG 전문가
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          전문가용 모바일 관리 시스템
        </p>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          onFinish={handleLogin}
          footer={
            <Button 
              block 
              type="submit" 
              color="primary" 
              loading={loading}
              size="large"
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          }
        >
          <Form.Item
            name="email"
            label="이메일"
            required
            rules={[
              { required: true, message: '이메일을 입력해주세요' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다' }
            ]}
          >
            <Input
              placeholder="이메일 주소를 입력하세요"
              leftElement={<UserOutline />}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="비밀번호"
            required
            rules={[
              { required: true, message: '비밀번호를 입력해주세요' },
              { min: 8, message: '비밀번호는 8자 이상이어야 합니다' }
            ]}
          >
            <Input
              placeholder="비밀번호를 입력하세요"
              type="password"
              leftElement={<LockOutline />}
            />
          </Form.Item>
        </Form>
      </Card>

      {/* 테스트 로그인 버튼들 */}
      <Card title="🧪 테스트 계정">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            color="primary"
            fill="outline"
            size="small"
            onClick={() => testLogin('master.expert@sgsg.com', 'MasterExpert@123')}
          >
            마스터 전문가로 로그인
          </Button>
          <Button
            block
            color="primary"
            fill="outline"
            size="small"
            onClick={() => testLogin('sub1.expert@sgsg.com', 'SubExpert@123')}
          >
            서브 전문가 1로 로그인
          </Button>
          <Button
            block
            color="primary"
            fill="outline"
            size="small"
            onClick={() => testLogin('sub2.expert@sgsg.com', 'SubExpert@123')}
          >
            서브 전문가 2로 로그인
          </Button>
        </Space>
      </Card>

      <div style={{ textAlign: 'center', marginTop: '24px', color: '#999', fontSize: '12px' }}>
        SGSG 플랫폼 v1.0
      </div>
    </div>
  );
};

export default LoginForm;