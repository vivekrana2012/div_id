import type { JSONContent } from '@tiptap/core'

/**
 * Converts plain text with `!link <url>` syntax to TipTap document JSON
 * Example: "Check this\n!link https://example.com\nMore text"
 * Returns: { type: 'doc', content: [{ type: 'paragraph', content: [...] }, { type: 'linkPreview', attrs: { url: '...' } }, ...] }
 */
export function plainTextToTiptapDoc(text: string): JSONContent {
  const lines = text.split('\n')
  const content: JSONContent[] = []
  let currentParagraphLines: string[] = []

  for (const line of lines) {
    const linkMatch = line.match(/^!link\s+(\S+)$/)

    if (linkMatch) {
      // This line is a link
      // First, flush any accumulated paragraph lines
      if (currentParagraphLines.length > 0) {
        const paragraphText = currentParagraphLines.join('\n')
        // Only create paragraph if it has non-empty content
        if (paragraphText.trim()) {
          content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: paragraphText }],
          })
        }
        currentParagraphLines = []
      }

      // Add the link preview node
      content.push({
        type: 'linkPreview',
        attrs: { url: linkMatch[1] },
      })
    } else {
      // Regular text line
      currentParagraphLines.push(line)
    }
  }

  // Flush remaining paragraph lines
  if (currentParagraphLines.length > 0) {
    const paragraphText = currentParagraphLines.join('\n')
    // Only create paragraph if it has non-empty content
    if (paragraphText.trim()) {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: paragraphText }],
      })
    }
  }

  // Ensure at least one paragraph exists (even if empty)
  if (content.length === 0) {
    content.push({
      type: 'paragraph',
    })
  }

  return {
    type: 'doc',
    content,
  }
}

/**
 * Converts TipTap document JSON back to plain text with `!link <url>` syntax
 * Paragraph content is rendered as text, linkPreview nodes become `!link <url>` lines
 */
export function tiptapDocToPlainText(doc: JSONContent): string {
  if (!doc.content || doc.content.length === 0) {
    return ''
  }

  const lines: string[] = []

  for (const node of doc.content) {
    if (node.type === 'paragraph') {
      // Extract text from paragraph's content
      if (node.content && node.content.length > 0) {
        let paragraphText = ''
        for (const textNode of node.content) {
          if (textNode.type === 'text') {
            paragraphText += textNode.text || ''
          }
          // Skip other inline marks/nodes
        }
        lines.push(paragraphText)
      } else {
        // Empty paragraph
        lines.push('')
      }
    } else if (node.type === 'linkPreview') {
      // Link preview node becomes !link line
      if (node.attrs?.url) {
        lines.push(`!link ${node.attrs.url}`)
      }
    }
  }

  return lines.join('\n')
}
