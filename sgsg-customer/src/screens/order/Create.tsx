import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Steps,
  Button,
  Card,
  Space,
  Divider,
  Image,
  Tag,
  SafeArea,
  Toast
} from 'antd-mobile';
import {
  LeftOutlined,
  CheckOutlined
} from '@ant-design/icons';

// 서브 컴포넌트들
import ServiceConfirmation from '../../components/order/ServiceConfirmation';
import DateTimeSelector from '../../components/order/DateTimeSelector';
import AddressForm from '../../components/order/AddressForm';
import RequirementsForm from '../../components/order/RequirementsForm';
import OrderSummary from '../../components/order/OrderSummary';

const OrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  
  // 주문 데이터 상태
  const [orderData, setOrderData] = useState({
    serviceId: location.state?.serviceId || '',
    service: location.state?.service || null,
    expertId: location.state?.expertId || '',
    expert: null,
    selectedDate: null as Date | null,
    selectedTime: null as string | null,
    address: null as any,
    requirements: '',
    specialRequests: ''
  });

  const steps = [
    { title: '서비스 확인', description: '선택한 서비스를 확인합니다' },
    { title: '일정 선택', description: '서비스 받을 날짜와 시간을 선택합니다' },
    { title: '주소 입력', description: '서비스 받을 주소를 입력합니다' },
    { title: '요구사항', description: '추가 요청사항을 입력합니다' },
    { title: '주문 확인', description: '최종 주문 내용을 확인합니다' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 마지막 단계에서 주문 생성
      handleCreateOrder();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleCreateOrder = async () => {
    try {
      Toast.show({
        icon: 'loading',
        content: '주문을 생성하는 중...',
        duration: 0
      });

      // TODO: API 호출로 실제 주문 생성
      await new Promise(resolve => setTimeout(resolve, 2000));

      Toast.clear();
      Toast.show({
        icon: 'success',
        content: '주문이 생성되었습니다!'
      });

      // 주문 완료 페이지로 이동
      navigate('/order/complete/temp-order-id');
    } catch (error) {
      Toast.clear();
      Toast.show({
        icon: 'fail',
        content: '주문 생성에 실패했습니다.'
      });
    }
  };

  const updateOrderData = (key: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return orderData.serviceId && orderData.service;
      case 1:
        return orderData.selectedDate && orderData.selectedTime;
      case 2:
        return orderData.address;
      case 3:
        return true; // 요구사항은 선택사항
      case 4:
        return true; // 최종 확인
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ServiceConfirmation
            service={orderData.service}
            expertId={orderData.expertId}
            onExpertSelect={(expert) => updateOrderData('expert', expert)}
          />
        );
      case 1:
        return (
          <DateTimeSelector
            selectedDate={orderData.selectedDate}
            selectedTime={orderData.selectedTime}
            onDateSelect={(date) => updateOrderData('selectedDate', date)}
            onTimeSelect={(time) => updateOrderData('selectedTime', time)}
            expertId={orderData.expertId}
          />
        );
      case 2:
        return (
          <AddressForm
            selectedAddress={orderData.address}
            onAddressSelect={(address) => updateOrderData('address', address)}
          />
        );
      case 3:
        return (
          <RequirementsForm
            requirements={orderData.requirements}
            specialRequests={orderData.specialRequests}
            onRequirementsChange={(value) => updateOrderData('requirements', value)}
            onSpecialRequestsChange={(value) => updateOrderData('specialRequests', value)}
          />
        );
      case 4:
        return (
          <OrderSummary
            orderData={orderData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh' }}>
      {/* 상단 네비게이션 */}
      <NavBar 
        onBack={handlePrevious}
        style={{ borderBottom: '1px solid #f0f0f0' }}
      >
        주문하기 ({currentStep + 1}/{steps.length})
      </NavBar>

      {/* 진행 상황 표시 */}
      <div style={{ padding: '16px', background: '#fafafa' }}>
        <Steps 
          current={currentStep}
          direction="horizontal"
          size="small"
        >
          {steps.map((step, index) => (
            <Steps.Step 
              key={index}
              title={step.title}
              description={step.description}
              status={
                index === currentStep ? 'process' :
                index < currentStep ? 'finish' : 'wait'
              }
            />
          ))}
        </Steps>
      </div>

      {/* 단계별 컨텐츠 */}
      <div style={{ padding: '16px', flex: 1 }}>
        {renderStepContent()}
      </div>

      {/* 하단 버튼 */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid #f0f0f0'
      }}>
        <SafeArea position="bottom">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              alignItems: 'center'
            }}>
              
              {currentStep > 0 && (
                <Button 
                  size="large"
                  fill="outline"
                  onClick={handlePrevious}
                  style={{ flex: 1 }}
                >
                  이전
                </Button>
              )}

              <Button 
                color="primary" 
                size="large"
                onClick={handleNext}
                disabled={!isStepValid()}
                style={{ flex: 2 }}
              >
                {currentStep === steps.length - 1 ? '주문하기' : '다음'}
              </Button>
            </div>

            {/* 진행률 표시 */}
            <div style={{ 
              width: '100%', 
              height: '4px', 
              background: '#f0f0f0', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  height: '100%',
                  background: '#2196F3',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </Space>
        </SafeArea>
      </div>
    </div>
  );
};

export default OrderCreate;