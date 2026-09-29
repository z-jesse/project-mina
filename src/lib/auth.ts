import { useQuery } from '@tanstack/react-query'
import { useHydrated } from '@tanstack/react-router'
import { getAuth } from '../server/auth.functions'

export function useAuth() {
  const hydrated = useHydrated()
  return useQuery({
    queryKey: ['auth'],
    queryFn: () => getAuth(),
    enabled: hydrated,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: 'always',
  })
}

// Only return to the site's known reading routes; never accept an external URL.
export function signInReturnPath(value: unknown) {
  if (typeof value !== 'string' || value.length > 2000) return '/'
  if (
    !/^\/(?:\?[^#]*)?$|^\/(?:topics\/[a-z0-9-]+|games\/grand-theft-auto-vi)(?:\?[^#]*)?$/.test(
      value,
    )
  )
    return '/'
  if (/[\\\r\n]/.test(value)) return '/'
  return value
}
