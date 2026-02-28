# 외부 서비스 연동 스펙

**문서 버전**: 3.0 (Fastify + Ant Design Migration)  
**작성일**: 2026-02-28  
**우선순위**: P1 (2순위 - Phase 1 개발 시 필수)  
**상태**: 신규 스펙  
**대상 서비스**: 결제(PG), SMS/알림, 이메일, 파일 저장, 실시간 채팅, 분석 픽셀  
**관련 문서**: [01_ARCHITECTURE_DESIGN.md](01_ARCHITECTURE_DESIGN.md), [03_BACKEND_API_SPEC.md](03_BACKEND_API_SPEC.md), [08_DEPLOYMENT_STRATEGY.md](08_DEPLOYMENT_STRATEGY.md)

---

## 📋 목차

1. [개요](#개요)
2. [헥토 파이낸셜 (PG 결제)](#헥토-파이낸셜-pg-결제)
3. [알리고 (SMS/알림)](#알리고-sms알림)
4. [이메일 발송 (Sendmail + Nodemailer)](#이메일-발송-sendmail--nodemailer)
5. [AWS S3 (파일 저장)](#aws-s3-파일-저장)
6. [채널톡 (고객 상담)](#채널톡-고객-상담)
7. [분석 픽셀 (GA4, Meta, Naver)](#분석-픽셀-ga4-meta-naver)
8. [환경 변수 관리](#환경-변수-관리)
9. [에러 처리 및 재시도](#에러-처리-및-재시도)
10. [모니터링 및 로깅](#모니터링-및-로깅)
11. [테스트 전략](#테스트-전략)

---

## 개요

### 목적
쓱싹 홈케어 플랫폼이 외부 서비스와 안정적으로 통신하기 위한 인터페이스, 인증, 에러 처리, 모니터링 전략을 정의합니다.

### 핵심 원칙
1. **느슨한 결합**: 외부 서비스 변경 시 내부 코드 최소 영향
2. **재시도 및 장애 허용**: 일시적 장애 시 자동 복구
3. **보안**: 민감 정보 암호화 저장, API 키 순환
4. **모니터링**: 모든 외부 호출 추적, 성능 측정, 에러 감지
5. **Mocking 지원**: 개발/테스트 환경에서 외부 서비스 의존성 제거

### 서비스 매핑 테이블
| 서비스 | 용도 | 제공 업체 | 연동 방식 | 비고 |
|--------|------|-----------|-----------|------|
| 헥토 파이낸셜 | PG 결제 (카드, 가상계좌, 간편결제) | Hecto Financial | REST API | 필수, 이미 계정 있음 |
| 알리고 | SMS 발송 (인증, 주문 알림, 정산 알림) | Aligo | REST API (form-urlencoded) | 필수, 이미 계정 있음 |
| Sendmail | 이메일 발송 (서버 내장) | Linux Sendmail | SMTP | 대체 가능 (SendGrid) |
| AWS S3 | 파일 저장 (이미지, 첨부파일, 서명) | Amazon Web Services | AWS SDK v3 | 필수, 설정 필요 |
| 채널톡 | 실시간 고객 상담 | Channel.io | JavaScript 플러그인 | 선택, 개발 후기 연동 |
| GA4 | 사용자 행동 분석 | Google Analytics | JavaScript 태그 | 선택 |
| Meta Pixel | 페이스북/인스타그램 광고 추적 | Meta | JavaScript 태그 | 선택 |
| Naver Pixel | 네이버 광고 추적 | Naver | JavaScript 태그 | 선택 |

---

## 헥토 파이낸셜 (PG 결제)

### 계정 정보
```yaml
계정:
  ID: devsgsgcare
  PW: sgsgcare1!

API 엔드포인트:
  개발: https://dev-api.hecto.co.kr
  운영: https://api.hecto.co.kr

필요 키:
  - 가맹점 ID (MID)
  - API Key
  - Secret Key
```

### 결제 플로우 (Fastify 서비스 레이어)
1. **결제 요청 생성**: 주문 정보 → Hecto 결제 요청 API 호출 → 결제 페이지 URL 응답
2. **결제 완료 처리**: Hecto 웹훅 → 결제 검증 → 주문 상태 업데이트
3. **결제 조회/취소/환불**: 관리자 또는 사용자 요청 시 API 호출

### API 엔드포인트 설계 (Fastify 라우트)
```typescript
// src/routes/payment.routes.ts
export const paymentRoutes = async (fastify: FastifyInstance) => {
  // 결제 요청 생성
  fastify.post<{ Body: PaymentRequestDto }>('/payment/request', {
    schema: paymentRequestSchema,
    handler: paymentController.requestPayment
  });
  
  // 결제 완료 웹훅 (Hecto → 우리 서버)
  fastify.post('/payment/webhook', {
    config: { rawBody: true }, // 서명 검증을 위해 raw body 필요
    handler: paymentController.handleWebhook
  });
  
  // 결제 조회
  fastify.get<{ Params: { paymentId: string } }>('/payment/:paymentId', {
    handler: paymentController.getPayment
  });
  
  // 결제 취소 (전체)
  fastify.post<{ Params: { paymentId: string } }>('/payment/:paymentId/cancel', {
    handler: paymentController.cancelPayment
  });
  
  // 결제 환불 (부분/전체)
  fastify.post<{ Params: { paymentId: string } }>('/payment/:paymentId/refund', {
    schema: refundRequestSchema,
    handler: paymentController.refundPayment
  });
};
```

### 서비스 계층 구현 (TypeScript)
```typescript
// src/services/payment.service.ts
import { PaymentRequest, PaymentResponse, WebhookPayload } from '../types/payment';
import { HectoClient } from '../clients/hecto.client';
import { logger } from '../utils/logger';

export class PaymentService {
  private hecto: HectoClient;
  
  constructor() {
    this.hecto = new HectoClient({
      baseUrl: process.env.HECTO_API_URL,
      apiKey: process.env.HECTO_API_KEY,
      secretKey: process.env.HECTO_SECRET_KEY,
      mid: process.env.HECTO_MID
    });
  }
  
  async requestPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 결제 요청 데이터 변환
      const hectoRequest = this.mapToHectoRequest(request);
      
      // Hecto API 호출
      const response = await this.hecto.createPayment(hectoRequest);
      
      // 응답 데이터 변환
      return {
        paymentId: response.paymentId,
        redirectUrl: response.redirectUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30분 만료
      };
    } catch (error) {
      logger.error('결제 요청 실패', { error, request });
      throw new PaymentError('결제 요청에 실패했습니다', error);
    }
  }
  
  async verifyWebhook(payload: WebhookPayload, signature: string): Promise<boolean> {
    // 서명 검증 로직
    const expectedSignature = this.generateSignature(payload);
    return expectedSignature === signature;
  }
  
  async processWebhook(payload: WebhookPayload): Promise<void> {
    // 웹훅 처리: 주문 상태 업데이트, DB 저장 등
    const order = await this.orderService.updateOrderStatus(
      payload.orderId, 
      payload.status
    );
    
    // 실시간 알림 (Socket.IO 또는 알림 서비스)
    await this.notificationService.notifyOrderUpdate(order);
  }
  
  private mapToHectoRequest(request: PaymentRequest): any {
    return {
      mid: this.hecto.mid,
      orderId: request.orderId,
      amount: request.amount,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      returnUrl: `${process.env.FRONTEND_URL}/payment/complete`,
      callbackUrl: `${process.env.API_URL}/api/v1/payment/webhook`
    };
  }
}
```

### 보안 고려사항
1. **웹훅 서명 검증**: 모든 웹훅 요청은 Hecto 서명 검증 필수
2. **API 키 보관**: 환경 변수에 저장, AWS Secrets Manager 또는 HashiCorp Vault 고려
3. **결제 데이터 암호화**: 민감 정보(카드 번호 등)는 Hecto가 처리, 우리 DB에 저장 안 함
4. **PCI DSS 준수**: 결제 페이지는 Hecto 호스팅 방식 사용 (iframe/redirect)

### 에러 처리
- **네트워크 타임아웃**: 3회 재시도 (지수 백오프)
- **잔액 부족**: 고객에게 알림, 결제 수단 변경 유도
- **서버 오류**: 모니터링 알림, 수동 개입 필요

---

## 알리고 (SMS/알림)

### 계정 정보
```yaml
계정:
  ID: sgsgcare
  PW: !@Caresg9581

API 엔드포인트:
  SMS 발송: https://apis.aligo.in/send/
  발송 결과 조회: https://apis.aligo.in/list/

필요 정보:
  - API Key (로그인 후 발급)
  - 발신번호 (사업자 인증 필요)
```

### 메시지 유형 및 템플릿
| 유형 | 대상 | 템플릿 ID | 내용 예시 |
|------|------|-----------|-----------|
| 휴대폰 인증 | 고객/전문가 | - | `[쓱싹] 인증번호: 123456` |
| 주문 접수 | 고객 | ORDER_RECEIVED | `[쓱싹] 주문이 접수되었습니다. 주문번호: ORD-001` |
| 전문가 배정 | 고객 | EXPERT_ASSIGNED | `[쓱싹] 전문가가 배정되었습니다. 홍길동 전문가(010-1234-5678)` |
| 서비스 시작 | 고객 | SERVICE_STARTED | `[쓱싹] 전문가가 방문했습니다. 서비스가 시작됩니다.` |
| 서비스 완료 | 고객 | SERVICE_COMPLETED | `[쓱싹] 서비스가 완료되었습니다. 리뷰를 작성해주세요.` |
| 정산 알림 | 전문가 | SETTLEMENT_NOTICE | `[쓱싹] 정산이 완료되었습니다. 1,113,750원이 입금될 예정입니다.` |
| 계정 승인 | 전문가 | ACCOUNT_APPROVED | `[쓱싹] 전문가 계정이 승인되었습니다. 로그인하여 서비스를 시작하세요.` |

### SMS 서비스 구현 (Fastify 서비스)
```typescript
// src/services/sms.service.ts
import { AligoClient } from '../clients/aligo.client';
import { logger } from '../utils/logger';
import { RedisService } from './redis.service';

export class SmsService {
  private aligo: AligoClient;
  private redis: RedisService;
  
  constructor() {
    this.aligo = new AligoClient({
      apiKey: process.env.ALIGO_API_KEY,
      userId: process.env.ALIGO_USER_ID,
      sender: process.env.ALIGO_SENDER
    });
    
    this.redis = new RedisService();
  }
  
  async sendVerificationCode(phone: string): Promise<{ success: boolean; ttl: number }> {
    // 6자리 랜덤 숫자 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 메시지 구성
    const message = `[쓱싹] 인증번호: ${code}`;
    
    try {
      // 알리고 API 호출
      await this.aligo.sendSMS({
        receiver: phone,
        msg: message,
        msg_type: 'SMS',
        title: '쓱싹'
      });
      
      // Redis에 저장 (3분 TTL)
      await this.redis.setex(`auth:phone:${phone}`, 180, code);
      
      logger.info('인증번호 발송 성공', { phone, codePrefix: code.substring(0, 2) });
      
      return { success: true, ttl: 180 };
    } catch (error) {
      logger.error('인증번호 발송 실패', { phone, error });
      throw new SmsError('인증번호 발송에 실패했습니다', error);
    }
  }
  
  async verifyCode(phone: string, code: string): Promise<boolean> {
    const storedCode = await this.redis.get(`auth:phone:${phone}`);
    
    if (!storedCode) {
      throw new VerificationError('인증번호가 만료되었거나 존재하지 않습니다');
    }
    
    const isValid = storedCode === code;
    
    if (isValid) {
      // 인증 성공 시 Redis 키 삭제
      await this.redis.del(`auth:phone:${phone}`);
      // 인증 성공 플래그 설정 (5분 유효)
      await this.redis.setex(`auth:verified:${phone}`, 300, 'true');
    }
    
    return isValid;
  }
  
  async sendOrderNotification(order: Order, notificationType: string): Promise<void> {
    const template = this.getTemplate(notificationType, order);
    
    // 고객에게 알림
    if (order.customerPhone) {
      await this.aligo.sendSMS({
        receiver: order.customerPhone,
        msg: template.customerMessage,
        msg_type: 'LMS', // 장문 메시지
        title: '쓱싹 알림'
      });
    }
    
    // 전문가에게 알림 (배정, 시작, 완료 시)
    if (order.expertPhone && this.shouldNotifyExpert(notificationType)) {
      await this.aligo.sendSMS({
        receiver: order.expertPhone,
        msg: template.expertMessage,
        msg_type: 'SMS',
        title: '쓱싹 알림'
      });
    }
  }
  
  private getTemplate(type: string, order: Order): Template {
    // 템플릿 매핑 로직
    const templates = {
      ORDER_RECEIVED: {
        customerMessage: `[쓱싹] 주문이 접수되었습니다. 주문번호: ${order.orderNumber}`,
        expertMessage: ''
      },
      // ... 다른 템플릿
    };
    
    return templates[type] || templates.DEFAULT;
  }
}
```

### 알리고 클라이언트 (HTTP 클라이언트)
```typescript
// src/clients/aligo.client.ts
import axios from 'axios';
import qs from 'qs';

export class AligoClient {
  private baseUrl = 'https://apis.aligo.in';
  private apiKey: string;
  private userId: string;
  private sender: string;
  
  constructor(config: { apiKey: string; userId: string; sender: string }) {
    this.apiKey = config.apiKey;
    this.userId = config.userId;
    this.sender = config.sender;
  }
  
  async sendSMS(params: {
    receiver: string;
    msg: string;
    msg_type: 'SMS' | 'LMS' | 'MMS';
    title?: string;
  }): Promise<AligoResponse> {
    const data = {
      key: this.apiKey,
      user_id: this.userId,
      sender: this.sender,
      receiver: params.receiver,
      msg: params.msg,
      msg_type: params.msg_type,
      title: params.title || '쓱싹',
      testmode_yn: process.env.NODE_ENV === 'development' ? 'Y' : 'N'
    };
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/send/`,
        qs.stringify(data),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000 // 10초 타임아웃
        }
      );
      
      if (response.data.result_code !== '1') {
        throw new AligoApiError(response.data.message, response.data.result_code);
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // 알리고 API 에러 응답
        throw new AligoApiError(error.response.data.message, error.response.status);
      } else if (error.request) {
        // 네트워크 에러
        throw new NetworkError('알리고 서버 연결 실패', error);
      } else {
        // 기타 에러
        throw error;
      }
    }
  }
  
  async getSendResult(msgId: string): Promise<DeliveryStatus> {
    // 발송 결과 조회
    const response = await axios.post(
      `${this.baseUrl}/list/`,
      qs.stringify({
        key: this.apiKey,
        user_id: this.userId,
        mid: msgId
      })
    );
    
    return response.data;
  }
}
```

### 비용 관리 및 제한
- **월 한도**: 알리고 무료 크레딧 확인, 초과 시 유료
- **발송 제한**: 동일 수신자에게 1분 내 3회 이상 발송 제한
- **국제 문자**: 영어/숫자 90자, 한글 45자 (SMS 기준)

### 대체 방안 (개발/테스트)
```typescript
// 개발 환경에서는 콘솔 출력만 (Mocking)
if (process.env.NODE_ENV === 'development' && process.env.SMS_MOCK === 'true') {
  console.log('[SMS Mock] 수신자:', phone, '메시지:', message);
  return { success: true, mock: true };
}
```

---

## 이메일 발송 (Sendmail + Nodemailer)

### 전략: 단계적 구현
1. **개발 환경**: Nodemailer + 콘솔 로그
2. **스테이징 환경**: Nodemailer + Gmail/Outlook SMTP
3. **프로덕션 환경**: Linux Sendmail (비용 최소화) 또는 SendGrid (고급 기능)

### Sendmail 설정 (Linux 서버)
```bash
# Ubuntu/Debian
sudo apt-get install sendmail
sudo systemctl enable sendmail
sudo systemctl start sendmail

# sendmail 설정 테스트
echo "Test email" | mail -s "Test Subject" admin@sgsgcare.com
```

### Nodemailer 서비스 구현
```typescript
// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    // 환경에 따라 트랜스포터 설정
    this.transporter = this.createTransporter();
  }
  
  private createTransporter(): nodemailer.Transporter {
    const env = process.env.NODE_ENV;
    
    if (env === 'development') {
      // 개발: 콘솔 출력만
      return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    } else if (env === 'staging') {
      // 스테이징: Gmail SMTP (앱 비밀번호 필요)
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // 프로덕션: Sendmail
      return nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
      });
    }
  }
  
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: {
        name: '쓱싹 홈케어',
        address: process.env.EMAIL_FROM || 'noreply@sgsgcare.com'
      },
      to,
      subject,
      html
    };
    
    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('이메일 콘텐츠:');
        console.log('수신자:', to);
        console.log('제목:', subject);
        console.log('내용:', html);
        console.log('메시지 ID:', info.messageId);
      }
      
      logger.info('이메일 발송 성공', { to, subject, messageId: info.messageId });
    } catch (error) {
      logger.error('이메일 발송 실패', { to, subject, error });
      throw new EmailError('이메일 발송에 실패했습니다', error);
    }
  }
  
  async sendWelcomeEmail(user: User): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>쓱싹 홈케어 가입을 환영합니다</title>
        </head>
        <body>
          <h1>환영합니다, ${user.name}님!</h1>
          <p>쓱싹 홈케어 플랫폼에 가입해주셔서 감사합니다.</p>
          <p>서비스를 이용하시려면 아래 링크에서 로그인해주세요.</p>
          <a href="${process.env.FRONTEND_URL}/login">로그인하기</a>
        </body>
      </html>
    `;
    
    await this.sendEmail(user.email, '쓱싹 홈케어 가입을 환영합니다', html);
  }
  
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>비밀번호 재설정</title>
        </head>
        <body>
          <h1>비밀번호 재설정 요청</h1>
          <p>아래 링크를 클릭하여 비밀번호를 재설정하세요.</p>
          <p>링크는 1시간 동안 유효합니다.</p>
          <a href="${resetUrl}">비밀번호 재설정하기</a>
        </body>
      </html>
    `;
    
    await this.sendEmail(email, '쓱싹 홈케어 비밀번호 재설정', html);
  }
  
  async sendSettlementStatement(expert: Expert, settlement: Settlement): Promise<void> {
    // 정산 명세서 이메일 (PDF 첨부 가능)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>정산 명세서</title>
        </head>
        <body>
          <h1>정산 명세서</h1>
          <p>${settlement.periodStart} ~ ${settlement.periodEnd} 동안의 정산 내역입니다.</p>
          <table border="1">
            <tr><th>주문 수</th><td>${settlement.orderCount}</td></tr>
            <tr><th>총 매출</th><td>${settlement.totalSales.toLocaleString()}원</td></tr>
            <tr><th>플랫폼 수수료</th><td>${settlement.platformFee.toLocaleString()}원</td></tr>
            <tr><th>순수익</th><td>${settlement.netProfit.toLocaleString()}원</td></tr>
          </table>
        </body>
      </html>
    `;
    
    await this.sendEmail(expert.email, `정산 명세서 (${settlement.periodStart} ~ ${settlement.periodEnd})`, html);
  }
}
```

### 템플릿 엔진 고려사항
- **초기**: 하드코딩 HTML 문자열
- **향후**: Handlebars, EJS, React Email로 마이그레이션 가능

### SendGrid 마이그레이션 준비
```typescript
// SendGrid 클라이언트 (필요 시 교체)
import sgMail from '@sendgrid/mail';

export class SendGridEmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME
      },
      subject,
      html
    };
    
    await sgMail.send(msg);
  }
}
```

---

## AWS S3 (파일 저장)

### 버킷 설정
```yaml
버킷명: sgsg-uploads
리전: ap-northeast-2 (서울)
접근 제어: Private (서명된 URL 사용)
CORS 설정: 개발/프로덕션 도메인 허용
라이프사이클 규칙: 30일 후 GLACIER 이동, 90일 후 삭제
```

### 파일 유형 및 디렉토리 구조
```
s3://sgsg-uploads/
├── users/
│   ├── {userId}/
│   │   ├── profile/ (프로필 이미지)
│   │   ├── documents/ (제출 서류)
│   │   └── signatures/ (서명 이미지)
├── services/
│   ├── {categoryId}/
│   │   ├── {serviceId}/
│   │   │   └── images/ (서비스 이미지)
├── orders/
│   ├── {orderId}/
│   │   ├── before/ (서비스 전 사진)
│   │   ├── after/ (서비스 후 사진)
│   │   └── receipts/ (영수증)
└── temp/ (임시 업로드, 24시간 후 삭제)
```

### S3 업로드 서비스 (AWS SDK v3)
```typescript
// src/services/s3.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class S3Service {
  private s3: S3Client;
  private bucket: string;
  
  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    
    this.bucket = process.env.AWS_S3_BUCKET!;
  }
  
  async uploadFile(
    file: Buffer,
    fileName: string,
    folder: string,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    const key = `${folder}/${uuidv4()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      // ACL: 'private' (기본값)
    });
    
    try {
      await this.s3.send(command);
      
      const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      logger.info('파일 업로드 성공', { key, contentType, size: file.length });
      
      return { key, url };
    } catch (error) {
      logger.error('파일 업로드 실패', { fileName, folder, error });
      throw new S3Error('파일 업로드에 실패했습니다', error);
    }
  }
  
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    
    const url = await getSignedUrl(this.s3, command, { expiresIn });
    return url;
  }
  
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    
    await this.s3.send(command);
    logger.info('파일 삭제 성공', { key });
  }
  
  // 멀티파트 업로드 (대용량 파일)
  async uploadLargeFile(
    filePath: string,
    fileName: string,
    folder: string,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    // 구현 생략 (CreateMultipartUploadCommand 사용)
    throw new Error('아직 구현되지 않음');
  }
}
```

### Multer 미들웨어 통합 (Fastify)
```typescript
// src/middleware/upload.middleware.ts
import multer from 'fastify-multer';
import { S3Service } from '../services/s3.service';

