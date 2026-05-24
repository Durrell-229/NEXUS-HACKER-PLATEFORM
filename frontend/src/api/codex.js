import apiClient from './client'

export const codexApi = {
  getArticles: (params = {}) =>
    apiClient.get('/api/codex/articles/', { params }),

  getArticle: (slug) =>
    apiClient.get(`/api/codex/articles/${slug}/`),

  searchArticles: (query) =>
    apiClient.get('/api/codex/search/', { params: { q: query } }),

  getCategories: () =>
    apiClient.get('/api/codex/categories/'),

  getTags: () =>
    apiClient.get('/api/codex/tags/'),

  likeArticle: (slug) =>
    apiClient.post(`/api/codex/articles/${slug}/like/`),

  bookmarkArticle: (slug) =>
    apiClient.post(`/api/codex/articles/${slug}/bookmark/`),
}
