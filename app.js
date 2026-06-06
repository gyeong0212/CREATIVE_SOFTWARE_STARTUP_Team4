import './styles.css';

const API_URL = 'https://apis.data.go.kr/1613000/TrainInfo/GetStrtpntAlocFndTrainInfo';
const API_KEY =
  import.meta.env.VITE_TAGO_SERVICE_KEY ||
  import.meta.env.VITE_PUBLIC_DATA_API_KEY ||
  '';

const stations = [
  { name: '서울', code: 'NAT010000', aliases: ['서울역'] },
  { name: '부산', code: 'NAT014445', aliases: ['부산역'] },
  { name: '대전', code: 'NAT011668', aliases: ['대전역'] },
  { name: '동대구', code: 'NAT013271', aliases: ['대구', '동대구역'] },
  { name: '광명', code: 'NAT010747', aliases: ['광명역'] },
  { name: '수원', code: 'NAT010415', aliases: ['수원역'] },
  { name: '천안아산', code: 'NAT080147', aliases: ['천안', '아산'] },
  { name: '오송', code: 'NAT050044', aliases: ['오송역'] },
  { name: '울산', code: 'NAT750726', aliases: ['울산역', '통도사'] },
  { name: '포항', code: 'NAT8B0351', aliases: ['포항역'] },
  { name: '경주', code: 'NAT8B0190', aliases: ['신경주', '경주역'] },
  { name: '청량리', code: 'NAT130126', aliases: ['청량리역'] },
  { name: '강릉', code: 'NAT601936', aliases: ['강릉역'] },
  { name: '전주', code: 'NAT040257', aliases: ['전주역'] },
  { name: '익산', code: 'NAT030879', aliases: ['익산역'] },
  { name: '광주송정', code: 'NAT031857', aliases: ['광주', '송정'] },
  { name: '목포', code: 'NAT032563', aliases: ['목포역'] },
  { name: '여수엑스포', code: 'NAT041993', aliases: ['여수', '여수역'] },
  { name: '순천', code: 'NAT041595', aliases: ['순천역'] },
  { name: '창원중앙', code: 'NAT880281', aliases: ['창원', '창원역'] },
  { name: '마산', code: 'NAT880345', aliases: ['마산역'] },
  { name: '진주', code: 'NAT881014', aliases: ['진주역'] },
];

const state = {
  from: '서울',
  to: '부산',
  date: todayString(),
  hour: nextHour(),
  passengers: 1,
  query: '',
  trains: [],
  loading: false,
  listening: false,
  selectedTrain: null,
  largeText: localStorage.getItem('mak-large-text') !== 'false',
  highContrast: localStorage.getItem('mak-high-contrast') === 'true',
};

function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextHour() {
  return '05';
}

function stationByName(name) {
  return stations.find((station) => station.name === name);
}

function stationOptions(selected) {
  return stations
    .map(
      (station) =>
        `<option value="${station.name}" ${station.name === selected ? 'selected' : ''}>${station.name}</option>`,
    )
    .join('');
}

function hourOptions(selected) {
  return Array.from({ length: 19 }, (_, index) => index + 5)
    .map((hour) => {
      const value = String(hour).padStart(2, '0');
      return `<option value="${value}" ${value === selected ? 'selected' : ''}>${value}시 이후</option>`;
    })
    .join('');
}

