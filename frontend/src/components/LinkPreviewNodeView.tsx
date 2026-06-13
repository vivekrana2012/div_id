import { NodeViewWrapper } from '@tiptap/react'
import { useEditorPreviewContext } from '@/context/EditorPreviewContext'
import LinkPreview from './LinkPreview'

export interface LinkPreviewNodeViewProps {
  node: any
  updateAttributes: (attrs: any) => void
  deleteNode: () => void
  selected: boolean
  extension?: any // TipTap extension with storage
}

export function LinkPreviewNodeView({
  node,
  deleteNode,
  selected,
}: any) {
  const url = node.attrs.url

  const { previews, loadingUrls } = useEditorPreviewContext()
  const preview = previews[url]
  const isLoading = loadingUrls.has(url)

  return (
    <NodeViewWrapper
      as="div"
      className={`relative group my-3 ${selected ? 'ring-2 ring-(--color-accent)' : ''}`}
    >
      <button
        onClick={deleteNode}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity
                   w-6 h-6 flex items-center justify-center rounded-full
                   bg-(--color-bg) border border-(--color-border) text-(--color-muted)
                   hover:text-(--color-accent) hover:border-(--color-accent) cursor-pointer"
        title="Remove link"
      >
        ✕
      </button>

      <LinkPreview
        url={url}
        title={preview?.title}
        description={preview?.description}
        imageUrl={preview?.imageUrl}
        siteName={preview?.siteName}
        loading={isLoading}
      />
    </NodeViewWrapper>
  )
}
