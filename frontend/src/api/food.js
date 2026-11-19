import api from "./index";

// 식품 상세 정보 조회
export const getFoodDetail = async (params) => {
  if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
    throw new Error(
      "백엔드 API 주소가 설정되지 않았습니다. frontend/.env의 VITE_API_BASE_URL을 설정한 뒤 개발 서버를 다시 시작해주세요.",
    );
  }

  const response = await api.get("/getFoodDetail/", {
    params,
    timeout: 0,
  });

  if (!response.headers["content-type"]?.includes("application/json")) {
    throw new Error(
      "백엔드 API가 JSON이 아닌 응답을 반환했습니다. VITE_API_BASE_URL 설정과 백엔드 서버 주소를 확인해주세요.",
    );
  }

  return response.data;
};

// 이미지에서 식품 정보 추출
export const extractFoodInfoFromImage = async (image) => {
  const body = new FormData();
  body.append("image", image);

  const response = await api.post("/aiAsk/extract-food-info", body, {
    timeout: 180_000,
  });
  return response.data;
};

// AI 분석 요청
export const canIEat = async (body) => {
  const response = await api.post("/aiAsk/canIEat", body);
  return response.data;
};

// 분석 결과 저장
export const saveAnalysisResult = async (body) => {
  const response = await api.post("/analysis/save", body);
  return response.data;
};

// 분석 기록 삭제
export const deleteAnalysisResults = async (analysisIds) => {
  const response = await api.delete("/analysis/delete", {
    data: { analysis_ids: analysisIds },
  });
  return response.data;
};
