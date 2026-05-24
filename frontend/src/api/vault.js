import apiClient from './client'

export const vaultApi = {
  getProfile: (username) =>
    apiClient.get(`/api/vault/users/${username}/`),

  getMyProfile: () =>
    apiClient.get('/api/vault/me/'),

  updateProfile: (data) =>
    apiClient.patch('/api/vault/me/', data),

  uploadAvatar: (formData) =>
    apiClient.post('/api/vault/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getSolvedChallenges: (username) =>
    apiClient.get(`/api/vault/users/${username}/solved/`),

  getAchievements: (username) =>
    apiClient.get(`/api/vault/users/${username}/achievements/`),

  getActivity: (username) =>
    apiClient.get(`/api/vault/users/${username}/activity/`),
}
