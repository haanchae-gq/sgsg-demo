# 쓱싹 홈케어 플랫폼 - 환경 설정 가이드

**문서 버전**: 2.1  
**작성일**: 2026-01-14  
**우선순위**: P0 (개발 시작 전 필수)

---

## 📋 목차

1. [외부 서비스 계정 정보](#외부-서비스-계정-정보)
2. [환경 변수 설정](#환경-변수-설정)
3. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
4. [외부 서비스 연동 가이드](#외부-서비스-연동-가이드)

---

## 외부 서비스 계정 정보

### 1. 헥토 파이낸셜 (결제)
**서비스**: PG 결제 대행  
**용도**: 카드 결제, 가상계좌, 간편결제

```yaml
계정 정보:
  ID: devsgsgcare
  PW: sgsgcare1!
  
API 엔드포인트:
  개발: https://dev-api.hecto.co.kr
  운영: https://api.hecto.co.kr
  
필요 정보:
  - 가맹점 ID (MID)
  - API Key
  - Secret Key
```

**연동 문서**: 헥토 파이낸셜 개발자 센터 참조

---

### 2. 알리고 (SMS)
**서비스**: SMS 발송  
**용도**: 휴대폰 인증, 주문 알림, 정산 알림

```yaml
계정 정보:
  ID: sgsgcare
  PW: !@Caresg9581
  
API 엔드포인트:
  SMS 발송: https://apis.aligo.in/send/
  
필요 정보:
  - API Key (로그인 후 발급)
  - 발신번호 등록 필요
```

**연동 문서**: https://smartsms.aligo.in/admin/api/spec.html

---

### 3. 이메일 발송 (Sendmail)
**서비스**: 서버 내장 Sendmail
**용도**: 회원가입 환영, 비밀번호 재설정, 정산 명세서

```yaml
상태: ✅ 배포 후 사용

개발 환경:
  - Nodemailer 사용 (콘솔 로그 출력)
  - 실제 발송 없이 테스트
  
배포 환경:
  - Linux Sendmail 사용
  - 서버에 Sendmail 설치 필요
  - 무료, 외부 서비스 불필요
  
설정 방법:
  1. 서버에 Sendmail 설치
     - Ubuntu: sudo apt-get install sendmail
     - CentOS: sudo yum install sendmail
  2. Nodemailer 설정 (sendmail transport)
  3. 발신 도메인 설정 (sgsgcare.com)
```

---

### 4. 채널톡 (고객 상담)
**서비스**: 실시간 채팅 상담  
**용도**: 고객 문의, 전문가 문의

```yaml
상태: ⚠️ 설정 필요

가입 절차:
  1. 채널톡 계정 생성 (https://channel.io)
  2. 플러그인 키 발급
  3. 웹사이트에 스크립트 삽입
```

---

### 5. AWS S3 (파일 저장)
**서비스**: 파일 저장소  
**용도**: 이미지, 첨부파일, 서명 이미지

```yaml
상태: ⚠️ 설정 필요

설정 절차:
  1. AWS 계정 생성
  2. S3 버킷 생성 (예: sgsg-uploads)
  3. IAM 사용자 생성 및 권한 부여
  4. Access Key, Secret Key 발급
  
권장 설정:
  - 리전: ap-northeast-2 (서울)
  - 버킷 정책: Private (서명된 URL 사용)
  - CORS 설정 필요
```

---

## 환경 변수 설정

### 백엔드 (.env)
```env
# 서버
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

# 헥토 파이낸셜 (결제)
HECTO_ENV=development
HECTO_MID=your-merchant-id
HECTO_API_KEY=your-api-key
HECTO_SECRET_KEY=your-secret-key
HECTO_API_URL=https://dev-api.hecto.co.kr

# 알리고 (SMS)
ALIGO_API_KEY=your-api-key-from-aligo
ALIGO_USER_ID=sgsgcare
ALIGO_SENDER=01012345678
ALIGO_API_URL=https://apis.aligo.in

# SendGrid (이메일) - 설정 후 입력
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@sgsgcare.com
SENDGRID_FROM_NAME=쓱싹

# AWS S3 (파일 저장) - 설정 후 입력
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=sgsg-uploads
AWS_REGION=ap-northeast-2

# 채널톡 - 설정 후 입력
CHANNEL_TALK_PLUGIN_KEY=your-plugin-key

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003

# 기타
LOG_LEVEL=debug
UPLOAD_MAX_SIZE=10485760
```

### 프론트엔드 (.env)
```env
# 전문가 웹앱
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_ENV=development

# 백오피스
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENV=development

# 소비자 웹
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_HECTO_CLIENT_KEY=your-client-key
VITE_CHANNEL_TALK_PLUGIN_KEY=your-plugin-key
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=your-pixel-id
VITE_NAVER_PIXEL_ID=your-pixel-id
```

---

## 로컬 개발 환경 설정

### 1. 필수 소프트웨어 설치

```bash
# Node.js 18+ (LTS)
# https://nodejs.org

# PostgreSQL 14+
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql@14

# Redis 7+
# Windows: https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis

# Docker (선택사항)
# https://www.docker.com/products/docker-desktop
```

### 2. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
psql -U postgres
CREATE DATABASE sgsg_db;
CREATE USER sgsg_user WITH PASSWORD 'sgsg_password';
GRANT ALL PRIVILEGES ON DATABASE sgsg_db TO sgsg_user;
\q

# Redis 실행
redis-server
```

### 3. 프로젝트 클론 및 설정

```bash
# Git 저장소 클론
git clone https://github.com/your-org/sgsg_platform.git
cd sgsg_platform

# 백엔드 설정
cd backend
npm install
cp .env.example .env
# .env 파일 수정 (위 환경 변수 참조)

# Prisma 마이그레이션
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 백엔드 실행
npm run dev

# 전문가 웹앱 설정 (새 터미널)
cd ../frontend-expert
npm install
cp .env.example .env
npm run dev

# 백오피스 설정 (새 터미널)
cd ../frontend-backoffice
npm install
cp .env.example .env
npm run dev
```

---

## 외부 서비스 연동 가이드

### 1. 헥토 파이낸셜 연동

#### Step 1: 개발자 센터 로그인
```
URL: https://dev.hecto.co.kr
ID: devsgsgcare
PW: sgsgcare1!
```

#### Step 2: API 키 발급
1. 개발자 센터 로그인
2. 가맹점 정보 확인
3. API Key, Secret Key 발급
4. `.env` 파일에 입력

#### Step 3: 결제 테스트
```javascript
// backend/src/services/payment.service.ts
import axios from 'axios';

const HECTO_API_URL = process.env.HECTO_API_URL;
const HECTO_API_KEY = process.env.HECTO_API_KEY;

async function requestPayment(orderData) {
  const response = await axios.post(`${HECTO_API_URL}/payment/request`, {
    mid: process.env.HECTO_MID,
    amount: orderData.amount,
    orderId: orderData.orderId,
    // ... 기타 필드
  }, {
    headers: {
      'Authorization': `Bearer ${HECTO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
}
```

---

### 2. 알리고 SMS 연동

#### Step 1: API Key 발급
```
URL: https://smartsms.aligo.in
ID: sgsgcare
PW: !@Caresg9581

1. 로그인
2. API 설정 메뉴
3. API Key 발급
4. 발신번호 등록 (사업자 인증 필요)
```

#### Step 2: SMS 발송 테스트
```javascript
// backend/src/services/sms.service.ts
import axios from 'axios';
import qs from 'qs';

const ALIGO_API_URL = 'https://apis.aligo.in';
const ALIGO_USER_ID = 'sgsgcare';
const ALIGO_API_KEY = process.env.ALIGO_API_KEY;

async function sendSMS(phone: string, message: string) {
  const data = {
    key: ALIGO_API_KEY,
    user_id: ALIGO_USER_ID,
    sender: process.env.ALIGO_SENDER, // 등록된 발신번호
    receiver: phone,
    msg: message,
    msg_type: 'SMS',
    title: '쓱싹'
  };
  
  const response = await axios.post(
    `${ALIGO_API_URL}/send/`,
    qs.stringify(data),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  return response.data;
}

// 휴대폰 인증번호 발송
async function sendVerificationCode(phone: string) {
  const code = Math.random().toString().slice(2, 8); // 6자리
  const message = `[쓱싹] 인증번호: ${code}`;
  
  await sendSMS(phone, message);
  
  // Redis에 저장 (3분 유효)
  await redis.setex(`phone_verify:${phone}`, 180, code);
  
  return { success: true };
}
```

---

### 3. SendGrid 연동 (설정 필요)

#### Step 1: SendGrid 계정 생성
```
URL: https://sendgrid.com
가입: 무료 플랜 (월 100통)

1. 계정 생성
2. 발신자 이메일 인증
   - 권장: noreply@sgsgcare.com
   - 또는: support@sgsgcare.com
3. API Key 발급
```

#### Step 2: 이메일 템플릿 생성 (선택)
```
템플릿 종류:
  - 회원가입 환영 이메일
  - 비밀번호 재설정 이메일
  - 주문 확인 이메일
  - 정산 명세서 이메일
```

#### Step 3: 이메일 발송 테스트
```javascript
// backend/src/services/email.service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to: string, subject: string, html: string) {
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

// 회원가입 환영 이메일
async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <h1>환영합니다, ${name}님!</h1>
    <p>쓱싹 홈케어 플랫폼에 가입해주셔서 감사합니다.</p>
  `;
  
  await sendEmail(email, '쓱싹 가입을 환영합니다', html);
}
```

#### 대안: Nodemailer (개발용)
```javascript
// SendGrid 설정 전 임시 사용
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: '"쓱싹" <noreply@sgsgcare.com>',
    to,
    subject,
    html
  });
}
```

---

### 4. AWS S3 연동 (설정 필요)

#### Step 1: AWS 계정 및 S3 버킷 생성
```
1. AWS 계정 생성 (https://aws.amazon.com)
2. S3 버킷 생성
   - 버킷명: sgsg-uploads
   - 리전: ap-northeast-2 (서울)
   - 퍼블릭 액세스 차단: ON
3. IAM 사용자 생성
   - 권한: S3 Full Access
   - Access Key, Secret Key 발급
```

#### Step 2: CORS 설정
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "https://expert.sgsgcare.com",
      "https://admin.sgsgcare.com",
      "https://www.sgsgcare.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### Step 3: 파일 업로드 구현
```javascript
// backend/src/services/upload.service.ts
import AWS from 'aws-sdk';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadFile(file: Express.Multer.File, folder: string) {
  const key = `${folder}/${uuidv4()}-${file.originalname}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private'
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
}

// Multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
```

---

### 5. 채널톡 연동 (설정 필요)

#### Step 1: 채널톡 설정
```
1. 채널톡 계정 생성 (https://channel.io)
2. 플러그인 키 발급
3. 웹사이트 도메인 등록
```

#### Step 2: 프론트엔드 스크립트 삽입
```html
<!-- public/index.html -->
<script>
  (function() {
    var w = window;
    if (w.ChannelIO) {
      return w.console.error('ChannelIO script included twice.');
    }
    var ch = function() {
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
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
      var x = document.getElementsByTagName('script')[0];
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

  ChannelIO('boot', {
    pluginKey: 'YOUR_PLUGIN_KEY'
  });
</script>
```

---

## 개발 시작 전 최종 체크리스트

### 필수 항목 (즉시 필요)
- [x] 헥토 파이낸셜 계정 (devsgsgcare / sgsgcare1!)
- [x] 알리고 SMS 계정 (sgsgcare / !@Caresg9581)
- [ ] PostgreSQL 설치 및 실행
- [ ] Redis 설치 및 실행
- [ ] Node.js 18+ 설치
- [ ] Git 저장소 생성

### 선택 항목 (개발 중 설정 가능)
- [ ] SendGrid 계정 생성 및 API Key 발급
- [ ] AWS S3 버킷 생성 및 IAM 설정
- [ ] 채널톡 계정 생성 및 플러그인 키 발급
- [ ] GA4, Meta Pixel, Naver Pixel 설정

### 임시 대안 (개발 초기)
```markdown
SendGrid 대신:
  - Nodemailer + Gmail (개발용)
  - 콘솔 로그 출력

AWS S3 대신:
  - 로컬 파일 시스템 (./uploads)
  - Multer disk storage

채널톡 대신:
  - 기본 채팅 기능만 구현
  - 나중에 연동
```

---

## 다음 단계

### 즉시 실행
1. **PostgreSQL, Redis 설치**
2. **백엔드 프로젝트 초기화**
3. **환경 변수 설정** (.env 파일)
4. **Prisma 마이그레이션 실행**
5. **개발 서버 실행 및 테스트**

### 개발 중 설정
1. **SendGrid 계정 생성** (이메일 발송 필요 시)
2. **AWS S3 설정** (파일 업로드 필요 시)
3. **채널톡 설정** (고객 상담 필요 시)

---

**작성일**: 2026-01-14  
**버전**: 2.1  
**상태**: 환경 설정 가이드 완료  
**다음 단계**: Phase 1 개발 시작