function render() {
  document.documentElement.classList.toggle('large-text', state.largeText);
  document.documentElement.classList.toggle('high-contrast', state.highContrast);

  document.querySelector('#app').innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="MAK Link 처음 화면">
        <span class="brand-mark">M</span>
        <span>MAK Link</span>
      </a>
      <div class="accessibility-tools" aria-label="화면 보기 설정">
        <button class="utility-button ${state.largeText ? 'is-active' : ''}" id="text-size-button" type="button">
          가<span class="large-letter">가</span> 글자 크게
        </button>
        <button class="utility-button ${state.highContrast ? 'is-active' : ''}" id="contrast-button" type="button">
          ◐ 화면 선명하게
        </button>
      </div>
    </header>

    <main>
      <section class="guide-banner" aria-live="polite">
        <div class="guide-face" aria-hidden="true">AI</div>
        <div>
          <p class="guide-label">AI 발권 안내원</p>
          <p class="guide-message">안녕하세요. 가고 싶은 곳과 시간을 편하게 말씀해 주세요.</p>
        </div>
      </section>

      <section class="booking-panel" aria-labelledby="request-title">
        <div class="step-heading">
          <span class="step-number">1</span>
          <div>
            <p class="step-label">첫 번째</p>
            <h1 id="request-title">원하는 이동을 말씀해 주세요</h1>
          </div>
        </div>

        <button class="voice-button ${state.listening ? 'is-listening' : ''}" id="voice-button" type="button">
          <span class="microphone" aria-hidden="true"></span>
          <span>
            <strong>${state.listening ? '듣고 있습니다' : '말로 입력하기'}</strong>
            <small>${state.listening ? '말씀을 마치면 자동으로 입력됩니다' : '버튼을 누르고 목적지와 시간을 말씀하세요'}</small>
          </span>
        </button>

        <div class="divider"><span>또는 직접 입력</span></div>

        <label class="input-label" for="travel-query">이동 요청</label>
        <textarea id="travel-query" rows="2" placeholder="예: 내일 오전 10시에 서울에서 부산 가는 표 2명">${escapeHtml(state.query)}</textarea>

        <div class="examples" aria-label="입력 예시">
          ${[
            '오늘 오후 서울에서 부산 1명',
            '내일 오전 대전에서 서울 2명',
            '토요일 아침 서울에서 강릉 1명',
          ]
            .map((example) => `<button class="example-button" type="button" data-example="${example}">${example}</button>`)
            .join('')}
        </div>

        <details class="direct-options">
          <summary>출발지와 시간을 직접 고르기</summary>
          <div class="option-grid">
            <label>
              <span>출발역</span>
              <select id="from-station">${stationOptions(state.from)}</select>
            </label>
            <label>
              <span>도착역</span>
              <select id="to-station">${stationOptions(state.to)}</select>
            </label>
            <label>
              <span>출발 날짜</span>
              <input id="travel-date" type="date" min="${todayString()}" value="${state.date}">
            </label>
            <label>
              <span>출발 시간</span>
              <select id="travel-hour">${hourOptions(state.hour)}</select>
            </label>
          </div>
        </details>

        <div class="passenger-row">
          <div>
            <span class="field-title">인원</span>
            <span class="field-help">함께 가는 사람을 포함해 주세요</span>
          </div>
          <div class="stepper" aria-label="승객 수">
            <button id="passenger-minus" type="button" aria-label="인원 줄이기" ${state.passengers <= 1 ? 'disabled' : ''}>−</button>
            <output id="passenger-count">${state.passengers}명</output>
            <button id="passenger-plus" type="button" aria-label="인원 늘리기" ${state.passengers >= 9 ? 'disabled' : ''}>＋</button>
          </div>
        </div>

        <button class="search-button" id="search-button" type="button" ${state.loading ? 'disabled' : ''}>
          ${state.loading ? '<span class="spinner"></span> 시간표를 찾고 있습니다' : '맞는 열차 찾아보기'}
        </button>
        <p class="privacy-note">결제 없이 실제 열차 시간표만 조회합니다.</p>
      </section>

      ${renderResults()}
    </main>

    ${state.selectedTrain ? renderConfirmation() : ''}
  `;

  bindEvents();
}

function renderResults() {
  if (state.loading) {
    return `
      <section class="results-panel" aria-live="polite">
        <div class="loading-card">
          <span class="spinner large"></span>
          <strong>잠시만 기다려 주세요</strong>
          <p>${state.from}에서 ${state.to}로 가는 열차를 찾고 있습니다.</p>
        </div>
      </section>
    `;
  }

  if (!state.trains.length) {
    return `
      <section class="process-strip" aria-label="예매 진행 순서">
        <div class="process-item is-current"><span>1</span><strong>이동 말하기</strong></div>
        <div class="process-line"></div>
        <div class="process-item"><span>2</span><strong>열차 고르기</strong></div>
        <div class="process-line"></div>
        <div class="process-item"><span>3</span><strong>다시 확인</strong></div>
      </section>
    `;
  }

  return `
    <section class="results-panel" id="results" aria-labelledby="results-title">
      <div class="step-heading results-heading">
        <span class="step-number">2</span>
        <div>
          <p class="step-label">두 번째</p>
          <h2 id="results-title">추천 열차를 확인해 주세요</h2>
          <p class="results-summary">${formatKoreanDate(state.date)} · ${state.from} 출발 · ${state.to} 도착 · ${state.passengers}명</p>
        </div>
        <button class="listen-results" id="listen-results" type="button">▶ 추천 결과 듣기</button>
      </div>
      <div class="train-list">
        ${state.trains.slice(0, 3).map((train, index) => renderTrainCard(train, index)).join('')}
      </div>
      <button class="restart-button" id="restart-button" type="button">처음부터 다시 찾기</button>
    </section>
  `;
}

function renderTrainCard(train, index) {
  const labels = ['가장 빠른 출발', '가장 저렴한 요금', '다른 열차 종류'];
  const totalFare = Number(train.adultcharge || 0) * state.passengers;
  return `
    <article class="train-card ${index === 0 ? 'recommended' : ''}">
      <div class="train-card-top">
        <span class="recommend-label">${labels[index]}</span>
        <span class="train-name">${escapeHtml(train.traingradename || 'KTX')} · ${escapeHtml(String(train.trainno || ''))}</span>
      </div>
      <div class="time-route">
        <div class="time-block">
          <span>출발</span>
          <strong>${formatTime(train.depplandtime)}</strong>
          <b>${state.from}</b>
        </div>
        <div class="journey-line">
          <span>${durationText(train.depplandtime, train.arrplandtime)}</span>
          <i></i>
          <small>직통</small>
        </div>
        <div class="time-block arrival">
          <span>도착</span>
          <strong>${formatTime(train.arrplandtime)}</strong>
          <b>${state.to}</b>
        </div>
      </div>
      <div class="fare-row">
        <div>
          <span>${state.passengers}명 예상 요금</span>
          <strong>${totalFare ? `${totalFare.toLocaleString('ko-KR')}원` : '요금 확인 필요'}</strong>
        </div>
        <button class="select-train" type="button" data-train-index="${index}">이 열차 선택</button>
      </div>
    </article>
  `;
}

function renderConfirmation() {
  const train = state.selectedTrain;
  const totalFare = Number(train.adultcharge || 0) * state.passengers;
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button class="modal-close" id="modal-close" type="button" aria-label="닫기">×</button>
        <div class="step-heading">
          <span class="step-number">3</span>
          <div>
            <p class="step-label">마지막 확인</p>
            <h2 id="confirm-title">이 열차가 맞나요?</h2>
          </div>
        </div>
        <div class="confirmation-route">
          <strong>${formatTime(train.depplandtime)} ${state.from}</strong>
          <span>→</span>
          <strong>${formatTime(train.arrplandtime)} ${state.to}</strong>
        </div>
        <dl class="confirmation-list">
          <div><dt>날짜</dt><dd>${formatKoreanDate(state.date)}</dd></div>
          <div><dt>열차</dt><dd>${escapeHtml(train.traingradename || 'KTX')} ${escapeHtml(String(train.trainno || ''))}</dd></div>
          <div><dt>인원</dt><dd>${state.passengers}명</dd></div>
          <div><dt>예상 요금</dt><dd>${totalFare ? `${totalFare.toLocaleString('ko-KR')}원` : '요금 확인 필요'}</dd></div>
        </dl>
        <p class="demo-warning">현재는 시간표 안내 시연입니다. 실제 좌석 예약과 결제는 진행되지 않습니다.</p>
        <button class="confirm-button" id="confirm-button" type="button">네, 이 열차가 맞습니다</button>
        <button class="back-button" id="back-button" type="button">다른 열차 다시 보기</button>
      </section>
    </div>
  `;
}

