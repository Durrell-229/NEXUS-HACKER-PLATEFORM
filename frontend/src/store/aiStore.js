import { create } from 'zustand'
import apiClient from '../api/client'
import { useAuthStore } from './authStore'

const STORAGE_KEY = 'nexus-ai-history'

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)))
  } catch {}
}

export const useAIStore = create((set, get) => ({
  open: false,
  messages: loadHistory(),
  isStreaming: false,
  error: null,

  toggle: () => set(s => ({ open: !s.open })),
  open_panel: () => set({ open: true }),
  close_panel: () => set({ open: false }),
  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ messages: [] })
  },

  sendMessage: async (userText) => {
    if (!userText.trim() || get().isStreaming) return null

    const userMsg = { role: 'user', content: userText, id: Date.now() }
    const assistantMsg = { role: 'assistant', content: '', id: Date.now() + 1, streaming: true }

    set(s => ({
      messages: [...s.messages, userMsg, assistantMsg],
      isStreaming: true,
      error: null,
    }))

    // Build message history (last 10 turns, no system)
    const history = get().messages
      .filter(m => !m.streaming && m.role !== 'system')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      // Pre-flight via apiClient : force le refresh du token si expiré
      // L'intercepteur axios met à jour le store Zustand automatiquement
      try { await apiClient.get('/vault/users/me/') } catch {}

      const token = useAuthStore.getState().token
      if (!token) throw new Error('Non authentifié — reconnecte-toi')

      const response = await fetch('/api/v1/matrix/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history, stream: true }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let toolsUsed = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.error) throw new Error(data.error)

            // Tool call started
            if (data.tool) {
              toolsUsed.push(data.tool)
              set(s => ({
                messages: s.messages.map(m =>
                  m.id === assistantMsg.id
                    ? { ...m, tools: [...(m.tools || []), { name: data.tool, args: data.args, status: 'running' }] }
                    : m
                ),
              }))
            }
            // Tool call completed
            if (data.tool_done) {
              set(s => ({
                messages: s.messages.map(m =>
                  m.id === assistantMsg.id
                    ? { ...m, tools: (m.tools || []).map(t => ({ ...t, status: 'done' })) }
                    : m
                ),
              }))
            }

            if (data.content) {
              fullContent += data.content
              set(s => ({
                messages: s.messages.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: fullContent } : m
                ),
              }))
            }
            if (data.done) break
          } catch {}
        }
      }

      set(s => {
        const updated = s.messages.map(m =>
          m.id === assistantMsg.id ? { ...m, streaming: false, content: fullContent } : m
        )
        saveHistory(updated)
        return { messages: updated, isStreaming: false }
      })

      return fullContent
    } catch (err) {
      const errMsg = err.message || 'NIM API error'
      set(s => ({
        messages: s.messages.map(m =>
          m.id === assistantMsg.id
            ? { ...m, streaming: false, content: `❌ ${errMsg}`, error: true }
            : m
        ),
        isStreaming: false,
        error: errMsg,
      }))
      return null
    }
  },
}))
