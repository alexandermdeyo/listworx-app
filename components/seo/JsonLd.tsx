/**
 * Renders schema.org structured data as a JSON-LD script tag.
 * Server-safe; "<" is escaped so content can't break out of the script element.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
