'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  invoice_pdf_url: string | null;
  period_start: string;
  period_end: string;
  paid_at: string | null;
  created_at: string;
}

interface BillingInfo {
  id: string;
  company_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
  tax_id: string | null;
  phone: string;
}

export default function BillingPortal() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      setLoading(true);
      setError(null);

      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      const { data: billingData, error: billingError } = await supabase
        .from('contractor_billing_info')
        .select('*')
        .maybeSingle();

      if (billingError) throw billingError;

      setInvoices(invoicesData || []);
      setBillingInfo(billingData);
    } catch (err: any) {
      console.error('Error loading billing data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Billing Data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing Portal</h1>
        <p className="text-gray-600">Manage your subscription and view invoice history</p>
      </div>

      {billingInfo && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Your registered billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium">{billingInfo.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{billingInfo.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {billingInfo.billing_address}<br />
                  {billingInfo.billing_city}, {billingInfo.billing_state} {billingInfo.billing_zip}
                </p>
              </div>
              {billingInfo.tax_id && (
                <div>
                  <p className="text-sm text-gray-500">Tax ID</p>
                  <p className="font-medium">{billingInfo.tax_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice History
          </CardTitle>
          <CardDescription>
            {invoices.length === 0
              ? 'No invoices yet'
              : `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No invoices yet</p>
              <p className="text-sm text-gray-400">
                Your invoices will appear here after your first payment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatAmount(invoice.amount, invoice.currency)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {invoice.paid_at
                              ? formatDate(invoice.paid_at)
                              : formatDate(invoice.created_at)}
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs">
                          Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                        </div>
                      </div>
                    </div>
                    {invoice.invoice_pdf_url && (
                      <Button
                        onClick={() => window.open(invoice.invoice_pdf_url!, '_blank')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-blue-700 text-sm mb-4">
          For billing questions or to update your payment method, contact our support team.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="mailto:billing@listworx.co"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            billing@listworx.co
          </a>
          <span className="text-blue-400">|</span>
          <a href="tel:615-362-4996" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            615-362-4996
          </a>
        </div>
      </div>
    </div>
  );
}
