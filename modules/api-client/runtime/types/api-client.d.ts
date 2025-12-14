export interface ApiError {
  message: string
  statusCode: number
  data?: any
  errors?: Record<string, string[]>
}

declare module '#app' {
  interface NuxtApp {
    $api: typeof import('ofetch').$fetch
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: typeof import('ofetch').$fetch
  }
}

export {}
