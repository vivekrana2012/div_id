import { useState, useEffect, useRef, useCallback } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { fetchLinkPreviews, type LinkPreviewData } from '@/api/client'
import { extractLinkUrls } from '@/lib/linkParser'
import TiptapEditor from '@/components/TiptapEditor'
import type { AxiosResponse } from 'axios'

interface PostDetail {
  id: string
  title: string
  body: string
  notes: string
  status: string
}

export default function EditorPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSaveError, setAutoSaveError] = useState('')
  
  // Auto-save state
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [lastSavedText, setLastSavedText] = useState('now')
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const postStatusRef = useRef<'draft' | 'published'>('draft')

  // Link preview state
  const [bodyPreviews, setBodyPreviews] = useState<Record<string, LinkPreviewData>>({})
  const [notesPreviews, setNotesPreviews] = useState<Record<string, LinkPreviewData>>({})
  const [bodyLoadingUrls, setBodyLoadingUrls] = useState<Set<string>>(new Set())
  const [notesLoadingUrls, setNotesLoadingUrls] = useState<Set<string>>(new Set())
  const bodyFetchedRef = useRef<Set<string>>(new Set())
  const notesFetchedRef = useRef<Set<string>>(new Set())
  const bodyPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notesPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load post if editing
  useEffect(() => {
    if (!id) {
      postStatusRef.current = 'draft'
      return
    }
    api.get(`/articles/${id}`)
      .then((res: AxiosResponse<PostDetail>) => {
        setTitle(res.data.title)
        setBody(res.data.body)
        setNotes(res.data.notes || '')
        postStatusRef.current = res.data.status as 'draft' | 'published'
        setLastSavedAt(new Date())

        // Fetch link previews for existing content
        const bodyUrls = extractLinkUrls(res.data.body)
        const notesUrls = extractLinkUrls(res.data.notes || '')
        if (bodyUrls.length > 0) {
          bodyUrls.forEach(u => bodyFetchedRef.current.add(u))
          setBodyLoadingUrls(new Set(bodyUrls))
          fetchLinkPreviews(bodyUrls)
            .then(results => {
              const map: Record<string, LinkPreviewData> = {}
              results.forEach(r => { map[r.url] = r })
              setBodyPreviews(prev => ({ ...prev, ...map }))
            })
            .finally(() => setBodyLoadingUrls(new Set()))
        }
        if (notesUrls.length > 0) {
          notesUrls.forEach(u => notesFetchedRef.current.add(u))
          setNotesLoadingUrls(new Set(notesUrls))
          fetchLinkPreviews(notesUrls)
            .then(results => {
              const map: Record<string, LinkPreviewData> = {}
              results.forEach(r => { map[r.url] = r })
              setNotesPreviews(prev => ({ ...prev, ...map }))
            })
            .finally(() => setNotesLoadingUrls(new Set()))
        }
      })
      .catch(() => navigate('/'))
  }, [id, navigate])

  // Update "last saved" text every minute
  useEffect(() => {
    const updateText = () => {
      if (lastSavedAt) {
        const diffMs = Date.now() - lastSavedAt.getTime()
        if (diffMs < 60000) {
          setLastSavedText('now')
        } else if (diffMs < 3600000) {
          const mins = Math.floor(diffMs / 60000)
          setLastSavedText(`${mins} min${mins > 1 ? 's' : ''} ago`)
        } else {
          const hours = Math.floor(diffMs / 3600000)
          setLastSavedText(`${hours} hour${hours > 1 ? 's' : ''} ago`)
        }
      }
    }
    updateText()
    updateTimerRef.current = setInterval(updateText, 60000)
    return () => {
      if (updateTimerRef.current) clearInterval(updateTimerRef.current)
    }
  }, [lastSavedAt])

  // Auto-save: only save drafts, debounced 30 seconds
  const autoSave = useCallback(
    async (currentTitle: string, currentBody: string, currentNotes: string) => {
      // Only auto-save drafts, and only if there's something to save
      if (!currentTitle.trim() && !currentBody.trim() && !currentNotes.trim()) {
        return
      }

      try {
        setAutoSaveError('')
        if (isEdit) {
          await api.put(`/articles/${id}`, {
            title: currentTitle,
            body: currentBody,
            notes: currentNotes,
            status: 'draft', // Always auto-save as draft
          })
        } else {
          const res = await api.post('/articles', {
            title: currentTitle,
            body: currentBody,
            notes: currentNotes,
            status: 'draft',
          })
          // Update URL to include the post ID
          navigate(`/editor/${res.data.id}`, { replace: true })
        }
        setLastSavedAt(new Date())
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        setAutoSaveError(msg ? `Auto-save failed: ${msg}` : 'Auto-save failed')
        // User can retry manually
      }
    },
    [id, isEdit, navigate]
  )

  // Track changes and debounce auto-save
  const handleTitleChange = (value: string) => {
    setTitle(value)
    setAutoSaveError('')

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(value, body, notes)
    }, 30000) // 30 second debounce
  }

  const handleBodyChange = (value: string) => {
    setBody(value)
    setAutoSaveError('')

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(title, value, notes)
    }, 30000)

    // Debounce link preview fetching
    if (bodyPreviewTimeoutRef.current) clearTimeout(bodyPreviewTimeoutRef.current)
    bodyPreviewTimeoutRef.current = setTimeout(() => {
      const urls = extractLinkUrls(value)
      const newUrls = urls.filter(u => !bodyFetchedRef.current.has(u))
      if (newUrls.length === 0) return
      setBodyLoadingUrls(prev => new Set([...prev, ...newUrls]))
      newUrls.forEach(u => bodyFetchedRef.current.add(u))
      fetchLinkPreviews(newUrls)
        .then(results => {
          const map: Record<string, LinkPreviewData> = {}
          results.forEach(r => { map[r.url] = r })
          setBodyPreviews(prev => ({ ...prev, ...map }))
        })
        .finally(() => setBodyLoadingUrls(prev => {
          const next = new Set(prev)
          newUrls.forEach(u => next.delete(u))
          return next
        }))
    }, 500)
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setAutoSaveError('')

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(title, body, value)
    }, 30000)

    // Debounce link preview fetching
    if (notesPreviewTimeoutRef.current) clearTimeout(notesPreviewTimeoutRef.current)
    notesPreviewTimeoutRef.current = setTimeout(() => {
      const urls = extractLinkUrls(value)
      const newUrls = urls.filter(u => !notesFetchedRef.current.has(u))
      if (newUrls.length === 0) return
      setNotesLoadingUrls(prev => new Set([...prev, ...newUrls]))
      newUrls.forEach(u => notesFetchedRef.current.add(u))
      fetchLinkPreviews(newUrls)
        .then(results => {
          const map: Record<string, LinkPreviewData> = {}
          results.forEach(r => { map[r.url] = r })
          setNotesPreviews(prev => ({ ...prev, ...map }))
        })
        .finally(() => setNotesLoadingUrls(prev => {
          const next = new Set(prev)
          newUrls.forEach(u => next.delete(u))
          return next
        }))
    }, 500)
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
      if (updateTimerRef.current) clearInterval(updateTimerRef.current)
      if (bodyPreviewTimeoutRef.current) clearTimeout(bodyPreviewTimeoutRef.current)
      if (notesPreviewTimeoutRef.current) clearTimeout(notesPreviewTimeoutRef.current)
    }
  }, [])

  const save = async (e: FormEvent, publishStatus: 'draft' | 'published') => {
    e.preventDefault()
    if (publishStatus === 'published' && (!title.trim() || !body.trim())) {
      setError('Title and body are required to publish.')
      return
    }
    if (!title.trim() && !body.trim() && !notes.trim()) {
      setError('Nothing to save.')
      return
    }
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/articles/${id}`, { title, body, notes, status: publishStatus })
        navigate(`/articles/${id}`)
      } else {
        const res = await api.post('/articles', { title, body, notes, status: publishStatus })
        navigate(`/articles/${res.data.id}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-(--color-bg) flex flex-col">
      <main className="mx-auto px-12 lg:px-24 pt-24 pb-24 flex-1 flex flex-col w-full">
        <div className="flex flex-col-reverse lg:flex-row gap-8 flex-1">
          {/* Main editor */}
          <form className="flex flex-col gap-6 flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              required
              placeholder="Title…"
              className="w-full border-b-2 border-(--color-ink) bg-transparent py-3 font-display font-bold text-2xl outline-none focus:border-(--color-accent) transition-colors placeholder:text-(--color-border)"
            />

            <TiptapEditor
              value={body}
              onChange={handleBodyChange}
              placeholder="Write your article…"
              className="w-full flex-1 min-h-[28rem]"
              textareaClassName="font-body font-medium text-lg leading-8 placeholder:text-(--color-border)"
              previews={bodyPreviews}
              loadingUrls={bodyLoadingUrls}
            />

            {error && <p className="font-ui text-sm text-(--color-accent)">{error}</p>}
            {autoSaveError && <p className="font-ui text-xs text-(--color-muted)">{autoSaveError}</p>}

            <div className="flex gap-6 items-center">
              <button
                type="button"
                disabled={saving}
                onClick={e => save(e, 'draft')}
                className="cursor-pointer font-ui text-xs uppercase tracking-widest text-(--color-muted) hover:text-(--color-ink) transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save draft'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={e => save(e, 'published')}
                className="cursor-pointer font-ui text-xs uppercase tracking-widest text-(--color-accent) hover:text-(--color-ink) transition-colors disabled:opacity-40"
              >
                {saving ? 'Publishing…' : 'Publish →'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="cursor-pointer font-ui text-xs uppercase tracking-widest text-(--color-muted) hover:text-(--color-ink) transition-colors ml-auto"
              >
                ✕ Close
              </button>
              {lastSavedAt && (
                <span className="font-ui text-xs text-(--color-muted) ml-2">
                  Last saved: {lastSavedText}
                </span>
              )}
            </div>
          </form>

          {/* Scratchpad */}
          <aside className="w-full lg:w-[28rem] flex-shrink-0 flex flex-col gap-2">
            <label className="font-ui text-xs uppercase tracking-widest text-(--color-muted)">
              Scratch Pad
            </label>
            <TiptapEditor
              value={notes}
              onChange={handleNotesChange}
              placeholder="Jot down ideas, links, references…"
              className="w-full h-full min-h-[200px] lg:min-h-[500px] bg-(--color-bg) border-2 border-transparent rounded-md p-4 focus-within:border-(--color-accent) transition-colors"
              textareaClassName="font-body text-sm leading-6 placeholder:text-(--color-border)"
              previews={notesPreviews}
              loadingUrls={notesLoadingUrls}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
