import { useAuthToken } from "../composables/useAuthToken"

export default defineNuxtPlugin({
  name: 'init-user',
  async setup () {
    const config = useRuntimeConfig()
    const apiConfig = config.public.apiClient as any
    const baseURL = apiConfig?.baseURL || ''

    const { token, setToken } = useAuthToken()
    const accessToken = useCookie('access_token')

    if (token.value) {
      try {
        await $fetch(`${baseURL}/api/me`, {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        })
        return
      } catch (e) {
        setToken(null)
      }
    }

    if (accessToken.value) {
      try {
        const jwt = await $fetch(`${baseURL}/api/login`, {
          method: 'POST',
          body: {
            access_token: accessToken.value
          }
        }) as string

        setToken(jwt)
        return
      } catch (e) {
        console.error('Login failed:', e)
      }
    }

    if (!token.value) {
        try {
          const response = await $fetch(`${baseURL}/api/register`, {
            method: 'POST'
          }) as any

          setToken(response.token)
          accessToken.value = response.access_token
        } catch (e) {
          console.warn('Auto-registration failed:', e)
        }
    }
  }
})
