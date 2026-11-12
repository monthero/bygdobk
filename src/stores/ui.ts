import { create } from 'zustand';

interface UiState {
  loginOpened: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  autoHideHeader: boolean;
  setAutoHideHeader: (on: boolean) => void;
  focusMode: boolean;
  setFocusMode: (on: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  loginOpened: false,
  openLogin: () => set({ loginOpened: true }),
  closeLogin: () => set({ loginOpened: false }),
  autoHideHeader: false,
  setAutoHideHeader: (on) => set({ autoHideHeader: on }),
  focusMode: false,
  setFocusMode: (on) => set({ focusMode: on }),
}));
