import {
  Link,
  useNavigate,
  useRouterState,
  useSearch,
} from '@tanstack/react-router'
import { Bookmark, House, Search, Sparkles } from 'lucide-react'

export default function Header() {
  const navigate = useNavigate()
  const { q, view } = useSearch({ strict: false })
  const isHome = useRouterState({
    select: (state) => state.location.pathname === '/',
  })
  return (
    <header className="watchdog-header">
      <a className="watchdog-skip" href="#main-content">
        Skip to content
      </a>
      <div className="watchdog-wrap watchdog-nav">
        <Link to="/" search={{}} className="watchdog-brand">
          <svg
            width="42"
            height="42"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <g
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                fill="#e6b979"
                d="M16 26C5 27 7 8 17 10l9 8m22 8c11 1 9-18-1-16l-9 8"
              />
              <path
                fill="#f9efd9"
                d="M15 26c0-14 34-14 34 0l-2 19c-1 13-29 13-30 0Z"
              />
              <path d="m20 52-4 8m28-8 4 8M28 43q4 6 8 0m-4 2v5m-6 0q6 5 12 0" />
              <path fill="#294f43" d="m12 27 5-9h10l3 9m4 0 3-9h10l5 9" />
              <circle cx="21" cy="32" r="11" fill="#294f43" />
              <circle cx="43" cy="32" r="11" fill="#294f43" />
              <circle cx="21" cy="32" r="7" fill="#f9efd9" />
              <circle cx="43" cy="32" r="7" fill="#f9efd9" />
              <path d="m18 32 3-3m19 3 3-3m-13 1h4" />
            </g>
          </svg>
          <span>games watchdog</span>
        </Link>
        <search className="watchdog-search-region">
          <form
            className="watchdog-search"
            onSubmit={(event) => {
              event.preventDefault()
              const query = String(
                new FormData(event.currentTarget).get('q') ?? '',
              ).trim()
              void navigate({ to: '/', search: { q: query || undefined } })
            }}
          >
            <Search size={19} aria-hidden="true" />
            <label htmlFor="news-search" className="sr-only">
              Search latest stories by game, subject, or outlet
            </label>
            <input
              key={q ?? ''}
              id="news-search"
              name="q"
              type="search"
              maxLength={120}
              defaultValue={q ?? ''}
              placeholder="Search games, stories & outlets"
            />
            <button type="submit">Search</button>
          </form>
        </search>
      </div>
      <nav
        className="watchdog-wrap watchdog-primary"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          search={{ view: undefined }}
          activeOptions={{ exact: true, explicitUndefined: true }}
          aria-current={isHome && !view ? 'page' : undefined}
        >
          <House size={17} aria-hidden="true" /> Home
        </Link>
        <Link
          to="/"
          search={{ view: 'for-you' }}
          activeOptions={{ exact: true }}
          aria-current={isHome && view === 'for-you' ? 'page' : undefined}
        >
          <Sparkles size={17} aria-hidden="true" /> For You{' '}
          <span className="nav-soon">Soon</span>
        </Link>
        <Link
          to="/"
          search={{ view: 'saved' }}
          activeOptions={{ exact: true }}
          aria-current={isHome && view === 'saved' ? 'page' : undefined}
        >
          <Bookmark size={17} aria-hidden="true" /> Saved
        </Link>
      </nav>
    </header>
  )
}
