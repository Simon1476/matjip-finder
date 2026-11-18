import { NextRequest, NextResponse } from "next/server";

const KAKAO_BASE = "https://dapi.kakao.com/v2/local/search";

// 카카오가 허용하는 반경 범위: 0 ~ 20000m. 우리 앱은 1km / 2km만 쓴다.
const ALLOWED_RADIUS = [1000, 2000];

// 허용하는 카테고리. 사용자가 보낸 문자열을 그대로 카카오에 넘기지 않으려고 목록으로 검증해요.
// 카페는 "음식점(FD6)"이 아니라 별도 그룹 코드 "CE7"이에요.
const ALLOWED_CATEGORIES = ["한식", "중식", "일식", "양식", "카페"];
const CAFE = "카페";

/**
 * GET /api/places
 *
 * 1) 지역 검색:  /api/places?query=강남역
 * 2) 내 위치:    /api/places?x=127.0276&y=37.4979&radius=1000
 *    (x = 경도, y = 위도. 카카오는 "경도, 위도" 순서라 헷갈리기 쉬워요!)
 * 둘 다 &category=한식 (한식/중식/일식/양식/카페)을 덧붙이면 그 종류만 찾아요.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 KAKAO_REST_API_KEY가 설정되지 않았어요." },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query")?.trim();
  const x = searchParams.get("x");
  const y = searchParams.get("y");
  const radius = Number(searchParams.get("radius"));
  const page = searchParams.get("page") ?? "1";
  const category = searchParams.get("category")?.trim() || null;

  if (category && !ALLOWED_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category는 ${ALLOWED_CATEGORIES.join(", ")} 중 하나여야 해요.` },
      { status: 400 }
    );
  }
  // 카페면 CE7, 그 외(전체 포함)는 음식점 FD6
  const groupCode = category === CAFE ? "CE7" : "FD6";

  let url: string;

  if (x && y) {
    if (!ALLOWED_RADIUS.includes(radius)) {
      return NextResponse.json(
        { error: "radius는 1000 또는 2000이어야 해요." },
        { status: 400 }
      );
    }
    const base = {
      category_group_code: groupCode,
      x,
      y,
      radius: String(radius),
      sort: "distance",
      size: "15",
      page,
    };
    if (category && category !== CAFE) {
      // 한식/중식/일식/양식: category.json은 세부 종류를 못 거르니 keyword.json으로 검색해요.
      // (keyword.json도 x,y,radius를 받고, sort=distance로 가까운 순 정렬이 돼요)
      const params = new URLSearchParams({ ...base, query: category });
      url = `${KAKAO_BASE}/keyword.json?${params}`;
    } else {
      // 전체 또는 카페: 그룹 코드(FD6/CE7)만으로 충분해서 category.json을 그대로 써요.
      url = `${KAKAO_BASE}/category.json?${new URLSearchParams(base)}`;
    }
  } else if (query) {
    // 지역 검색 모드: "강남역 한식" / "강남역 맛집" 처럼 키워드로 검색
    const params = new URLSearchParams({
      query: `${query} ${category ?? "맛집"}`,
      category_group_code: groupCode,
      size: "15",
      page,
    });
    url = `${KAKAO_BASE}/keyword.json?${params}`;
  } else {
    return NextResponse.json(
      { error: "query 또는 x,y,radius 중 하나는 필요해요." },
      { status: 400 }
    );
  }

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    // 카카오가 준 에러 내용을 그대로 전달하면 디버깅이 쉬워요.
    const detail = await res.text();
    return NextResponse.json(
      { error: "카카오 API 호출에 실패했어요.", status: res.status, detail },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
