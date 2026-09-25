import { computed } from 'vue'
import { useAuthStore } from '@/core/auth/auth.store'
import { useTenantStore } from '@/core/tenant/tenant.store'

// UI-only check for showing/hiding things. The server always enforces permissions.
export function useCan() {
  const auth = useAuthStore()
  const tenant = useTenantStore()

  const permissions = computed<string[]>(() => {
    const slug = tenant.current?.slug
    return slug ? (auth.membershipFor(slug)?.permissions ?? []) : []
  })

  function can(required: string | string[]): boolean {
    const list = Array.isArray(required) ? required : [required]
    return list.every((p) => permissions.value.includes(p))
  }

  return { can, permissions }
}