const s3Service = new S3Service();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 최대 5개 파일
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않은 파일 형식입니다'));
    }
  }
});

// Fastify 플러그인으로 등록
export const uploadPlugin = async (fastify: FastifyInstance) => {
  fastify.register(multer.contentParser);
  
  // 단일 파일 업로드 엔드포인트
  fastify.post('/upload', {
    preHandler: upload.single('file'),
    handler: async (request, reply) => {
      const file = request.file;
      const folder = request.body.folder || 'temp';
      
      if (!file) {
        throw new BadRequestError('파일이 필요합니다');
      }
      
      const result = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        folder,
        file.mimetype
      );
      
      return {
        success: true,
        data: {
          key: result.key,
          url: result.url,
          signedUrl: await s3Service.getSignedUrl(result.key, 3600)
        }
      };
    }
  });
  
  // 다중 파일 업로드
  fastify.post('/upload/multiple', {
    preHandler: upload.array('files', 5),
    handler: async (request, reply) => {
      const files = request.files as Express.Multer.File[];
      const folder = request.body.folder || 'temp';
      
      const results = await Promise.all(
        files.map(async (file) => {
          const result = await s3Service.uploadFile(
            file.buffer,
            file.originalname,
            folder,
            file.mimetype
          );
          
          return {
            originalName: file.originalname,
            key: result.key,
            url: result.url
          };
        })
      );
      
      return { success: true, data: results };
    }
  });
};
```

### 이미지 처리 (Lambda@Edge 또는 서버사이드)
- **썸네일 생성**: Lambda@Edge로 자동 리사이징
- **WebP 변환**: 최신 브라우저 지원 시 WebP 형식 제공
- **이미지 최적화**: Sharp 라이브러리로 서버사이드 처리

### 비용 관리
- **스토리지 비용**: 월별 사용량 모니터링, 불필요 파일 정리
- **전송 비용**: CloudFront로 캐싱하여 비용 절감
- **요청 비용**: 작은 파일 배치는 멀티파트 업로드 권장

---

## 채널톡 (고객 상담)

### 통합 전략
1. **Phase 1**: 기본 채팅 기능만 구현 (Aligo SMS 기반)
2. **Phase 2**: 채널톡 플러그인 추가 (고객/전문가/관리자 간 실시간 채팅)

### 채널톡 설정
```yaml
가입: https://channel.io
플러그인 키: 채널톡 대시보드에서 발급
도메인 등록: expert.sgsgcare.com, admin.sgsgcare.com, www.sgsgcare.com
```

### 프론트엔드 통합 (React)
```typescript
// src/components/ChannelTalk.tsx
import { useEffect } from 'react';

