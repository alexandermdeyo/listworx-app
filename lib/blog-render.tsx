/**
 * Renders an article body the same way on the public blog page and in the admin
 * Content preview. Moved unchanged from app/blog/[slug]/page.tsx (Stage 1B).
 */
export function renderBody(text: string) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('# ')) {
      return <h2 key={i} className="text-2xl font-bold text-mkt-ink mt-8 mb-3">{trimmed.slice(2)}</h2>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={i} className="text-xl font-bold text-mkt-ink mt-6 mb-2">{trimmed.slice(3)}</h3>;
    }
    if (trimmed.startsWith('### ')) {
      return <h4 key={i} className="text-lg font-semibold text-mkt-ink mt-5 mb-2">{trimmed.slice(4)}</h4>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '));
      return (
        <ul key={i} className="list-disc list-inside space-y-1.5 text-mkt-ink/90 my-3 pl-1">
          {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
        </ul>
      );
    }
    if (/^\d+\. /.test(trimmed)) {
      const items = trimmed.split('\n').filter(l => /^\d+\. /.test(l));
      return (
        <ol key={i} className="list-decimal list-inside space-y-1.5 text-mkt-ink/90 my-3 pl-1">
          {items.map((item, j) => <li key={j}>{item.replace(/^\d+\. /, '')}</li>)}
        </ol>
      );
    }
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-2 border-lw-rust pl-4 py-1 my-4 text-mkt-ink/70 italic">
          {trimmed.slice(2)}
        </blockquote>
      );
    }

    const withInline = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    return (
      <p key={i} className="text-mkt-ink/90 leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: withInline }} />
    );
  });
}
