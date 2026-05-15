'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [jobData, setJobData] = useState<any>(null);
  const [contractorData, setContractorData] = useState<any>(null);

  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [timelinessRating, setTimelinessRating] = useState(5);
  const [professionalismRating, setProfessionalismRating] = useState(5);
  const [wouldRecommend, setWouldRecommend] = useState('yes');
  const [comments, setComments] = useState('');

  const [ironcladResponded24h, setIroncladResponded24h] = useState('');
  const [ironcladShowedUp, setIroncladShowedUp] = useState('');
  const [ironcladQualityRating, setIroncladQualityRating] = useState(0);
  const [ironcladProfessionalismRating, setIroncladProfessionalismRating] = useState(0);
  const [ironcladWouldRequestAgain, setIroncladWouldRequestAgain] = useState('');

  useEffect(() => {
    loadFeedbackData();
  }, [token]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/feedback/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Invalid or expired feedback link');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setJobData(data.jobRequest);
      setContractorData(data.contractor);
    } catch (err) {
      setError('Failed to load feedback form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating: overallRating,
          qualityRating,
          communicationRating,
          timelinessRating,
          professionalismRating,
          wouldRecommend: wouldRecommend === 'yes',
          comments,
          ironcladResponded24h,
          ironcladShowedUp,
          ironcladQualityRating,
          ironcladProfessionalismRating,
          ironcladWouldRequestAgain,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: any) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-lw-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lw-rust mx-auto mb-4" />
          <p className="text-lw-text/60">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lw-surface flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center bg-lw-surface-card">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Star className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Unable to Load Feedback</h2>
          <p className="text-lw-text/60">{error}</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-lw-surface flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center bg-lw-surface-card">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-lw-text/60">
            Your feedback has been submitted successfully. It helps us maintain
            our IronClad Standards and improve our contractor network.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lw-surface py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-lw-surface-card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Share Your Feedback</h1>
            <p className="text-lw-text/60">
              Help us maintain IronClad Standards by rating your experience
            </p>
          </div>

          {contractorData && (
            <div className="mb-8 p-4 bg-lw-surface rounded-lg border border-lw-border-light">
              <h3 className="font-semibold mb-1">{contractorData.company_name}</h3>
              <p className="text-sm text-lw-text/60">
                {contractorData.owner_name}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Overall Experience"
            />

            <StarRating
              value={qualityRating}
              onChange={setQualityRating}
              label="Quality of Work"
            />

            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication"
            />

            <StarRating
              value={timelinessRating}
              onChange={setTimelinessRating}
              label="Timeliness"
            />

            <StarRating
              value={professionalismRating}
              onChange={setProfessionalismRating}
              label="Professionalism"
            />

            <div className="space-y-2">
              <Label>Would you recommend this contractor?</Label>
              <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="border-t pt-6 mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">IronClad Standards Review</h3>
                <p className="text-sm text-muted-foreground">Help us maintain our network quality.</p>
              </div>

              <div className="space-y-2">
                <Label>Did the contractor respond to your initial inquiry within 24 hours?</Label>
                <RadioGroup value={ironcladResponded24h} onValueChange={setIroncladResponded24h}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ic-responded-yes" />
                    <Label htmlFor="ic-responded-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ic-responded-no" />
                    <Label htmlFor="ic-responded-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no_response" id="ic-responded-nr" />
                    <Label htmlFor="ic-responded-nr">Did not respond</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Did the contractor show up as scheduled?</Label>
                <RadioGroup value={ironcladShowedUp} onValueChange={setIroncladShowedUp}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ic-showed-yes" />
                    <Label htmlFor="ic-showed-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ic-showed-no" />
                    <Label htmlFor="ic-showed-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_yet" id="ic-showed-ny" />
                    <Label htmlFor="ic-showed-ny">Job not yet complete</Label>
                  </div>
                </RadioGroup>
              </div>

              <StarRating
                value={ironcladQualityRating}
                onChange={setIroncladQualityRating}
                label="How would you rate the quality of the work?"
              />

              <StarRating
                value={ironcladProfessionalismRating}
                onChange={setIroncladProfessionalismRating}
                label="How would you rate the contractor's professionalism and communication?"
              />

              <div className="space-y-2">
                <Label>Would you request this contractor again through ListWorx?</Label>
                <RadioGroup value={ironcladWouldRequestAgain} onValueChange={setIroncladWouldRequestAgain}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ic-again-yes" />
                    <Label htmlFor="ic-again-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ic-again-no" />
                    <Label htmlFor="ic-again-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="ic-again-maybe" />
                    <Label htmlFor="ic-again-maybe">Maybe</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Additional Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share any additional details about your experience..."
                rows={4}
              />
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
