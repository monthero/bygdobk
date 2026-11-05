import { create } from 'zustand';

interface UiState {
  loginOpened: boolean;
  openLogin: () => void;
  closeLogin: () => void;
}

export const useUi = create<UiState>()((set) => ({
  loginOpened: false,
  openLogin: () => set({ loginOpened: true }),
  closeLogin: () => set({ loginOpened: false }),
}));
