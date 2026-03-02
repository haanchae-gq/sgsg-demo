import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tree, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  Switch,
  message,
  Popconfirm,
  Tag,
  Image,
  Alert
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DragOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import type { ServiceCategory } from '../../types';

interface TreeNode {
  key: string;
  title: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServiceCategories();
      setCategories(response.data || []);
    } catch (error) {
      message.error('카테고리 목록을 불러오는데 실패했습니다.');
      console.error('Fetch categories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = (categories: ServiceCategory[], parentId: string | null = null): TreeNode[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(category => ({
        key: category.id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {category.image && (
                <Image
                  src={category.image}
                  width={24}
                  height={24}
                  style={{ borderRadius: '4px' }}
                  preview={false}
                />
              )}
              <span>{category.name}</span>
              {!category.isActive && <Tag color="red">비활성</Tag>}
            </div>
            <Space size="small">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSubCategory(category);
                }}
                title="하위 카테고리 추가"
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCategory(category);
                }}
                title="수정"
              />
              <Popconfirm
                title="정말 이 카테고리를 삭제하시겠습니까?"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDeleteCategory(category.id);
                }}
                okText="예"
                cancelText="아니요"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => e.stopPropagation()}
                  title="삭제"
                />
              </Popconfirm>
            </Space>
          </div>
        ),
        children: buildTreeData(categories, category.id),
        isLeaf: !categories.some(cat => cat.parentId === category.id)
      }));
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleAddSubCategory = (parent: ServiceCategory) => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ parentId: parent.id, parentName: parent.name });
    setModalVisible(true);
  };

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category);
    const parentCategory = categories.find(cat => cat.id === category.parentId);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      order: category.order,
      parentId: category.parentId,
      parentName: parentCategory?.name || '최상위 카테고리'
    });
    setModalVisible(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await apiService.deleteServiceCategory(categoryId);
      message.success('카테고리가 삭제되었습니다.');
      fetchCategories();
    } catch (error) {
      message.error('카테고리 삭제에 실패했습니다.');
      console.error('Delete category error:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const categoryData = {
        name: values.name,
        description: values.description || '',
        parentId: values.parentId || null,
        isActive: values.isActive !== false,
        order: values.order || 0,
        image: values.image?.[0]?.url || values.image?.[0]?.response?.url || null
      };

      if (editingCategory) {
        await apiService.updateServiceCategory(editingCategory.id, categoryData);
        message.success('카테고리가 수정되었습니다.');
      } else {
        await apiService.createServiceCategory(categoryData);
        message.success('카테고리가 추가되었습니다.');
      }

      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error(`카테고리 ${editingCategory ? '수정' : '추가'}에 실패했습니다.`);
      console.error('Submit category error:', error);
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
    onChange: (info: any) => {
      if (info.file.status === 'done') {
        message.success('이미지가 업로드되었습니다.');
      } else if (info.file.status === 'error') {
        message.error('이미지 업로드에 실패했습니다.');
      }
    },
  };

  const treeData = buildTreeData(categories);

  useEffect(() => {
    fetchCategories();
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
          서비스 카테고리 관리
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddCategory}
        >
          최상위 카테고리 추가
        </Button>
      </div>

      <Alert
        message="카테고리 관리 안내"
        description="드래그 앤 드롭으로 카테고리 순서를 변경할 수 있으며, 최대 3단계까지 중첩 카테고리를 생성할 수 있습니다."
        type="info"
        style={{ marginBottom: '16px' }}
        showIcon
      />

      <Card bordered={false}>
        {treeData.length > 0 ? (
          <Tree
            treeData={treeData}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            showLine={{ showLeafIcon: false }}
            showIcon
            icon={<AppstoreOutlined />}
            blockNode
            style={{ fontSize: '14px' }}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#8c8c8c'
          }}>
            <AppstoreOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>카테고리가 없습니다</div>
            <div style={{ marginTop: '8px' }}>
              <Button type="link" onClick={handleAddCategory}>
                첫 번째 카테고리를 추가해보세요
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        title={editingCategory ? '카테고리 수정' : '카테고리 추가'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="parentName" label="상위 카테고리">
            <Input disabled placeholder="최상위 카테고리" />
          </Form.Item>

          <Form.Item
            name="name"
            label="카테고리명"
            rules={[{ required: true, message: '카테고리명을 입력해주세요.' }]}
          >
            <Input placeholder="카테고리명을 입력하세요" />
          </Form.Item>

          <Form.Item name="description" label="설명">
            <Input.TextArea
              rows={3}
              placeholder="카테고리에 대한 설명을 입력하세요"
            />
          </Form.Item>

          <Form.Item name="order" label="정렬 순서">
            <Input
              type="number"
              placeholder="0"
              min={0}
            />
          </Form.Item>

          <Form.Item name="image" label="카테고리 이미지">
            <Upload
              {...uploadProps}
              listType="picture-card"
              maxCount={1}
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
    </div>
  );
};

export default Categories;