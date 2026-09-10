import axiosInstance from "./axiosInstance";

// 현재 비밀번호가 맞는지 서버에 확인 요청
export const verifyPassword = async (currentPassword) => {
  const response = await axiosInstance.post("/api/auth/verify-password", {
    password: currentPassword,
  });
  return response.data; // 예: { isSuccess: true }
};
