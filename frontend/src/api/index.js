import axios from "axios";

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

let refreshRequest = null;

function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = axios
      .post(
        "/refresh",
        {},
        {
          baseURL: import.meta.env.VITE_API_BASE_URL,
          withCredentials: true,
        },
      )
      .then((response) => response.data.access_token)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export function logoutFromServer() {
  return axios.post(
    "/logout",
    {},
    {
      baseURL: import.meta.env.VITE_API_BASE_URL,
      withCredentials: true,
    },
  );
}

async function expireSession() {
  const { default: useAuthStore } = await import("../store/useAuthStore.js");
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // ★ 쿠키를 주고받기 위해 반드시 설정해야 합니다!
});

// 1. Request Interceptor: 요청 보낼 때 Access Token 첨부
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

//2. Response Interceptor: 401 에러 발생 시 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const isAuthEndpoint = /\/(login|register|refresh|logout)(\/|$)/.test(
      requestUrl,
    );

    if (error.response?.status === 401 && originalRequest?._retry) {
      await expireSession();
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        if (typeof newAccessToken !== "string" || !newAccessToken) {
          throw new Error("토큰 갱신 응답에 access_token이 없습니다.");
        }
        const { default: useAuthStore } = await import(
          "../store/useAuthStore.js"
        );
        useAuthStore.getState().updateAccessToken(newAccessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("세션이 만료되었습니다. 다시 로그인해주세요.", refreshError);
        await expireSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
