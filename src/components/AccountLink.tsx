import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { signOut } from '../server/auth.functions'

export default function AccountLink() {
  const auth = useAuth()
  const client = useQueryClient()
  const href = useRouterState({ select: (state) => state.location.href })
  const logout = useMutation({
    mutationFn: async () => {
      const result = await signOut()
      if (result.error) throw new Error(result.error)
    },
    onSuccess: async () => {
      // Remove account-specific choices before fetching the anonymous view.
      await client.cancelQueries({ queryKey: ['article-feedback'] })
      client.removeQueries({ queryKey: ['article-feedback'] })
      await client.invalidateQueries({ queryKey: ['auth'] })
    },
  })
  return (
    <div className="watchdog-account">
      {auth.data?.user ? (
        <>
          <span className="account-email" title={auth.data.user.email}>
            {auth.data.user.email}
          </span>
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </>
      ) : (
        <Link to="/sign-in" search={{ returnTo: href }}>
          Sign in
        </Link>
      )}
      {(auth.isError || logout.isError) && (
        <span role="alert" className="account-error">
          Account unavailable. Try again.
        </span>
      )}
    </div>
  )
}
