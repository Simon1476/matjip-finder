// 카카오 로컬 API가 돌려주는 장소 1개의 모양 (우리가 쓰는 필드만 적었어요)
export interface Place {
  id: string;
  place_name: string;
  category_name: string; // 예: "음식점 > 한식 > 한정식"
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  distance: string; // 미터 단위 문자열. 키워드 검색에서는 빈 문자열일 수 있어요.
  x: string; // 경도
  y: string; // 위도
}

// 내 위치 (위도/경도)
export interface Origin {
  lat: number;
  lng: number;
}

export interface PlacesResponse {
  documents: Place[];
  meta: { total_count: number; is_end: boolean };
}
