'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MapPin, Calendar, ChevronDown, ChevronUp, Phone, Mail, Globe, User, CircleCheck as CheckCircle, ExternalLink, Star } from 'lucide-react';

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
  property_city: string;
  property_state: string;
  property_county: string;
  property_zip: string;
  job_description: string;
  urgency: string;
  status: string;
  created_at: string;
  feedback_token: string | null;
  referrals: Referral[];
  categories: string[];
  selected_contractor_id: string | null;
}

interface Props {
  request: JobRequest;
  onSelectContractor: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ASSIGNED: { label: 'Referrals Sent', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  PENDING: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  COMPLETED: { label: 'Completed', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  NO_MATCH: { label: 'No Match Found', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const urgencyConfig: Record<string, string> = {
  IMMEDIATE: 'ASAP',
  WITHIN_WEEK: 'Urgent',
  WITHIN_MONTH: 'Standard',
  FLEXIBLE: 'Flexible',
};

export default function RequestHistoryItem({ request, onSelectContractor }: Props) {
  const [expanded, setExpanded] = useState(false);

  const statusInfo = statusConfig[request.status] || { label: request.status, className: 'bg-muted text-muted-foreground border-border' };
  const urgencyLabel = urgencyConfig[request.urgency] || request.urgency;
  const date = new Date(request.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hasReferrals = request.referrals.length > 0;
  const hasSelection = !!request.selected_contractor_id;
  const selectedContractor = hasSelection
    ? request.referrals.find(r => r.contractor.id === request.selected_contractor_id)?.contractor
    : null;

  return (
    <Card className="border border-border overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
              {hasSelection && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle className="h-3 w-3" />
                  Contractor Selected
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground truncate">
              {request.property_address}
            </h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {request.property_city}, {request.property_state}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {date}
              </span>
              {request.categories.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {request.categories.join(', ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {request.referrals.length} referral{request.referrals.length !== 1 ? 's' : ''}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {request.job_description && (
            <div className="px-5 py-4 border-b border-border bg-muted/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Job Description</p>
              <p className="text-sm text-foreground leading-relaxed">{request.job_description}</p>
            </div>
          )}

          {hasReferrals ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Matched Contractors
                </p>
                {!hasSelection && (
                  <Button size="sm" variant="outline" onClick={onSelectContractor} className="gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark Who You Chose
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {request.referrals
                  .sort((a, b) => a.slot_position - b.slot_position)
                  .map((referral) => {
                    const c = referral.contractor;
                    const isSelected = c.id === request.selected_contractor_id;
                    return (
                      <div
                        key={referral.id}
                        className={`rounded-lg border p-4 transition-colors ${isSelected ? 'border-green-500/40 bg-green-500/5' : 'border-border bg-muted/20'}`}
                      >
                        <div className="flex items-start gap-3">
                          {c.logo_url ? (
                            <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-background border border-border">
                              <img src={c.logo_url} alt={c.company_name} className="h-full w-full object-contain" />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{c.company_name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-sm text-foreground">{c.company_name}</p>
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                                  <CheckCircle className="h-3 w-3" />
                                  Selected
                                </span>
                              )}
                            </div>
                            {c.owner_name && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {c.owner_name}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2">
                              {c.phone && (
                                <a href={`tel:${c.phone}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {c.phone}
                                </a>
                              )}
                              {c.email && (
                                <a href={`mailto:${c.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {c.email}
                                </a>
                              )}
                              {c.website && (
                                <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  Website
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {hasSelection && request.feedback_token && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Link href={`/feedback/${request.feedback_token}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Star className="h-3.5 w-3.5" />
                      Leave Feedback
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground">No contractors were matched for this request.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