declare global {
  interface Window {
    ChannelIO?: any;
    ChannelIOInitialized?: boolean;
  }
}

export function ChannelTalk() {
  useEffect(() => {
    if (!window.ChannelIO) {
      (function() {
        const w = window;
        if (w.ChannelIO) {
          return;
        }
        const ch = function() {
          ch.c(arguments);
        };
        ch.q = [];
        ch.c = function(args) {
          ch.q.push(args);
        };
        w.ChannelIO = ch;
        function l() {
          if (w.ChannelIOInitialized) {
            return;
          }
          w.ChannelIOInitialized = true;
          const s = document.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
          const x = document.getElementsByTagName('script')[0];
          if (x.parentNode) {
            x.parentNode.insertBefore(s, x);
          }
        }
        if (document.readyState === 'complete') {
          l();
        } else {
          w.addEventListener('DOMContentLoaded', l);
          w.addEventListener('load', l);
        }
      })();
    }
    
    // 부트 설정
    window.ChannelIO('boot', {
      pluginKey: process.env.VITE_CHANNEL_TALK_PLUGIN_KEY
    });
    
    // 사용자 정보 연동 (로그인 시)
    const user = getUserFromStore(); // Zustand 또는 Context에서 가져오기
    if (user) {
      window.ChannelIO('updateUser', {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileUrl: user.profileImage
      });
    }
    
    return () => {
      // 컴포넌트 언마운트 시 채널톡 종료
      if (window.ChannelIO) {
        window.ChannelIO('shutdown');
      }
    };
  }, []);
  
  return null; // UI 없는 컴포넌트
}
```

### 백엔드 연동 (웹훅)
- **사용자 정보 동기화**: 로그인/로그아웃 시 채널톡 사용자 정보 업데이트
- **채팅 이력 연동**: 주문 컨텍스트와 채팅 연결
- **관리자 알림**: 고객 문의 시 관리자에게 알림

---

## 분석 픽셀 (GA4, Meta, Naver)

### 구현 전략
1. **환경별 분리**: 개발 환경에서는 픽셀 비활성화
2. **동적 로딩**: 환경 변수로 픽셀 활성화/비활성화 제어
3. **이벤트 추적**: 주요 사용자 행동(주문, 가입, 결제) 추적

### GA4 구현 (React)
```typescript
// src/components/GoogleAnalytics.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export function GoogleAnalytics() {
  const location = useLocation();
  const measurementId = process.env.VITE_GA4_MEASUREMENT_ID;
  
  useEffect(() => {
    if (!measurementId || process.env.NODE_ENV === 'development') {
      return;
    }
    
    // 스크립트 로드
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_path: location.pathname
    });
    
    return () => {
      // 스크립트 제거 (필요 시)
    };
  }, [measurementId]);
  
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);
  
  return null;
}

