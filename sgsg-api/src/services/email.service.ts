import nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config?: EmailConfig) {
    // 환경 변수에서 설정 가져오기 또는 제공된 설정 사용
    this.config = config || this.getConfigFromEnv();
    
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
    });

    // 연결 확인 (옵션)
    this.verifyConnection();
  }

  private getConfigFromEnv(): EmailConfig {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    
    return {
      host,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'noreply@sgsg.com',
    };
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('SMTP 서버 연결 성공');
    } catch (error) {
      console.error('SMTP 서버 연결 실패:', error);
      // 개발 환경에서는 계속 진행할 수 있도록 에러만 로깅
    }
  }

  async sendEmail(message: EmailMessage): Promise<boolean> {
    try {
      const mailOptions: MailOptions = {
        from: this.config.from,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('이메일 전송 성공:', info.messageId);
      return true;
    } catch (error) {
      console.error('이메일 전송 실패:', error);
      return false;
    }
  }

  // 템플릿 이메일 전송 메서드들

  async sendVerificationEmail(to: string, verificationToken: string, userName?: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SGSG 서비스</h1>
          </div>
          <div class="content">
            <h2>이메일 인증</h2>
            <p>안녕하세요${userName ? ` ${userName}님` : ''},</p>
            <p>SGSG 서비스 가입을 완료하기 위해 이메일 주소를 인증해 주세요.</p>
            <p>아래 버튼을 클릭하여 이메일 인증을 완료해 주세요:</p>
            <p>
              <a href="${verificationUrl}" class="button">이메일 인증하기</a>
            </p>
            <p>버튼이 동작하지 않을 경우 다음 링크를 복사하여 브라우저에 붙여넣기 하세요:</p>
            <p><code>${verificationUrl}</code></p>
            <p>이 링크는 24시간 동안 유효합니다.</p>
            <p>본 인증 요청을 하지 않으셨다면, 이 이메일을 무시해 주세요.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SGSG 서비스. All rights reserved.</p>
            <p>이 이메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `SGSG 서비스 이메일 인증\n\n안녕하세요${userName ? ` ${userName}님` : ''},\n\nSGSG 서비스 가입을 완료하기 위해 이메일 주소를 인증해 주세요.\n\n다음 링크를 클릭하여 이메일 인증을 완료해 주세요:\n${verificationUrl}\n\n이 링크는 24시간 동안 유효합니다.\n\n본 인증 요청을 하지 않으셨다면, 이 이메일을 무시해 주세요.`;

    return this.sendEmail({
      to,
      subject: 'SGSG 서비스 - 이메일 인증',
      text,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff4d4f; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #ff4d4f; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .warning { background-color: #fff2f0; border-left: 4px solid #ff4d4f; padding: 10px 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SGSG 서비스</h1>
          </div>
          <div class="content">
            <h2>비밀번호 재설정</h2>
            <p>안녕하세요${userName ? ` ${userName}님` : ''},</p>
            <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해 주세요.</p>
            <div class="warning">
              <p><strong>주의:</strong> 이 요청을 하지 않으셨다면, 계정 보안을 위해 즉시 비밀번호를 변경하시기 바랍니다.</p>
            </div>
            <p>
              <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
            </p>
            <p>버튼이 동작하지 않을 경우 다음 링크를 복사하여 브라우저에 붙여넣기 하세요:</p>
            <p><code>${resetUrl}</code></p>
            <p>이 링크는 1시간 동안 유효합니다.</p>
            <p>비밀번호 재설정 후에는 새로운 비밀번호로 로그인하실 수 있습니다.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SGSG 서비스. All rights reserved.</p>
            <p>이 이메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `SGSG 서비스 비밀번호 재설정\n\n안녕하세요${userName ? ` ${userName}님` : ''},\n\n비밀번호 재설정을 요청하셨습니다. 다음 링크를 클릭하여 새 비밀번호를 설정해 주세요:\n${resetUrl}\n\n이 링크는 1시간 동안 유효합니다.\n\n이 요청을 하지 않으셨다면, 계정 보안을 위해 즉시 비밀번호를 변경하시기 바랍니다.`;

    return this.sendEmail({
      to,
      subject: 'SGSG 서비스 - 비밀번호 재설정',
      text,
      html,
    });
  }

  async sendWelcomeEmail(to: string, userName?: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #52c41a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .features { margin: 20px 0; }
          .feature { margin: 10px 0; padding: 10px; background-color: white; border-left: 3px solid #52c41a; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SGSG 서비스에 오신 것을 환영합니다!</h1>
          </div>
          <div class="content">
            <h2>환영합니다${userName ? ` ${userName}님` : ''}!</h2>
            <p>SGSG 서비스에 가입해 주셔서 감사합니다. 이제 전문가 서비스 예약과 관리의 모든 기능을 이용하실 수 있습니다.</p>
            
            <div class="features">
              <h3>주요 기능:</h3>
              <div class="feature">
                <strong>다양한 서비스 카탈로그</strong>
                <p>청소, 집수리, 이사 등 다양한 서비스를 찾아보고 예약하세요.</p>
              </div>
              <div class="feature">
                <strong>전문가 매칭</strong>
                <p>검증된 전문가들이 신속하고 정확하게 서비스를 제공합니다.</p>
              </div>
              <div class="feature">
                <strong>안전한 결제 시스템</strong>
                <p>보증금과 잔금 시스템으로 안전하게 결제하세요.</p>
              </div>
              <div class="feature">
                <strong>실시간 알림</strong>
                <p>주문 상태와 진행 상황을 실시간으로 확인하세요.</p>
              </div>
            </div>
            
            <p>서비스 이용과 관련하여 궁금한 점이 있으시면 고객센터로 문의해 주세요.</p>
            <p>감사합니다.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SGSG 서비스. All rights reserved.</p>
            <p>이 이메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `SGSG 서비스에 오신 것을 환영합니다!\n\n안녕하세요${userName ? ` ${userName}님` : ''},\n\nSGSG 서비스에 가입해 주셔서 감사합니다. 이제 전문가 서비스 예약과 관리의 모든 기능을 이용하실 수 있습니다.\n\n주요 기능:\n- 다양한 서비스 카탈로그 (청소, 집수리, 이사 등)\n- 전문가 매칭\n- 안전한 결제 시스템\n- 실시간 알림\n\n서비스 이용과 관련하여 궁금한 점이 있으시면 고객센터로 문의해 주세요.\n\n감사합니다.`;

    return this.sendEmail({
      to,
      subject: 'SGSG 서비스에 오신 것을 환영합니다!',
      text,
      html,
    });
  }

  async sendOrderConfirmationEmail(to: string, orderNumber: string, serviceName: string, orderDate: string, amount: number, userName?: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .order-details { margin: 20px 0; background-color: white; padding: 20px; border-radius: 4px; border: 1px solid #ddd; }
          .detail-row { display: flex; margin: 10px 0; }
          .detail-label { width: 120px; font-weight: bold; }
          .detail-value { flex: 1; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>주문 확인</h1>
          </div>
          <div class="content">
            <h2>주문이 접수되었습니다</h2>
            <p>안녕하세요${userName ? ` ${userName}님` : ''},</p>
            <p>주문이 성공적으로 접수되었습니다. 아래 주문 정보를 확인해 주세요.</p>
            
            <div class="order-details">
              <h3>주문 상세 정보</h3>
              <div class="detail-row">
                <div class="detail-label">주문 번호:</div>
                <div class="detail-value">${orderNumber}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">서비스:</div>
                <div class="detail-value">${serviceName}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">주문 일시:</div>
                <div class="detail-value">${orderDate}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">결제 금액:</div>
                <div class="detail-value">${amount.toLocaleString()}원</div>
              </div>
            </div>
            
            <p>주문 상태는 마이페이지에서 확인하실 수 있으며, 서비스 진행 상황에 따라 알림을 드리겠습니다.</p>
            <p>감사합니다.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SGSG 서비스. All rights reserved.</p>
            <p>이 이메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `주문 확인\n\n안녕하세요${userName ? ` ${userName}님` : ''},\n\n주문이 성공적으로 접수되었습니다.\n\n주문 상세 정보:\n- 주문 번호: ${orderNumber}\n- 서비스: ${serviceName}\n- 주문 일시: ${orderDate}\n- 결제 금액: ${amount.toLocaleString()}원\n\n주문 상태는 마이페이지에서 확인하실 수 있으며, 서비스 진행 상황에 따라 알림을 드리겠습니다.\n\n감사합니다.`;

    return this.sendEmail({
      to,
      subject: `주문 확인: ${orderNumber}`,
      text,
      html,
    });
  }

  async sendNotificationEmail(to: string, title: string, message: string, userName?: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #faad14; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .notification { background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; padding: 20px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SGSG 서비스 알림</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>안녕하세요${userName ? ` ${userName}님` : ''},</p>
            
            <div class="notification">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <p>알림 설정은 마이페이지에서 변경하실 수 있습니다.</p>
            <p>감사합니다.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SGSG 서비스. All rights reserved.</p>
            <p>이 이메일은 발신 전용입니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `SGSG 알림: ${title}`,
      text: `SGSG 서비스 알림\n\n안녕하세요${userName ? ` ${userName}님` : ''},\n\n${title}\n\n${message}\n\n알림 설정은 마이페이지에서 변경하실 수 있습니다.\n\n감사합니다.`,
      html,
    });
  }
}