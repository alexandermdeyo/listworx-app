'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarClock, X } from 'lucide-react';

/**
 * "Request this media partner" — opens a small in-platform booking form that
 * POSTs to /api/media-bookings. The API decides the source (contractor →
 * dashboard, realtor → referral pool) from the signed-in user. Anyone not
 * signed in is sent to /login first.
 */
export default function MediaPartnerRequestButton({
  mediaPartnerId,
  companyName,
  className,
  size = 'default',
}: {
  mediaPartnerId: string;
  companyName: string;
  className?: string;
  size?: 'default' | 'lg' | 'sm';
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ notes: '', property_address: '', preferred_date: '' });
  const [state, setState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/media-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_partner_id: mediaPartnerId, ...form }),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(data.error || 'Could not send the request.');
        return;
      }
      setState('done');
    } catch {
      setState('error');
      setMessage('Network error — please try again.');
    }
  };

  return (
    <>
      <Button
        size={size}
        className={className ?? 'bg-lw-rust text-white hover:bg-lw-rust-hover'}
        onClick={() => {
          setOpen(true);
          setState('idle');
        }}
      >
        <CalendarClock className="mr-2 h-4 w-4" />
        Request this media partner
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-mkt-ink">Request {companyName}</h3>
                <p className="mt-1 text-sm text-mkt-ink/60">
                  They&apos;ll get your request in their dashboard and confirm or decline. No contact
                  details are shared until they accept.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-mkt-ink/40 hover:text-mkt-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            {state === 'done' ? (
              <div className="rounded-xl border border-lw-rust/30 bg-lw-rust/[0.06] p-6 text-center">
                <p className="font-bold text-mkt-ink">Request sent.</p>
                <p className="mt-1 text-sm text-mkt-ink/70">
                  You&apos;ll be notified when {companyName} responds.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-mkt-ink">
                    What do you need shot? *
                  </label>
                  <Textarea
                    required
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Property type, scope (photos / video / drone), anything they should know…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-mkt-ink">
                      Property address
                    </label>
                    <Input
                      value={form.property_address}
                      onChange={(e) => setForm((f) => ({ ...f, property_address: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-mkt-ink">
                      Preferred date
                    </label>
                    <Input
                      type="date"
                      value={form.preferred_date}
                      onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                    />
                  </div>
                </div>

                {state === 'error' && (
                  <p className="text-sm font-medium text-red-600">{message}</p>
                )}

                <Button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="w-full bg-lw-rust text-white hover:bg-lw-rust-hover"
                >
                  {state === 'submitting' ? 'Sending…' : 'Send request'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
