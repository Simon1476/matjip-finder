"use client";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Props {
  radius: number; // 1000 | 2000
  active: boolean; // 내 위치 모드인지
  disabled?: boolean;
  onLocate: () => void;
  onRadiusChange: (radius: number) => void;
}

export default function LocationControls({ radius, active, disabled, onLocate, onRadiusChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        className="h-10"
        onClick={onLocate}
        disabled={disabled}
      >
        📍 내 위치로 찾기
      </Button>

      {/* Base UI 토글은 값을 배열로 주고받아요: 선택된 값이 ["1000"] 처럼 들어옴 */}
      <ToggleGroup
        variant="outline"
        value={[String(radius)]}
        onValueChange={(values) => {
          // 이미 선택된 걸 다시 누르면 빈 배열이 오는데, 반경은 항상 하나가 선택돼 있어야 하니 무시
          if (values.length > 0) onRadiusChange(Number(values[0]));
        }}
        disabled={disabled}
      >
        <ToggleGroupItem
          value="1000"
          className="h-10 px-4 data-[pressed]:bg-primary data-[pressed]:text-primary-foreground"
        >
          1km
        </ToggleGroupItem>
        <ToggleGroupItem
          value="2000"
          className="h-10 px-4 data-[pressed]:bg-primary data-[pressed]:text-primary-foreground"
        >
          2km
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
