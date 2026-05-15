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
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 px-8 py-10 text-center">
        <p className="text-lg font-semibold text-white">You&apos;re in.</p>
        <p className="mt-2 text-zinc-400 text-sm">Thanks for subscribing. We&apos;ll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-zinc-900 border border-zinc-800 px-8 py-8 flex flex-col gap-4">
      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
      />
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#E8621A] hover:bg-[#d45516] disabled:opacity-60 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
      >
        {loading ? 'Subscribing…' : 'Subscribe'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
