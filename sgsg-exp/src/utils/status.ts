export const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '대기 중',
    'confirmed': '확정됨',
    'expert_assigned': '전문가 배정',
    'schedule_pending': '일정 대기',
    'scheduled': '일정 확정',
    'in_progress': '진행 중',
    'completed': '완료',
    'cancelled': '취소됨',
    'as_requested': '요청대로 처리'
  };
  return statusMap[status] || status;
};

export const getOrderStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'pending': '#fa8c16', // orange
    'confirmed': '#1890ff', // blue
    'expert_assigned': '#13c2c2', // cyan
    'schedule_pending': '#722ed1', // geekblue 
    'scheduled': '#52c41a', // green
    'in_progress': '#52c41a', // green
    'completed': '#8c8c8c', // default
    'cancelled': '#ff4d4f', // red
    'as_requested': '#eb2f96' // purple
  };
  return colorMap[status] || '#8c8c8c';
};

export const getPaymentStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'unpaid': '미결제',
    'deposit_paid': '선금 완료',
    'balance_paid': '잔금 완료', 
    'refunded': '환불됨',
    'partially_refunded': '부분 환불'
  };
  return statusMap[status] || status;
};

export const getPaymentStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'unpaid': '#ff4d4f', // red
    'deposit_paid': '#fa8c16', // orange
    'balance_paid': '#52c41a', // green
    'refunded': '#8c8c8c', // default
    'partially_refunded': '#fa8c16' // orange
  };
  return colorMap[status] || '#8c8c8c';
};