// 이벤트 전송 훅
export function useGAEvent() {
  const sendEvent = (eventName: string, eventParams = {}) => {
    if (window.gtag && process.env.NODE_ENV === 'production') {
      window.gtag('event', eventName, eventParams);
    }
  };
  
  return { sendEvent };
}
```

### 주요 추적 이벤트
```typescript
// 이벤트 정의
export const GA_EVENTS = {
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  VIEW_SERVICE: 'view_service',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
  CONTACT_EXPERT: 'contact_expert',
  LEAVE_REVIEW: 'leave_review'
};

// 사용 예시
const { sendEvent } = useGAEvent();

// 주문 완료 시
sendEvent(GA_EVENTS.PURCHASE, {
  transaction_id: order.id,
  value: order.totalAmount,
  currency: 'KRW',
  items: order.items.map(item => ({
    item_id: item.serviceId,
    item_name: item.serviceName,
    price: item.price,
    quantity: item.quantity
  }))
});
```

### Meta Pixel 구현
```typescript
// src/components/MetaPixel.tsx
import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

export function MetaPixel() {
  const pixelId = process.env.VITE_META_PIXEL_ID;
  
  useEffect(() => {
    if (!pixelId || process.env.NODE_ENV === 'development') {
      return;
    }
    
    // 스크립트 로드
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    
    return () => {
      // 정리
    };
  }, [pixelId]);
  
  return null;
}
```

### Naver Pixel 구현
```typescript
// src/components/NaverPixel.tsx
import { useEffect } from 'react';

