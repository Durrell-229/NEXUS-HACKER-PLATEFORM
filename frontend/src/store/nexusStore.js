import { create } from 'zustand'

export const useNexusStore = create((set, get) => ({
  // UI State
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  activeSection: 'dashboard',
  theme: 'dark',

  // Notifications
  notifications: [
    { id: 1, type: 'challenge', message: 'New challenge "Buffer Overflow 101" added to PWN', time: '2m ago', read: false },
    { id: 2, type: 'achievement', message: 'Achievement unlocked: "First Blood" — first solve on a challenge', time: '15m ago', read: false },
    { id: 3, type: 'system', message: 'Weekly CTF event starts in 2 hours', time: '1h ago', read: true },
    { id: 4, type: 'message', message: 'h4x0r_elite sent you a message', time: '3h ago', read: true },
  ],

  // Global loading
  globalLoading: false,

  // Alert/Toast messages
  toasts: [],

  // Terminal overlay
  terminalOpen: false,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),

  setActiveSection: (section) => set({ activeSection: section }),

  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  })),

  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true }))
  })),

  addNotification: (notification) => set((state) => ({
    notifications: [
      { id: Date.now(), ...notification, read: false },
      ...state.notifications
    ]
  })),

  addToast: (toast) => {
    const id = Date.now()
    set((state) => ({
      toasts: [...state.toasts, { id, ...toast }]
    }))
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, toast.duration || 4000)
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
