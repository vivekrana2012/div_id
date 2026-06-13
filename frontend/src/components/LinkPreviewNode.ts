import { Node as TiptapNode, ReactNodeViewRenderer } from '@tiptap/react'
import { LinkPreviewNodeView } from './LinkPreviewNodeView'

export interface LinkPreviewNodeAttrs {
  url: string
}

export const LinkPreviewNode = TiptapNode.create({
  name: 'linkPreview',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true, // This makes it non-editable (atomic)

  addAttributes() {
    return {
      url: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-url'),
        renderHTML: (attributes) => ({
          'data-url': attributes.url,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="link-preview"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'link-preview' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewNodeView)
  },

  addCommands() {
    return {
      insertLinkPreview:
        (url: string) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { url },
          })
        },
    } as any
  },
})
