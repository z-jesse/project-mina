import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="watchdog-header">
      <a className="watchdog-skip" href="#main-content">
        Skip to content
      </a>
      <nav className="watchdog-wrap watchdog-nav" aria-label="Main navigation">
        <Link to="/" className="watchdog-brand">
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
      </nav>
    </header>
  )
}
