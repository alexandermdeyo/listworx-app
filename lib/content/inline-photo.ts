/**
 * Puts a photo inside an article body. The photo always becomes its own paragraph,
 * placed after the paragraph the cursor is in, so it never splits a sentence.
 * Pure helpers shared by the Content editor and the Blog editor.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function inlinePhotoTag(url: string, alt: string) {
  return `<img src="${esc(url)}" alt="${esc(alt || '')}" style="width:100%;border-radius:10px;margin:8px 0" />`;
}

/**
 * Inserts `tag` after the paragraph containing `cursor` (a character position in
 * `body`). No cursor, or a cursor at the very end, adds it at the end.
 * Returns the new body and the position just after the photo.
 */
export function insertPhotoAt(body: string, cursor: number | null | undefined, tag: string) {
  const text = body || '';
  const pos = typeof cursor === 'number' && cursor >= 0 && cursor <= text.length ? cursor : text.length;
  const breakAt = text.indexOf('\n\n', pos);
  const cut = breakAt === -1 ? text.length : breakAt;
  const before = text.slice(0, cut).trimEnd();
  const after = text.slice(cut).replace(/^\s+/, '');
  const head = before ? `${before}\n\n${tag}` : tag;
  const next = after ? `${head}\n\n${after}` : `${head}\n\n`;
  return { body: next, caret: head.length };
}
