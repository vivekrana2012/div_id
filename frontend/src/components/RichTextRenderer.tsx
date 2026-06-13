import { useEffect, useState, useRef } from 'react'
import { parseLinkSyntax, extractLinkUrls } from '@/lib/linkParser'
import { fetchLinkPreviews, type LinkPreviewData } from '@/api/client'
import LinkPreview from './LinkPreview'

interface RichTextRendererProps {
  text: string
  className?: string
}

export default function RichTextRenderer({ text, className = '' }: RichTextRendererProps) {
  const [previews, setPreviews] = useState<Record<string, LinkPreviewData>>({})
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set())
  const fetchedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const urls = extractLinkUrls(text)
    const newUrls = urls.filter(u => !fetchedRef.current.has(u))

    if (newUrls.length === 0) return

    setLoadingUrls(prev => new Set([...prev, ...newUrls]))
    newUrls.forEach(u => fetchedRef.current.add(u))

    fetchLinkPreviews(newUrls)
      .then(results => {
        const map: Record<string, LinkPreviewData> = {}
        results.forEach(r => { map[r.url] = r })
        setPreviews(prev => ({ ...prev, ...map }))
      })
      .catch(() => {
        // On failure, just clear loading — previews won't show
      })
      .finally(() => {
        setLoadingUrls(prev => {
          const next = new Set(prev)
          newUrls.forEach(u => next.delete(u))
          return next
        })
      })
  }, [text])

  const segments = parseLinkSyntax(text)

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {seg.content}
            </span>
          )
        }

        const preview = previews[seg.url]
        const isLoading = loadingUrls.has(seg.url)

        return (
          <LinkPreview
            key={`${seg.url}-${i}`}
            url={seg.url}
            title={preview?.title}
            description={preview?.description}
            imageUrl={preview?.imageUrl}
            siteName={preview?.siteName}
            loading={isLoading}
          />
        )
      })}
    </div>
  )
}
