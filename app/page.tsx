"use client";

import { useCallback, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import LocationControls from "@/components/LocationControls";
import PlaceList from "@/components/PlaceList";
import KakaoMap from "@/components/KakaoMap";
import type { Origin, Place, PlacesResponse } from "@/lib/types";

// 브라우저 위치 조회 실패 코드를 사용자가 이해할 문장으로 바꿔요
function geoErrorMessage(err: GeolocationPositionError) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "위치 권한이 거부됐어요. 브라우저 주소창의 자물쇠 아이콘에서 위치를 허용해주세요.";
    case err.POSITION_UNAVAILABLE:
      return "현재 위치를 알 수 없어요. 잠시 후 다시 시도해주세요.";
    case err.TIMEOUT:
      return "위치를 가져오는 데 너무 오래 걸려요. 다시 시도해주세요.";
    default:
      return "위치를 가져오지 못했어요.";
  }
}

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [total, setTotal] = useState(0); // 조건에 맞는 전체 개수 (화면에는 최대 15개만 보여요)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false); // 검색을 한 번이라도 했는지
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null); // null이면 지역 검색 모드
  const [radius, setRadius] = useState(1000);

  // 가장 최근 요청 번호. 반경을 빠르게 연타하면 응답이 뒤바뀌어 올 수 있어서,
  // 마지막으로 보낸 요청의 결과만 화면에 반영해요.
  const requestIdRef = useRef(0);

  // useCallback: 함수가 매 렌더마다 새로 만들어지지 않게 고정 (지도의 effect가 불필요하게 재실행되는 걸 방지)
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  async function load(url: string) {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      // 브라우저가 우리 서버(/api/places)에 물어본다. 카카오 키는 서버만 알고 있어요.
      const res = await fetch(url);
      if (!res.ok) throw new Error("검색에 실패했어요. 잠시 후 다시 시도해주세요.");
      const data: PlacesResponse = await res.json();
      if (requestId !== requestIdRef.current) return; // 더 최신 요청이 있으면 버림
      setPlaces(data.documents);
      setTotal(data.meta.total_count);
      setSelectedId(null);
      setSearched(true);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  const nearbyUrl = (o: Origin, r: number) => `/api/places?x=${o.lng}&y=${o.lat}&radius=${r}`;

  // 지역 검색: 내 위치 모드를 끄고 키워드로 검색
  function handleSearch(query: string) {
    setOrigin(null);
    load(`/api/places?query=${encodeURIComponent(query)}`);
  }

  // 내 위치로 찾기: 브라우저에 현재 좌표를 물어본 뒤, 그 좌표 기준 반경 검색
  function handleLocate() {
    if (!navigator.geolocation) {
      setError("이 브라우저는 위치 기능을 지원하지 않아요.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const o = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(o);
        load(nearbyUrl(o, radius));
      },
      (err) => {
        setLoading(false);
        setError(geoErrorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // 1km ↔ 2km 전환: 내 위치 모드일 때만 다시 검색
  function handleRadiusChange(r: number) {
    setRadius(r);
    if (origin) load(nearbyUrl(origin, r));
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
      <h1 className="mb-5 text-3xl font-bold">🍽️ 맛집 찾기</h1>
      <SearchBar onSearch={handleSearch} disabled={loading} />

      <div className="mt-3">
        <LocationControls
          radius={radius}
          active={origin !== null}
          disabled={loading}
          onLocate={handleLocate}
          onRadiusChange={handleRadiusChange}
        />
      </div>

      <div className="mt-4">
        <KakaoMap
          places={places}
          selectedId={selectedId}
          onSelect={handleSelect}
          origin={origin}
          radius={origin ? radius : null}
        />
      </div>

      <section className="mt-6">
        {origin && !loading && !error && searched && (
          <p className="mb-3 text-sm text-muted-foreground">
            📍 내 위치 기준 <b className="text-foreground">{radius / 1000}km</b> 이내 · 총{" "}
            {total.toLocaleString()}곳 중 가까운 {places.length}곳
          </p>
        )}
        {loading && <p className="py-6 text-center text-muted-foreground">검색 중...</p>}
        {error && <p className="py-6 text-center text-destructive">{error}</p>}
        {!loading && !error && searched && places.length === 0 && (
          <p className="py-8 text-center text-lg font-semibold">
            😢 검색 결과가 없어요.{" "}
            {origin ? "반경을 넓혀보세요." : "다른 지역명으로 검색해보세요."}
          </p>
        )}
        {!loading && places.length > 0 && (
          <PlaceList places={places} selectedId={selectedId} onSelect={handleSelect} />
        )}
      </section>
    </main>
  );
}
