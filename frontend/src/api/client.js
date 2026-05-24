import axios from 'axios'

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const BASE_URL = rawBase.endsWith('/api/v1') ? rawBase : `${rawBase.replace(/\/$/, '')}/api/v1`

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from zustand persisted storage
    const stored = localStorage.getItem('nexus-auth')
    if (stored) {
      try {
        const { state } = JSON.parse(stored)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch {
        // ignore parse errors
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const stored = localStorage.getItem('nexus-auth')
      if (stored) {
        try {
          const { state } = JSON.parse(stored)
          if (state?.refreshToken) {
            const refreshRes = await axios.post(
              `${BASE_URL}/auth/token/refresh/`,
              { refresh: state.refreshToken }
            )
            const newToken = refreshRes.data.access

            // Update localStorage
            const parsed = JSON.parse(stored)
            parsed.state.token = newToken
            localStorage.setItem('nexus-auth', JSON.stringify(parsed))

            // Sync Zustand store (dynamic import avoids circular dep)
            const { useAuthStore } = await import('../store/authStore')
            useAuthStore.setState({ token: newToken })

            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return apiClient(originalRequest)
          }
        } catch {
          // Refresh failed — clear auth
          localStorage.removeItem('nexus-auth')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
