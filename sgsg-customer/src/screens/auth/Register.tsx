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
  Toast,
  SafeArea,
  Steps,
  Popup,
  List
} from 'antd-mobile';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // 이메일 인증 발송
  const sendEmailVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '인증 코드가 이메일로 발송되었습니다'
      });
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '이메일 발송에 실패했습니다'
      });
    }
  });

  // 휴대폰 인증 발송
  const sendPhoneVerificationMutation = useMutation({
    mutationFn: async (phone: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '인증 코드가 SMS로 발송되었습니다'
      });
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: 'SMS 발송에 실패했습니다'
      });
    }
  });

  // 회원가입
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '회원가입이 완료되었습니다! 로그인해주세요 🎉'
      });
      
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 1500);
    },
    onError: () => {
      Toast.show({
        icon: 'fail',
        content: '회원가입에 실패했습니다'
      });
    }
  });

  const steps = [
    { title: '약관동의', description: '서비스 이용약관에 동의해주세요' },
    { title: '정보입력', description: '기본 회원정보를 입력해주세요' },
    { title: '인증완료', description: '이메일과 휴대폰 인증을 완료하세요' }
  ];

  const handleEmailVerification = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      Toast.show('이메일을 먼저 입력해주세요');
      return;
    }
    
    sendEmailVerificationMutation.mutate(email);
  };

  const handlePhoneVerification = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone) {
      Toast.show('휴대폰 번호를 먼저 입력해주세요');
      return;
    }
    
    sendPhoneVerificationMutation.mutate(phone);
  };

  const handleVerifyCode = (type: 'email' | 'phone') => {
    if (!verificationCode) {
      Toast.show('인증 코드를 입력해주세요');
      return;
    }
    
    // 간단한 테스트 코드 (실제로는 서버에서 검증)
    if (verificationCode === '123456') {
      if (type === 'email') {
        setIsEmailVerified(true);
        Toast.show({
          icon: 'success',
          content: '이메일 인증이 완료되었습니다'
        });
      } else {
        setIsPhoneVerified(true);
        Toast.show({
          icon: 'success',
          content: '휴대폰 인증이 완료되었습니다'
        });
      }
      setVerificationCode('');
    } else {
      Toast.show({
        icon: 'fail',
        content: '인증 코드가 올바르지 않습니다'
      });
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // 약관 동의 확인
      const values = form.getFieldsValue(['termsAgreed', 'privacyAgreed']);
      if (!values.termsAgreed || !values.privacyAgreed) {
        Toast.show('필수 약관에 동의해주세요');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // 기본 정보 입력 검증
      try {
        await form.validateFields(['name', 'email', 'phone', 'password', 'confirmPassword']);
        setCurrentStep(2);
      } catch (error) {
        Toast.show('모든 필수 정보를 올바르게 입력해주세요');
      }
    } else if (currentStep === 2) {
      // 인증 완료 확인
      if (!isEmailVerified || !isPhoneVerified) {
        Toast.show('이메일과 휴대폰 인증을 모두 완료해주세요');
        return;
      }
      
      // 회원가입 실행
      const values = form.getFieldsValue();
      registerMutation.mutate({
        ...values,
        marketingAgreed,
        emailVerified: isEmailVerified,
        phoneVerified: isPhoneVerified
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            
            <div style={{ 
              textAlign: 'center',
              padding: '20px 0',
              background: '#f0f9ff',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🛡️</div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 500,
                color: '#2196F3',
                marginBottom: '8px'
              }}>
                안전하고 신뢰할 수 있는 서비스
              </div>
              <div style={{ fontSize: '12px', color: '#1890ff' }}>
                SGSG는 고객과 전문가의 안전을 최우선으로 합니다
              </div>
            </div>

            <Form.Item
              name="termsAgreed"
              valuePropName="checked"
              rules={[{ required: true, message: '서비스 이용약관에 동의해주세요' }]}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox />
                  <span style={{ marginLeft: '8px', fontWeight: 500 }}>
                    서비스 이용약관 동의 (필수)
                  </span>
                </div>
                <Button
                  fill="none"
                  size="small"
                  onClick={() => setTermsModalVisible(true)}
                >
                  <RightOutlined />
                </Button>
              </div>
            </Form.Item>

            <Form.Item
              name="privacyAgreed"
              valuePropName="checked"
              rules={[{ required: true, message: '개인정보 처리방침에 동의해주세요' }]}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox />
                  <span style={{ marginLeft: '8px', fontWeight: 500 }}>
                    개인정보 처리방침 동의 (필수)
                  </span>
                </div>
                <Button
                  fill="none"
                  size="small"
                  onClick={() => setPrivacyModalVisible(true)}
                >
                  <RightOutlined />
                </Button>
              </div>
            </Form.Item>

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              border: '1px solid #f0f0f0',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={marketingAgreed}
                  onChange={setMarketingAgreed}
                />
                <span style={{ marginLeft: '8px' }}>
                  마케팅 정보 수신 동의 (선택)
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                할인 혜택 알림
              </div>
            </div>

          </Space>
        );

      case 1:
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            
            <Form.Item
              name="name"
              label="이름"
              rules={[
                { required: true, message: '이름을 입력해주세요' },
                { min: 2, message: '이름은 2자 이상 입력해주세요' }
              ]}
            >
              <Input
                placeholder="실명을 입력하세요"
                prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="이메일"
              rules={[
                { required: true, message: '이메일을 입력해주세요' },
                { type: 'email', message: '올바른 이메일 형식을 입력해주세요' }
              ]}
            >
              <Input
                placeholder="example@email.com"
                prefix={<MailOutlined style={{ color: '#8c8c8c' }} />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="휴대폰 번호"
              rules={[
                { required: true, message: '휴대폰 번호를 입력해주세요' },
                { pattern: /^01[016789]-?\d{3,4}-?\d{4}$/, message: '올바른 휴대폰 번호를 입력해주세요' }
              ]}
            >
              <Input
                placeholder="010-1234-5678"
                prefix={<MobileOutlined style={{ color: '#8c8c8c' }} />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="비밀번호"
              rules={[
                { required: true, message: '비밀번호를 입력해주세요' },
                { min: 8, message: '비밀번호는 8자 이상이어야 합니다' },
                { 
                  pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
                  message: '영문, 숫자, 특수문자를 모두 포함해야 합니다' 
                }
              ]}
            >
              <Input
                type={passwordVisible ? 'text' : 'password'}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
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
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="비밀번호 확인"
              rules={[
                { required: true, message: '비밀번호 확인을 입력해주세요' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
                  },
                }),
              ]}
            >
              <Input
                type={confirmPasswordVisible ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력하세요"
                prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                suffix={
                  <Button
                    fill="none"
                    size="mini"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  >
                    {confirmPasswordVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </Button>
                }
                size="large"
              />
            </Form.Item>

          </Space>
        );

      case 2:
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            
            {/* 이메일 인증 */}
            <Card 
              title="이메일 인증"
              style={{ 
                border: isEmailVerified ? '1px solid #52c41a' : '1px solid #f0f0f0',
                borderRadius: '8px'
              }}
              extra={
                isEmailVerified ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                ) : null
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {!isEmailVerified && (
                  <>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {form.getFieldValue('email')}로 인증 코드를 발송합니다
                    </div>
                    
                    <Button
                      color="primary"
                      fill="outline"
                      onClick={handleEmailVerification}
                      loading={sendEmailVerificationMutation.isPending}
                      block
                    >
                      인증 코드 발송
                    </Button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Input
                        placeholder="인증 코드 6자리"
                        value={verificationCode}
                        onChange={setVerificationCode}
                        maxLength={6}
                        style={{ flex: 1 }}
                      />
                      <Button
                        color="primary"
                        onClick={() => handleVerifyCode('email')}
                        disabled={!verificationCode}
                      >
                        확인
                      </Button>
                    </div>

                    <div style={{ 
                      fontSize: '11px', 
                      color: '#ff7f00',
                      background: '#fff7e6',
                      padding: '6px 8px',
                      borderRadius: '4px'
                    }}>
                      💡 테스트용 인증 코드: 123456
                    </div>
                  </>
                )}

                {isEmailVerified && (
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#52c41a',
                    textAlign: 'center',
                    padding: '12px 0'
                  }}>
                    ✅ 이메일 인증이 완료되었습니다!
                  </div>
                )}
              </Space>
            </Card>

            {/* 휴대폰 인증 */}
            <Card 
              title="휴대폰 인증"
              style={{ 
                border: isPhoneVerified ? '1px solid #52c41a' : '1px solid #f0f0f0',
                borderRadius: '8px'
              }}
              extra={
                isPhoneVerified ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                ) : null
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {!isPhoneVerified && (
                  <>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {form.getFieldValue('phone')}로 인증 코드를 발송합니다
                    </div>
                    
                    <Button
                      color="primary"
                      fill="outline"
                      onClick={handlePhoneVerification}
                      loading={sendPhoneVerificationMutation.isPending}
                      block
                    >
                      인증 코드 발송
                    </Button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Input
                        placeholder="인증 코드 6자리"
                        value={verificationCode}
                        onChange={setVerificationCode}
                        maxLength={6}
                        style={{ flex: 1 }}
                      />
                      <Button
                        color="primary"
                        onClick={() => handleVerifyCode('phone')}
                        disabled={!verificationCode}
                      >
                        확인
                      </Button>
                    </div>

                    <div style={{ 
                      fontSize: '11px', 
                      color: '#ff7f00',
                      background: '#fff7e6',
                      padding: '6px 8px',
                      borderRadius: '4px'
                    }}>
                      💡 테스트용 인증 코드: 123456
                    </div>
                  </>
                )}

                {isPhoneVerified && (
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#52c41a',
                    textAlign: 'center',
                    padding: '12px 0'
                  }}>
                    ✅ 휴대폰 인증이 완료되었습니다!
                  </div>
                )}
              </Space>
            </Card>

          </Space>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar onBack={handlePrevious}>
        회원가입
      </NavBar>

      <div style={{ padding: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 진행 단계 */}
          <Steps current={currentStep} direction="horizontal" size="small">
            {steps.map((step, index) => (
              <Steps.Step 
                key={index}
                title={step.title}
                description={step.description}
              />
            ))}
          </Steps>

          {/* 단계별 컨텐츠 */}
          <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Form
              form={form}
              layout="vertical"
              requiredMarkStyle="none"
            >
              {renderStepContent()}
            </Form>
          </Card>

          {/* 다음/완료 버튼 */}
          <Button
            color="primary"
            size="large"
            block
            onClick={handleNext}
            loading={registerMutation.isPending}
            style={{ 
              borderRadius: '8px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            {currentStep === 2 ? '회원가입 완료' : '다음 단계'}
          </Button>

          {/* 이미 회원인 경우 */}
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={{ color: '#8c8c8c', fontSize: '14px' }}>
              이미 회원이신가요?{' '}
            </span>
            <Button
              fill="none"
              color="primary"
              size="small"
              onClick={() => navigate('/auth/login')}
            >
              로그인
            </Button>
          </div>

        </Space>
      </div>

      {/* 약관 모달 */}
      <Popup 
        visible={termsModalVisible}
        onMaskClick={() => setTermsModalVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px',
          maxHeight: '70vh'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0 }}>서비스 이용약관</h3>
            <Button 
              fill="none" 
              onClick={() => setTermsModalVisible(false)}
              size="small"
            >
              ✕
            </Button>
          </div>
          
          <div style={{ 
            height: '300px', 
            overflow: 'auto',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#595959'
          }}>
            제1조(목적) 이 약관은 SGSG(이하 "회사")가 제공하는 홈 서비스 플랫폼과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다...
            {/* 실제 약관 내용 */}
          </div>
        </div>
      </Popup>

      {/* 개인정보 처리방침 모달 */}
      <Popup 
        visible={privacyModalVisible}
        onMaskClick={() => setPrivacyModalVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px',
          maxHeight: '70vh'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0 }}>개인정보 처리방침</h3>
            <Button 
              fill="none" 
              onClick={() => setPrivacyModalVisible(false)}
              size="small"
            >
              ✕
            </Button>
          </div>
          
          <div style={{ 
            height: '300px', 
            overflow: 'auto',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#595959'
          }}>
            SGSG(이하 "회사")는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다...
            {/* 실제 개인정보 처리방침 내용 */}
          </div>
        </div>
      </Popup>

      {/* 하단 여백 */}
      <SafeArea position="bottom" />

    </div>
  );
};

export default Register;