# MAK Link

고령층과 디지털 취약계층이 안내원에게 말하듯 열차 시간표를 찾을 수 있도록 만든 발권 안내 웹 애플리케이션입니다.

## 주요 기능

- 한국어 자연어 이동 요청 분석
- 브라우저 음성 입력
- 공공데이터포털 열차 운행정보 조회
- 출발 시간, 도착 시간, 이동 시간, 인원별 예상 요금 표시
- 추천 결과 음성 안내
- 큰 글자와 고대비 화면
- 열차 선택 전 최종 확인

## 실행 방법

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`에 공공데이터포털 서비스 키를 입력한 뒤 실행합니다.

```env
VITE_TAGO_SERVICE_KEY=your_service_key
```

## 명령어

```bash
npm run dev
npm run build
npm run preview
```

## 배포

Firebase CLI 인증과 프로젝트 설정을 마친 뒤 실행합니다.

```bash
npm run build
firebase deploy --only hosting
```

## 사용 데이터

- 공공데이터포털 국토교통부 열차 운행정보 API

현재 버전은 시간표 안내용 시연이며 실제 좌석 예약과 결제는 진행하지 않습니다.
