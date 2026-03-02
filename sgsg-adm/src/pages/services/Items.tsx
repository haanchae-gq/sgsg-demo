import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  InputNumber,
  Upload,
  Image,
  Switch,
  message,
  Popconfirm,
  Descriptions
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  EyeOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import FilterForm from '../../components/common/FilterForm';
import apiService from '../../services/api';
import { formatDateTime, formatCurrency, formatDuration } from '../../utils/formatters';
import type { ServiceItem, ServiceCategory } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

const Items: React.FC = () => {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [form] = Form.useForm();

  const filterFields = [
    {
      name: 'search',
      label: '검색',
      type: 'input' as const,
      placeholder: '서비스명으로 검색',
    },
    {
      name: 'categoryId',
      label: '카테고리',
      type: 'select' as const,
      options: categories.map(cat => ({ label: cat.name, value: cat.id })),
    },
    {
      name: 'isActive',
      label: '상태',
      type: 'select' as const,
      options: [
        { label: '활성', value: 'true' },
        { label: '비활성', value: 'false' },
      ],
    },
  ];

  const fetchCategories = async () => {
    try {
      const response = await apiService.getServiceCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchItems = async (page = 1, pageSize = 20, filterParams = filters) => {
    try {
      setLoading(true);
      const response = await apiService.getServiceItems({
        page,
        limit: pageSize,
        ...filterParams,
      });

      setItems(response.data.items || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total || 0,
      });
    } catch (error) {
      message.error('서비스 목록을 불러오는데 실패했습니다.');
      console.error('Fetch items error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (values: any) => {
    setFilters(values);
    fetchItems(1, pagination.pageSize, values);
  };

  const handleResetFilter = () => {
    setFilters({});
    fetchItems(1, pagination.pageSize, {});
  };

  const handleTableChange = (paginationParams: any) => {
    fetchItems(paginationParams.current, paginationParams.pageSize, filters);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, estimatedDuration: 60 });
    setModalVisible(true);
  };

  const handleEditItem = (item: ServiceItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      basePrice: item.basePrice,
      estimatedDuration: item.estimatedDuration,
      isActive: item.isActive,
    });
    setModalVisible(true);
  };

  const handleViewItem = (item: ServiceItem) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await apiService.deleteServiceItem(itemId);
      message.success('서비스가 삭제되었습니다.');
      fetchItems(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('서비스 삭제에 실패했습니다.');
      console.error('Delete item error:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const itemData = {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        basePrice: values.basePrice,
        estimatedDuration: values.estimatedDuration || 60,
        isActive: values.isActive !== false,
        images: values.images?.map((file: any) => 
          file.url || file.response?.url
        ).filter(Boolean) || []
      };

      if (editingItem) {
        await apiService.updateServiceItem(editingItem.id, itemData);
        message.success('서비스가 수정되었습니다.');
      } else {
        await apiService.createServiceItem(itemData);
        message.success('서비스가 추가되었습니다.');
      }

      setModalVisible(false);
      fetchItems(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error(`서비스 ${editingItem ? '수정' : '추가'}에 실패했습니다.`);
      console.error('Submit item error:', error);
    }
  };

  const uploadProps = {
    name: 'file',
    action: '/api/v1/upload/image',
    headers: {
      authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('이미지 파일만 업로드 가능합니다.');
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('이미지 크기는 5MB 이하여야 합니다.');
      }
      return isImage && isLt5M;
    },
  };

  const columns = [
    {
      title: '서비스 정보',
      key: 'serviceInfo',
      width: 250,
      render: (_, record: ServiceItem) => (
        <Space size={12}>
          {record.images?.[0] && (
            <Image
              src={record.images[0]}
              width={40}
              height={40}
              style={{ borderRadius: '6px' }}
              preview={false}
            />
          )}
          <div>
            <div style={{ fontWeight: '500' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.category?.name || '카테고리 없음'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '기본 가격',
      dataIndex: 'basePrice',
      key: 'basePrice',
      width: 120,
      align: 'right' as const,
      render: (price: number) => (
        <span style={{ fontWeight: '500' }}>
          {formatCurrency(price)}
        </span>
      ),
    },
    {
      title: '소요 시간',
      dataIndex: 'estimatedDuration',
      key: 'estimatedDuration',
      width: 100,
      align: 'center' as const,
      render: (duration: number) => formatDuration(duration),
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center' as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <div>
          <div>{formatDateTime(date).split(' ')[0]}</div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
            {formatDateTime(date).split(' ')[1]}
          </div>
        </div>
      ),
    },
    {
      title: '액션',
      key: 'action',
      width: 150,
      align: 'center' as const,
      render: (_, record: ServiceItem) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewItem(record)}
            title="상세 정보"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
            title="수정"
          />
          <Popconfirm
            title="정말 이 서비스를 삭제하시겠습니까?"
            onConfirm={() => handleDeleteItem(record.id)}
            okText="예"
            cancelText="아니요"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              title="삭제"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          margin: 0
        }}>
          서비스 관리
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddItem}
        >
          서비스 추가
        </Button>
      </div>

      <FilterForm
        fields={filterFields}
        onFilter={handleFilter}
        onReset={handleResetFilter}
        loading={loading}
      />

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${total}개`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? '서비스 수정' : '서비스 추가'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="서비스명"
            rules={[{ required: true, message: '서비스명을 입력해주세요.' }]}
          >
            <Input placeholder="서비스명을 입력하세요" />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="카테고리"
            rules={[{ required: true, message: '카테고리를 선택해주세요.' }]}
          >
            <Select placeholder="카테고리 선택">
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="설명">
            <TextArea
              rows={3}
              placeholder="서비스에 대한 상세한 설명을 입력하세요"
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="basePrice"
              label="기본 가격 (원)"
              rules={[{ required: true, message: '기본 가격을 입력해주세요.' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="000000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
              />
            </Form.Item>

            <Form.Item
              name="estimatedDuration"
              label="예상 소요 시간 (분)"
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="60"
              />
            </Form.Item>
          </div>

          <Form.Item name="images" label="서비스 이미지">
            <Upload
              {...uploadProps}
              listType="picture-card"
              multiple
              maxCount={5}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>이미지 업로드</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="isActive" label="활성화" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="서비스 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedItem && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="서비스명" span={2}>
                {selectedItem.name}
              </Descriptions.Item>
              <Descriptions.Item label="카테고리">
                {selectedItem.category?.name || '없음'}
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                <Tag color={selectedItem.isActive ? 'green' : 'red'}>
                  {selectedItem.isActive ? '활성' : '비활성'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="기본 가격">
                {formatCurrency(selectedItem.basePrice)}
              </Descriptions.Item>
              <Descriptions.Item label="예상 소요 시간">
                {formatDuration(selectedItem.estimatedDuration)}
              </Descriptions.Item>
              <Descriptions.Item label="등록일" span={2}>
                {formatDateTime(selectedItem.createdAt)}
              </Descriptions.Item>
              {selectedItem.description && (
                <Descriptions.Item label="설명" span={2}>
                  {selectedItem.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedItem.images && selectedItem.images.length > 0 && (
              <div>
                <h4>서비스 이미지</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                  gap: '8px' 
                }}>
                  {selectedItem.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      width="100%"
                      height={80}
                      style={{ objectFit: 'cover', borderRadius: '6px' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Items;