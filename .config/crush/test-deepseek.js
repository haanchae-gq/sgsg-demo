#!/usr/bin/env node
/**
 * DeepSeek API 연결 및 설정 테스트 스크립트
 */

const https = require('https');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = 'https://api.deepseek.com';

if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
  console.error('❌ DEEPSEEK_API_KEY가 설정되지 않았습니다.');
  console.log('💡 .env 파일에서 DEEPSEEK_API_KEY를 실제 API 키로 변경해주세요.');
  process.exit(1);
}

/**
 * DeepSeek API 테스트 함수
 */
async function testDeepSeekAPI() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Always respond in valid JSON format. Do not include markdown code blocks.'
        },
        {
          role: 'user', 
          content: 'Create a simple JSON response with "status": "success" and "message": "DeepSeek API test successful"'
        }
      ],
      max_tokens: 100,
      temperature: 0.1,
      stream: false
    });

    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(testData)
      },
      timeout: 30000
    };

    console.log('🔍 DeepSeek API 연결 테스트 중...');
    
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📡 응답 상태: ${res.statusCode}`);
        
        if (res.statusCode !== 200) {
          console.error('❌ API 호출 실패:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const response = JSON.parse(data);
          
          if (response.choices && response.choices[0] && response.choices[0].message) {
            console.log('✅ API 호출 성공!');
            console.log('📝 응답 내용:', response.choices[0].message.content);
            
            // JSON 응답 검증
            try {
              const aiResponse = JSON.parse(response.choices[0].message.content);
              console.log('✅ AI 응답 JSON 파싱 성공:', aiResponse);
            } catch (jsonError) {
              console.log('⚠️ AI 응답이 JSON 형식이 아님:', response.choices[0].message.content);
            }
            
            resolve(response);
          } else {
            console.error('❌ 예상하지 못한 응답 형식:', response);
            reject(new Error('Unexpected response format'));
          }
        } catch (parseError) {
          console.error('❌ 응답 JSON 파싱 실패:', parseError.message);
          console.log('원본 응답:', data);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 네트워크 오류:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ 요청 시간 초과');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(testData);
    req.end();
  });
}

/**
 * 설정 유효성 검사
 */
async function validateSettings() {
  console.log('🔧 Crush 설정 검증 중...');
  
  try {
    const crushConfig = require('./crush.json');
    
    if (crushConfig.providers && crushConfig.providers.deepseek) {
      console.log('✅ DeepSeek provider 설정됨');
      console.log('📊 최대 토큰:', crushConfig.providers.deepseek.model_overrides?.['deepseek-chat']?.max_tokens || '기본값');
      console.log('🌡️ Temperature:', crushConfig.providers.deepseek.model_overrides?.['deepseek-chat']?.temperature || '기본값');
    } else {
      console.log('❌ DeepSeek provider가 설정되지 않음');
    }
    
    if (crushConfig.model?.default_provider === 'deepseek') {
      console.log('✅ DeepSeek가 기본 provider로 설정됨');
    } else {
      console.log('ℹ️ 기본 provider:', crushConfig.model?.default_provider || 'openrouter');
    }
    
  } catch (error) {
    console.error('❌ Crush 설정 파일 읽기 실패:', error.message);
  }
}

// 메인 실행
async function main() {
  console.log('🚀 DeepSeek API 설정 테스트 시작\n');
  
  await validateSettings();
  console.log('');
  
  try {
    await testDeepSeekAPI();
    console.log('\n🎉 모든 테스트 통과! DeepSeek API 사용 준비 완료');
  } catch (error) {
    console.error('\n💥 테스트 실패:', error.message);
    console.log('\n🔧 해결 방법:');
    console.log('1. .env 파일에서 DEEPSEEK_API_KEY를 확인하세요');
    console.log('2. API 키가 유효한지 DeepSeek 콘솔에서 확인하세요');
    console.log('3. 네트워크 연결을 확인하세요');
    process.exit(1);
  }
}

main();