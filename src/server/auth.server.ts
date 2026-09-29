import { createServerClient } from '@supabase/ssr'
import { isAuthSessionMissingError } from '@supabase/supabase-js'
import {
  getCookies,
  getRequest,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'
import { z } from 'zod'

export function privateResponse() {
  setResponseHeader('Cache-Control', 'private, no-store')
  setResponseHeader('Vary', 'Cookie')
}

export function authConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_PUBLISHABLE_KEY &&
      process.env.APP_ORIGIN,
  )
}

function appOrigin() {
  const origin = z.url().parse(process.env.APP_ORIGIN)
  if (new URL(origin).origin !== origin)
    throw new Error('APP_ORIGIN must be an origin without a path.')
  return origin
}

export function requireSameOrigin() {
  privateResponse()
  const request = getRequest()
  if (
    request.method !== 'POST' ||
    request.headers.get('origin') !== appOrigin()
  ) {
    throw new Error('This action must originate from this website.')
  }
}

// A request-specific server client is the only place that handles Auth tokens.
export function authClient() {
  privateResponse()
  const secure = appOrigin().startsWith('https:')
  if (
    !secure &&
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(appOrigin()).hostname)
  ) {
    throw new Error('Authentication requires HTTPS outside local development.')
  }
  return createServerClient(
    z.url().parse(process.env.SUPABASE_URL),
    z.string().min(1).parse(process.env.SUPABASE_PUBLISHABLE_KEY),
    {
      cookieOptions: {
        name: secure ? '__Host-mina-auth' : 'mina-auth',
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      },
      cookies: {
        getAll: () =>
          Object.entries(getCookies()).map(([name, value]) => ({
            name,
            value,
          })),
        setAll: (cookies, headers) => {
          for (const { name, value, options } of cookies)
            setCookie(name, value, options)
          for (const [name, value] of Object.entries(headers))
            setResponseHeader(name, value)
        },
      },
    },
  )
}

export async function currentUser() {
  privateResponse()
  if (!authConfigured()) return null
  const { data, error } = await authClient().auth.getUser()
  if (error) {
    if (
      isAuthSessionMissingError(error) ||
      [
        'bad_jwt',
        'session_not_found',
        'refresh_token_not_found',
        'refresh_token_already_used',
      ].includes(error.code ?? '')
    )
      return null
    throw new Error('Unable to check your account. Please try again.')
  }
  return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null
}

export async function requireUser() {
  const user = await currentUser()
  if (!user) throw new Error('Sign in to vote.')
  return user
}
