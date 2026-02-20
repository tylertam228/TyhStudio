import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  discordInfo: null,
  setDiscordInfo: (info) => set({ discordInfo: info }),

  roomState: null,
  setRoomState: (state) => set({ roomState: state }),

  isHost: false,
  setIsHost: (isHost) => set({ isHost }),

  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      { id: Date.now(), ...notification },
    ],
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));
