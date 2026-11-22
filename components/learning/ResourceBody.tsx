import type { ResourceSection } from '@/lib/learning/resources';

export default function ResourceBody({ sections }: { sections: ResourceSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-xl font-bold text-white">{s.heading}</h2>
          {s.paragraphs?.map((p) => (
            <p key={p.slice(0, 40)} className="mt-3 leading-relaxed text-white/75">{p}</p>
          ))}
          {s.bullets && (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-white/75">
              {s.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
