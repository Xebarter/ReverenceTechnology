import { NextResponse } from 'next/server';
import { authErrorResponse, requireFirebaseUser } from '../../../server/requireAuth';
import { eq, pgInsertRow, pgSelect } from '../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../server/supabaseEnv';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(
      url,
      serviceKey,
      'job_applications',
      `${eq('user_id', user.uid)}&order=created_at.desc`,
      'id,job_id,status,created_at,jobs(id,title,location)',
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    const applications = rows.map((row) => {
      const jobs = row.jobs;
      return {
        ...row,
        jobs: Array.isArray(jobs) ? jobs[0] || null : jobs || null,
      };
    });
    return NextResponse.json({ applications });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const body = (await req.json().catch(() => null)) as {
      job_id?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      cover_letter?: string;
      resume_url?: string;
    } | null;

    const jobId = body?.job_id?.trim();
    const fullName = body?.full_name?.trim();
    const email = body?.email?.trim();
    const phone = body?.phone?.trim();
    const resumeUrl = body?.resume_url?.trim();
    if (!jobId || !fullName || !email || !phone || !resumeUrl) {
      return NextResponse.json({ error: 'Missing required application fields' }, { status: 400 });
    }

    const { url, serviceKey } = requireSupabaseService();
    const { row, error } = await pgInsertRow(url, serviceKey, 'job_applications', {
      user_id: user.uid,
      job_id: jobId,
      full_name: fullName,
      email,
      phone,
      cover_letter: body?.cover_letter?.trim() || null,
      resume_url: resumeUrl,
      status: 'new',
    });
    if (error || !row) return NextResponse.json({ error: error || 'Could not submit application' }, { status: 400 });
    return NextResponse.json({ application: row }, { status: 201 });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
