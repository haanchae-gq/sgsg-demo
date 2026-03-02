import React from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';


const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterFormProps {
  onFilter: (values: any) => void;
  onReset: () => void;
  loading?: boolean;
  fields?: FilterField[];
}

interface FilterField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'dateRange';
  placeholder?: string;
  options?: { label: string; value: string }[];
  allowClear?: boolean;
}

const FilterForm: React.FC<FilterFormProps> = ({
  onFilter,
  onReset,
  loading = false,
  fields = []
}) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    // Convert date range to proper format
    const processedValues = { ...values };
    
    Object.keys(processedValues).forEach(key => {
      if (processedValues[key] && Array.isArray(processedValues[key]) && processedValues[key].length === 2) {
        // Handle date range
        processedValues[`${key}From`] = processedValues[key][0].format('YYYY-MM-DD');
        processedValues[`${key}To`] = processedValues[key][1].format('YYYY-MM-DD');
        delete processedValues[key];
      }
    });

    onFilter(processedValues);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  const renderField = (field: FilterField) => {
    switch (field.type) {
      case 'input':
        return (
          <Input
            placeholder={field.placeholder || `${field.label} 검색`}
            allowClear={field.allowClear !== false}
          />
        );

      case 'select':
        return (
          <Select
            placeholder={field.placeholder || `${field.label} 선택`}
            allowClear={field.allowClear !== false}
            style={{ minWidth: 120 }}
          >
            {field.options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'dateRange':
        return (
          <RangePicker
            placeholder={['시작일', '종료일']}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '16px 24px' }}
    >
      <Form
        form={form}
        layout="inline"
        onFinish={handleSubmit}
        style={{ width: '100%' }}
      >
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center',
          gap: '12px',
          width: '100%'
        }}>
          {fields.map(field => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              style={{ margin: 0 }}
            >
              {renderField(field)}
            </Form.Item>
          ))}
          
          <Space style={{ marginLeft: 'auto' }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              loading={loading}
            >
              검색
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              초기화
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default FilterForm;