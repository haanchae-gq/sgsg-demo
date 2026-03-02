import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export interface HectoPaymentRequest {
  mid: string;
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  callbackUrl: string;
  timestamp: string;
  signature?: string;
}

export interface HectoPaymentResponse {
  paymentId: string;
  redirectUrl: string;
  status: string;
  message?: string;
}

export interface HectoWebhookPayload {
  mid: string;
  orderId: string;
  paymentId: string;
  status: 'success' | 'failed' | 'cancelled';
  amount: number;
  pgTransactionId: string;
  paidAt: string;
  timestamp: string;
  signature: string;
}

export class HectoApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'HectoApiError';
  }
}

export class HectoClient {
  private client: AxiosInstance;
  private mid: string;
  private apiKey: string;
  private secretKey: string;

  constructor(config: {
    baseUrl: string;
    mid: string;
    apiKey: string;
    secretKey: string;
  }) {
    this.mid = config.mid;
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // 요청/응답 인터셉터 설정
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 요청 인터셉터 - 서명 추가
    this.client.interceptors.request.use((config) => {
      if (config.data) {
        config.data.signature = this.generateSignature(config.data);
      }
      return config;
    });

    // 응답 인터셉터 - 에러 처리
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { data, status } = error.response;
          throw new HectoApiError(data.message || '헥토 API 오류', data.code || status.toString());
        } else if (error.request) {
          throw new HectoApiError('헥토 서버 연결 실패');
        } else {
          throw new HectoApiError('헥토 요청 처리 실패');
        }
      }
    );
  }

  /**
   * 서명 생성 (HMAC-SHA256)
   */
  private generateSignature(data: any): string {
    // 서명용 문자열 생성 - 키를 알파벳 순으로 정렬하여 연결
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .filter(key => key !== 'signature') // signature 필드는 제외
      .map(key => `${key}=${data[key]}`)
      .join('&');

    // HMAC-SHA256 서명 생성
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureString)
      .digest('hex');

    return signature;
  }

  /**
   * 웹훅 서명 검증
   */
  verifyWebhookSignature(payload: HectoWebhookPayload): boolean {
    const receivedSignature = payload.signature;
    const expectedSignature = this.generateSignature(payload);
    
    return receivedSignature === expectedSignature;
  }

  /**
   * 결제 요청 생성
   */
  async createPayment(request: Omit<HectoPaymentRequest, 'mid' | 'signature'>): Promise<HectoPaymentResponse> {
    const paymentRequest: HectoPaymentRequest = {
      ...request,
      mid: this.mid,
    };

    try {
      const response = await this.client.post('/payment/request', paymentRequest);
      
      return {
        paymentId: response.data.paymentId,
        redirectUrl: response.data.redirectUrl,
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error) {
      console.error('헥토 결제 요청 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 상태 조회
   */
  async getPaymentStatus(paymentId: string): Promise<{
    paymentId: string;
    status: string;
    amount: number;
    pgTransactionId?: string;
    paidAt?: string;
  }> {
    const timestamp = Date.now().toString();
    const requestData = {
      mid: this.mid,
      paymentId,
      timestamp,
    };

    try {
      const response = await this.client.post('/payment/status', requestData);
      
      return response.data;
    } catch (error) {
      console.error('헥토 결제 상태 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(paymentId: string, reason: string, amount?: number): Promise<{
    cancelId: string;
    status: string;
    message: string;
  }> {
    const timestamp = Date.now().toString();
    const requestData = {
      mid: this.mid,
      paymentId,
      reason,
      amount, // 부분 취소할 경우 금액 지정
      timestamp,
    };

    try {
      const response = await this.client.post('/payment/cancel', requestData);
      
      return {
        cancelId: response.data.cancelId,
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error) {
      console.error('헥토 결제 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 처리
   */
  async refundPayment(paymentId: string, reason: string, amount: number): Promise<{
    refundId: string;
    status: string;
    message: string;
  }> {
    const timestamp = Date.now().toString();
    const requestData = {
      mid: this.mid,
      paymentId,
      reason,
      amount,
      timestamp,
    };

    try {
      const response = await this.client.post('/payment/refund', requestData);
      
      return {
        refundId: response.data.refundId,
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error) {
      console.error('헥토 결제 환불 실패:', error);
      throw error;
    }
  }
}