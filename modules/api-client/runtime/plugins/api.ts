import type { ApiError } from '../types/api-client'

export default defineNuxtPlugin({
  name: 'api-client',
  setup () {
    const config = useRuntimeConfig()
    const apiConfig = config.public.apiClient as any
    const baseURL = apiConfig?.baseURL || ''
    const tokenKey = apiConfig?.tokenKey || 'token'
    const loginPath = apiConfig?.loginPath || '/login'
    const retry = apiConfig?.retry || 1
    const retryDelay = apiConfig?.retryDelay || 500
    const timeout = apiConfig?.timeout || 10000

    const api = $fetch.create({
      baseURL,
      onRequest({ request, options }) {
        const tokenCookie = useCookie(tokenKey, {
          default: () => '',
          secure: true,
          sameSite: 'strict',
          httpOnly: false, // Allow client-side access
        })

        const token = tokenCookie.value
        if (token) {
          options.headers = options.headers || {}
          setHeaders(options.headers, 'Authorization', `Bearer ${token}`)
        }
        if (!(options.body instanceof FormData)) {
          options.headers = options.headers || {}
          setHeaders(options.headers, 'Content-Type', 'application/json')
        }
        options.headers = options.headers || {}
        setHeaders(options.headers, 'Accept', 'application/json')

        if (import.meta.dev || true) {
          console.log(`🚀 API Request: ${options.method || 'GET'} ${request}`)
        }
      },
      onResponse({ request, response, options }) {
        if (import.meta.dev) {
          console.log(`✅ API Response: ${response.status} ${request}`)
        }
      },

      onResponseError({ request, response, options }) {
        const errorData: ApiError = {
          message: response._data?.message || 'An error occurred',
          statusCode: response.status,
          data: response._data,
        }

        switch (response.status) {
          case 401: {
            // Unauthorized - clear token and redirect to login
            const tokenCookie = useCookie('token', {
              default: () => '',
              secure: true,
              sameSite: 'strict',
              httpOnly: false,
            })
            tokenCookie.value = ''

            // Only handle navigation on client side
            if (import.meta.client) {
              navigateTo(loginPath)
            }
            errorData.message = 'Authentication required'
            break
          }

          case 403:
            errorData.message = 'Access forbidden'
            break

          case 400:
            errorData.message = response._data?.error || response._data?.message || 'Bad request'
            break

          case 404:
            errorData.message = 'Resource not found'
            break

          case 422:
            errorData.message = 'Validation error'
            errorData.errors = response._data?.errors
            break

          case 429:
            errorData.message = 'Too many requests'
            break

          case 500:
          case 502:
          case 503:
          case 504:
            errorData.message = response._data?.error || response._data?.message || 'Server error'
            break

          default:
            errorData.message = response._data?.error || response._data?.message || 'An unexpected error occurred'
        }

        // Log error in development
        if (import.meta.dev) {
          console.error(`❌ API Error: ${response.status} ${request}`, errorData)
        }

        // Throw a structured error
        throw createError({
          statusCode: response.status,
          statusMessage: errorData.message,
          data: errorData,
        })
      },

      retry,
      retryDelay,
      timeout,
    })

    return {
      provide: {
        api,
      },
    }
  },
})

function setHeaders(headers: any, key: string, value: string) {
  if (Array.isArray(headers)) {
    headers.push([key, value])
  }
  else if (headers instanceof Headers) {
    headers.set(key, value)
  }
  else {
    headers[key] = value
  }
}
