import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
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
    }),
    {
      name: "canieat-auth",
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
