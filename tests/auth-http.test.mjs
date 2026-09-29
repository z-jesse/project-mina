import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { createDefaultSerovalPlugins } from '@tanstack/react-router/ssr/client'
import { config } from 'dotenv'
import pg from 'pg'
import { fromCrossJSON, toJSONAsync } from 'seroval'

// Requires the local Vite app on port 3000 and local Supabase Auth.
test('HTTP sessions and shared voting enforce identity and same-origin boundaries', async () => {
  config({ path: ['.env.local', '.env'], quiet: true })
  const database = new URL(process.env.DATABASE_URL)
  assert.equal(database.hostname, '127.0.0.1')
  assert.equal(database.pathname, '/mina_development')
  assert.equal(process.env.SUPABASE_URL, 'http://127.0.0.1:54321')
  const base = 'http://localhost:3000'
  const status = JSON.parse(
    execFileSync(
      process.execPath,
      ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ),
  )
  assert.equal(status.API_URL, 'http://127.0.0.1:54321')
  const methods = new Map()
  for (const module of ['auth', 'votes']) {
    const source = await (
      await fetch(`${base}/src/server/${module}.functions.ts`)
    ).text()
    for (const match of source.matchAll(
      /export const (\w+) = createServerFn\(\{ method: "(\w+)" \}\)\.handler\(createClientRpc\("([^"]+)"\)/g,
    ))
      methods.set(match[1], { method: match[2], id: match[3] })
  }
  function browser() {
    const jar = new Map()
    let lastCookies = []
    return {
      jar,
      get lastCookies() {
        return lastCookies
      },
      async call(name, data, origin = base) {
        const fn = methods.get(name)
        assert.ok(fn, `Found ${name}`)
        const init = {
          method: fn.method,
          headers: new Headers({
            Origin: origin,
            'x-tsr-serverFn': 'true',
            'Content-Type': 'application/json',
          }),
        }
        const payload =
          data === undefined
            ? undefined
            : JSON.stringify(await toJSONAsync({ data }))
        let url = `${base}/_serverFn/${fn.id}`
        if (fn.method === 'GET' && payload)
          url += `?payload=${encodeURIComponent(payload)}`
        if (fn.method === 'POST') init.body = payload
        if (payload === undefined) init.headers.delete('Content-Type')
        init.headers.set(
          'Cookie',
          [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
        )
        const r = await fetch(url, init)
        if (r.status === 403) return { error: 'Forbidden' }
        assert.match(
          r.headers.get('cache-control') ?? '',
          /no-store/,
          `${name} HTTP ${r.status}`,
        )
        lastCookies = r.headers.getSetCookie()
        for (const cookie of lastCookies) {
          const pair = cookie.split(';')[0]
          const index = pair.indexOf('=')
          const key = pair.slice(0, index)
          const value = pair.slice(index + 1)
          if (!value) jar.delete(key)
          else jar.set(key, value)
        }
        return fromCrossJSON(await r.json(), {
          refs: new Map(),
          plugins: createDefaultSerovalPlugins(),
        })
      },
    }
  }
  const first = browser(),
    second = browser(),
    anonymous = browser()
  const users = [],
    messages = []
  const adminHeaders = {
    apikey: status.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
  }
  async function signIn(client) {
    const email = `mina-http-${randomUUID()}@example.com`
    const requested = await client.call('requestSignInCode', { email })
    assert.equal(requested.result.error, null)
    const list = await (
      await fetch(`${status.MAILPIT_URL}/api/v1/messages`)
    ).json()
    const message = list.messages.find((m) =>
      m.To.some((r) => r.Address === email),
    )
    assert.ok(message)
    messages.push(message.ID)
    const content = await (
      await fetch(`${status.MAILPIT_URL}/api/v1/message/${message.ID}`)
    ).json()
    const code = (content.Text || content.HTML).match(/\b\d{6}\b/)[0]
    const verified = await client.call('verifySignInCode', { email, code })
    assert.equal(verified.result.error, null)
    assert.ok(client.lastCookies.some((c) => c.includes('mina-auth')))
    assert.ok(
      client.lastCookies.every(
        (c) => /HttpOnly/i.test(c) && /SameSite=Lax/i.test(c),
      ),
    )
    const auth = await client.call('getAuth')
    assert.equal(auth.result.user.email, email)
    users.push(auth.result.user.id)
    const reused = await client.call('verifySignInCode', { email, code })
    assert.ok(reused.result.error)
    return auth.result.user.id
  }
  let articleUrl
  try {
    const state = await anonymous.call('getAuth')
    assert.equal(state.result.configured, true)
    assert.equal(state.result.user, null)
    const html = await (await fetch(base)).text()
    assert.ok(html.includes('Sign in'))
    const articleMatches = [
      ...html.matchAll(/href="(https:\/\/www\.eurogamer\.net\/[^"#]+)"/g),
    ]
    assert.ok(articleMatches.length)
    articleUrl = articleMatches[0][1].replaceAll('&amp;', '&')
    const initial = await anonymous.call('getArticleFeedback', {
      urls: [articleUrl],
    })
    const baseline = initial.result[0]
    assert.ok(baseline)
    const denied = await anonymous.call('setArticleFeedback', {
      url: articleUrl,
      value: 1,
    })
    assert.ok(denied.error)
    const csrf = await anonymous.call(
      'requestSignInCode',
      { email: 'do-not-send@example.com' },
      'https://other.example',
    )
    assert.ok(csrf.error)
    await signIn(first)
    await signIn(second)
    const stored = [...first.jar.entries()]
      .filter(([name]) => name === 'mina-auth' || /^mina-auth\.\d+$/.test(name))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value)
      .join('')
    assert.ok(stored.startsWith('base64-'))
    const expired = JSON.parse(
      Buffer.from(stored.slice(7), 'base64url').toString(),
    )
    expired.expires_at = 1
    const encoded = `base64-${Buffer.from(JSON.stringify(expired)).toString('base64url')}`
    first.jar.clear()
    for (let offset = 0; offset < encoded.length; offset += 3000)
      first.jar.set(
        `mina-auth.${offset / 3000}`,
        encoded.slice(offset, offset + 3000),
      )
    assert.equal((await first.call('getAuth')).result.user.id, users[0])
    assert.ok(
      first.lastCookies.length,
      'Expired cookie sessions should refresh and update HttpOnly cookies',
    )
    const voted = await first.call('setArticleFeedback', {
      url: articleUrl,
      value: 1,
      userId: users[1],
    })
    assert.equal(voted.result.error, null)
    await second.call('setArticleFeedback', { url: articleUrl, value: -1 })
    let totals = (
      await first.call('getArticleFeedback', { urls: [articleUrl] })
    ).result[0]
    assert.equal(totals.helpful, baseline.helpful + 1)
    assert.equal(totals.unhelpful, baseline.unhelpful + 1)
    assert.equal(totals.ownVote, 1)
    assert.equal(
      (await second.call('getArticleFeedback', { urls: [articleUrl] }))
        .result[0].ownVote,
      -1,
    )
    await Promise.all(
      Array.from({ length: 3 }, () =>
        first.call('setArticleFeedback', { url: articleUrl, value: 1 }),
      ),
    )
    assert.equal(
      (await first.call('getArticleFeedback', { urls: [articleUrl] })).result[0]
        .helpful,
      baseline.helpful + 1,
    )
    await first.call('setArticleFeedback', { url: articleUrl, value: -1 })
    await first.call('setArticleFeedback', { url: articleUrl, value: null })
    totals = (await second.call('getArticleFeedback', { urls: [articleUrl] }))
      .result[0]
    assert.equal(totals.unhelpful, baseline.unhelpful + 1)
    assert.equal(totals.ownVote, -1)
    await second.call('setArticleFeedback', { url: articleUrl, value: null })
    const oldCookies = new Map(first.jar)
    assert.equal((await first.call('signOut')).result.error, null)
    assert.equal((await first.call('getAuth')).result.user, null)
    const loggedOut = await first.call('setArticleFeedback', {
      url: articleUrl,
      value: 1,
    })
    assert.ok(loggedOut.error)
    const replay = browser()
    for (const [key, value] of oldCookies) replay.jar.set(key, value)
    const revoked = await replay.call('getAuth')
    assert.equal(
      revoked.result.user,
      null,
      'A revoked session should not authorize a vote',
    )
    console.log(
      'HTTP checks passed: same-origin protection, anonymous rejection, HttpOnly cookies, code reuse, two accounts, spoofed user ID ignored, repeated votes, switching/removal, and sign-out.',
    )
  } finally {
    if (articleUrl)
      for (const client of [first, second])
        try {
          await client.call('setArticleFeedback', {
            url: articleUrl,
            value: null,
          })
        } catch {}
    const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await db.connect()
    try {
      await db.query(
        'delete from article_votes where user_id = any($1::uuid[])',
        [users],
      )
    } finally {
      await db.end()
    }
    for (const id of users) {
      const r = await fetch(`${status.API_URL}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      })
      assert.ok(r.ok)
    }
    if (messages.length)
      await fetch(`${status.MAILPIT_URL}/api/v1/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: messages }),
      })
  }
})
