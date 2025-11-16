import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Criar instância do axios
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  signup: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Templates API
export const templatesApi = {
  list: async (category?: string) => {
    const response = await api.get('/templates', {
      params: { category },
    })
    return response.data
  },

  getBySlug: async (slug: string) => {
    const response = await api.get(`/templates/${slug}`)
    return response.data
  },

  getCategories: async () => {
    const response = await api.get('/templates/categories')
    return response.data
  },
}

// Contracts API
export const contractsApi = {
  list: async (page = 1, limit = 10) => {
    const response = await api.get('/contracts', {
      params: { page, limit },
    })
    return response.data
  },

  create: async (data: { templateId: string; answers: Record<string, any> }) => {
    const response = await api.post('/contracts', data)
    return response.data
  },

  get: async (id: string) => {
    const response = await api.get(`/contracts/${id}`)
    return response.data
  },

  update: async (id: string, answers: Record<string, any>) => {
    const response = await api.put(`/contracts/${id}`, { answers })
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/contracts/${id}`)
    return response.data
  },

  generate: async (id: string) => {
    const response = await api.post(`/contracts/${id}/generate`)
    return response.data
  },

  generatePDF: async (id: string) => {
    const response = await api.post(`/contracts/${id}/pdf`)
    return response.data
  },
}

// User API
export const userApi = {
  stats: async () => {
    const response = await api.get('/user/stats')
    return response.data
  },

  activity: async (page = 1, limit = 20) => {
    const response = await api.get('/user/activity', {
      params: { page, limit },
    })
    return response.data
  },
}