export function NaverPixel() {
  const pixelId = process.env.VITE_NAVER_PIXEL_ID;
  
  useEffect(() => {
    if (!pixelId || process.env.NODE_ENV === 'development') {
      return;
    }
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://wcs.naver.net/wcslog.js`;
    document.head.appendChild(script);
    
    script.onload = () => {
      if (window.wcs) {
        window.wcs_add = {};
        window.wcs.add = window.wcs_add;
        window.wcs.inflow = window.wcs_add;
        window.wcs_do = window.wcs_add;
        
        const naverScript = document.createElement('script');
        naverScript.type = 'text/javascript';
        naverScript.innerHTML = `
          if(!wcs_add) var wcs_add = {};
          wcs_add["wa"] = "${pixelId}";
          if(window.wcs) {
            wcs_do();
          }
        `;
        document.head.appendChild(naverScript);
      }
    };
    
    return () => {
      // 정리
    };
  }, [pixelId]);
  
  return null;
}
```

### 통합 컴포넌트
```typescript
// src/components/Analytics.tsx
import { GoogleAnalytics } from './GoogleAnalytics';
import { MetaPixel } from './MetaPixel';
import { NaverPixel } from './NaverPixel';

export function Analytics() {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  
  return (
    <>
      <GoogleAnalytics />
      <MetaPixel />
      <NaverPixel />
    </>
  );
}
```

---

## 환경 변수 관리

### 백엔드 환경 변수 (.env.example)
```env
# 서버 설정
NODE_ENV=development
PORT=3000
API_VERSION=v1

