import api from "./index";

// 식품 상세 정보 조회
export const getFoodDetail = async (params) => {
  const response = await api.get("/getFoodDetail", { params });
  return response.data;
};

// AI 분석 요청
export const canIEat = async (body) => {
  const response = await api.post("/aiAsk/canIEat", body);
  return response.data;
};
