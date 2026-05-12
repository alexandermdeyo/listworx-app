'use client';

import { Button } from '@/components/ui/button';
import { PARTNER_STATUS } from '@/lib/partner-status';
import { ContractorProfile, STATUS_LABELS } from './types';
import { CircleCheck as CheckCircle2, Clock, TriangleAlert as AlertTriangle, Shield, RefreshCw, LogOut, Building2, ChevronRight, Circle as XCircle } from 'lucide-react';

interface StatusCardProps {
  profile: ContractorProfile;
  userEmail: string;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

function getStatusConfig(status: string) {
  switch (status) {
    case PARTNER_STATUS.APPLIED:
      return {
        icon: Clock,
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        headline: 'Application Submitted',
        message: 'Our team is reviewing your application. You\'ll hear back within 24–48 hours.',
        nextStep: 'Sit tight — we\'re vetting your credentials and will reach out shortly.',
      };
    case PARTNER_STATUS.APPROVED:
      return {
        icon: CheckCircle2,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        headline: 'Approved – Choose a Plan',
        message: 'Congratulations! Your application has been approved.',
        nextStep: 'Select a subscription plan below to activate your account and start receiving leads.',
      };
    case PARTNER_STATUS.ACTIVE:
      return {
        icon: Shield,
        color: 'text-lw-rust',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badgeClass: 'bg-orange-100 text-lw-rust border-orange-300',
        headline: 'Active Partner',
        message: 'Your account is active and you are receiving qualified leads.',
        nextStep: 'Keep your profile and service areas up to date for best results.',
      };
    case PARTNER_STATUS.PAUSED:
      return {
        icon: AlertTriangle,
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        headline: 'Subscription Paused',
        message: 'Your subscription is past due or was paused.',
        nextStep: 'Update your payment method to resume receiving leads immediately.',
      };
    case PARTNER_STATUS.REJECTED:
      return {
        icon: XCircle,
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        headline: 'Application Not Approved',
        message: 'Your application was not approved at this time.',
        nextStep: 'Contact adeyo@listworx.co for details or to discuss next steps.',
      };
    default:
      return {
        icon: Clock,
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        headline: 'Account Created',
        message: 'Complete your application to get started.',
        nextStep: 'Fill out the application form below to apply as a ListWorx partner.',
      };
  }
}

export default function StatusCard({
  profile,
  userEmail,
  refreshing,
  onRefresh,
  onLogout,
}: StatusCardProps) {
  const config = getStatusConfig(profile.partner_status);
  const StatusIcon = config.icon;
  const label = STATUS_LABELS[profile.partner_status] || profile.partner_status;

  return (
    <div className="bg-white text-gray-900 rounded-2xl border border-lw-border-light overflow-hidden shadow-sm">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt="Company Logo"
                className="h-16 w-16 rounded-xl object-contain border border-lw-border-light bg-white p-1 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-lw-surface border border-lw-border-light flex items-center justify-center flex-shrink-0">
                <Building2 className="h-8 w-8 text-lw-text/30" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-lw-text truncate">
                {profile.company_name || 'My Contractor Account'}
              </h1>
              <p className="text-lw-text/50 text-sm mt-0.5 truncate">{userEmail}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass}`}>
                  <StatusIcon className="h-3 w-3" />
                  {label}
                </span>
                {profile.tier && profile.partner_status === PARTNER_STATUS.ACTIVE && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-lw-rust/10 text-lw-rust border border-lw-rust/20 capitalize">
                    {profile.tier} Plan
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="ml-1.5 text-xs">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1.5 text-xs">Sign Out</span>
            </Button>
          </div>
        </div>

        <div className={`mt-6 rounded-xl p-4 ${config.bg} border ${config.border}`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="font-semibold text-lw-text text-sm">{config.headline}</p>
              <p className="text-lw-text/70 text-sm mt-0.5">{config.message}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ChevronRight className={`h-3.5 w-3.5 ${config.color} flex-shrink-0`} />
                <p className={`text-sm font-medium ${config.color}`}>{config.nextStep}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
