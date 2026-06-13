import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, email, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Username', value: username, setter: setUsername, type: 'text' },
    { label: 'Email', value: email, setter: setEmail, type: 'email' },
    { label: 'Password', value: password, setter: setPassword, type: 'password' },
  ] as const

  return (
    <div className="min-h-screen bg-(--color-bg) flex flex-col">
      <div className="max-w-md mx-auto w-full px-6 pt-24">
        <h1 className="font-display font-black text-6xl uppercase tracking-tight text-(--color-ink) mb-12">
          Register
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {fields.map(({ label, value, setter, type }) => (
            <div key={label}>
              <label className="font-ui text-xs uppercase tracking-widest text-(--color-muted) block mb-2">
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={e => setter(e.target.value)}
                required
                className="w-full border-b-2 border-(--color-ink) bg-transparent py-3 font-body text-lg outline-none focus:border-(--color-accent) transition-colors"
              />
            </div>
          ))}
          {error && (
            <p className="font-ui text-sm text-(--color-accent)">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-(--color-accent) text-white font-ui font-bold uppercase tracking-widest py-4 px-8 hover:bg-(--color-ink) transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account\u2026' : 'Create Account \u2192'}
          </button>
        </form>
        <p className="mt-8 font-ui text-sm text-(--color-muted)">
          Already have an account?{' '}
          <Link to="/login" className="text-(--color-ink) underline hover:text-(--color-accent)">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
