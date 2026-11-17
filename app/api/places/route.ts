import { NextRequest, NextResponse } from "next/server";

const KAKAO_BASE = "https://dapi.kakao.com/v2/local/search";

// 카카오가 허용하는 반경 범위: 0 ~ 20000m. 우리 앱은 1km / 2km만 쓴다.
const ALLOWED_RADIUS = [1000, 2000];

/**
 * GET /api/places
 *
 * 1) 지역 검색:  /api/places?query=강남역
 * 2) 내 위치:    /api/places?x=127.0276&y=37.4979&radius=1000
 *    (x = 경도, y = 위도. 카카오는 "경도, 위도" 순서라 헷갈리기 쉬워요!)
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

  let url: string;

  if (x && y) {
    // 내 위치 모드: 카테고리 검색 (FD6 = 음식점), 가까운 순
    if (!ALLOWED_RADIUS.includes(radius)) {
      return NextResponse.json(
        { error: "radius는 1000 또는 2000이어야 해요." },
        { status: 400 }
      );
    }
    const params = new URLSearchParams({
      category_group_code: "FD6",
      x,
      y,
      radius: String(radius),
      sort: "distance",
      size: "15",
      page,
    });
    url = `${KAKAO_BASE}/category.json?${params}`;
  } else if (query) {
    // 지역 검색 모드: "강남역 맛집" 처럼 키워드로 검색
    const params = new URLSearchParams({
      query: `${query} 맛집`,
      category_group_code: "FD6",
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
