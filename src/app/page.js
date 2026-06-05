"use client";

import { useMemo, useState } from "react";

const stationOptions = [
  { name: "서울", code: "NAT010000" },
  { name: "용산", code: "NAT010032" },
  { name: "광명", code: "NAT010415" },
  { name: "천안아산", code: "NAT010971" },
  { name: "오송", code: "NAT050044" },
  { name: "대전", code: "NAT011668" },
  { name: "동대구", code: "NAT013271" },
  { name: "부산", code: "NAT014445" },
  { name: "광주송정", code: "NAT031857" },
  { name: "목포", code: "NAT032563" },
];

const quickRoutes = [
  ["서울", "부산"],
  ["서울", "대전"],
  ["용산", "광주송정"],
  ["서울", "동대구"],
];

const today = new Date().toISOString().slice(0, 10);

function formatClock(value) {
  if (!value || String(value).length < 12) return "-";
  const text = String(value);
  return `${text.slice(8, 10)}:${text.slice(10, 12)}`;
}

function formatDuration(start, end) {
  if (!start || !end) return "";
  const dep = new Date(
    `${String(start).slice(0, 4)}-${String(start).slice(4, 6)}-${String(start).slice(6, 8)}T${String(start).slice(8, 10)}:${String(start).slice(10, 12)}:00`,
  );
  const arr = new Date(
    `${String(end).slice(0, 4)}-${String(end).slice(4, 6)}-${String(end).slice(6, 8)}T${String(end).slice(8, 10)}:${String(end).slice(10, 12)}:00`,
  );
  const minutes = Math.max(0, Math.round((arr - dep) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}시간 ${rest}분` : `${rest}분`;
}

function formatWon(value) {
  if (!value) return "운임 정보 없음";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

export default function Home() {
  const [departure, setDeparture] = useState("서울");
  const [arrival, setArrival] = useState("부산");
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [schedules, setSchedules] = useState([]);

  const availableArrivals = useMemo(
    () => stationOptions.filter((station) => station.name !== departure),
    [departure],
  );

  const canSearch = departure !== arrival && date;

  async function handleSearch(event) {
    event.preventDefault();
    if (!canSearch) return;

    setStatus("loading");
    setMessage("");
    setSchedules([]);

    const params = new URLSearchParams({
      dep: departure,
      arr: arrival,
      date,
      trainGradeCode: "00",
    });

    try {
      const response = await fetch(`/api/trains?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "열차 정보를 불러오지 못했습니다.");
        return;
      }

      setSchedules(data.schedules || []);
      setStatus("success");
      setMessage(data.message || "");
    } catch {
      setStatus("error");
      setMessage("네트워크 연결을 확인한 뒤 다시 조회해 주세요.");
    }
  }

  function applyRoute(dep, arr) {
    setDeparture(dep);
    setArrival(arr);
    setStatus("idle");
    setMessage("");
    setSchedules([]);
  }

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-[#20231f]">
      <section className="border-b border-[#d8ddd2] bg-[#102820] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#d7ec85]">MAK Link</p>
              <h1 className="mt-2 text-3xl font-bold md:text-5xl">
                열차 시간표 안내
              </h1>
            </div>
            <div className="rounded-md border border-white/20 px-4 py-3 text-right text-sm">
              <p className="font-semibold">무료 API 범위</p>
              <p className="text-white/75">운행정보·시간표 조회</p>
            </div>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-white/80">
            어르신이 매표소 직원에게 말하듯 목적지를 고르면, KTX 열차의 출발
            시간·도착 시간·운임을 먼저 확인하는 MVP입니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-7 md:grid-cols-[360px_1fr] md:px-8">
        <form
          onSubmit={handleSearch}
          className="rounded-md border border-[#d8ddd2] bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">여정 선택</h2>
            <span className="rounded-md bg-[#e8f0d7] px-3 py-1 text-sm font-semibold text-[#30430d]">
              KTX
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#4f584b]">
                출발역
              </span>
              <select
                value={departure}
                onChange={(event) => {
                  const next = event.target.value;
                  setDeparture(next);
                  if (next === arrival) setArrival(availableArrivals[0]?.name || "");
                }}
                className="mt-2 h-12 w-full rounded-md border border-[#cfd6c8] bg-white px-3 text-base"
              >
                {stationOptions.map((station) => (
                  <option key={station.code} value={station.name}>
                    {station.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#4f584b]">
                도착역
              </span>
              <select
                value={arrival}
                onChange={(event) => setArrival(event.target.value)}
                className="mt-2 h-12 w-full rounded-md border border-[#cfd6c8] bg-white px-3 text-base"
              >
                {availableArrivals.map((station) => (
                  <option key={station.code} value={station.name}>
                    {station.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#4f584b]">
                출발 날짜
              </span>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 h-12 w-full rounded-md border border-[#cfd6c8] bg-white px-3 text-base"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSearch || status === "loading"}
            className="mt-5 h-[52px] w-full rounded-md bg-[#17624f] px-4 text-lg font-bold text-white transition hover:bg-[#0f493a] disabled:cursor-not-allowed disabled:bg-[#aab3a6]"
          >
            {status === "loading" ? "조회 중..." : "시간표 조회"}
          </button>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-[#4f584b]">
              빠른 선택
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickRoutes.map(([dep, arr]) => (
                <button
                  type="button"
                  key={`${dep}-${arr}`}
                  onClick={() => applyRoute(dep, arr)}
                  className="rounded-md border border-[#d8ddd2] px-3 py-2 text-sm font-semibold hover:border-[#17624f] hover:text-[#17624f]"
                >
                  {dep} → {arr}
                </button>
              ))}
            </div>
          </div>
        </form>

        <section className="rounded-md border border-[#d8ddd2] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#e3e8de] pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {departure} → {arrival}
              </h2>
              <p className="mt-1 text-sm text-[#667060]">
                TAGO 열차정보 API 기준 KTX 운행 시간표
              </p>
            </div>
            <p className="rounded-md bg-[#f1f4ea] px-3 py-2 text-sm font-semibold text-[#4f584b]">
              {date}
            </p>
          </div>

          {message ? (
            <div
              className={`mt-5 rounded-md border px-4 py-3 text-sm leading-6 ${
                status === "error"
                  ? "border-[#efc4ba] bg-[#fff1ee] text-[#8a2c1f]"
                  : "border-[#d8ddd2] bg-[#f7faf0] text-[#40522d]"
              }`}
            >
              {message}
            </div>
          ) : null}

          {status === "idle" ? (
            <div className="mt-8 flex min-h-72 items-center justify-center rounded-md border border-dashed border-[#cfd6c8] bg-[#fbfcf8] px-5 text-center">
              <p className="max-w-md text-lg font-semibold leading-8 text-[#4f584b]">
                출발역과 도착역을 고른 뒤 시간표를 조회해 주세요.
              </p>
            </div>
          ) : null}

          {status === "loading" ? (
            <div className="mt-8 grid gap-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-md bg-[#eef2e8]"
                />
              ))}
            </div>
          ) : null}

          {status === "success" && schedules.length === 0 ? (
            <div className="mt-8 flex min-h-72 items-center justify-center rounded-md border border-dashed border-[#cfd6c8] bg-[#fbfcf8] px-5 text-center">
              <p className="max-w-md text-lg font-semibold leading-8 text-[#4f584b]">
                조회된 KTX 운행편이 없습니다. 날짜나 역을 바꿔 다시 확인해
                주세요.
              </p>
            </div>
          ) : null}

          {schedules.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {schedules.map((train) => (
                <article
                  key={`${train.trainNo}-${train.depTime}-${train.arrTime}`}
                  className="rounded-md border border-[#d8ddd2] p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#17624f] px-2.5 py-1 text-sm font-bold text-white">
                          {train.gradeName || "KTX"}
                        </span>
                        <span className="text-sm font-semibold text-[#667060]">
                          열차 {train.trainNo}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <p className="text-3xl font-bold">
                          {formatClock(train.depTime)}
                        </p>
                        <span className="h-px w-8 bg-[#b9c3b1]" />
                        <p className="text-3xl font-bold">
                          {formatClock(train.arrTime)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-[#667060]">
                        {train.depPlaceName} 출발 · {train.arrPlaceName} 도착 ·{" "}
                        {formatDuration(train.depTime, train.arrTime)}
                      </p>
                    </div>
                    <div className="rounded-md bg-[#f1f4ea] px-4 py-3 text-left md:text-right">
                      <p className="text-sm font-semibold text-[#667060]">
                        일반실 성인 기준
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {formatWon(train.adultCharge)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