# 데이터베이스
DATABASE_URL=postgresql://sgsg_user:sgsg_password@localhost:5432/sgsg_db

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 헥토 파이낸셜
HECTO_ENV=development
HECTO_MID=your-merchant-id
HECTO_API_KEY=your-api-key
HECTO_SECRET_KEY=your-secret-key
HECTO_API_URL=https://dev-api.hecto.co.kr

# 알리고
ALIGO_API_KEY=your-api-key-from-aligo
ALIGO_USER_ID=sgsgcare
ALIGO_SENDER=01012345678
ALIGO_API_URL=https://apis.aligo.in

# 이메일
EMAIL_FROM=noreply@sgsgcare.com
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=sgsg-uploads
AWS_REGION=ap-northeast-2

# 채널톡 (선택)
CHANNEL_TALK_PLUGIN_KEY=your-plugin-key

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003

# 기타
LOG_LEVEL=debug
UPLOAD_MAX_SIZE=10485760
```

### 프론트엔드 환경 변수 (.env.example)
```env
# 공통
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENV=development

# 전문가 웹앱
VITE_EXPERT_URL=http://localhost:3001

# 백오피스
VITE_ADMIN_URL=http://localhost:3002

# 소비자 웹 (향후)
VITE_CONSUMER_URL=http://localhost:3003

