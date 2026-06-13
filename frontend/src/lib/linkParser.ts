export interface LinkSegment {
  type: 'text'
  content: string
}

export interface LinkRefSegment {
  type: 'link'
  url: string
}

export type Segment = LinkSegment | LinkRefSegment

const LINK_PATTERN = /^!link\s+(\S+)$/gm

/**
 * Parses text containing `!link <url>` lines into segments.
 * Lines matching the pattern become link segments; everything else is text.
 */
export function parseLinkSyntax(text: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0

  LINK_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    segments.push({ type: 'link', url: match[1] })
    lastIndex = match.index + match[0].length
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}

/**
 * Extracts all URLs from `!link <url>` lines in the text.
 */
export function extractLinkUrls(text: string): string[] {
  LINK_PATTERN.lastIndex = 0
  const urls: string[] = []
  let match: RegExpExecArray | null

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    urls.push(match[1])
  }

  return [...new Set(urls)]
}
