import { create } from "zustand";

const getInitialIsDark = () => {
  if (typeof window === "undefined") return true;

  const saved = window.localStorage.getItem("isDark");
  if (saved === "true") return true;
  if (saved === "false") return false;

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
};

const useThemeStore = create((set) => ({
  isDark: getInitialIsDark(),

  setIsDark: (next) => {
    set({ isDark: next });
    try {
      window.localStorage.setItem("isDark", next ? "true" : "false");
    } catch {
      // localStorage 사용 불가 환경이면 무시
    }
  },

  toggleDark: () =>
    set((state) => {
      const next = !state.isDark;
      try {
        window.localStorage.setItem("isDark", next ? "true" : "false");
      } catch {
        // 무시
      }
      return { isDark: next };
    }),
}));

export default useThemeStore;

