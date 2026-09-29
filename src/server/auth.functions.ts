import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  authClient,
  authConfigured,
  currentUser,
  requireSameOrigin,
} from './auth.server'

const email = z.string().trim().email().max(254)

export const getAuth = createServerFn({ method: 'GET' }).handler(async () => ({
  configured: authConfigured(),
  localPreview: process.env.CONTENT_SOURCE !== 'database',
  user: await currentUser(),
}))

export const requestSignInCode = createServerFn({ method: 'POST' })
  .validator(z.object({ email }))
  .handler(async ({ data }) => {
    requireSameOrigin()
    const { error } = await authClient().auth.signInWithOtp({
      email: data.email,
    })
    return {
      error: error
        ? 'Could not send a code. Wait a minute and try again.'
        : null,
    }
  })

export const verifySignInCode = createServerFn({ method: 'POST' })
  .validator(z.object({ email, code: z.string().regex(/^\d{6}$/) }))
  .handler(async ({ data }) => {
    requireSameOrigin()
    const { error } = await authClient().auth.verifyOtp({
      email: data.email,
      token: data.code,
      type: 'email',
    })
    return {
      error: error
        ? 'That code is invalid or expired. Check it or request a new code.'
        : null,
    }
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  requireSameOrigin()
  const { error } = await authClient().auth.signOut({ scope: 'local' })
  return { error: error ? 'Could not sign out. Please try again.' : null }
})
