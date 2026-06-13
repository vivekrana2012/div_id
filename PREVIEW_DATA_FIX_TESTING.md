# Preview Data Flow Fix - Testing Guide

## Overview
Fixed link preview metadata (thumbnail, title, description) not displaying in LinkPreviewNodeView by implementing reactive editor storage synchronization and using TipTap's `useCurrentEditor` hook for data access.

## Architecture

### Data Flow Before Fix (❌ Broken)
```
EditorPage state (bodyPreviews) 
  ↓ (passed as prop)
TiptapEditor 
  ↓ (stored in editor.storage)
Editor.storage.context 
  ↓ (extension?.storage?.context - not reactive)
LinkPreviewNodeView (no updates when state changes)
```

### Data Flow After Fix (✅ Working)
```
EditorPage state (bodyPreviews)
  ↓ (passed as prop via context memo)
TiptapEditor (context = useMemo)
  ↓ (useEffect watches context)
Editor.storage.previews & editor.storage.loadingUrls
  ↓ (useCurrentEditor hook - reactive within React context)
LinkPreviewNodeView (updates when editor.storage changes)
  ↓
LinkPreview component displays: thumbnail, title, description
```

## Key Components Modified

### 1. TiptapEditor.tsx
**Purpose**: Main editor component, synchronizes preview data to editor storage

**Key Changes**:
- Storage update useEffect watches `[editor, context]` dependencies
- Updates three storage properties:
  - `editor.storage.context` (for extension backward compat)
  - `editor.storage.previews` (flat access for node views)
  - `editor.storage.loadingUrls` (flat access for loading state)
- Console logs storage updates for debugging

**Signature**:
```typescript
interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  textareaClassName?: string
  previews: Record<string, LinkPreviewData>
  loadingUrls: Set<string>
}
```

### 2. LinkPreviewNodeView.tsx
**Purpose**: React component rendering inside TipTap link preview node

**Key Changes**:
- Uses `useCurrentEditor()` hook from @tiptap/react instead of editor prop
- Casts editor.storage as `any` to access custom properties
- Console logs preview access attempts
- Displays LinkPreview component with: url, title, description, imageUrl, siteName, loading

