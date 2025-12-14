import tailwindcss from "@tailwindcss/vite"
import process from 'node:process'
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  css: [
    './assets/css/main.css',
  ],
  alias: {
    '~': fileURLToPath(new URL('./', import.meta.url))
  },
  modules: [
    './modules/api-client',
    '@vueuse/nuxt',
  ],
  apiClient: {
    baseURL: process.env.API_BASE_URL,
    tokenKey: 'token',
  },
})
