import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('ko');
dayjs.extend(relativeTime);

export const formatDate = (date: string | Date, format = 'YYYY년 MM월 DD일') => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export const formatPercentage = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
};

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
    'pending': 'orange',
    'confirmed': 'blue',
    'expert_assigned': 'cyan',
    'schedule_pending': 'geekblue', 
    'scheduled': 'green',
    'in_progress': 'green',
    'completed': 'default',
    'cancelled': 'red',
    'as_requested': 'purple'
  };
  return colorMap[status] || 'default';
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
    'unpaid': 'red',
    'deposit_paid': 'orange',
    'balance_paid': 'green',
    'refunded': 'default',
    'partially_refunded': 'orange'
  };
  return colorMap[status] || 'default';
};