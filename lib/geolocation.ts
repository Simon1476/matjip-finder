import type { Origin } from "@/lib/types";

/**
 * 브라우저에 현재 위치를 물어보고 { lat, lng }를 돌려줘요.
 * 원래 콜백(성공 함수, 실패 함수) 방식인 API를 Promise로 감싼 것 → await로 쓸 수 있어요.
 * 실패하면 사용자에게 보여줄 문장이 담긴 Error를 던져요.
 */
export function getCurrentPosition(): Promise<Origin> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저는 위치 기능을 지원하지 않아요."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(geoErrorMessage(err))),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// 브라우저 위치 조회 실패 코드를 사용자가 이해할 문장으로 바꿔요
function geoErrorMessage(err: GeolocationPositionError) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "위치 권한이 거부됐어요. 브라우저 주소창의 자물쇠 아이콘에서 위치를 허용해주세요.";
    case err.POSITION_UNAVAILABLE:
      return "현재 위치를 알 수 없어요. 잠시 후 다시 시도해주세요.";
    case err.TIMEOUT:
      return "위치를 가져오는 데 너무 오래 걸려요. 다시 시도해주세요.";
    default:
      return "위치를 가져오지 못했어요.";
  }
}
