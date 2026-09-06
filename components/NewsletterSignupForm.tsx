'use client';

import { useState } from 'react';

export default function NewsletterSignupForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source: 'website' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-lg font-bold text-mkt-ink">You&apos;re in.</p>
        <p className="mt-2 text-sm text-mkt-ink/60">
          Thanks for subscribing — we&apos;ll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm sm:flex-row sm:items-center"
    >
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-mkt-ink placeholder-mkt-ink/40 focus:outline-none focus:ring-2 focus:ring-lw-rust"
      />
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-mkt-ink placeholder-mkt-ink/40 focus:outline-none focus:ring-2 focus:ring-lw-rust"
      />
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-lg bg-lw-rust px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lw-rust-hover disabled:opacity-60"
      >
        {loading ? 'Subscribing…' : 'Subscribe'}
      </button>
      {error && <p className="text-sm text-red-600 sm:w-full">{error}</p>}
    </form>
  );
}
