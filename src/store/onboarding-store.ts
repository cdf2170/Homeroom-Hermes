import { create } from "zustand";

interface OnboardingStore {
  completed: boolean;
  markComplete: () => void;
  reset: () => void;
}

const STORAGE_KEY = "homeroom_onboarding_v1_complete";

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  completed: localStorage.getItem(STORAGE_KEY) === "true",
  markComplete: () => {
    localStorage.setItem(STORAGE_KEY, "true");
    set({ completed: true });
  },
  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ completed: false });
  },
}));
