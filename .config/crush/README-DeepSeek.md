# DeepSeek API 설정 가이드

이 가이드는 Crush에서 DeepSeekAPI의 "unexpected end of JSON input" 오류를 방지하기 위한 설정을 설명합니다.

## 🔧 설정 개요

### 1. 주요 변경사항

- **max_tokens**: 8192로 증가 (JSON 응답 잘림 방지)
- **temperature**: 0.1로 낮춤 (더 일관된 JSON 출력)
- **stream**: false로 설정 (스트리밍으로 인한 JSON 파싱 오류 방지)
- **timeout**: 180초로 증가 (충분한 응답 시간 확보)

### 2. 오류 처리 강화

```json
"error_handling": {
  "max_retries": 3,
  "backoff_factor": 2.0,
  "retry_delays": [2, 4, 8],
  "retry_on_timeout": true,
  "retry_on_rate_limit": true,
  "retry_on_server_error": true,
  "json_validation": {
    "enabled": true,
    "auto_repair": true,
    "strict_mode": false
  }
}
```

### 3. 응답 전처리

```json
"response_processing": {
  "strip_markdown_blocks": true,
  "validate_json": true,
  "fallback_on_error": true
}
```

## 🚀 사용 방법

### 1. API 키 설정

`.env` 파일에 DeepSeek API 키를 추가:

```bash
DEEPSEEK_API_KEY="sk-your-actual-deepseek-api-key"
```

### 2. 설정 테스트

```bash
cd .config/crush
node test-deepseek.js
```

### 3. JSON 수리 유틸리티

잘린 JSON을 수리해야 할 때:

```bash
node json-repair.js '{"incomplete": "json'
```

## 🛠️ 트러블슈팅

### "unexpected end of JSON input" 오류 해결

1. **max_tokens 확인**: 8192 이상으로 설정되어 있는지 확인
2. **스트리밍 비활성화**: `"stream": false`로 설정
3. **temperature 낮추기**: 0.1로 설정하여 일관된 출력 확보
4. **재시도 로직**: 자동 재시도가 활성화되어 있는지 확인

### 일반적인 문제들

#### 1. API 키 오류
```bash
❌ DEEPSEEK_API_KEY가 설정되지 않았습니다.
```
**해결**: `.env`에서 실제 API 키로 변경

#### 2. JSON 파싱 실패
```bash
❌ 응답 JSON 파싱 실패: Unexpected end of JSON input
```
**해결**: `json-repair.js` 유틸리티 사용

#### 3. 시간 초과
```bash
❌ 요청 시간 초과
```
**해결**: timeout 값을 더 크게 설정

## 📊 성능 최적화

### 1. 모델별 설정

- **deepseek-chat**: 일반 대화 및 JSON 응답용
- **deepseek-coder**: 코드 생성 전용

### 2. 요청 제한

- **rate_limit**: 100/minute
- **concurrent_requests**: 5
- **priority**: high

## 🔍 모니터링

### 성공적인 설정 확인 방법:

1. ✅ API 연결 테스트 통과
2. ✅ JSON 응답 파싱 성공
3. ✅ 에러 없이 재시도 로직 작동
4. ✅ 적절한 응답 시간 유지

### 설정 파일 위치:
- **Crush 설정**: `.config/crush/crush.json`
- **환경 변수**: `.env`
- **테스트 도구**: `.config/crush/test-deepseek.js`
- **JSON 수리**: `.config/crush/json-repair.js`

## 📚 추가 리소스

- [DeepSeek API 문서](https://platform.deepseek.com/api-docs/)
- [Crush 설정 가이드](https://charm.land/docs/crush/)
- [JSON Schema 검증](https://jsonschema.net/)

## 🤝 지원

문제가 지속되면:
1. `test-deepseek.js`로 연결 상태 확인
2. API 키 유효성 검증
3. 네트워크 연결 상태 점검
4. DeepSeek 서비스 상태 확인