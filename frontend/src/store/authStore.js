import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import apiClient from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await apiClient.post('/auth/token/', { email, password })
          const { access, refresh, username, is_staff, is_superuser, rank, level } = res.data
          set({
            token: access,
            refreshToken: refresh,
            user: { username, email, is_staff, is_superuser, rank, level },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          return { success: true }
        } catch (err) {
          const error = !err.response
            ? 'Cannot reach server — check your connection'
            : err.response.data?.detail || `Server error ${err.response.status}`
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          // 1. Créer le compte
          await apiClient.post('/auth/register/', {
            username: data.username,
            email: data.email,
            password: data.password,
            password_confirm: data.password,
          })
          // 2. Se connecter automatiquement pour obtenir les tokens
          const loginRes = await apiClient.post('/auth/token/', {
            email: data.email,
            password: data.password,
          })
          const { access, refresh } = loginRes.data
          // 3. Récupérer le profil
          const profileRes = await apiClient.get('/vault/users/me/', {
            headers: { Authorization: `Bearer ${access}` }
          }).catch(() => ({ data: { username: data.username } }))
          set({
            token: access,
            refreshToken: refresh,
            user: profileRes.data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          return { success: true }
        } catch (err) {
          let errorMsg
          if (!err.response) {
            errorMsg = 'Cannot reach server — check your connection or CORS settings'
          } else {
            const errors = err.response.data || {}
            errorMsg = Object.values(errors).flat().join(' ') || `Server error ${err.response.status}`
          }
          set({ isLoading: false, error: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }))
      },

      clearError: () => set({ error: null }),

      getToken: () => get().token,
    }),
    {
      name: 'nexus-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
