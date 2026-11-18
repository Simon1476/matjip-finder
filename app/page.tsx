"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import LocationControls from "@/components/LocationControls";
import PlaceList from "@/components/PlaceList";
import KakaoMap from "@/components/KakaoMap";
import { Button } from "@/components/ui/button";
import { usePlaces } from "@/hooks/usePlaces";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Origin } from "@/lib/types";

const nearbyUrl = (o: Origin, r: number) => `/api/places?x=${o.lng}&y=${o.lat}&radius=${r}`;

export default function Home() {
  // 검색 결과 관련 상태/로직은 전부 훅 안에 있어요
  const {
    places, total, loading, loadingMore, error, searched,
    selectedId, select, search, loadMore, canLoadMore,
  } = usePlaces();

  // 사용자가 고르는 "검색 조건"만 여기에 남아요
  const [origin, setOrigin] = useState<Origin | null>(null); // null이면 지역 검색 모드
  const [radius, setRadius] = useState(1000);

  // 지역 검색: 내 위치 모드를 끄고 키워드로 검색
  function handleSearch(query: string) {
    setOrigin(null);
    search(`/api/places?query=${encodeURIComponent(query)}`);
  }

  // 내 위치로 찾기: 브라우저에 현재 좌표를 물어본 뒤, 그 좌표 기준 반경 검색
  function handleLocate() {
    search(async () => {
      const o = await getCurrentPosition();
      setOrigin(o);
      return nearbyUrl(o, radius);
    });
  }

  // 지도를 클릭해서 기준 위치를 직접 지정: PC처럼 GPS가 없어 위치가 부정확할 때 쓰면 좋아요
  function handlePickLocation(o: Origin) {
    setOrigin(o);
    search(nearbyUrl(o, radius));
  }

  // 1km ↔ 2km 전환: 내 위치 모드일 때만 다시 검색
  function handleRadiusChange(r: number) {
    setRadius(r);
    if (origin) search(nearbyUrl(origin, r));
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
          onSelect={select}
          origin={origin}
          radius={origin ? radius : null}
          onPickLocation={handlePickLocation}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          💡 지도를 클릭하면 그 위치를 기준으로 주변 맛집을 찾아요.
        </p>
      </div>

      <section className="mt-6">
        {origin && !loading && !error && searched && (
          <p className="mb-3 text-sm text-muted-foreground">
            📍 선택한 위치 기준 <b className="text-foreground">{radius / 1000}km</b> 이내 · 총{" "}
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
          <PlaceList places={places} selectedId={selectedId} onSelect={select} />
        )}
        {!loading && !error && places.length > 0 && canLoadMore && (
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "불러오는 중..." : "더 보기"}
          </Button>
        )}
      </section>
    </main>
  );
}
