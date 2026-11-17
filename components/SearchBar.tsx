"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSearch: (query: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled }: Props) {
  // 입력창의 글자를 React가 기억하게 하는 state
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // form 기본 동작(페이지 새로고침) 막기
    const trimmed = text.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <Input
        className="h-11 flex-1 text-base"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="지역을 입력하세요 (예: 강남역, 홍대입구)"
      />
      <Button className="h-11 px-6" type="submit" disabled={disabled}>
        검색
      </Button>
    </form>
  );
}
