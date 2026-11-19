import api from "./index";

export async function fetchUserState() {
  const response = await api.get("/MyPage/loadUserState");
  const { success, message, data } = response.data;

  if (!success || !data) {
    throw new Error(message || "사용자 상태를 불러오지 못했습니다.");
  }
  if (!Array.isArray(data.allergies) || !Array.isArray(data.restrictions)) {
    throw new Error("사용자 상태 응답 형식이 올바르지 않습니다.");
  }

  const allergies = data.allergies.map((allergy) =>
    typeof allergy === "string" ? allergy : allergy?.allergy_name,
  );
  const precautions = data.restrictions.map((restriction) =>
    typeof restriction === "string"
      ? restriction
      : restriction?.restriction_text,
  );
  if (
    allergies.some((allergy) => typeof allergy !== "string") ||
    precautions.some((precaution) => typeof precaution !== "string")
  ) {
    throw new Error("사용자 상태 응답 형식이 올바르지 않습니다.");
  }

  return {
    user_id: data.user_id,
    email: data.email,
    allergies,
    precautions,
  };
}

export function confirmPassword(password, passwordConfirm) {
  return password === passwordConfirm;
}

export async function loginRequest({ email, password }) {
  const response = await api.post("/login/", { email, password });
  return response.data;
}

export async function registerRequest({ email, password, nickname }) {
  const response = await api.post("/register/", {
    email,
    password,
    nickname,
  });
  return response.data;
}

export function getApiErrorMessage(error) {
  const data = error.response?.data;
  if (!data) {
    return error.message || "요청에 실패했습니다.";
  }
  if (typeof data.detail === "string") {
    return data.detail;
  }
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item.msg || item.message || JSON.stringify(item))
      .join("\n");
  }
  if (data.message) {
    return data.message;
  }
  return "요청에 실패했습니다.";
}
