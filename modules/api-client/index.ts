import { defineNuxtModule, createResolver, addPlugin, addTypeTemplate, addImportsDir } from 'nuxt/kit'

export interface ModuleOptions {
  /** Upstream base URL for your backend API */
  baseURL: string
  /** Header name to forward locale */
  headerLocale?: string // default: 'X-LOCALE'
  enable?: boolean
  tokenKey?: string
  loginPath?: string
  retry?: number
  retryDelay?: number
  timeout?: number
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'api-client',
    configKey: 'apiClient',
  },
  defaults: {
    baseURL: '',
    headerLocale: 'X-LOCALE',
    enable: true,
    tokenKey: 'token',
    loginPath: '/login',
    retry: 1,
    retryDelay: 500,
    timeout: 10000,
  },
  setup(options, nuxt) {
    if (!options.enable)
      return

    const { resolve } = createResolver(import.meta.url)

    // Add public runtime config (available on both client and server)
    nuxt.options.runtimeConfig.public.apiClient = {
      baseURL: options.baseURL!,
      tokenKey: options.tokenKey!,
      loginPath: options.loginPath!,
      retry: options.retry!,
      retryDelay: options.retryDelay!,
      timeout: options.timeout!,
    } as any

    // Register plugins - must point to the actual files, not directory
    addPlugin(resolve('./runtime/plugins/1.init-user.server'))
    addPlugin(resolve('./runtime/plugins/2.api'))


    // Register composables directory for auto-import
    addImportsDir(resolve('./runtime/composables'))

    // Register types using addTypeTemplate for proper type support
    addTypeTemplate({
      filename: 'types/api-client.d.ts',
      src: resolve('./runtime/types/api-client.d.ts'),
    })
    addTypeTemplate({
      filename: 'types/changeable.d.ts',
      src: resolve('./runtime/types/changeable.d.ts'),
    })
  },
})
