export const useAuthToken = () => {
  const config = useRuntimeConfig()
  const apiConfig = config.public.apiClient as any
  const tokenKey = apiConfig?.tokenKey || 'token'

  const tokenState = useState<string | null>('auth_token_state', () => {
    const cookie = useCookie(tokenKey)
    return cookie.value || null
  })

  const setToken = (newToken: string | null) => {
    tokenState.value = newToken
    const cookie = useCookie(tokenKey)
    cookie.value = newToken
  }

  return {
    token: tokenState,
    setToken
  }
}
