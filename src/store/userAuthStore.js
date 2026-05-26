import { create } from "zustand";

const useAuthStore = create((set) => ({
  isLoggedIn: false,
  user: {
    name: "",
    email: "",
    allergies: [],
  },
  login: (name, email, allergies = []) =>
    set({
      isLoggedIn: true,
      user: { name, email, allergies },
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      user: { name: "", email: "", allergies: [] },
    }),
  updateAllergies: (allergies) =>
    set((state) => ({
      user: { ...state.user, allergies },
    })),
}));

export default useAuthStore;
