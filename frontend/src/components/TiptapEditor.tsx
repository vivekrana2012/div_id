import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { LinkPreviewNode } from './LinkPreviewNode'
import { plainTextToTiptapDoc, tiptapDocToPlainText } from '@/lib/tiptapSerializer'
import { type LinkPreviewData } from '@/api/client'
import { EditorPreviewContext } from '@/context/EditorPreviewContext'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  textareaClassName?: string
  previews: Record<string, LinkPreviewData>
  loadingUrls: Set<string>
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = 'Start typing…',
  className = '',
  textareaClassName = '',
  previews,
  loadingUrls,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {},
      }),
      Placeholder.configure({
        placeholder,
      }),
      LinkPreviewNode,
    ],
    content: plainTextToTiptapDoc(value),
      onUpdate: ({ editor }) => {
      // Skip onChange if this is just a pattern conversion meta

      // Try to convert any !link patterns
      const { doc: stateDoc, tr } = editor.state
      let modified = false

      stateDoc.forEach((node: any, offset: number) => {
        if (node.type.name === 'paragraph' && !modified) {
          // Extract text from paragraph
          let text = ''
          node.forEach((child: any) => {
            if (child.type.name === 'text') {
              text += child.text
            }
          })

          // Check if this paragraph is a link line
          const linkMatch = text.trim().match(/^!link\s+(\S+)$/)
          if (linkMatch) {
            const url = linkMatch[1]
            // Replace this paragraph with a linkPreview node
            const linkPreviewNode = editor.schema.nodes.linkPreview.create({ url })
            tr.replaceWith(offset, offset + node.nodeSize, linkPreviewNode)
            tr.setMeta('convertLink', true)
            modified = true
          }
        }
      })

      if (modified) {
        // Defer dispatch to avoid re-entrant call (flushSync error in React 18)
        setTimeout(() => {
          editor.view.dispatch(tr)
          setTimeout(() => {
            const doc = editor.getJSON()
            const plainText = tiptapDocToPlainText(doc)
            onChange(plainText)
          }, 0)
        }, 0)
      } else {
        // Normal update - serialize and call onChange
        const doc = editor.getJSON()
        const plainText = tiptapDocToPlainText(doc)
        onChange(plainText)
      }
    },
  })

  // No-op: previews and loadingUrls are provided via EditorPreviewContext below

  // When external value changes (e.g., on load), update editor content
  useEffect(() => {
    if (editor && value !== tiptapDocToPlainText(editor.getJSON())) {
      editor.commands.setContent(plainTextToTiptapDoc(value))
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div
      className={`${className} tiptap-wrapper`}
      onClick={(e) => {
        // Focus editor when clicking empty space in the wrapper
        if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('.ProseMirror')) {
          editor.commands.focus('end')
        }
      }}
    >
      <EditorPreviewContext.Provider value={{ previews, loadingUrls }}>
        <EditorContent
          editor={editor}
          className={`tiptap ${textareaClassName} bg-transparent outline-none`}
        />
      </EditorPreviewContext.Provider>
    </div>
  )
}
