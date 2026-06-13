interface LinkPreviewProps {
  url: string
  title?: string
  description?: string
  imageUrl?: string
  siteName?: string
  loading?: boolean
}

export default function LinkPreview({ url, title, description, imageUrl, siteName, loading }: LinkPreviewProps) {
  if (loading) {
    return (
      <div className="my-3 border border-(--color-border) rounded-lg overflow-hidden animate-pulse">
        <div className="flex gap-4 p-4">
          <div className="w-24 h-24 flex-shrink-0 bg-(--color-border) rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-(--color-border) rounded w-3/4" />
            <div className="h-3 bg-(--color-border) rounded w-full" />
            <div className="h-3 bg-(--color-border) rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  const displayDomain = siteName || (() => {
    try { return new URL(url).hostname } catch { return url }
  })()

  const hasImage = imageUrl && imageUrl.trim().length > 0
  const hasTitle = title && title.trim().length > 0

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-3 block border border-transparent rounded-lg overflow-hidden hover:border-(--color-accent) transition-colors no-underline"
    >
      <div className="flex items-center gap-0">
        {hasImage && (
          <div className="w-32 h-28 flex-shrink-0 bg-(--color-border)">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <p className="font-ui text-xs text-(--color-muted) uppercase tracking-wider mb-1 truncate">
            {displayDomain}
          </p>
          <p className="font-body font-semibold text-sm text-(--color-ink) truncate mb-1">
            {hasTitle ? title : url}
          </p>
          {description && (
            <p className="font-body text-xs text-(--color-muted) line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}
