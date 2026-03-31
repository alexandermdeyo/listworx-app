import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return false;

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return userData?.role === 'ADMIN';
}

function extractStoragePathFromDocumentUrl(documentUrl: string): string | null {
  if (!documentUrl) return null;

  try {
    const url = new URL(documentUrl);

    const possibleMarkers = [
      '/storage/v1/object/sign/contractor-documents/',
      '/storage/v1/object/public/contractor-documents/',
      '/storage/v1/object/authenticated/contractor-documents/',
      '/object/sign/contractor-documents/',
      '/object/public/contractor-documents/',
      '/object/authenticated/contractor-documents/',
      '/contractor-documents/',
    ];

    for (const marker of possibleMarkers) {
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) {
        const extracted = url.pathname.slice(idx + marker.length);
        if (extracted) {
          return decodeURIComponent(extracted);
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');

    if (!contractorId) {
      return NextResponse.json({ error: 'contractorId required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: documents, error } = await supabaseAdmin
      .from('contractor_documents')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('document_type');

    if (error) throw error;

    return NextResponse.json({ documents: documents ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, documentUrl, documentId, reviewStatus, reviewNotes } = body;

    const supabaseAdmin = createAdminClient();

    if (action === 'signed-url') {
      if (!documentUrl) {
        return NextResponse.json(
          { error: 'documentUrl required' },
          { status: 400 }
        );
      }

      // If it is already a perfectly usable signed/public URL, just return it.
      // This avoids pointless failures on older saved URLs.
      if (
        typeof documentUrl === 'string' &&
        documentUrl.includes('/contractor-documents/') &&
        (documentUrl.startsWith('http://') || documentUrl.startsWith('https://'))
      ) {
        const storagePath = extractStoragePathFromDocumentUrl(documentUrl);

        // If path extraction works, create a fresh signed URL.
        if (storagePath) {
          const { data, error } = await supabaseAdmin.storage
            .from('contractor-documents')
            .createSignedUrl(storagePath, 600);

          if (!error && data?.signedUrl) {
            return NextResponse.json({ signedUrl: data.signedUrl });
          }
        }

        // Fallback: return the original URL so admin can still try to open it.
        return NextResponse.json({ signedUrl: documentUrl });
      }

      return NextResponse.json(
        { error: 'Could not determine document URL' },
        { status: 400 }
      );
    }

    if (action === 'update-review') {
      if (!documentId || !reviewStatus) {
        return NextResponse.json(
          { error: 'documentId and reviewStatus required' },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from('contractor_documents')
        .update({
          status: reviewStatus,
          notes: reviewNotes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}