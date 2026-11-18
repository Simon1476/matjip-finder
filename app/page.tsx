"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import LocationControls from "@/components/LocationControls";
import CategoryFilter, { type Category } from "@/components/CategoryFilter";
import PlaceList from "@/components/PlaceList";
import KakaoMap from "@/components/KakaoMap";
import { Button } from "@/components/ui/button";
import { usePlaces } from "@/hooks/usePlaces";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Origin } from "@/lib/types";

// 검색 주소를 만드는 곳을 여기 두 개로 모아요. 카테고리를 빠뜨리는 실수를 막으려는 거예요.
const categoryParam = (c: Category | null) => (c ? `&category=${encodeURIComponent(c)}` : "");
const nearbyUrl = (o: Origin, r: number, c: Category | null) =>
  `/api/places?x=${o.lng}&y=${o.lat}&radius=${r}${categoryParam(c)}`;
const regionUrl = (q: string, c: Category | null) =>
  `/api/places?query=${encodeURIComponent(q)}${categoryParam(c)}`;

export default function Home() {
  // 검색 결과 관련 상태/로직은 전부 훅 안에 있어요
  const {
    places, total, loading, loadingMore, error, searched,
    selectedId, select, search, loadMore, canLoadMore,
  } = usePlaces();

  // 사용자가 고르는 "검색 조건"만 여기에 남아요
  const [origin, setOrigin] = useState<Origin | null>(null); // null이면 지역 검색 모드
  const [radius, setRadius] = useState(1000);
  const [category, setCategory] = useState<Category | null>(null); // null이면 전체
  const [lastQuery, setLastQuery] = useState<string | null>(null); // 지역 검색에서 마지막으로 검색한 지역명

  // 지역 검색: 내 위치 모드를 끄고 키워드로 검색 (선택해 둔 카테고리는 유지)
  function handleSearch(query: string) {
    setOrigin(null);
    setLastQuery(query);
    search(regionUrl(query, category));
  }

  // 내 위치로 찾기: 브라우저에 현재 좌표를 물어본 뒤, 그 좌표 기준 반경 검색
  function handleLocate() {
    search(async () => {
      const o = await getCurrentPosition();
      setOrigin(o);
      return nearbyUrl(o, radius, category);
    });
  }

  // 지도를 클릭해서 기준 위치를 직접 지정: PC처럼 GPS가 없어 위치가 부정확할 때 쓰면 좋아요
  function handlePickLocation(o: Origin) {
    setOrigin(o);
    search(nearbyUrl(o, radius, category));
  }

  // 1km ↔ 2km 전환: 내 위치 모드일 때만 다시 검색
  function handleRadiusChange(r: number) {
    setRadius(r);
    if (origin) search(nearbyUrl(origin, r, category));
  }

  // 카테고리 전환: 지금 모드(내 위치 / 지역 검색)에 맞게 다시 검색. 아직 검색한 적이 없으면 조건만 바꿔 둬요.
  function handleCategoryChange(c: Category | null) {
    setCategory(c);
    if (origin) search(nearbyUrl(origin, radius, c));
    else if (lastQuery) search(regionUrl(lastQuery, c));
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

      <div className="mt-3">
        <CategoryFilter category={category} disabled={loading} onChange={handleCategoryChange} />
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
            📍 선택한 위치 기준 <b className="text-foreground">{radius / 1000}km</b> 이내
            {category && <> · <b className="text-foreground">{category}</b></>} · 총{" "}
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
