import { create } from "zustand";

const useDarkStore = create((set) => ({
  isDark: true,
  toggleDark: () => set((state) => ({ isDark: !state.isDark })),
}));

export default useDarkStore;
