import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Toast } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password
      });

      const { accessToken, refreshToken, user } = response.data.data;
      
      // 전문가 계정 확인
      if (user.role !== 'expert') {
        Toast.show({
          icon: 'fail',
          content: '전문가 계정만 이용할 수 있습니다'
        });
        return;
      }

      login({ accessToken, refreshToken }, user);
      
      Toast.show({
        icon: 'success',
        content: '로그인 성공!'
      });

      onLoginSuccess?.();
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.error?.message || '로그인에 실패했습니다';
      Toast.show({
        icon: 'fail',
        content: message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>SGSG 전문가</h1>
        <p>전문가 계정으로 로그인하세요</p>
      </div>

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="login-form"
        initialValues={{
          email: 'expert@sgsg.com',
          password: 'Expert@123456',
          rememberMe: true
        }}
      >
        <Form.Item
          name="email"
          label="이메일"
          rules={[
            { required: true, message: '이메일을 입력하세요' },
            { type: 'email', message: '올바른 이메일을 입력하세요' }
          ]}
        >
          <Input 
            placeholder="이메일을 입력하세요"
            clearable
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="비밀번호"
          rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
        >
          <Input
            type={passwordVisible ? 'text' : 'password'}
            placeholder="비밀번호를 입력하세요"
            suffix={
              <div onClick={() => setPasswordVisible(!passwordVisible)}>
                {passwordVisible ? <EyeOutline /> : <EyeInvisibleOutline />}
              </div>
            }
          />
        </Form.Item>

        <Form.Item name="rememberMe">
          <Checkbox>자동 로그인</Checkbox>
        </Form.Item>

        <Button
          block
          type="submit"
          color="primary"
          size="large"
          loading={loading}
          className="login-button"
        >
          로그인
        </Button>
      </Form>

      <div className="login-footer">
        <div className="login-links">
          <span>비밀번호 재설정</span>
          <span>전문가 등록</span>
        </div>
        <div className="demo-info">
          <p>데모 계정:</p>
          <p>이메일: expert@sgsg.com</p>
          <p>비밀번호: Expert@123456</p>
        </div>
      </div>
    </div>
  );
};

export default Login;