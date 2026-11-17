/* eslint-disable @typescript-eslint/no-explicit-any */

// 카카오맵 SDK는 타입이 없는 외부 스크립트라서, window.kakao를 any로 선언해요.
declare global {
  interface Window {
    kakao: any;
  }
}

let loadPromise: Promise<any> | null = null;

/**
 * 카카오맵 SDK 스크립트를 한 번만 불러오고, 준비되면 kakao 객체를 돌려줘요.
 * (컴포넌트가 여러 번 그려져도 스크립트가 중복으로 로드되지 않게 Promise를 재사용)
 */
export function loadKakaoMap(): Promise<any> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!key) {
      reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았어요."));
      return;
    }

    const script = document.createElement("script");
    // autoload=false: 스크립트 로드 후 kakao.maps.load()로 직접 시작 (Next.js에서 안전한 방식)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = () => {
      loadPromise = null; // 실패하면 다음에 다시 시도할 수 있게 초기화
      reject(new Error("카카오맵 SDK를 불러오지 못했어요. 도메인 등록을 확인해주세요."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
