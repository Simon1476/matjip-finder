"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/types";

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

interface Props {
  place: Place;
  selected?: boolean;
  onClick?: () => void; // 있으면 카드를 눌러 볼 수 있는 모양이 돼요 (목록용)
  onClose?: () => void; // 있으면 오른쪽 위에 닫기(✕) 버튼이 생겨요 (고정 카드용)
}

// 목록과 "선택한 가게" 고정 카드가 같은 모양을 쓰도록 분리한 카드 컴포넌트
export default function PlaceCard({ place, selected, onClick, onClose }: Props) {
  const dist = formatDistance(place.distance);
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative gap-1 py-4",
        onClick && "cursor-pointer transition-colors hover:bg-accent",
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
          {dist && (
            <span className={cn("text-sm font-semibold text-primary", onClose ? "ml-1" : "ml-auto")}>
              {dist}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {place.road_address_name || place.address_name}
        </p>
        {place.phone && <p className="text-sm text-muted-foreground">{place.phone}</p>}
      </CardContent>
      {onClose && (
        <button
          type="button"
          aria-label="선택 해제"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          ✕
        </button>
      )}
    </Card>
  );
}
