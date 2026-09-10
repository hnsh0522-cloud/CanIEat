import api from "./index";

// 현재 비밀번호가 맞는지 서버에 확인 요청
export const verifyPassword = async (currentPassword) => {
  const response = await api.post("/api/auth/verify-password", {
    password: currentPassword,
  });
  return response.data; // 예: { isSuccess: true }
};

// 비밀번호와 비밀번호 확인이 일치하는지 확인
export const confirmPassword = (password, passwordConfirm) => {
  return password === passwordConfirm;
};