function bindEvents() {
  document.querySelector('#text-size-button')?.addEventListener('click', () => {
    state.largeText = !state.largeText;
    localStorage.setItem('mak-large-text', String(state.largeText));
    render();
  });

  document.querySelector('#contrast-button')?.addEventListener('click', () => {
    state.highContrast = !state.highContrast;
    localStorage.setItem('mak-high-contrast', String(state.highContrast));
    render();
  });

  document.querySelector('#voice-button')?.addEventListener('click', startVoiceInput);

  const queryInput = document.querySelector('#travel-query');
  queryInput?.addEventListener('input', (event) => {
    state.query = event.target.value;
  });

  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      state.query = button.dataset.example;
      parseTravelRequest(state.query);
      render();
      document.querySelector('#travel-query')?.focus();
    });
  });

  document.querySelector('#from-station')?.addEventListener('change', (event) => {
    state.from = event.target.value;
  });
  document.querySelector('#to-station')?.addEventListener('change', (event) => {
    state.to = event.target.value;
  });
  document.querySelector('#travel-date')?.addEventListener('change', (event) => {
    state.date = event.target.value;
  });
  document.querySelector('#travel-hour')?.addEventListener('change', (event) => {
    state.hour = event.target.value;
  });

  document.querySelector('#passenger-minus')?.addEventListener('click', () => {
    state.passengers = Math.max(1, state.passengers - 1);
    render();
  });
  document.querySelector('#passenger-plus')?.addEventListener('click', () => {
    state.passengers = Math.min(9, state.passengers + 1);
    render();
  });

  document.querySelector('#search-button')?.addEventListener('click', searchTrains);

  document.querySelectorAll('[data-train-index]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedTrain = state.trains[Number(button.dataset.trainIndex)];
      render();
    });
  });

  document.querySelector('#listen-results')?.addEventListener('click', speakResults);
  document.querySelector('#restart-button')?.addEventListener('click', restart);
  document.querySelector('#modal-close')?.addEventListener('click', closeModal);
  document.querySelector('#back-button')?.addEventListener('click', closeModal);
  document.querySelector('#confirm-button')?.addEventListener('click', confirmSelection);
}

