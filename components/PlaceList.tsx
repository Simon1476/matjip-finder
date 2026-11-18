"use client";

import PlaceCard from "@/components/PlaceCard";
import type { Place } from "@/lib/types";

interface Props {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// 선택해도 목록을 스크롤하지 않아요. (선택한 가게는 지도 아래 고정 카드에 따로 보여줘요)
export default function PlaceList({ places, selectedId, onSelect }: Props) {
  return (
    <ul className="flex flex-col gap-2.5">
      {places.map((place) => (
        <li key={place.id}>
          <PlaceCard
            place={place}
            selected={place.id === selectedId}
            onClick={() => onSelect(place.id)}
          />
        </li>
      ))}
    </ul>
  );
}