# 외부 서비스 클라이언트 키
VITE_HECTO_CLIENT_KEY=your-client-key
VITE_CHANNEL_TALK_PLUGIN_KEY=your-plugin-key

# 분석 픽셀 (선택)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=your-pixel-id
VITE_NAVER_PIXEL_ID=your-pixel-id
```

### 보안 고려사항
1. **민감 정보 암호화**: AWS Secrets Manager, HashiCorp Vault, 또는 환경 변수 암호화
2. **키 순환 정책**: 90일마다 API 키 순환
3. **접근 제어**: 환경별 다른 키 사용 (개발/스테이징/프로덕션)
4. **모니터링**: 키 사용 추적, 이상 징후 감지

---

## 에러 처리 및 재시도

### 재시도 전략 (Exponential Backoff)
```typescript
// src/utils/retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 마지막 시도가 아니면 대기
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// 사용 예시
const result = await withRetry(
  () => hectoClient.createPayment(paymentRequest),
  3, // 최대 3회 재시도
  1000 // 초기 지연 1초
);
```

### 서킷 브레이커 패턴
```typescript
// src/utils/circuitBreaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1분
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerError('서킷 브레이커가 열려 있습니다');
      }
    }
    
    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }
}
```

### 에러 분류 및 처리
```typescript
// src/errors/external.errors.ts
export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class PaymentError extends ExternalServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'Hecto', originalError);
    this.name = 'PaymentError';
  }
}

export class SmsError extends ExternalServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'Aligo', originalError);
    this.name = 'SmsError';
  }
}

export class EmailError extends ExternalServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'Email', originalError);
    this.name = 'EmailError';
  }
}

