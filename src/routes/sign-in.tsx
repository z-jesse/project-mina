import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { signInReturnPath, useAuth } from '../lib/auth'
import { requestSignInCode, verifySignInCode } from '../server/auth.functions'

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search) => ({ returnTo: signInReturnPath(search.returnTo) }),
  head: () => ({
    meta: [
      { title: 'Sign in | Games Watchdog' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: SignInPage,
})

function SignInPage() {
  const { returnTo } = Route.useSearch()
  const auth = useAuth()
  const client = useQueryClient()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resendAt, setResendAt] = useState(0)

  async function send() {
    if (busy) return
    if (Date.now() < resendAt) {
      setError('Please wait a minute before requesting another code.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await requestSignInCode({ data: { email } })
      if (result.error) {
        setError(result.error)
        return
      }
      setSent(true)
      setResendAt(Date.now() + 60_000)
    } catch {
      setError('Could not reach sign-in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await verifySignInCode({ data: { email, code } })
      if (result.error) {
        setError(result.error)
        return
      }
      client.removeQueries({ queryKey: ['article-feedback'] })
      // A fresh request reads the new HttpOnly cookie and clears prior account state.
      window.location.assign(returnTo)
    } catch {
      setError('Could not finish signing in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main-content" className="topic-page">
      <div className="topic-wrap auth-panel">
        <h1>
          {auth.data?.user
            ? 'You’re signed in'
            : sent
              ? 'Check your email'
              : 'Sign in to Games Watchdog'}
        </h1>
        {auth.data?.user ? (
          <>
            <p>{auth.data.user.email}</p>
            <a href={returnTo}>Continue reading</a>
          </>
        ) : !auth.data ? (
          <output>
            {auth.isError
              ? 'Sign-in is unavailable. Please try again.'
              : 'Loading sign-in…'}
            {auth.isError && (
              <button type="button" onClick={() => void auth.refetch()}>
                Retry
              </button>
            )}
          </output>
        ) : !auth.data.configured ? (
          <p>
            Sign-in isn’t available in this preview. You can still browse every
            story.
          </p>
        ) : (
          <>
            <p>
              {sent
                ? `Enter the six-digit code sent to ${email}.`
                : 'Use your email to sign in or create an account. No password needed.'}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void (sent ? verify() : send())
              }}
            >
              {sent ? (
                <>
                  <label htmlFor="sign-in-code">Sign-in code</label>
                  <input
                    id="sign-in-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                  />
                </>
              ) : (
                <>
                  <label htmlFor="sign-in-email">Email address</label>
                  <input
                    id="sign-in-email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </>
              )}
              <button type="submit" disabled={busy}>
                {busy ? 'Please wait…' : sent ? 'Sign in' : 'Email me a code'}
              </button>
            </form>
            {sent && (
              <div className="auth-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send()}
                >
                  Send another code
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setSent(false)
                    setCode('')
                    setError('')
                  }}
                >
                  Use a different email
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="account-error">
                {error}
              </p>
            )}
          </>
        )}
        <Link to="/" search={{}}>
          Back to news
        </Link>
      </div>
    </main>
  )
}
