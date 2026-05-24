import apiClient from './client'

export const forgeApi = {
  runCode: (code, language, stdin = '') =>
    apiClient.post('/api/forge/execute/', { code, language, stdin }),

  saveSnippet: (data) =>
    apiClient.post('/api/forge/snippets/', data),

  getSnippets: () =>
    apiClient.get('/api/forge/snippets/'),

  getSnippet: (id) =>
    apiClient.get(`/api/forge/snippets/${id}/`),

  updateSnippet: (id, data) =>
    apiClient.patch(`/api/forge/snippets/${id}/`, data),

  deleteSnippet: (id) =>
    apiClient.delete(`/api/forge/snippets/${id}/`),

  shareSnippet: (id) =>
    apiClient.post(`/api/forge/snippets/${id}/share/`),

  getLanguages: () =>
    apiClient.get('/api/forge/languages/'),
}
