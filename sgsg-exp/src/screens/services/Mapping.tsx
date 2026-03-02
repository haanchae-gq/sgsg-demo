import React, { useState } from 'react';
import { 
  NavBar, 
  List, 
  Card, 
  Switch, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Picker,
  Toast,
  Badge,
  Divider
} from 'antd-mobile';
import { 
  LeftOutline,
  AddOutline,
  EditSOutline,
  DeleteOutline,
  EnvironmentOutline
} from 'antd-mobile-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Mapping.css';

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  basePrice: number;
  description?: string;
}

interface ExpertServiceMapping {
  id: string;
  expertId: string;
  serviceItemId: string;
  serviceItem: ServiceItem;
  customPrice?: number;
  isActive: boolean;
  serviceAreas?: string[];
}

const ServiceMapping: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ExpertServiceMapping | null>(null);
  const [form] = Form.useForm();

  // 전문가의 서비스 매핑 조회
  const { data: mappings, isLoading } = useQuery({
    queryKey: ['expert', 'services'],
    queryFn: async () => {
      const response = await api.get('/experts/me/services');
      return response.data.data as ExpertServiceMapping[];
    }
  });

  // 전체 서비스 목록 조회 (추가 시 선택용)
  const { data: availableServices } = useQuery({
    queryKey: ['services', 'items'],
    queryFn: async () => {
      const response = await api.get('/services/items');
      return response.data.data.items as ServiceItem[];
    }
  });

  // 서비스 매핑 추가
  const addMappingMutation = useMutation({
    mutationFn: async (data: { serviceItemId: string; customPrice?: number; serviceAreas?: string[] }) => {
      return await api.post('/experts/me/services', data);
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '서비스가 추가되었습니다' });
      setAddModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['expert', 'services'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '서비스 추가에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  // 서비스 매핑 업데이트
  const updateMappingMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; customPrice?: number; isActive?: boolean; serviceAreas?: string[] }) => {
      return await api.put(`/experts/me/services/${id}`, data);
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '서비스가 업데이트되었습니다' });
      setEditModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['expert', 'services'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '서비스 업데이트에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  // 서비스 매핑 삭제
  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/experts/me/services/${id}`);
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '서비스가 삭제되었습니다' });
      queryClient.invalidateQueries({ queryKey: ['expert', 'services'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '서비스 삭제에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  const handleToggleActive = (mapping: ExpertServiceMapping) => {
    updateMappingMutation.mutate({
      id: mapping.id,
      isActive: !mapping.isActive
    });
  };

  const handleEditMapping = (mapping: ExpertServiceMapping) => {
    setSelectedMapping(mapping);
    form.setFieldsValue({
      customPrice: mapping.customPrice,
      serviceAreas: mapping.serviceAreas?.join(', ') || ''
    });
    setEditModalVisible(true);
  };

  const handleDeleteMapping = (mapping: ExpertServiceMapping) => {
    Modal.confirm({
      title: '서비스 삭제',
      content: `${mapping.serviceItem.name} 서비스를 삭제하시겠습니까?`,
      onConfirm: () => deleteMappingMutation.mutate(mapping.id)
    });
  };

  const handleAddSubmit = (values: any) => {
    const serviceAreas = values.serviceAreas ? values.serviceAreas.split(',').map((area: string) => area.trim()) : [];
    addMappingMutation.mutate({
      serviceItemId: values.serviceItemId,
      customPrice: values.customPrice ? parseInt(values.customPrice) : undefined,
      serviceAreas
    });
  };

  const handleEditSubmit = (values: any) => {
    if (!selectedMapping) return;
    
    const serviceAreas = values.serviceAreas ? values.serviceAreas.split(',').map((area: string) => area.trim()) : [];
    updateMappingMutation.mutate({
      id: selectedMapping.id,
      customPrice: values.customPrice ? parseInt(values.customPrice) : undefined,
      serviceAreas
    });
  };

  const getServiceOptions = () => {
    if (!availableServices || !mappings) return [];
    
    // 이미 매핑된 서비스 제외
    const mappedServiceIds = mappings.map(m => m.serviceItemId);
    return availableServices
      .filter(service => !mappedServiceIds.includes(service.id))
      .map(service => ({
        label: `${service.category.name} > ${service.name}`,
        value: service.id
      }));
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="서비스 정보를 불러오는 중..." />;
  }

  return (
    <div className="service-mapping">
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
        서비스 관리
      </NavBar>

      <div className="mapping-content">
        <Card className="summary-card">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{mappings?.length || 0}</span>
              <span className="stat-label">등록 서비스</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{mappings?.filter(m => m.isActive).length || 0}</span>
              <span className="stat-label">활성 서비스</span>
            </div>
          </div>
        </Card>

        {!mappings || mappings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛠️</div>
            <h3>등록된 서비스가 없습니다</h3>
            <p>제공하실 수 있는 서비스를 추가해보세요</p>
            <Button 
              color="primary" 
              onClick={() => setAddModalVisible(true)}
            >
              서비스 추가하기
            </Button>
          </div>
        ) : (
          <div className="mapping-list">
            {mappings.map((mapping) => (
              <Card key={mapping.id} className="mapping-card">
                <div className="mapping-header">
                  <div className="service-info">
                    <h3>{mapping.serviceItem.name}</h3>
                    <div className="service-category">{mapping.serviceItem.category.name}</div>
                  </div>
                  <div className="mapping-actions">
                    <Switch
                      checked={mapping.isActive}
                      onChange={() => handleToggleActive(mapping)}
                    />
                  </div>
                </div>

                <Divider />

                <div className="mapping-details">
                  <div className="price-info">
                    <span>기본 가격: {formatCurrency(mapping.serviceItem.basePrice)}</span>
                    {mapping.customPrice && (
                      <span className="custom-price">
                        내 가격: {formatCurrency(mapping.customPrice)}
                      </span>
                    )}
                  </div>

                  {mapping.serviceAreas && mapping.serviceAreas.length > 0 && (
                    <div className="service-areas">
                      <EnvironmentOutline />
                      <span>{mapping.serviceAreas.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="mapping-footer">
                  <Button
                    size="small"
                    fill="outline"
                    onClick={() => handleEditMapping(mapping)}
                  >
                    <EditSOutline />
                    수정
                  </Button>
                  <Button
                    size="small"
                    fill="outline"
                    color="danger"
                    onClick={() => handleDeleteMapping(mapping)}
                  >
                    <DeleteOutline />
                    삭제
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 서비스 추가 모달 */}
      <Modal
        visible={addModalVisible}
        title="서비스 추가"
        onClose={() => setAddModalVisible(false)}
        content={
          <Form
            form={form}
            onFinish={handleAddSubmit}
            layout="vertical"
          >
            <Form.Item 
              name="serviceItemId" 
              label="서비스 선택"
              rules={[{ required: true, message: '서비스를 선택하세요' }]}
            >
              <Picker
                columns={[getServiceOptions()]}
              />
            </Form.Item>

            <Form.Item name="customPrice" label="내 가격 (선택)">
              <Input
                placeholder="기본 가격과 다른 경우 입력"
                type="number"
              />
            </Form.Item>

            <Form.Item name="serviceAreas" label="서비스 지역 (선택)">
              <Input
                placeholder="쉼표로 구분하여 입력 (예: 강남구, 서초구)"
              />
            </Form.Item>

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
                loading={addMappingMutation.isPending}
              >
                추가
              </Button>
            </div>
          </Form>
        }
      />

      {/* 서비스 수정 모달 */}
      <Modal
        visible={editModalVisible}
        title="서비스 수정"
        onClose={() => setEditModalVisible(false)}
        content={
          <Form
            form={form}
            onFinish={handleEditSubmit}
            layout="vertical"
          >
            <Form.Item name="customPrice" label="내 가격">
              <Input
                placeholder={selectedMapping ? `기본 가격: ${formatCurrency(selectedMapping.serviceItem.basePrice)}` : ''}
                type="number"
              />
            </Form.Item>

            <Form.Item name="serviceAreas" label="서비스 지역">
              <Input
                placeholder="쉼표로 구분하여 입력 (예: 강남구, 서초구)"
              />
            </Form.Item>

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
                loading={updateMappingMutation.isPending}
              >
                저장
              </Button>
            </div>
          </Form>
        }
      />
    </div>
  );
};

export default ServiceMapping;