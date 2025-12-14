import { AuthRepository } from "../repositories/auth"
import { SettingRepository } from "../repositories/setting"
import type { Setting } from "../types/changeable"

export default defineNuxtPlugin({
  name: 'auth-middleware',
  dependsOn: ['api-client'],
  async setup (nuxtApp) {
  const settings = useState<Setting | null>('settings:data', () => null)
  const booted = useState<boolean>('auth:booted', () => false)

  async function initUser() {
    const authRepository = new AuthRepository(nuxtApp.$api as any)
    const tokenKey = useRuntimeConfig().public.apiClient.tokenKey
    const token = useCookie(tokenKey)
    const accessToken = useCookie('access_token')

    if (token.value) {
      try {
        await authRepository.me()
        return
      } catch (e) { console.error(e) }
    }

    if (accessToken.value) {
      try {
        const response = await authRepository.login({ access_token: accessToken.value })
        token.value = response
        return
      } catch (e) { console.error(e) }
    }

    try {
      const response = await authRepository.register()
      token.value = response.token
      accessToken.value = response.access_token
    } catch (e) {
      console.warn('Auto-registration failed:', e)
    }
  }

  if (!booted.value) {
    try {
        await initUser()

        if (!settings.value) {
            const settingRepo = new SettingRepository(nuxtApp.$api as any)
            settings.value = await settingRepo.getSettings()
        }

        booted.value = true
    } catch (e) {
        console.error('App initialization failed:', e)
    }
  }

  return {
    provide: {
      settings: computed(() => settings.value)
    }
  }
}})
