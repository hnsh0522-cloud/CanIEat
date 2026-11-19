import { create } from "zustand";
import {
  getAccessToken,
  logoutFromServer,
  setAccessToken,
} from "../api/index.js";

const AUTH_STORAGE_KEY = "canIEat.auth";

const emptyUser = {
  user_id: null,
  name: "",
  nickname: "",
  email: "",
  allergies: [],
  precautions: [],
};

function readSavedAuth() {
  try {
    const savedAuth = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedAuth) return null;

    const parsedAuth = JSON.parse(savedAuth);
    if (
      typeof parsedAuth.accessToken !== "string" ||
      !parsedAuth.accessToken ||
      !parsedAuth.user ||
      typeof parsedAuth.user !== "object"
    ) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsedAuth;
  } catch (error) {
    console.error("로그인 상태를 복원하지 못했습니다.", error);
    return null;
  }
}

function saveAuth(accessToken, user) {
  try {
    window.sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken, user }),
    );
  } catch (error) {
    console.error("로그인 상태를 저장하지 못했습니다.", error);
  }
}

function clearSavedAuth() {
  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("저장된 로그인 상태를 삭제하지 못했습니다.", error);
  }
}

const savedAuth = readSavedAuth();
if (savedAuth) setAccessToken(savedAuth.accessToken);
const savedUser = savedAuth
  ? {
      ...emptyUser,
      ...savedAuth.user,
      allergies: Array.isArray(savedAuth.user.allergies)
        ? savedAuth.user.allergies
        : [],
      precautions: Array.isArray(savedAuth.user.precautions)
        ? savedAuth.user.precautions
        : [],
    }
  : emptyUser;

const useAuthStore = create((set) => ({
  isLoggedIn: Boolean(savedAuth),
  user: savedUser,

  login: ({ access_token, user }) => {
    setAccessToken(access_token);
    const nextUser = {
      ...emptyUser,
      ...user,
      name: user.nickname ?? user.name ?? "",
      allergies: Array.isArray(user.allergies) ? user.allergies : [],
      precautions: Array.isArray(user.precautions) ? user.precautions : [],
    };
    saveAuth(access_token, nextUser);
    set({
      isLoggedIn: true,
      user: nextUser,
    });
  },

  logout: () => {
    setAccessToken(null);
    clearSavedAuth();
    set({
      isLoggedIn: false,
      user: emptyUser,
    });
    logoutFromServer().catch((error) => {
      console.error("서버 세션을 종료하지 못했습니다.", error);
    });
  },

  updateAccessToken: (accessToken) => {
    setAccessToken(accessToken);
    const { isLoggedIn, user } = useAuthStore.getState();
    if (isLoggedIn) saveAuth(accessToken, user);
  },

  updateAllergies: (allergies) =>
    set((state) => {
      const user = { ...state.user, allergies };
      if (state.isLoggedIn) saveAuth(getAccessToken(), user);
      return { user };
    }),

  updatePrecautions: (precautions) =>
    set((state) => {
      const user = { ...state.user, precautions };
      if (state.isLoggedIn) saveAuth(getAccessToken(), user);
      return { user };
    }),

  updateUserState: (userState) =>
    set((state) => {
      const user = { ...state.user, ...userState };
      if (state.isLoggedIn) saveAuth(getAccessToken(), user);
      return { user };
    }),
}));

export default useAuthStore;
