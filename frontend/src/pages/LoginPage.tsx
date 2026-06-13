import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-(--color-bg) flex flex-col">
      <div className="max-w-md mx-auto w-full px-6 pt-24">
        <h1 className="font-display font-black text-6xl uppercase tracking-tight text-(--color-ink) mb-12">
          Sign<br />In
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="font-ui text-xs uppercase tracking-widest text-(--color-muted) block mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full border-b-2 border-(--color-ink) bg-transparent py-3 font-body text-lg outline-none focus:border-(--color-accent) transition-colors"
            />
          </div>
          <div>
            <label className="font-ui text-xs uppercase tracking-widest text-(--color-muted) block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border-b-2 border-(--color-ink) bg-transparent py-3 font-body text-lg outline-none focus:border-(--color-accent) transition-colors"
            />
          </div>
          {error && (
            <p className="font-ui text-sm text-(--color-accent)">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-(--color-accent) text-white font-ui font-bold uppercase tracking-widest py-4 px-8 hover:bg-(--color-ink) transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in\u2026' : 'Sign In \u2192'}
          </button>
        </form>
        <p className="mt-8 font-ui text-sm text-(--color-muted)">
          No account?{' '}
          <Link to="/register" className="text-(--color-ink) underline hover:text-(--color-accent)">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