**Props Received** (via TipTap's ReactNodeViewRenderer):
```typescript
{
  node: any                    // Node with attrs.url
  deleteNode: () => void       // Delete this node
  selected: boolean            // Is node selected
}
```

## Testing Checklist

### 1. Browser Console (Developer Tools)
Open DevTools → Console tab and look for logs when editing:

**Expected Logs**:
```
[TiptapEditor] Updated storage with previews: {previewCount: 1, loadingUrls: []}
[LinkPreviewNodeView] {url: "https://example.com", preview: {...}, isLoading: false, hasEditor: true, storageKeys: [...]}
```

**What They Mean**:
- `previewCount: 1` → One URL's preview data is stored
- `isLoading: false` → Preview metadata was fetched (not loading)
- `hasEditor: true` → useCurrentEditor() successfully retrieved editor
- `storageKeys` → Editor storage properties available

### 2. UI Testing - Full Flow

**Step 1: Start Application**
```bash
docker compose up -d --build
```

**Step 2: Create New Post**
- Navigate to Editor page (create new post)
- Type title: "Test Post"
- In body editor, type: `!link https://www.youtube.com/watch?v=dQw4w9WgXcQ`

**Step 3: Observe Preview**
- Preview node should appear after line ends
- Loading spinner → Fetching metadata
- After 1-2 seconds: Thumbnail, title, description, site name should display
- Delete button (✕) should appear on hover

**Step 4: Verify Full Metadata Display**
Check that preview card shows:
- [ ] YouTube thumbnail (red play icon)
- [ ] Title: "Rick Astley - Never Gonna Give You Up (Official Video)"
- [ ] Description: First 160 chars of video description
- [ ] Site name: "YouTube"

### 3. Console Logs - Detailed Inspection

**When adding URL**:
```javascript
// In console, after typing !link and waiting for preview:
editor.storage.previews
// Should show: {
//   "https://www.youtube.com/watch?v=dQw4w9WgXcQ": {
//     url: "...",
//     title: "...",
//     description: "...",
//     imageUrl: "...",
//     siteName: "YouTube"
//   }
// }
```

**If previews empty**:
```javascript
editor.storage.loadingUrls
// Should show empty Set if loading complete, or Set { "url" } if still fetching
```

### 4. Network Testing (Network Tab)

**Expected Requests**:
1. User types `!link https://youtube.com`
2. EditorPage.handleBodyChange fires
3. extractLinkUrls() identifies URL
4. fetchLinkPreviews() called
5. Network request: `POST /api/link-preview/batch`
6. Response: `{ "urls": ["https://youtube.com"], ...linkPreviewData }`

**Debug Network Failure**:
- Check backend `/api/link-preview/batch` endpoint is running
- Verify backend can fetch YouTube metadata
- Check SSRF protection allows youtube.com

### 5. Edge Cases to Test

**Multiple URLs**:
```
!link https://example.com
!link https://github.com
!link https://twitter.com
```
All three should fetch and display previews

**URL Already Fetched**:
Type same URL twice in different lines - second should use cached data from first

**Invalid URL**:
```
!link not-a-valid-url
```
Should show error or blank preview

**Mixed Content**:
```
Check out this video:
!link https://youtube.com

And this article:
!link https://medium.com/article
```
Both previews should display correctly

## Troubleshooting

### Issue: Previews show but no metadata (blank cards)
**Diagnosis**:
- Check console for [LinkPreviewNodeView] logs
- If `preview: undefined` → metadata not stored
- If `preview: {...}` → metadata exists, check LinkPreview component

**Fix**:
- Verify EditorPage.handleBodyChange is called
- Check if fetchLinkPreviews response contains data
- Verify setBodyPreviews state update succeeded

### Issue: Preview never appears (no node created)
**Diagnosis**:
- Check console for pattern conversion logs
- Type !link and watch for node creation

**Possible Cause**: Pattern not matching `^!link\s+(\S+)$`
- Must be exactly: `!link https://url` (one space, no quotes)
- Must be on its own line

### Issue: Console shows "hasEditor: false"
**Diagnosis**:
- useCurrentEditor() not finding editor context
- Check EditorContent wrapper in TiptapEditor

**Fix**:
- Verify EditorProvider or useEditor is set up correctly
- Check TiptapEditor is nested properly

### Issue: Storage shows empty previews: {}
**Diagnosis**:
- TiptapEditor storage update not firing
- Check useEffect dependencies

**Debug**:
```javascript
// In console
editor.storage.context
// Should have: { previews: {...}, loadingUrls: Set(...) }
```

## Verification Commands

```bash
# Build
npm run build

# Dev server (if not using docker)
npm run dev

# Type check
npx tsc --noEmit

# Check for console.log output
# Open DevTools → Console → type URL in editor → watch logs
```

## Performance Notes

- Storage update is instant (synchronous)
- React re-renders only when content/props change
- Node view re-renders when editor.storage changes (via useCurrentEditor hook)
- Should handle 10+ previews without lag

## Implementation Notes

### Why useCurrentEditor instead of prop?
- Node views created by ReactNodeViewRenderer don't directly receive editor as prop
- useCurrentEditor accesses editor from React context established by EditorProvider
- More reliable than trying to thread editor through NodeViewRenderer options

### Why both nested and flat storage?
- Nested (context) for backward compatibility
- Flat (previews, loadingUrls) for easy access without drilling through context
- Both updated simultaneously

### Why console.log instead of logger?
- Temporary debugging during development
- Will be removed in production build optimization pass
- Helps diagnose data flow issues in user environments

## Related Files
- [TiptapEditor.tsx](frontend/src/components/TiptapEditor.tsx)
- [LinkPreviewNodeView.tsx](frontend/src/components/LinkPreviewNodeView.tsx)
- [EditorPage.tsx](frontend/src/pages/EditorPage.tsx)
- [LinkPreview.tsx](frontend/src/components/LinkPreview.tsx)
- [LinkPreviewNode.ts](frontend/src/components/LinkPreviewNode.ts)

## Success Criteria

✅ All of the following must be true:
1. Build succeeds without TypeScript errors
2. Preview nodes appear when typing `!link` pattern
3. Console shows [TiptapEditor] logs with previewCount > 0
4. Console shows [LinkPreviewNodeView] logs with preview data
5. UI displays thumbnail, title, description for at least one URL
6. Delete button works on preview nodes
7. No console errors related to storage or editor
