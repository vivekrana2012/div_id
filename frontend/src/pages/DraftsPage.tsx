import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import Header from '@/components/Header'
import type { AxiosResponse } from 'axios'

interface Post {
  id: string
  title: string
  body: string
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
}

function excerpt(text: string, len = 120) {
  return text.length > len ? text.slice(0, len).trimEnd() + '\u2026' : text
}

export default function DraftsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/articles/mine')
      .then((res: AxiosResponse<{ content?: Post[] } | Post[]>) => {
        const data = res.data
        const all = Array.isArray(data) ? data : (data.content ?? [])
        setPosts(all.filter(p => p.status === 'draft'))
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <Header />
      <main className="max-w-5xl mx-auto px-6">
        <div className="pt-10 pb-6 border-b-2 border-(--color-ink)">
          <h1
            className="font-display font-black leading-none tracking-tight text-(--color-ink)"
            style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}
          >
            DRAFTS
          </h1>
        </div>

        {loading ? (
          <div className="py-20 text-center font-ui text-(--color-muted) uppercase tracking-widest text-sm">
            Loading…
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center font-ui text-(--color-muted) uppercase tracking-widest text-sm">
            No drafts yet.
          </div>
        ) : (
          <ul className="divide-y divide-(--color-border)">
            {posts.map(post => (
              <li key={post.id} className="py-10">
                <Link to={`/editor/${post.id}`} className="group block">
                  <h2 className="font-display font-black text-3xl md:text-4xl leading-tight text-(--color-ink) group-hover:text-(--color-accent) transition-colors mb-3">
                    {post.title || <span className="italic text-(--color-muted)">Untitled</span>}
                  </h2>
                  <p className="font-body text-lg text-(--color-ink) opacity-70 leading-relaxed mb-4">
                    {excerpt(post.body || post.notes || '')}
                  </p>
                  <div className="flex items-center gap-4 font-ui text-xs uppercase tracking-widest text-(--color-muted)">
                    <span>
                      {new Date(post.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
