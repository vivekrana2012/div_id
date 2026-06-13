import { createContext, useContext } from 'react'
import type { LinkPreviewData } from '@/api/client'

export interface EditorPreviewContextType {
  previews: Record<string, LinkPreviewData>
  loadingUrls: Set<string>
}

export const EditorPreviewContext = createContext<EditorPreviewContextType | null>(null)

export function useEditorPreviewContext() {
  const context = useContext(EditorPreviewContext)
  if (!context) {
    return {
      previews: {},
      loadingUrls: new Set(),
    }
  }
  return context
}
