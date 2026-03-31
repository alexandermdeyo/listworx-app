'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Phone, Loader as Loader2, CircleAlert as AlertCircle, LogOut, Archive, Trash2, FileText, CreditCard as Edit, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface Realtor {
  id: string;
  user_id: string;
  company_name: string;
  license_number: string;
  created_at: string;
  last_contacted_at: string | null;
  notes: string | null;
  archived: boolean;
  users: {
    email: string;
    full_name: string;
  };
  job_requests_count: number;
}

export default function RealtorsPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const result = await checkAdminAuth();

    if (!result.ok) {
      if (result.reason === 'not_admin') {
        setAccessDenied(true);
      } else {
        router.push('/login?redirect=/admin/crm/realtors');
      }
      return;
    }

    setIsAuthenticated(true);
    loadRealtors();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const loadRealtors = async () => {
    try {
      setLoading(true);

      const { data } = await supabase
        .from('realtor_profiles')
        .select(`
          *,
          users(email, full_name)
        `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (data) {
        const realtorsWithCounts = await Promise.all(
          data.map(async (realtor) => {
            const { count } = await supabase
              .from('job_requests')
              .select('id', { count: 'exact', head: true })
              .eq('realtor_id', realtor.id);

            return {
              ...realtor,
              job_requests_count: count || 0,
            } as Realtor;
          })
        );

        setRealtors(realtorsWithCounts);
      }
    } catch (error) {
      console.error('Error loading realtors:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async (realtorId: string) => {
    try {
      setProcessing(realtorId);

      await supabase
        .from('realtor_profiles')
        .update({ notes: notesText })
        .eq('id', realtorId);

      setEditingNotes(null);
      await loadRealtors();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setProcessing(null);
    }
  };

  const markContacted = async (realtorId: string) => {
    try {
      setProcessing(realtorId);

      await supabase
        .from('realtor_profiles')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', realtorId);

      await loadRealtors();
    } catch (error) {
      console.error('Error marking contacted:', error);
    } finally {
      setProcessing(null);
    }
  };

  const archiveRealtor = async (realtorId: string) => {
    if (!confirm('Archive this realtor?')) return;

    try {
      setProcessing(realtorId);

      await supabase
        .from('realtor_profiles')
        .update({ archived: true })
        .eq('id', realtorId);

      await loadRealtors();
    } catch (error) {
      console.error('Error archiving:', error);
    } finally {
      setProcessing(null);
    }
  };

  const deleteRealtor = async (realtorId: string) => {
    if (!confirm('Permanently delete this realtor? This cannot be undone.')) return;

    try {
      setProcessing(realtorId);

      await supabase
        .from('realtor_profiles')
        .delete()
        .eq('id', realtorId);

      await loadRealtors();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setProcessing(null);
    }
  };

  const openEmailDialog = (realtor: Realtor) => {
    setSelectedRealtor(realtor);
    setEmailSubject(`Hello from ListWorx`);
    setEmailMessage(`Dear ${realtor.users.full_name},\n\n`);
    setEmailDialogOpen(true);
  };

  const sendCustomEmail = () => {
    if (!selectedRealtor) return;

    const mailtoLink = `mailto:${selectedRealtor.users.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
    window.location.href = mailtoLink;
    setEmailDialogOpen(false);
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <Card className="p-8 max-w-md text-center bg-lw-dark-card border-lw-dark-border">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-zinc-400 mb-6">Admin privileges required.</p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </Card>
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-lw-rust" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lw-dark">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin/crm" className="text-zinc-400 hover:text-white mb-2 inline-block transition-colors">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">
              Realtors & Clients
            </h1>
            <p className="text-zinc-400">
              Manage all realtors and homeowners
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="space-y-6">
          {realtors.length === 0 ? (
            <Card className="p-12 text-center bg-lw-dark-card border-lw-dark-border">
              <h3 className="text-xl font-semibold mb-2 text-white">No Realtors</h3>
              <p className="text-zinc-400">
                All realtors will appear here
              </p>
            </Card>
          ) : (
            realtors.map((realtor) => (
              <Card key={realtor.id} className="p-6 bg-lw-dark-card border-lw-dark-border">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-1 text-white">
                          {realtor.users.full_name}
                        </h3>
                        {realtor.company_name && (
                          <p className="text-lg text-zinc-400">
                            {realtor.company_name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-lw-dark-border text-zinc-300">
                        {realtor.job_requests_count} requests
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-zinc-500" />
                        <a
                          href={`mailto:${realtor.users.email}`}
                          className="text-lw-rust hover:underline"
                        >
                          {realtor.users.email}
                        </a>
                      </div>
                      {realtor.license_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-zinc-500" />
                          <span className="text-zinc-400">
                            License: {realtor.license_number}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">Admin Notes</h4>
                        {editingNotes !== realtor.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingNotes(realtor.id);
                              setNotesText(realtor.notes || '');
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingNotes === realtor.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add notes about this realtor..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveNotes(realtor.id)}
                              disabled={processing === realtor.id}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNotes(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400">
                          {realtor.notes || 'No notes yet'}
                        </p>
                      )}
                    </div>

                    {realtor.last_contacted_at && (
                      <p className="text-sm text-zinc-400">
                        Last contacted:{' '}
                        {new Date(realtor.last_contacted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => openEmailDialog(realtor)}
                      variant="outline"
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>

                    <Button
                      onClick={() => markContacted(realtor.id)}
                      disabled={processing === realtor.id}
                      variant="outline"
                      className="w-full"
                    >
                      Mark as Contacted
                    </Button>

                    <Button
                      onClick={() => archiveRealtor(realtor.id)}
                      disabled={processing === realtor.id}
                      variant="outline"
                      className="w-full"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>

                    <Button
                      onClick={() => deleteRealtor(realtor.id)}
                      disabled={processing === realtor.id}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="bg-lw-dark-card border-lw-dark-border">
          <DialogHeader>
            <DialogTitle className="text-white">Send Email to {selectedRealtor?.users.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2 block">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-lw-dark-surface border-lw-dark-border text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2 block">Message</label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={6}
                className="bg-lw-dark-surface border-lw-dark-border text-white"
              />
            </div>
            <Button onClick={sendCustomEmail} className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">
              Open in Email Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
