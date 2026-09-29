import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'

// Exercises the local provider, not the application's future cookie/session layer.
test('local email codes verify once, create a session, and support sign-out', async () => {
  const status = JSON.parse(
    execFileSync(
      process.execPath,
      ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ),
  )
  // Never send test requests to a hosted project or real email provider.
  assert.equal(status.API_URL, 'http://127.0.0.1:54321')
  assert.equal(status.MAILPIT_URL, 'http://127.0.0.1:54324')
  const email = `mina-auth-${randomUUID()}@example.com`
  let userId: string | undefined
  let messageId: string | undefined

  async function auth(path: string, body?: object, token = status.ANON_KEY) {
    return fetch(`${status.API_URL}/auth/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        apikey: status.ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    })
  }

  try {
    assert.equal((await auth('/otp', { email, create_user: true })).status, 200)
    const messages = await fetch(`${status.MAILPIT_URL}/api/v1/messages`, {
      signal: AbortSignal.timeout(10_000),
    }).then((response) => response.json())
    const message = messages.messages.find(
      (item: { To: { Address: string }[] }) =>
        item.To.some((recipient) => recipient.Address === email),
    )
    assert.ok(message, 'The sign-in email should be captured in Mailpit')
    messageId = message.ID
    const content = await fetch(
      `${status.MAILPIT_URL}/api/v1/message/${messageId}`,
    ).then((response) => response.json())
    const code = (content.Text || content.HTML).match(/\b\d{6}\b/)?.[0]
    assert.ok(code, 'The local template should contain a six-digit code')
    const verified = await auth('/verify', {
      email,
      token: code,
      type: 'email',
    })
    assert.equal(verified.status, 200)
    const session = await verified.json()
    userId = session.user.id
    assert.equal(session.user.email, email)
    assert.ok(session.access_token)
    assert.ok(session.refresh_token)
    assert.notEqual(
      (await auth('/verify', { email, token: code, type: 'email' })).status,
      200,
      'A consumed code must not sign in again',
    )
    const user = await auth('/user', undefined, session.access_token)
    assert.equal(user.status, 200)
    assert.equal((await user.json()).id, userId)
    const refreshed = await auth('/token?grant_type=refresh_token', {
      refresh_token: session.refresh_token,
    })
    assert.equal(refreshed.status, 200)
    const nextSession = await refreshed.json()
    assert.equal(
      (await auth('/logout', {}, nextSession.access_token)).status,
      204,
    )
    assert.notEqual(
      (
        await auth('/token?grant_type=refresh_token', {
          refresh_token: nextSession.refresh_token,
        })
      ).status,
      200,
      'Signing out must revoke the refresh session',
    )
  } finally {
    if (userId) {
      const deleted = await fetch(
        `${status.API_URL}/auth/v1/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            apikey: status.SERVICE_ROLE_KEY,
            Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
          },
        },
      )
      assert.ok(deleted.ok, 'Remove only the user created by this test')
    }
    if (messageId) {
      const deleted = await fetch(`${status.MAILPIT_URL}/api/v1/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: [messageId] }),
      })
      assert.ok(deleted.ok, 'Remove only the email created by this test')
    }
  }
})
