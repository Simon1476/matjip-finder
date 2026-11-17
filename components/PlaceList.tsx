"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/types";

interface Props {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// 카테고리 "음식점 > 한식 > 한정식" 에서 마지막 단계만 보여주기
function shortCategory(category: string) {
  const parts = category.split(" > ");
  return parts[parts.length - 1];
}

function formatDistance(distance: string) {
  if (!distance) return null;
  const m = Number(distance);
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

export default function PlaceList({ places, selectedId, onSelect }: Props) {
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // 선택이 바뀌면 해당 가게가 화면에 보이도록 스크롤 (마커 클릭 시 목록이 화면 밖이어도 보이게)
  useEffect(() => {
    if (selectedId) {
      itemRefs.current.get(selectedId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  return (
    <ul className="flex flex-col gap-2.5">
      {places.map((place) => {
        const dist = formatDistance(place.distance);
        const selected = place.id === selectedId;
        return (
          <li
            key={place.id}
            ref={(el) => {
              if (el) itemRefs.current.set(place.id, el);
              else itemRefs.current.delete(place.id);
            }}
            onClick={() => onSelect(place.id)}
          >
            <Card
              className={cn(
                "cursor-pointer gap-1 py-4 transition-colors hover:bg-accent",
                selected && "border-2 border-primary bg-primary/10 hover:bg-primary/10"
              )}
            >
              <CardContent className="flex flex-col gap-1 px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={place.place_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[17px] font-bold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {place.place_name}
                  </a>
                  <Badge variant="secondary">{shortCategory(place.category_name)}</Badge>
                  {dist && <span className="ml-auto text-sm font-semibold text-primary">{dist}</span>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {place.road_address_name || place.address_name}
                </p>
                {place.phone && <p className="text-sm text-muted-foreground">{place.phone}</p>}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
