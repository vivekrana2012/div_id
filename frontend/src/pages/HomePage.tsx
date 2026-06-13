import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import Header from '@/components/Header'
import type { AxiosResponse } from 'axios'

interface Post {
  id: string
  title: string
  body: string
  status: string
  createdAt: string
  author: { username: string; displayName?: string }
}

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function excerpt(text: string, len = 200) {
  return text.length > len ? text.slice(0, len).trimEnd() + '\u2026' : text
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/posts')
      .then((res: AxiosResponse<{ content?: Post[] } | Post[]>) => {
        const data = res.data
        setPosts(Array.isArray(data) ? data : (data.content ?? []))
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
            ARTICLES

          </h1>
        </div>

        {loading ? (
          <div className="py-20 text-center font-ui text-(--color-muted) uppercase tracking-widest text-sm">
            Loading\u2026
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center font-ui text-(--color-muted) uppercase tracking-widest text-sm">
            No articles yet.
          </div>
        ) : (
          <ul className="divide-y divide-(--color-border)">
            {posts.map(post => (
              <li key={post.id} className="py-10">
                <Link to={`/posts/${post.id}`} className="group block">
                  <h2 className="font-display font-black text-3xl md:text-4xl leading-tight text-(--color-ink) group-hover:text-(--color-accent) transition-colors mb-3">
                    {post.title}
                  </h2>
                  <p className="font-body text-lg text-(--color-ink) opacity-70 leading-relaxed mb-4">
                    {excerpt(post.body)}
                  </p>
                  <div className="flex items-center gap-4 font-ui text-xs uppercase tracking-widest text-(--color-muted)">
                    <span>{post.author.displayName || post.author.username}</span>
                    <span>&middot;</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                    <span>&middot;</span>
                    <span>{readingTime(post.body)} min read</span>
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
