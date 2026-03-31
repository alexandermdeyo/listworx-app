'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Loader as Loader2, CircleAlert as AlertCircle, LogOut, ThumbsUp, ThumbsDown } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface Review {
  id: string;
  rating: number;
  quality_rating: number | null;
  communication_rating: number | null;
  timeliness_rating: number | null;
  professionalism_rating: number | null;
  would_recommend: boolean;
  comments: string | null;
  created_at: string;
  job_requests: {
    requester_name: string;
    property_address: string;
    property_city: string;
    property_state: string;
  };
  contractor_profiles: {
    company_name: string;
    owner_name: string;
  };
}

export default function ReviewsPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
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
        router.push('/login?redirect=/admin/crm/reviews');
      }
      return;
    }

    setIsAuthenticated(true);
    loadReviews();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const loadReviews = async () => {
    try {
      setLoading(true);

      const { data } = await supabase
        .from('job_feedback')
        .select(`
          *,
          job_requests(
            requester_name,
            property_address,
            property_city,
            property_state
          ),
          contractor_profiles(
            company_name,
            owner_name
          )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setReviews(data as any);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

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
              Reviews & Feedback
            </h1>
            <p className="text-zinc-400">
              All feedback from realtors and clients
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <Card className="p-12 text-center bg-lw-dark-card border-lw-dark-border">
              <h3 className="text-xl font-semibold mb-2 text-white">No Reviews Yet</h3>
              <p className="text-zinc-400">
                Customer reviews will appear here
              </p>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="p-6 bg-lw-dark-card border-lw-dark-border">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {review.job_requests.requester_name}
                        </h3>
                        <Badge variant="outline" className="border-lw-dark-border text-zinc-300">
                          {new Date(review.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {review.job_requests.property_address},{' '}
                        {review.job_requests.property_city},{' '}
                        {review.job_requests.property_state}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-white">Contractor</h4>
                      <p className="text-sm">
                        <span className="font-medium text-zinc-200">
                          {review.contractor_profiles.company_name}
                        </span>
                        <br />
                        <span className="text-zinc-400">
                          {review.contractor_profiles.owner_name}
                        </span>
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white">Overall Rating</h4>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>

                    {review.comments && (
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Comments</h4>
                        <p className="text-sm text-zinc-400 italic">
                          &quot;{review.comments}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="space-y-4">
                      {review.quality_rating && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-zinc-300">
                              Quality of Work
                            </span>
                            <StarRating rating={review.quality_rating} />
                          </div>
                        </div>
                      )}

                      {review.communication_rating && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-zinc-300">
                              Communication
                            </span>
                            <StarRating rating={review.communication_rating} />
                          </div>
                        </div>
                      )}

                      {review.timeliness_rating && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-zinc-300">
                              Timeliness
                            </span>
                            <StarRating rating={review.timeliness_rating} />
                          </div>
                        </div>
                      )}

                      {review.professionalism_rating && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-zinc-300">
                              Professionalism
                            </span>
                            <StarRating rating={review.professionalism_rating} />
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-lw-dark-border/60">
                        <div className="flex items-center gap-2">
                          {review.would_recommend ? (
                            <>
                              <ThumbsUp className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                Would recommend
                              </span>
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="h-5 w-5 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                Would not recommend
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
