"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMap } from "@/lib/kakao";
import type { Origin, Place } from "@/lib/types";

interface Props {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  origin: Origin | null; // 내 위치 (없으면 지역 검색 모드)
  radius: number | null; // 반경(m)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function KakaoMap({ places, selectedId, onSelect, origin, radius }: Props) {
  const containerRef = useRef<HTMLDivElement>(null); // 지도가 그려질 div
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map()); // 장소 id -> 마커
  const infoRef = useRef<any>(null); // 말풍선(이름 표시)
  const circleRef = useRef<any>(null); // 반경 원
  const meRef = useRef<any>(null); // 내 위치 점
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 1) 처음 한 번: SDK 로드 후 지도 생성
  useEffect(() => {
    let cancelled = false;
    loadKakaoMap()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978), // 기본: 서울시청
          level: 5,
        });
        infoRef.current = new kakao.maps.InfoWindow({ zIndex: 1 });
        setReady(true);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) places가 바뀔 때마다: 기존 마커를 지우고 새로 찍기
  useEffect(() => {
    if (!ready) return;
    const kakao = window.kakao;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();
    infoRef.current.close();
    if (places.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();
    places.forEach((place) => {
      // 주의: 카카오 API의 y = 위도(lat), x = 경도(lng)
      const pos = new kakao.maps.LatLng(Number(place.y), Number(place.x));
      const marker = new kakao.maps.Marker({ position: pos, map });
      kakao.maps.event.addListener(marker, "click", () => onSelect(place.id));
      markersRef.current.set(place.id, marker);
      bounds.extend(pos);
    });
    map.setBounds(bounds); // 모든 마커가 보이도록 지도 범위 맞추기
  }, [places, ready, onSelect]);

  // 3) 내 위치/반경이 바뀌면: 내 위치 점과 반경 원을 다시 그리고, 원이 한눈에 보이게 맞추기
  //    (effect는 위에서 아래로 실행되므로, 2번의 마커 범위 맞추기를 이 효과가 덮어써요)
  useEffect(() => {
    if (!ready) return;
    const kakao = window.kakao;
    const map = mapRef.current;

    circleRef.current?.setMap(null);
    meRef.current?.setMap(null);
    circleRef.current = null;
    meRef.current = null;
    if (!origin || !radius) return;

    const center = new kakao.maps.LatLng(origin.lat, origin.lng);

    circleRef.current = new kakao.maps.Circle({
      center,
      radius, // 미터 단위
      strokeWeight: 2,
      strokeColor: "#ff6b35",
      strokeOpacity: 0.9,
      fillColor: "#ff6b35",
      fillOpacity: 0.1,
      map,
    });

    // 내 위치: 파란 점 (CustomOverlay = 내가 만든 HTML을 지도 위에 올리는 기능)
    const dot = document.createElement("div");
    dot.style.cssText =
      "width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px rgba(37,99,235,.35)";
    meRef.current = new kakao.maps.CustomOverlay({ position: center, content: dot, map, zIndex: 3 });

    map.setBounds(circleRef.current.getBounds());
  }, [origin, radius, places, ready]);

  // 4) 선택된 가게가 바뀌면: 말풍선을 띄우고 지도를 그쪽으로 이동
  useEffect(() => {
    if (!ready || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    const place = places.find((p) => p.id === selectedId);
    if (!marker || !place) return;

    infoRef.current.setContent(
      `<div style="padding:6px 10px;font-size:13px;white-space:nowrap;color:#000">${escapeHtml(place.place_name)}</div>`
    );
    infoRef.current.open(mapRef.current, marker);
    mapRef.current.panTo(marker.getPosition());
  }, [selectedId, places, ready]);

  if (error) {
    return (
      <div className="rounded-xl border p-6 text-center text-destructive">{error}</div>
    );
  }
  return <div ref={containerRef} className="h-[360px] w-full rounded-xl border" />;
}

// 가게 이름을 HTML에 넣기 전에 특수문자를 안전하게 바꿔요 (XSS 방지)
function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
