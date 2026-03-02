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
  InputNumber,
  Select,
  Descriptions,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  DatePicker
} from 'antd';
import { 
  EyeOutlined, 
  UndoOutlined,
  DollarCircleOutlined,
  TransactionOutlined,
  CreditCardOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons';
import FilterForm from '../../components/common/FilterForm';
import apiService from '../../services/api';
import { 
  formatDateTime, 
  formatCurrency, 
  formatNumber,
  formatRelativeTime,
  getPaymentStatusText,
  getPaymentStatusColor
} from '../../utils/formatters';
import type { Payment } from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface PaymentSummary {
  totalAmount: number;
  totalRefunded: number;
  pendingAmount: number;
  completedAmount: number;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [refundForm] = Form.useForm();
  const [summary, setSummary] = useState<PaymentSummary>({
    totalAmount: 0,
    totalRefunded: 0,
    pendingAmount: 0,
    completedAmount: 0,
  });

  const filterFields = [
    {
      name: 'search',
      label: '검색',
      type: 'input' as const,
      placeholder: '주문번호, 결제ID, 거래ID로 검색',
    },
    {
      name: 'status',
      label: '결제 상태',
      type: 'select' as const,
      options: [
        { label: '대기중', value: 'pending' },
        { label: '완료', value: 'completed' },
        { label: '실패', value: 'failed' },
        { label: '취소', value: 'cancelled' },
      ],
    },
    {
      name: 'type',
      label: '결제 유형',
      type: 'select' as const,
      options: [
        { label: '예약금', value: 'deposit' },
        { label: '잔금', value: 'balance' },
        { label: '전액', value: 'full' },
        { label: '환불', value: 'refund' },
      ],
    },
    {
      name: 'method',
      label: '결제 방법',
      type: 'select' as const,
      options: [
        { label: '카드결제', value: 'card' },
        { label: '계좌이체', value: 'transfer' },
        { label: '현금', value: 'cash' },
      ],
    },
    {
      name: 'dateRange',
      label: '결제일',
      type: 'dateRange' as const,
    },
  ];

  const fetchPayments = async (page = 1, pageSize = 20, filterParams = filters) => {
    try {
      setLoading(true);
      const response = await apiService.getPayments({
        page,
        limit: pageSize,
        ...filterParams,
      });

      setPayments(response.data.items || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total || 0,
      });

      // Calculate summary
      calculateSummary(response.data.items || []);
    } catch (error) {
      message.error('결제 내역을 불러오는데 실패했습니다.');
      console.error('Fetch payments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentList: Payment[]) => {
    const summary = paymentList.reduce((acc, payment) => {
      if (payment.status === 'completed') {
        if (payment.type === 'refund') {
          acc.totalRefunded += payment.amount;
        } else {
          acc.completedAmount += payment.amount;
        }
      } else if (payment.status === 'pending') {
        acc.pendingAmount += payment.amount;
      }
      acc.totalAmount += payment.amount;
      return acc;
    }, {
      totalAmount: 0,
      totalRefunded: 0,
      pendingAmount: 0,
      completedAmount: 0,
    });

    setSummary(summary);
  };

  const handleFilter = (values: any) => {
    setFilters(values);
    fetchPayments(1, pagination.pageSize, values);
  };

  const handleResetFilter = () => {
    setFilters({});
    fetchPayments(1, pagination.pageSize, {});
  };

  const handleTableChange = (paginationParams: any) => {
    fetchPayments(paginationParams.current, paginationParams.pageSize, filters);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailModalVisible(true);
  };

  const handleRefundPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    refundForm.resetFields();
    refundForm.setFieldsValue({
      amount: payment.amount,
      reason: ''
    });
    setRefundModalVisible(true);
  };

  const handleRefundSubmit = async () => {
    try {
      const values = await refundForm.validateFields();
      if (!selectedPayment) return;

      await apiService.refundPayment(selectedPayment.id, values.amount, values.reason);
      message.success('환불 처리가 완료되었습니다.');
      setRefundModalVisible(false);
      fetchPayments(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      message.error('환불 처리에 실패했습니다.');
      console.error('Refund error:', error);
    }
  };

  const getPaymentTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'deposit': '예약금',
      'balance': '잔금',
      'full': '전액',
      'refund': '환불',
    };
    return typeMap[type] || type;
  };

  const getPaymentTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'deposit': 'orange',
      'balance': 'blue',
      'full': 'green',
      'refund': 'red',
    };
    return colorMap[type] || 'default';
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      'card': '카드결제',
      'transfer': '계좌이체',
      'cash': '현금',
    };
    return methodMap[method] || method;
  };

  const columns = [
    {
      title: '결제 정보',
      key: 'paymentInfo',
      width: 200,
      render: (_, record: Payment) => (
        <div>
          <div style={{ fontWeight: '500', color: '#1890ff' }}>
            {record.id.slice(0, 8)}...
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
            {record.order?.orderNumber || '주문 정보 없음'}
          </div>
        </div>
      ),
    },
    {
      title: '결제 유형',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center' as const,
      render: (type: string) => (
        <Tag color={getPaymentTypeColor(type)}>
          {getPaymentTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '결제 방법',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      align: 'center' as const,
      render: (method: string) => getPaymentMethodText(method),
    },
    {
      title: '결제 금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: Payment) => (
        <span 
          style={{ 
            fontWeight: '500',
            color: record.type === 'refund' ? '#ff4d4f' : '#000'
          }}
        >
          {record.type === 'refund' ? '-' : ''}{formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '거래 ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 120,
      render: (transactionId: string) => (
        <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          {transactionId || '-'}
        </span>
      ),
    },
    {
      title: '결제일시',
      key: 'paymentDate',
      width: 120,
      render: (_, record: Payment) => (
        <div>
          <div>
            {record.processedAt 
              ? formatDateTime(record.processedAt).split(' ')[0]
              : formatDateTime(record.createdAt).split(' ')[0]
            }
          </div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
            {formatRelativeTime(record.processedAt || record.createdAt)}
          </div>
        </div>
      ),
    },
    {
      title: '액션',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_, record: Payment) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewPayment(record)}
            title="상세 정보"
          />
          {record.status === 'completed' && record.type !== 'refund' && (
            <Popconfirm
              title="정말 이 결제를 환불하시겠습니까?"
              onConfirm={() => handleRefundPayment(record)}
              okText="예"
              cancelText="아니요"
            >
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                danger
                title="환불"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '24px' 
      }}>
        결제 관리
      </h1>

      {/* Payment Summary Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="총 결제 금액"
              value={summary.completedAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="대기 중 결제"
              value={summary.pendingAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="총 환불 금액"
              value={summary.totalRefunded}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<UndoOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 거래 건수"
              value={pagination.total}
              prefix={<CreditCardOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
      </Row>

      <FilterForm
        fields={filterFields}
        onFilter={handleFilter}
        onReset={handleResetFilter}
        loading={loading}
      />

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={payments}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${formatNumber(total)}건`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Payment Detail Modal */}
      <Modal
        title="결제 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedPayment && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="결제 ID" span={2}>
              <span style={{ fontFamily: 'monospace' }}>
                {selectedPayment.id}
              </span>
            </Descriptions.Item>
            
            <Descriptions.Item label="주문번호">
              {selectedPayment.order?.orderNumber || '정보 없음'}
            </Descriptions.Item>
            <Descriptions.Item label="결제 상태">
              <Tag color={getPaymentStatusColor(selectedPayment.status)}>
                {getPaymentStatusText(selectedPayment.status)}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="결제 유형">
              <Tag color={getPaymentTypeColor(selectedPayment.type)}>
                {getPaymentTypeText(selectedPayment.type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="결제 방법">
              {getPaymentMethodText(selectedPayment.method)}
            </Descriptions.Item>
            
            <Descriptions.Item label="결제 금액" span={2}>
              <span style={{ 
                fontWeight: '500', 
                fontSize: '16px',
                color: selectedPayment.type === 'refund' ? '#ff4d4f' : '#000'
              }}>
                {selectedPayment.type === 'refund' ? '-' : ''}{formatCurrency(selectedPayment.amount)}
              </span>
            </Descriptions.Item>
            
            {selectedPayment.transactionId && (
              <Descriptions.Item label="거래 ID" span={2}>
                <span style={{ fontFamily: 'monospace' }}>
                  {selectedPayment.transactionId}
                </span>
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="결제 요청일">
              {formatDateTime(selectedPayment.createdAt)}
            </Descriptions.Item>
            {selectedPayment.processedAt && (
              <Descriptions.Item label="처리 완료일">
                {formatDateTime(selectedPayment.processedAt)}
              </Descriptions.Item>
            )}
            
            {selectedPayment.status === 'failed' && selectedPayment.failureReason && (
              <Descriptions.Item label="실패 사유" span={2}>
                {selectedPayment.failureReason}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal
        title="환불 처리"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        onOk={handleRefundSubmit}
        width={500}
      >
        {selectedPayment && (
          <div>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f5f5f5', 
              marginBottom: '16px', 
              borderRadius: '6px' 
            }}>
              <div>결제 ID: <strong>{selectedPayment.id}</strong></div>
              <div>원 결제 금액: <strong>{formatCurrency(selectedPayment.amount)}</strong></div>
            </div>
            
            <Form form={refundForm} layout="vertical">
              <Form.Item
                name="amount"
                label="환불 금액 (원)"
                rules={[
                  { required: true, message: '환불 금액을 입력해주세요.' },
                  { 
                    type: 'number', 
                    min: 1, 
                    max: selectedPayment.amount,
                    message: `환불 금액은 1원 이상 ${formatCurrency(selectedPayment.amount)} 이하여야 합니다.` 
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
                />
              </Form.Item>
              
              <Form.Item
                name="reason"
                label="환불 사유"
                rules={[{ required: true, message: '환불 사유를 입력해주세요.' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="환불 처리 사유를 입력해주세요"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;