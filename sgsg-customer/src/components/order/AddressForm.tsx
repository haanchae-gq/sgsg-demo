import React, { useState } from 'react';
import {
  Card,
  Space,
  Button,
  Input,
  Radio,
  Popup,
  List,
  Tag
} from 'antd-mobile';
import {
  EnvironmentOutlined,
  PlusOutlined,
  AimOutlined
} from '@ant-design/icons';

interface Address {
  id: string;
  name: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
  contactName?: string;
  contactPhone?: string;
}

interface AddressFormProps {
  selectedAddress: Address | null;
  onAddressSelect: (address: Address | null) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({
  selectedAddress,
  onAddressSelect
}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    addressDetail: '',
    contactName: '',
    contactPhone: ''
  });

  // 임시 저장된 주소 목록 (실제로는 API에서 가져옴)
  const savedAddresses: Address[] = [
    {
      id: '1',
      name: '우리집',
      address: '서울특별시 강남구 테헤란로 123',
      addressDetail: '101동 505호',
      isDefault: true,
      contactName: '김철수',
      contactPhone: '010-1234-5678'
    },
    {
      id: '2',
      name: '회사',
      address: '서울특별시 서초구 서초대로 456',
      addressDetail: '10층 A동',
      isDefault: false,
      contactName: '김철수',
      contactPhone: '010-1234-5678'
    }
  ];

  const handleAddressSearch = () => {
    // TODO: 카카오 주소 API 연동
    // 임시로 주소 입력
    setNewAddress({
      ...newAddress,
      address: '서울특별시 강남구 역삼동 123-45'
    });
  };

  const handleCurrentLocation = () => {
    // TODO: GPS 위치 기반 주소 검색
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 실제로는 reverse geocoding API 호출
          setNewAddress({
            ...newAddress,
            address: '현재 위치 기반 주소'
          });
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
        }
      );
    }
  };

  const handleSaveNewAddress = () => {
    if (!newAddress.address || !newAddress.addressDetail) {
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      name: newAddress.name || '새 주소',
      address: newAddress.address,
      addressDetail: newAddress.addressDetail,
      isDefault: false,
      contactName: newAddress.contactName,
      contactPhone: newAddress.contactPhone
    };

    onAddressSelect(address);
    setShowAddressForm(false);
    setNewAddress({
      name: '',
      address: '',
      addressDetail: '',
      contactName: '',
      contactPhone: ''
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      
      {/* 저장된 주소 선택 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EnvironmentOutlined />
            저장된 주소
          </div>
        }
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          
          {savedAddresses.length > 0 ? (
            <Radio.Group 
              value={selectedAddress?.id}
              onChange={(val) => {
                const address = savedAddresses.find(addr => addr.id === val);
                onAddressSelect(address || null);
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {savedAddresses.map((address) => (
                  <Radio 
                    key={address.id} 
                    value={address.id}
                    style={{ 
                      width: '100%',
                      alignItems: 'flex-start',
                      padding: '12px',
                      border: selectedAddress?.id === address.id ? '2px solid #2196F3' : '1px solid #f0f0f0',
                      borderRadius: '8px',
                      margin: 0
                    }}
                  >
                    <div style={{ marginLeft: '8px', flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>
                          {address.name}
                        </span>
                        {address.isDefault && (
                          <Tag color="primary" fill="outline" size="small">
                            기본
                          </Tag>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
                        {address.address}
                      </div>
                      <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
                        {address.addressDetail}
                      </div>
                      {address.contactName && (
                        <div style={{ fontSize: '12px', color: '#bfbfbf', marginTop: '4px' }}>
                          {address.contactName} {address.contactPhone}
                        </div>
                      )}
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#8c8c8c',
              fontSize: '14px',
              padding: '20px 0'
            }}>
              저장된 주소가 없습니다
            </div>
          )}

        </Space>
      </Card>

      {/* 새 주소 추가 */}
      <Card 
        title="새 주소 추가"
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Button 
          fill="outline" 
          block
          icon={<PlusOutlined />}
          onClick={() => setShowAddressForm(true)}
        >
          새 주소 입력하기
        </Button>
      </Card>

      {/* 선택된 주소 표시 */}
      {selectedAddress && (
        <Card 
          style={{ 
            background: '#f0f9ff',
            border: '1px solid #91d5ff',
            borderRadius: '12px'
          }}
        >
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500,
              color: '#1890ff',
              marginBottom: '8px'
            }}>
              ✅ 선택된 주소
            </div>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              {selectedAddress.name}
            </div>
            <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
              {selectedAddress.address} {selectedAddress.addressDetail}
            </div>
          </div>
        </Card>
      )}

      {/* 새 주소 입력 팝업 */}
      <Popup 
        visible={showAddressForm}
        onMaskClick={() => setShowAddressForm(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px',
          maxHeight: '80vh',
          minHeight: '60vh'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0 }}>새 주소 추가</h3>
            <Button 
              fill="none" 
              onClick={() => setShowAddressForm(false)}
              size="small"
            >
              ✕
            </Button>
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            
            {/* 주소 검색 */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                주소 검색
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button 
                  fill="outline" 
                  block
                  onClick={handleAddressSearch}
                >
                  🔍 주소 검색
                </Button>
                <Button 
                  fill="outline" 
                  block
                  icon={<AimOutlined />}
                  onClick={handleCurrentLocation}
                >
                  현재 위치 사용
                </Button>
              </Space>
            </div>

            {/* 주소 정보 입력 */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                주소 정보
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Input
                  placeholder="주소명 (예: 우리집, 회사)"
                  value={newAddress.name}
                  onChange={(val) => setNewAddress({...newAddress, name: val})}
                />
                <Input
                  placeholder="주소"
                  value={newAddress.address}
                  onChange={(val) => setNewAddress({...newAddress, address: val})}
                  readOnly
                  style={{ background: '#fafafa' }}
                />
                <Input
                  placeholder="상세주소 (동호수, 층수 등)"
                  value={newAddress.addressDetail}
                  onChange={(val) => setNewAddress({...newAddress, addressDetail: val})}
                />
              </Space>
            </div>

            {/* 연락처 정보 */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                연락처 정보 (선택사항)
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Input
                  placeholder="연락 받을 분 성함"
                  value={newAddress.contactName}
                  onChange={(val) => setNewAddress({...newAddress, contactName: val})}
                />
                <Input
                  placeholder="연락처"
                  value={newAddress.contactPhone}
                  onChange={(val) => setNewAddress({...newAddress, contactPhone: val})}
                />
              </Space>
            </div>

            {/* 저장 버튼 */}
            <Button 
              color="primary" 
              block 
              size="large"
              onClick={handleSaveNewAddress}
              disabled={!newAddress.address || !newAddress.addressDetail}
            >
              이 주소로 선택하기
            </Button>
          </Space>
        </div>
      </Popup>

    </Space>
  );
};

export default AddressForm;