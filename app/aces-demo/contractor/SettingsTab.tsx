'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Bell } from 'lucide-react';

export default function SettingsTab() {
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationEmail, setNotificationEmail] = useState(true);

  function handlePasswordSubmit(e: React.FormEvent) {
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

    toast({ title: 'Demo Mode', description: 'This is a demo — no real password was changed.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  function handleNotificationToggle(value: boolean) {
    setNotificationEmail(value);
    toast({ title: 'Demo Mode', description: 'This is a demo — no real preference was saved.' });
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-lw-rust" />
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">Update the password for this account.</p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button type="submit" className="bg-lw-rust text-white hover:bg-lw-rust-hover">
            Save Password
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-5 w-5 text-lw-rust" />
          <h2 className="text-xl font-bold text-gray-900">Email Notifications</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">Control which emails ListWorx sends.</p>

        <div className="flex items-center gap-3">
          <Switch checked={notificationEmail} onCheckedChange={handleNotificationToggle} id="demo-notification-toggle" />
          <Label htmlFor="demo-notification-toggle" className="cursor-pointer">
            Receive email notifications for new referrals and account updates
          </Label>
        </div>
      </section>
    </div>
  );
}