function parseTravelRequest(text) {
  const normalized = text.replace(/\s+/g, '');
  const found = [];

  stations.forEach((station) => {
    const names = [station.name, ...(station.aliases || [])];
    const position = Math.min(
      ...names.map((name) => {
        const index = normalized.indexOf(name.replace(/\s+/g, ''));
        return index < 0 ? Number.POSITIVE_INFINITY : index;
      }),
    );
    if (Number.isFinite(position)) found.push({ station, position });
  });

  found.sort((a, b) => a.position - b.position);
  if (found.length >= 2) {
    state.from = found[0].station.name;
    state.to = found[1].station.name;
  } else if (found.length === 1) {
    state.to = found[0].station.name;
  }

  const passengerMatch = normalized.match(/(\d+)\s*(명|인)/);
  if (passengerMatch) state.passengers = Math.min(9, Math.max(1, Number(passengerMatch[1])));

  const now = new Date();
  if (normalized.includes('내일')) {
    now.setDate(now.getDate() + 1);
    state.date = localDateString(now);
  } else if (normalized.includes('모레')) {
    now.setDate(now.getDate() + 2);
    state.date = localDateString(now);
  } else {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const dayMatch = normalized.match(/(일|월|화|수|목|금|토)요일/);
    if (dayMatch) {
      const target = weekdays.indexOf(dayMatch[1]);
      const gap = (target - now.getDay() + 7) % 7 || 7;
      now.setDate(now.getDate() + gap);
      state.date = localDateString(now);
    }
  }

  let hour;
  const hourMatch = normalized.match(/(오전|오후)?(\d{1,2})시/);
  if (hourMatch) {
    hour = Number(hourMatch[2]);
    if (hourMatch[1] === '오후' && hour < 12) hour += 12;
    if (hourMatch[1] === '오전' && hour === 12) hour = 0;
  } else if (normalized.includes('아침')) {
    hour = 8;
  } else if (normalized.includes('점심')) {
    hour = 12;
  } else if (normalized.includes('저녁')) {
    hour = 18;
  }
  if (Number.isFinite(hour)) state.hour = String(Math.min(23, hour)).padStart(2, '0');
}

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('이 브라우저에서는 음성 입력을 지원하지 않습니다. 크롬 또는 엣지 브라우저를 이용해 주세요.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'ko-KR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  state.listening = true;
  render();

  recognition.onresult = (event) => {
    state.query = event.results[0][0].transcript;
    parseTravelRequest(state.query);
  };
  recognition.onerror = () => {
    alert('음성을 잘 듣지 못했습니다. 마이크 허용을 확인한 뒤 다시 말씀해 주세요.');
  };
  recognition.onend = () => {
    state.listening = false;
    render();
  };
  recognition.start();
}

