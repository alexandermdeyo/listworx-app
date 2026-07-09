'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { isValidDemoAccessCode } from '@/lib/demo/acesDemoData';

const DEMO_ACCESS_SESSION_KEY = 'aces_demo_access_granted';

export default function DemoAccessGate({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [granted, setGranted] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(DEMO_ACCESS_SESSION_KEY);
    setGranted(stored === 'true');
    setChecked(true);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isValidDemoAccessCode(codeInput)) {
      window.sessionStorage.setItem(DEMO_ACCESS_SESSION_KEY, 'true');
      setGranted(true);
      setError(null);
      return;
    }

    setError('That code did not match. Please try again.');
  }

  if (!checked) {
    return <div className="min-h-screen bg-lw-dark" />;
  }

  if (!granted) {
    return (
      <div className="min-h-screen bg-lw-dark text-lw-light flex items-center justify-center px-4">
        <Card className="w-full max-w-sm p-8">
          <div className="h-12 w-12 rounded-xl bg-lw-rust/15 flex items-center justify-center mb-6">
            <Lock className="h-6 w-6 text-lw-rust" />
          </div>
          <p className="lw-label mb-2">ListWorx Demo</p>
          <h1 className="text-2xl font-semibold mb-2">Enter Demo Access Code</h1>
          <p className="text-sm lw-muted mb-6">
            This is a private walkthrough of the ListWorx platform. Enter the access code to continue.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="demo-access-code">Access Code</Label>
              <Input
                id="demo-access-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter access code"
                autoFocus
                autoComplete="off"
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" size="lg" className="w-full">
              Enter Demo
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