export class S3Error extends ExternalServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'AWS S3', originalError);
    this.name = 'S3Error';
  }
}
```

---

## 모니터링 및 로깅

### 외부 서비스 호출 로깅
```typescript
// src/middleware/logging.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export async function externalServiceLogging(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const startTime = Date.now();
  
  // 요청 전 로깅
  logger.info('외부 서비스 호출 시작', {
    service: request.routeOptions.config?.service,
    url: request.url,
    method: request.method,
    params: request.params,
    query: request.query
  });
  
  try {
    const response = await reply;
    const duration = Date.now() - startTime;
    
    // 성공 로깅
    logger.info('외부 서비스 호출 성공', {
      service: request.routeOptions.config?.service,
      duration,
      statusCode: reply.statusCode
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 실패 로깅
    logger.error('외부 서비스 호출 실패', {
      service: request.routeOptions.config?.service,
      duration,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}
```

### 메트릭 수집 (Prometheus)
```typescript
// src/metrics/external.metrics.ts
import client from 'prom-client';

const externalServiceRequests = new client.Counter({
  name: 'external_service_requests_total',
  help: 'Total number of external service requests',
  labelNames: ['service', 'method', 'status']
});

const externalServiceDuration = new client.Histogram({
  name: 'external_service_duration_seconds',
  help: 'External service request duration in seconds',
  labelNames: ['service', 'method']
});

export function recordExternalServiceCall(
  service: string,
  method: string,
  duration: number,
  success: boolean
) {
  externalServiceRequests.inc({
    service,
    method,
    status: success ? 'success' : 'error'
  });
  
  externalServiceDuration.observe(
    { service, method },
    duration / 1000
  );
}
```

### 대시보드 모니터링 (Grafana)
- **서비스 상태**: 각 외부 서비스 가용성
- **응답 시간**: P50, P95, P99 응답 시간
- **에러율**: 서비스별 에러 비율
- **비용 모니터링**: API 호출 횟수, SMS 발송량, S3 사용량

### 알림 설정
- **에러율 임계치 초과**: Slack/이메일 알림
- **서비스 다운**: 즉시 알림
- **비용 초과**: 월별 할당량 80% 도달 시 알림

---

## 테스트 전략

### 모의 객체 (Mocking)
```typescript
// __tests__/mocks/external.mocks.ts
export const mockHectoClient = {
  createPayment: jest.fn().mockResolvedValue({
    paymentId: 'test_payment_123',
    redirectUrl: 'https://test.hecto.co.kr/payment/test'
  }),
  verifyWebhook: jest.fn().mockResolvedValue(true)
};

export const mockAligoClient = {
  sendSMS: jest.fn().mockResolvedValue({
    result_code: '1',
    message: '발송성공'
  })
};

export const mockS3Service = {
  uploadFile: jest.fn().mockResolvedValue({
    key: 'test/key/file.jpg',
    url: 'https://s3.amazonaws.com/bucket/test/key/file.jpg'
  }),
  getSignedUrl: jest.fn().mockResolvedValue('https://signed.url')
};
```

### 통합 테스트
```typescript
// __tests__/integration/external.test.ts
describe('외부 서비스 통합 테스트', () => {
  test('결제 요청 → Hecto API 호출', async () => {
    const paymentService = new PaymentService();
    
    const result = await paymentService.requestPayment({
      orderId: 'test_order_123',
      amount: 150000,
      customerName: '테스트 고객',
      customerEmail: 'test@example.com',
      customerPhone: '01012345678'
    });
    
    expect(result).toHaveProperty('paymentId');
    expect(result).toHaveProperty('redirectUrl');
  });
  
  test('SMS 인증번호 발송', async () => {
    const smsService = new SmsService();
    
    const result = await smsService.sendVerificationCode('01012345678');
    
    expect(result.success).toBe(true);
    expect(result.ttl).toBe(180);
  });
});
```

### E2E 테스트 (Playwright)
```typescript
// e2e/external-services.spec.ts
import { test, expect } from '@playwright/test';

test('결제 플로우 E2E 테스트', async ({ page }) => {
  // 1. 서비스 선택
  await page.goto('/services');
  await page.click('text=에어컨 설치');
  
  // 2. 주문 생성
  await page.fill('#customer-name', '테스트 고객');
  await page.fill('#customer-phone', '01012345678');
  await page.click('text=결제하기');
  
  // 3. 결제 요청 (Hecto 모의 페이지)
  await expect(page).toHaveURL(/hecto\.co\.kr/);
  
  // 4. 결제 완료
  await page.click('text=테스트 결제 완료');
  
  // 5. 결제 완료 확인
  await expect(page).toHaveURL(/\/order\/complete/);
  await expect(page.locator('text=결제가 완료되었습니다')).toBeVisible();
});
```

### 부하 테스트 (k6)
```javascript
// k6/payment-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // 30초 동안 50명까지 증가
    { duration: '1m', target: 50 },   // 1분 동안 50명 유지
    { duration: '30s', target: 0 },   // 30초 동안 0명까지 감소
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 요청이 500ms 미만
    http_req_failed: ['rate<0.01'],   // 에러율 1% 미만
  },
};

export default function () {
  const payload = JSON.stringify({
    orderId: `test_${__VU}_${__ITER}`,
    amount: 150000,
    customerName: '테스트 고객',
    customerEmail: 'test@example.com',
    customerPhone: '01012345678',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_token',
    },
  };
  
  const res = http.post('http://localhost:3000/api/v1/payment/request', payload, params);
  
  check(res, {
    '결제 요청 성공': (r) => r.status === 200,
    '응답 시간 적절': (r) => r.timings.duration < 1000,
  });
  
  sleep(1);
}
```

---

## 마이그레이션 및 업그레이드 계획

### 단계적 마이그레이션
1. **Phase 1**: 기본 외부 서비스 연동 (Hecto, Aligo, Sendmail)
2. **Phase 2**: AWS S3 파일 업로드 구현
3. **Phase 3**: 채널톡 실시간 채팅 통합
4. **Phase 4**: 분석 픽셀 통합

### 대체 서비스 준비
- **결제**: 토스페이먼츠, 아임포트 (Hecto 문제 시)
- **SMS**: Coolsms, NHN Toast (Aligo 문제 시)
- **이메일**: SendGrid, Amazon SES (Sendmail 문제 시)
- **파일 저장**: Cloudflare R2, Google Cloud Storage (S3 문제 시)

### 비상 대책 (Fallback)
1. **결제 실패**: 가상계좌 발급 또는 수동 결제 안내
2. **SMS 실패**: 앱 내 푸시 알림 또는 이메일 대체
3. **이메일 실패**: SMS로 중요 알림 대체
4. **파일 업로드 실패**: 로컬 임시 저장 후 재시도

---

**작성일**: 2026-02-28  
**버전**: 3.0  
**상태**: 스펙 작성 완료  
**다음 단계**: Phase 1 개발 시 본 문서 기반으로 외부 서비스 연동 구현