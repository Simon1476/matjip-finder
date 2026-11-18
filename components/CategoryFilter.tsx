"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// 서버(app/api/places/route.ts)의 허용 목록과 같아야 해요. null = 전체
export const CATEGORIES = ["한식", "중식", "일식", "양식", "카페"] as const;
export type Category = (typeof CATEGORIES)[number];

const ALL = "all"; // 토글 값은 문자열이어야 해서, "전체"는 null 대신 "all"로 표현해요

interface Props {
  category: Category | null;
  disabled?: boolean;
  onChange: (category: Category | null) => void;
}

export default function CategoryFilter({ category, disabled, onChange }: Props) {
  // 폰: 버튼이 한 줄을 균등하게 나눠 갖고(flex-1) 손가락으로 누르기 좋은 높이(h-10). 넓은 화면: 글자 크기만큼만
  const itemClass =
    "h-10 flex-1 px-0 sm:flex-none sm:px-3.5 data-[pressed]:bg-primary data-[pressed]:text-primary-foreground";
  return (
    <ToggleGroup
      variant="outline"
      className="w-full sm:w-auto"
      value={[category ?? ALL]}
      onValueChange={(values) => {
        // 이미 선택된 걸 다시 누르면 빈 배열이 와요. 항상 하나는 선택돼 있어야 하니 무시
        if (values.length === 0) return;
        onChange(values[0] === ALL ? null : (values[0] as Category));
      }}
      disabled={disabled}
    >
      <ToggleGroupItem value={ALL} className={itemClass}>
        전체
      </ToggleGroupItem>
      {CATEGORIES.map((c) => (
        <ToggleGroupItem key={c} value={c} className={itemClass}>
          {c}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
