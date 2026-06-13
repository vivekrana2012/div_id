import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  isRefreshing = false
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const reqUrl = err.config?.url || ''
    const isAuthCheck = reqUrl === '/auth/me' || reqUrl.endsWith('/auth/me')
    const isRefreshAttempt = reqUrl === '/auth/refresh' || reqUrl.endsWith('/auth/refresh')
    const path = window.location.pathname
    const onPublicPage = ['/login', '/register', '/articles'].includes(path) || path.startsWith('/posts/')
    
    if ((err.response?.status === 401 || err.response?.status === 403) && !isAuthCheck && !onPublicPage && !isRefreshAttempt) {
      if (isRefreshing) {
        // Queue the request to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          return api(err.config)
        })
      }

      isRefreshing = true

      try {
        // Try to refresh token
        const refreshRes = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        )

        const { accessToken } = refreshRes.data

        // Update cookies (done by server, but we might need to store refresh token on client for mobile)
        // For web, cookies are handled automatically

        processQueue(null, accessToken)

        // Retry the original request
        return api(err.config)
      } catch (refreshErr) {
        // Refresh failed - clear state and redirect to login
        processQueue(refreshErr, null)
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(err)
  }
)

export default api

// Link preview types and API functions
export interface LinkPreviewData {
  url: string
  title: string
  description: string
  imageUrl: string
  siteName: string
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  const res = await api.post<LinkPreviewData>('/link-preview', { url })
  return res.data
}

export async function fetchLinkPreviews(urls: string[]): Promise<LinkPreviewData[]> {
  const res = await api.post<LinkPreviewData[]>('/link-preview/batch', { urls })
  return res.data
}
