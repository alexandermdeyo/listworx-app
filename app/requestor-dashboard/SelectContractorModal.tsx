'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CircleCheck as CheckCircle, User, X, Loader as Loader2 } from 'lucide-react';

interface Referral {
  id: string;
  slot_position: number;
  status: string;
  contractor: {
    id: string;
    company_name: string;
    owner_name: string;
    phone: string;
    email: string;
    website: string | null;
    logo_url: string | null;
    specialties: string[];
  };
}

interface JobRequest {
  id: string;
  property_address: string;
  referrals: Referral[];
  selected_contractor_id: string | null;
}

interface Props {
  request: JobRequest;
  realtorProfileId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SelectContractorModal({ request, realtorProfileId, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [selectedId, setSelectedId] = useState<string>(request.selected_contractor_id || '');
  const [hired, setHired] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!selectedId) {
      setError('Please select a contractor');
      return;
    }
    setSaving(true);
    setError('');

    const { error: upsertError } = await supabase
      .from('contractor_selections')
      .upsert(
        {
          job_request_id: request.id,
          contractor_id: selectedId,
          realtor_profile_id: realtorProfileId,
          hired,
          notes,
          outcome: hired ? 'hired' : 'selected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'job_request_id' }
      );

    setSaving(false);

    if (upsertError) {
      setError('Failed to save selection. Please try again.');
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mark Your Selection</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Which contractor did you choose to work with?</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {request.referrals
              .sort((a, b) => a.slot_position - b.slot_position)
              .map((referral) => {
                const c = referral.contractor;
                const isSelected = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted/20 hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center border ${
                      isSelected ? 'bg-primary/20 border-primary/40' : 'bg-muted border-border'
                    }`}>
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.company_name} className="h-full w-full object-contain rounded-md" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{c.company_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{c.company_name}</p>
                      {c.owner_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {c.owner_name}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setHired(!hired)}
              className={`flex items-center gap-2 w-full p-3 rounded-lg border text-left transition-all ${
                hired ? 'border-green-500/40 bg-green-500/10' : 'border-border bg-muted/20 hover:bg-muted/30'
              }`}
            >
              <div className={`h-4 w-4 rounded flex items-center justify-center border ${
                hired ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
              }`}>
                {hired && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-foreground">I hired this contractor</span>
            </button>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about your experience or why you chose this contractor..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="mt-1.5 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedId} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Save Selection
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
