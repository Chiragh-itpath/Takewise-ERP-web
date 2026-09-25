import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    permissions?: string[]
    layout?: 'app' | 'auth'
  }
}

export {}