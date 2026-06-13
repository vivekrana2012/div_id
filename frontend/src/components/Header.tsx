import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b-2 border-(--color-ink) bg-(--color-bg)">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display font-black text-lg tracking-widest uppercase text-(--color-ink)">
          &lt;div id&gt;
        </Link>
        <nav className="flex items-center gap-8">
          {user ? (
            <>
              <Link
                to="/"
                className="font-ui text-sm uppercase tracking-widest text-(--color-ink) hover:text-(--color-accent) transition-colors"
              >
                Drafts
              </Link>
              <Link
                to="/articles"
                className="font-ui text-sm uppercase tracking-widest text-(--color-ink) hover:text-(--color-accent) transition-colors"
              >
                Articles
              </Link>
              <Link
                to="/editor"
                className="font-ui text-sm uppercase tracking-widest text-(--color-ink) hover:text-(--color-accent) transition-colors"
              >
                New Post
              </Link>
              <button
                onClick={logout}
                className="cursor-pointer font-ui text-sm uppercase tracking-widest text-(--color-muted) hover:text-(--color-ink) transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="font-ui text-sm uppercase tracking-widest text-(--color-ink) hover:text-(--color-accent) transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
