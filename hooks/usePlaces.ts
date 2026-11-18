"use client";

import { useCallback, useRef, useState } from "react";
import type { Place, PlacesResponse } from "@/lib/types";

// 카카오 로컬 API는 한 검색당 최대 45개(15개 × 3페이지)까지만 돌려줘요
const MAX_PAGE = 3;

// 검색 주소(page 제외)를 바로 주거나, "주소를 만들어 주는 비동기 함수"를 줄 수 있어요.
// 후자는 내 위치처럼 주소를 만들기 전에 기다릴 일이 있을 때 써요.
type UrlSource = string | (() => Promise<string>);

/**
 * 검색 결과와 관련된 모든 상태 + 로직:
 * 새 검색(search), 더 보기(loadMore), 목록↔지도 선택(selectedId).
 */
export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [total, setTotal] = useState(0); // 조건에 맞는 전체 개수 (화면에는 최대 45개까지만 보여요)
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false); // 검색을 한 번이라도 했는지
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isEnd, setIsEnd] = useState(true);

  // 가장 최근 요청 번호. 반경을 빠르게 연타하면 응답이 뒤바뀌어 올 수 있어서,
  // 마지막으로 보낸 요청의 결과만 화면에 반영해요.
  const requestIdRef = useRef(0);
  // "더 보기"용: 지금 보고 있는 검색의 URL(page 제외)
  const baseUrlRef = useRef<string | null>(null);

  // useCallback: 함수가 매 렌더마다 새로 만들어지지 않게 고정 (지도의 effect가 불필요하게 재실행되는 걸 방지)
  const select = useCallback((id: string | null) => setSelectedId(id), []); // null = 선택 해제

  // pageNum === 1 이면 새 검색(목록 교체), > 1 이면 "더 보기"(목록 뒤에 이어 붙임)
  async function load(source: UrlSource, pageNum: number) {
    const requestId = ++requestIdRef.current;
    const append = pageNum > 1;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const baseUrl = typeof source === "string" ? source : await source();
      if (requestId !== requestIdRef.current) return;
      // 브라우저가 우리 서버(/api/places)에 물어본다. 카카오 키는 서버만 알고 있어요.
      const res = await fetch(`${baseUrl}&page=${pageNum}`);
      if (!res.ok) throw new Error("검색에 실패했어요. 잠시 후 다시 시도해주세요.");
      const data: PlacesResponse = await res.json();
      if (requestId !== requestIdRef.current) return; // 더 최신 요청이 있으면 버림
      baseUrlRef.current = baseUrl;
      setPage(pageNum);
      setIsEnd(data.meta.is_end);
      setTotal(data.meta.total_count);
      setSearched(true);
      if (append) {
        // 페이지 경계에서 같은 가게가 겹칠 수 있어 id로 중복 제거
        setPlaces((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.documents.filter((p) => !seen.has(p.id))];
        });
      } else {
        setPlaces(data.documents);
        setSelectedId(null);
      }
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  const search = (source: UrlSource) => load(source, 1);

  const loadMore = () => {
    if (baseUrlRef.current) load(baseUrlRef.current, page + 1);
  };

  return {
    places,
    total,
    loading,
    loadingMore,
    error,
    searched,
    selectedId,
    select,
    search,
    loadMore,
    canLoadMore: !isEnd && page < MAX_PAGE,
  };
}
