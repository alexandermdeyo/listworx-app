'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader as Loader2, KeyRound, Bell } from 'lucide-react';
import type { ContractorProfile } from './types';

interface SettingsTabProps {
  profile: ContractorProfile;
  userEmail: string;
  onNotificationPreferenceChange: (value: boolean) => void;
}

export default function SettingsTab({ profile, userEmail, onNotificationPreferenceChange }: SettingsTabProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [notificationEmail, setNotificationEmail] = useState(profile.notification_email ?? true);
  const [notificationSaving, setNotificationSaving] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Missing information', description: 'Please fill in all three password fields.' });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'New password and confirmation must match.' });
      return;
    }

    setPasswordSaving(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        toast({ title: 'Current password is incorrect', description: 'Please double-check your current password and try again.' });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        toast({ title: 'Could not update password', description: updateError.message || 'Please try again.' });
        return;
      }

      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'Could not update password', description: err.message || 'Unknown error.' });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleNotificationToggle(value: boolean) {
    setNotificationEmail(value);
    setNotificationSaving(true);

    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ notification_email: value })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      onNotificationPreferenceChange(value);
      toast({ title: 'Preference saved', description: value ? 'Email notifications are now on.' : 'Email notifications are now off.' });
    } catch (err: any) {
      setNotificationEmail(!value);
      toast({ title: 'Could not save preference', description: err.message || 'Please try again.' });
    } finally {
      setNotificationSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-lw-rust" />
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">Update the password for your ListWorx account.</p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={passwordSaving} className="bg-lw-rust text-white hover:bg-lw-rust-hover">
            {passwordSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Password
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-5 w-5 text-lw-rust" />
          <h2 className="text-xl font-bold text-gray-900">Email Notifications</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">Control which emails ListWorx sends you.</p>

        <div className="flex items-center gap-3">
          <Switch
            checked={notificationEmail}
            onCheckedChange={handleNotificationToggle}
            disabled={notificationSaving}
            id="notification-email-toggle"
          />
          <Label htmlFor="notification-email-toggle" className="cursor-pointer">
            Receive email notifications for new referrals and account updates
          </Label>
          {notificationSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>
      </section>
    </div>
  );
}