async function searchTrains() {
  const query = document.querySelector('#travel-query')?.value.trim() || state.query;
  if (query) {
    state.query = query;
    parseTravelRequest(query);
  }

  if (state.from === state.to) {
    alert('출발역과 도착역을 다르게 선택해 주세요.');
    return;
  }

  if (!API_KEY) {
    alert('공공데이터 서비스키가 설정되지 않았습니다.');
    return;
  }

  state.loading = true;
  state.trains = [];
  render();

  try {
    const departure = stationByName(state.from);
    const arrival = stationByName(state.to);
    const departureDate = state.date.replaceAll('-', '');
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      pageNo: '1',
      numOfRows: '100',
      _type: 'json',
      depPlaceId: departure.code,
      arrPlaceId: arrival.code,
      depPlandTime: departureDate,
    });
    const response = await fetch(`${API_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const header = data?.response?.header;
    if (header?.resultCode && header.resultCode !== '00') {
      throw new Error(header.resultMsg || '시간표 조회 오류');
    }

    const items = data?.response?.body?.items?.item;
    const availableTrains = (Array.isArray(items) ? items : items ? [items] : [])
      .filter((train) => String(train.depplandtime || '').slice(8, 10) >= state.hour)
      .sort((a, b) => Number(a.depplandtime) - Number(b.depplandtime));

    const recommendations = [];
    const addRecommendation = (train) => {
      if (train && !recommendations.some((item) => item.trainno === train.trainno)) recommendations.push(train);
    };
    addRecommendation(availableTrains[0]);
    addRecommendation(
      [...availableTrains]
        .filter((train) => Number(train.adultcharge) > 0)
        .sort((a, b) => Number(a.adultcharge) - Number(b.adultcharge))[0],
    );
    addRecommendation(
      availableTrains.find(
        (train) =>
          !String(train.traingradename || '').includes('KTX') &&
          !recommendations.some((item) => item.trainno === train.trainno),
      ),
    );
    availableTrains.forEach((train) => {
      if (recommendations.length < 3) addRecommendation(train);
    });
    state.trains = recommendations;

    if (!state.trains.length) {
      alert('선택한 시간 이후의 열차를 찾지 못했습니다. 출발 시간이나 역을 바꿔 다시 찾아보세요.');
    }
  } catch (error) {
    console.error(error);
    alert(`시간표를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.\n(${error.message})`);
  } finally {
    state.loading = false;
    render();
    if (state.trains.length) {
      requestAnimationFrame(() => document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }
}

function speakResults() {
  if (!('speechSynthesis' in window) || !state.trains.length) return;
  window.speechSynthesis.cancel();
  const sentences = state.trains.slice(0, 3).map((train, index) => {
    const label = index === 0 ? '첫 번째 추천' : `${index + 1}번째 추천`;
    return `${label}, ${formatTimeForSpeech(train.depplandtime)}에 ${state.from}에서 출발하여 ${formatTimeForSpeech(train.arrplandtime)}에 ${state.to}에 도착합니다.`;
  });
  const utterance = new SpeechSynthesisUtterance(sentences.join(' '));
  utterance.lang = 'ko-KR';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function restart() {
  state.query = '';
  state.trains = [];
  state.selectedTrain = null;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeModal() {
  state.selectedTrain = null;
  render();
}

function confirmSelection() {
  const train = state.selectedTrain;
  state.selectedTrain = null;
  state.trains = [];
  render();
  const main = document.querySelector('main');
  main.insertAdjacentHTML(
    'beforeend',
    `<section class="completion-panel" role="status">
      <div class="completion-check">✓</div>
      <h2>열차 선택을 확인했습니다</h2>
      <p>${formatKoreanDate(state.date)} ${formatTime(train.depplandtime)}, ${state.from}에서 ${state.to}로 가는 열차입니다.</p>
      <strong>현재 시연에서는 실제 예약과 결제가 진행되지 않습니다.</strong>
      <button type="button" id="completion-restart">다른 열차 알아보기</button>
    </section>`,
  );
  document.querySelector('#completion-restart')?.addEventListener('click', restart);
  document.querySelector('.completion-panel')?.scrollIntoView({ behavior: 'smooth' });
}

function formatTime(value) {
  const text = String(value || '');
  if (text.length < 12) return '--:--';
  return `${text.slice(8, 10)}:${text.slice(10, 12)}`;
}

function formatTimeForSpeech(value) {
  const [hour, minute] = formatTime(value).split(':').map(Number);
  return `${hour}시 ${minute ? `${minute}분` : ''}`;
}

function durationText(start, end) {
  const parse = (value) => {
    const text = String(value);
    return new Date(
      Number(text.slice(0, 4)),
      Number(text.slice(4, 6)) - 1,
      Number(text.slice(6, 8)),
      Number(text.slice(8, 10)),
      Number(text.slice(10, 12)),
    );
  };
  const minutes = Math.max(0, Math.round((parse(end) - parse(start)) / 60000));
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}

function formatKoreanDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

render();
