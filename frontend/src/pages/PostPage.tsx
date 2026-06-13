import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import Header from '@/components/Header'
import RichTextRenderer from '@/components/RichTextRenderer'
import { useAuth } from '@/context/AuthContext'
import type { AxiosError, AxiosResponse } from 'axios'

interface Post {
  id: string
  title: string
  body: string
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
  author: { id: string; username: string; displayName?: string }
}

function readingTime(text: string) {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get(`/articles/${id}`)
      .then((res: AxiosResponse<Post>) => setPost(res.data))
      .catch((err: AxiosError) => {
        if (err.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!post || !confirm('Delete this article?')) return
    await api.delete(`/articles/${post.id}`)
    navigate('/')
  }

  if (loading) {
    return <div className="min-h-screen bg-(--color-bg)"><Header /></div>
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-(--color-bg)">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="font-display font-black text-6xl text-(--color-ink) mb-4">404</h1>
          <p className="font-ui text-(--color-muted) mb-8">Article not found.</p>
          <Link to="/" className="font-ui text-sm uppercase tracking-widest text-(--color-accent) underline">
            &larr; Back
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === post.author.id

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <Header />
      <article className="max-w-2xl mx-auto px-6 pt-14 pb-24">
        <div className="mb-6 flex items-center gap-4 font-ui text-xs uppercase tracking-widest text-(--color-muted) flex-wrap">
          <Link to="/articles" className="hover:text-(--color-accent) transition-colors">
            &larr; Articles
          </Link>
          <span>&middot;</span>
          <span>{readingTime(post.body)} min read</span>
          <span>&middot;</span>
          <span>
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
          {isOwner && (
            <>
              <span>&middot;</span>
              <Link to={`/editor/${post.id}`} className="hover:text-(--color-accent) transition-colors">
                Edit
              </Link>
              <span>&middot;</span>
              <button onClick={handleDelete} className="cursor-pointer hover:text-(--color-accent) transition-colors">
                DELETE
              </button>
            </>
          )}
        </div>

        <h1
          className="font-display font-black leading-tight text-(--color-ink) mb-10"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          {post.title}
        </h1>

        <p className="font-ui text-sm text-(--color-muted) mb-10 uppercase tracking-widest">
          By {post.author.displayName || post.author.username}
        </p>

        <RichTextRenderer
          text={post.body}
          className="font-body text-xl leading-8 text-(--color-ink)"
        />

        {isOwner && post.notes && (
          <aside className="mt-12 pt-8 border-t border-(--color-border)">
            <h2 className="font-ui text-xs uppercase tracking-widest text-(--color-muted) mb-4">
              Scratch Pad
            </h2>
            <RichTextRenderer
              text={post.notes}
              className="font-body text-base leading-7 text-(--color-muted)"
            />
          </aside>
        )}
      </article>
    </div>
  )
}
