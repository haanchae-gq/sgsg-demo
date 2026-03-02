#!/usr/bin/env node
/**
 * JSON 수리 유틸리티 - DeepSeek API 응답 처리용
 * "unexpected end of JSON input" 오류를 방지하고 수정
 */

const fs = require('fs');

/**
 * 잘린 JSON을 수리하는 함수
 */
function repairJson(jsonString) {
  try {
    // 1. 기본 검증 - 이미 올바른 JSON인지 확인
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    console.log('JSON 복구 시도 중...', error.message);
  }

  let repaired = jsonString.trim();
  
  // 2. 마크다운 코드 블록 제거
  repaired = repaired.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  
  // 3. 불완전한 키 수정 (따옴표 누락)
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // 4. 잘린 문자열 값 수정
  repaired = repaired.replace(/:\s*"([^"]*?)$/g, ': "$1"');
  
  // 5. 누락된 닫는 괄호 추가
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  
  // 닫는 괄호 추가
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}';
  }
  
  // 6. 마지막 쉼표 제거
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // 7. 최종 검증
  try {
    JSON.parse(repaired);
    console.log('✅ JSON 복구 성공');
    return repaired;
  } catch (finalError) {
    console.error('❌ JSON 복구 실패:', finalError.message);
    
    // 8. 마지막 시도: 최소 유효한 JSON 반환
    if (repaired.startsWith('{')) {
      return '{}';
    } else if (repaired.startsWith('[')) {
      return '[]';
    }
    return '{}';
  }
}

/**
 * DeepSeek 응답 전처리 함수
 */
function preprocessDeepSeekResponse(response) {
  if (typeof response !== 'string') {
    return response;
  }
  
  // 1. 여러 JSON 객체가 연결된 경우 첫 번째만 추출
  const firstJsonMatch = response.match(/\{[\s\S]*?\}/);
  if (firstJsonMatch) {
    return repairJson(firstJsonMatch[0]);
  }
  
  // 2. 배열 응답 처리
  const firstArrayMatch = response.match(/\[[\s\S]*?\]/);
  if (firstArrayMatch) {
    return repairJson(firstArrayMatch[0]);
  }
  
  return repairJson(response);
}

// CLI에서 직접 실행된 경우
if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.error('사용법: node json-repair.js "<json_string>"');
    process.exit(1);
  }
  
  try {
    const result = preprocessDeepSeekResponse(input);
    console.log('복구된 JSON:');
    console.log(result);
  } catch (error) {
    console.error('오류:', error.message);
    process.exit(1);
  }
}

module.exports = { repairJson, preprocessDeepSeekResponse };