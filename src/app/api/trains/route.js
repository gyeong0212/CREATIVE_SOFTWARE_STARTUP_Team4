import { NextResponse } from "next/server";

const TRAIN_INFO_URL =
  "http://apis.data.go.kr/1613000/TrainInfoService/getStrtpntAlocFndTrainInfo";

const stations = {
  "서울": "NAT010000",
  "용산": "NAT010032",
  "광명": "NAT010415",
  "천안아산": "NAT010971",
  "오송": "NAT050044",
  "대전": "NAT011668",
  "동대구": "NAT013271",
  "부산": "NAT014445",
  "광주송정": "NAT031857",
  "목포": "NAT032563",
};

function getServiceKey() {
  const rawKey =
    process.env.TAGO_SERVICE_KEY ||
    process.env.DATA_GO_KR_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_TAGO_SERVICE_KEY ||
    "";

  try {
    return decodeURIComponent(rawKey.trim());
  } catch {
    return rawKey.trim();
  }
}

function toDateParam(date) {
  return date.replaceAll("-", "");
}

function normalizeItems(items) {
  if (!items) return [];
  const item = items.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function normalizeSchedule(train) {
  return {
    trainNo: String(train.trainno || ""),
    gradeName: String(train.traingradename || ""),
    depPlaceName: String(train.depplacename || ""),
    arrPlaceName: String(train.arrplacename || ""),
    depTime: String(train.depplandtime || ""),
    arrTime: String(train.arrplandtime || ""),
    adultCharge: Number(train.adultcharge || 0),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dep = searchParams.get("dep") || "";
  const arr = searchParams.get("arr") || "";
  const date = searchParams.get("date") || "";
  const trainGradeCode = searchParams.get("trainGradeCode") || "00";
  const serviceKey = getServiceKey();

  if (!serviceKey) {
    return NextResponse.json(
      {
        message:
          "공공데이터포털 TAGO 열차정보 서비스키가 아직 설정되지 않았습니다. .env.local에 TAGO_SERVICE_KEY를 넣으면 실제 시간표 조회가 됩니다.",
        schedules: [],
      },
      { status: 503 },
    );
  }

  if (!stations[dep] || !stations[arr]) {
    return NextResponse.json(
      {
        message: "지원하는 역 목록에서 출발역과 도착역을 선택해 주세요.",
        schedules: [],
      },
      { status: 400 },
    );
  }

  if (dep === arr) {
    return NextResponse.json(
      {
        message: "출발역과 도착역은 달라야 합니다.",
        schedules: [],
      },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      {
        message: "출발 날짜 형식이 올바르지 않습니다.",
        schedules: [],
      },
      { status: 400 },
    );
  }

  const url = new URL(TRAIN_INFO_URL);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "30");
  url.searchParams.set("_type", "json");
  url.searchParams.set("depPlaceId", stations[dep]);
  url.searchParams.set("arrPlaceId", stations[arr]);
  url.searchParams.set("depPlandTime", toDateParam(date));
  url.searchParams.set("trainGradeCode", trainGradeCode);

  try {
    const apiResponse = await fetch(url, { cache: "no-store" });
    const payload = await apiResponse.json();
    const header = payload?.response?.header;

    if (!apiResponse.ok || header?.resultCode !== "00") {
      return NextResponse.json(
        {
          message:
            header?.resultMsg ||
            "TAGO 열차정보 API 응답을 처리하지 못했습니다.",
          schedules: [],
        },
        { status: 502 },
      );
    }

    const schedules = normalizeItems(payload.response?.body?.items)
      .map(normalizeSchedule)
      .filter((train) => train.depTime && train.arrTime)
      .sort((a, b) => Number(a.depTime) - Number(b.depTime));

    return NextResponse.json({
      message: schedules.length
        ? "실제 TAGO 열차정보 API에서 조회한 시간표입니다."
        : "해당 조건으로 조회된 KTX 운행편이 없습니다.",
      schedules,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "TAGO 열차정보 API 연결에 실패했습니다. 서비스키 승인 상태와 네트워크를 확인해 주세요.",
        schedules: [],
      },
      { status: 502 },
    );
  }
}
