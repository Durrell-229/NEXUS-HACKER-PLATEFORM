import apiClient from './client'

export const arenaApi = {
  getChallenges: (params = {}) =>
    apiClient.get('/api/arena/challenges/', { params }),

  getChallenge: (id) =>
    apiClient.get(`/api/arena/challenges/${id}/`),

  submitFlag: (id, flag) =>
    apiClient.post(`/api/arena/challenges/${id}/submit/`, { flag }),

  getHint: (id, hintId) =>
    apiClient.post(`/api/arena/challenges/${id}/hints/${hintId}/unlock/`),

  getSolvers: (id) =>
    apiClient.get(`/api/arena/challenges/${id}/solvers/`),

  getCategories: () =>
    apiClient.get('/api/arena/categories/'),

  getAttachment: (id, fileId) =>
    apiClient.get(`/api/arena/challenges/${id}/files/${fileId}/`, { responseType: 'blob' }),
}
